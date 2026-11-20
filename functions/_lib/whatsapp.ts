import {whatsappText} from './whatsapp-format';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {CheckoutError,now,text,identifier,hash,integer} from './http';
import {answer,conversation} from './assistant';
import type {Env} from './types';
import {preferenceCommand,applyPreference,assertContactAllowed,contactPreference,requestHuman} from './whatsapp-preferences';
import {audit,assertSenderReady,senderState,originInfo,metaError,blockSender,safeMetaText,accountNotice,metaHeaders} from './whatsapp-audit';
export interface WhatsAppConversation {id:string;phone:string;display_name:string;status:string;last_customer_at:number;last_message_at:string;last_inbound_seq:number;read_seq:number;created_at:string;photo_key:string|null}
export interface WhatsAppMessage {seq:number;id:string;conversation_id:string;direction:string;message_type:string;body:string;payload_json:string|null;provider_id:string|null;state:string;error:string|null;created_at:string;occurred_at:string;due_at:number;attempts:number;lease_until:number;admin_email:string|null}
export function configured(env:Env){return !!env.WHATSAPP_TOKEN&&/^\d{5,30}$/.test(env.WHATSAPP_PHONE_NUMBER_ID||'')&&!!env.WHATSAPP_APP_SECRET&&!!env.WHATSAPP_VERIFY_TOKEN;}
export function signed(raw:Uint8Array,signature:string,secret:string){if(!/^sha256=[a-f0-9]{64}$/.test(signature))return false;const expected=createHmac('sha256',secret).update(raw).digest();const supplied=Buffer.from(signature.slice(7),'hex');return supplied.length===expected.length&&timingSafeEqual(expected,supplied);}
export async function graph(env:Env,path:string,init:RequestInit={}){
 if(!env.WHATSAPP_TOKEN)throw new CheckoutError(503,'WhatsApp is not configured.');
 const r=await fetch('https://graph.facebook.com/v23.0/'+path,{...init,headers:{...Object.fromEntries(new Headers(init.headers)),authorization:'Bearer '+env.WHATSAPP_TOKEN},redirect:'manual',signal:AbortSignal.timeout(15000)});
 if(!r.ok){await r.body?.cancel();throw new CheckoutError(502,'WhatsApp could not confirm the request.');}return r;
}
export function replyPayload(data:Record<string,unknown>){
 const kind=String(data.kind||'text'),content=text(data.body,'message',3000),reply=data.reply_to?identifier(data.reply_to,'reply message'):undefined;
 let payload:Record<string,unknown>={type:'text',text:{body:content,preview_url:false}};
 if(kind!=='text'&&content.length>1024)throw new CheckoutError(400,'Interactive messages must be at most 1,024 characters.');
 if(kind==='buttons'||kind==='list'){
  if(!Array.isArray(data.options)||data.options.length<1||data.options.length>(kind==='buttons'?3:10))throw new CheckoutError(400,'Choose a valid number of reply options.');
  const options=data.options.map((label,i)=>({id:'option-'+i,title:text(label,'option',kind==='buttons'?20:24)}));
  payload={type:'interactive',interactive:kind==='buttons'?{type:'button',body:{text:content},action:{buttons:options.map(option=>({type:'reply',reply:option}))}}:{type:'list',body:{text:content},action:{button:'Choose an option',sections:[{rows:options}]}}};
 }else if(kind==='url'||kind==='link'||kind==='checkout'){
  const url=text(data.url,'link',1000);let parsed:URL;try{parsed=new URL(url);}catch{throw new CheckoutError(400,'Use an HTTPS link.');}if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new CheckoutError(400,'Use an HTTPS link.');
  payload={type:'interactive',interactive:{type:'cta_url',body:{text:content},action:{name:'cta_url',parameters:{display_text:kind==='checkout'?'Pay securely':'Open link',url:parsed.href}}}};
 }else if(kind!=='text')throw new CheckoutError(400,'Choose text, buttons, list or link.');
 return {payload,kind,content,reply,delay:integer(data.delay,0,0,1440)};
}
export async function enqueue(env:Env,chat:WhatsAppConversation,data:Record<string,unknown>,email:string){
 if(!configured(env))throw new CheckoutError(503,'WhatsApp is not configured.');
 const id=identifier(data.id,'message reference'),prepared=replyPayload(data),due=Date.now()+prepared.delay*60000;
 await audit(env,'reply_preflight',{message_id:id,conversation_id:chat.id,recipient_phone:chat.phone,details:{origin:email==='ai'?'ai_reply':'staff_reply',message_kind:prepared.kind,due_at:due,last_customer_at:chat.last_customer_at}});
 await assertSenderReady(env);
 await assertContactAllowed(env,chat.phone);
 if(!chat.last_customer_at||chat.last_customer_at+86400000<=due){await audit(env,'reply_rejected_window',{message_id:id,conversation_id:chat.id,recipient_phone:chat.phone,details:{reason:'24_hour_window_closed',due_at:due,last_customer_at:chat.last_customer_at}});throw new CheckoutError(409,'The 24-hour WhatsApp reply window is closed for this scheduled time.');}
 let context:Record<string,string>|undefined;
 if(prepared.reply){const target=await env.DB.prepare('SELECT provider_id FROM whatsapp_messages WHERE id=? AND conversation_id=?').bind(prepared.reply,chat.id).first<{provider_id:string|null}>();if(!target?.provider_id)throw new CheckoutError(400,'Reply to a delivered message in this conversation.');context={message_id:target.provider_id};}
 const payload=JSON.stringify({messaging_product:'whatsapp',to:chat.phone,...prepared.payload,...(context?{context}:{})});
 const prior=await env.DB.prepare('SELECT * FROM whatsapp_messages WHERE id=?').bind(id).first<WhatsAppMessage>();
 if(prior){if(prior.conversation_id!==chat.id||prior.direction!=='OUT'||prior.payload_json!==payload||prior.admin_email!==email)throw new CheckoutError(409,'This reply reference was already used.');return prior;}
 try{await env.DB.prepare("INSERT INTO whatsapp_messages(id,conversation_id,direction,message_type,body,payload_json,state,created_at,occurred_at,due_at,admin_email) VALUES(?,?,'OUT',?,?,?,'QUEUED',?,?,?,?)").bind(id,chat.id,prepared.kind,prepared.content,payload,now(),now(),due,email).run();}
 catch(error){const concurrent=await env.DB.prepare('SELECT * FROM whatsapp_messages WHERE id=?').bind(id).first<WhatsAppMessage>();if(concurrent?.conversation_id===chat.id&&concurrent.payload_json===payload&&concurrent.admin_email===email)return concurrent;throw error;}
 return (await env.DB.prepare('SELECT * FROM whatsapp_messages WHERE id=?').bind(id).first<WhatsAppMessage>())!;
}
export async function dispatch(env:Env,id:string){
 const item=await env.DB.prepare('SELECT * FROM whatsapp_messages WHERE id=?').bind(id).first<WhatsAppMessage>();if(!item||item.state!=='QUEUED'||item.due_at>Date.now())return;
 const chat=await env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id=?').bind(item.conversation_id).first<WhatsAppConversation>();
 if(!chat||chat.last_customer_at+86400000<=Date.now()){await env.DB.prepare("UPDATE whatsapp_messages SET state='REJECTED',error='Reply window closed.' WHERE id=? AND state='QUEUED'").bind(id).run();await audit(env,'send_rejected_window',{message_id:id,conversation_id:item.conversation_id});return;}
 await assertSenderReady(env);
 await assertContactAllowed(env,chat.phone);
 const claim=await env.DB.prepare("UPDATE whatsapp_messages SET state='SENDING',attempts=attempts+1,lease_until=? WHERE id=? AND state='QUEUED' AND due_at<=? RETURNING id").bind(Date.now()+60000,id,Date.now()).first();if(!claim)return;
 let started=false,providerKnown:string|null=null,explicitRejected=false,rejectionReason='Meta rejected the request.';
 const fields={message_id:id,conversation_id:chat.id,recipient_phone:chat.phone};
 try{
  const origin=await originInfo(env,id),sender=await senderState(env),payload=JSON.parse(item.payload_json||'{}');
  if(payload.to!==chat.phone||payload.messaging_product!=='whatsapp')throw new Error('Stored payload does not match this recipient.');
  if(item.admin_email==='ai'&&(await contactPreference(env,chat.phone))?.human_hold&&origin.origin!=='human_handoff_ack')throw new CheckoutError(409,'Automation is paused for human assistance.');
  const interactive=payload.interactive;
  await audit(env,'send_started',{...fields,details:{...origin,api_version:'v23.0',request_path:'/'+env.WHATSAPP_PHONE_NUMBER_ID+'/messages',app_id:sender?.app_id||env.WHATSAPP_APP_ID||null,waba_id:sender?.waba_id||null,sender_health_checked_at:sender?.health_checked_at||null,sender_display_phone_number:sender?.display_phone_number||null,sender_identity_checked_at:sender?.identity_checked_at||null,attempt:item.attempts+1,message_kind:item.message_type,payload_type:payload.type,interactive_type:interactive?.type||null,row_count:interactive?.action?.sections?.reduce((n:number,s:any)=>n+(Array.isArray(s.rows)?s.rows.length:0),0)||0,button_count:interactive?.action?.buttons?.length||0,text_length:item.body.length,text_hash:await hash(item.body),last_customer_at:chat.last_customer_at,reply_window_remaining_ms:chat.last_customer_at+86400000-Date.now()}});
  // Fail closed if the durable start event cannot be written.
  await assertContactAllowed(env,chat.phone);
  if(item.admin_email==='ai'&&(await contactPreference(env,chat.phone))?.human_hold&&origin.origin!=='human_handoff_ack')throw new CheckoutError(409,'Automation is paused for human assistance.');
  await assertSenderReady(env);
  started=true;
  const r=await fetch('https://graph.facebook.com/v23.0/'+env.WHATSAPP_PHONE_NUMBER_ID+'/messages',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+env.WHATSAPP_TOKEN},body:item.payload_json!,redirect:'manual',signal:AbortSignal.timeout(15000)});
  let data:any;try{data=JSON.parse((await r.text()).slice(0,65536))}catch{data={}}
  if(!r.ok){const error=metaError(env,data,r.status);explicitRejected=true;rejectionReason='Meta rejected the request: HTTP '+r.status+(error.code?' / code '+error.code:'')+'. See the private tracker.';if(error.code)await blockSender(env,error.code,error.message||'Meta restriction/authentication error.');await audit(env,'send_failed',{...fields,details:{...error,headers:metaHeaders(env,r.headers)}});await env.DB.prepare("UPDATE whatsapp_messages SET state='FAILED',lease_until=0,error=? WHERE id=? AND state='SENDING'").bind('Meta rejected the request: HTTP '+r.status+(error.code?' / code '+error.code:'')+'. See the private tracker.',id).run();return;}
  const provider=data.messages?.[0]?.id;if(typeof provider!=='string'||!provider||provider.length>200)throw Error('Provider reference missing');providerKnown=provider;
  await audit(env,'send_accepted',{...fields,provider_message_id:provider,details:{http_status:r.status,headers:metaHeaders(env,r.headers),confirmed_recipient:/^\d{7,30}$/.test(String(data.contacts?.[0]?.wa_id||''))?String(data.contacts[0].wa_id):null,message_status:safeMetaText(env,data.messages?.[0]?.message_status,120)}});
  await env.DB.batch([
   env.DB.prepare("UPDATE whatsapp_messages SET provider_id=?,state='SENT',lease_until=0,error=NULL WHERE id=? AND state='SENDING'").bind(provider,id),
   env.DB.prepare('UPDATE whatsapp_conversations SET last_message_at=? WHERE id=?').bind(now(),chat.id)
  ]);
  const delivered=await env.DB.prepare('SELECT state FROM whatsapp_delivery_events WHERE provider_id=?').bind(provider).first<{state:string}>();
  if(delivered)await env.DB.prepare("UPDATE whatsapp_messages SET state=?,error=? WHERE id=?").bind(delivered.state,delivered.state==='FAILED'?'Meta reported delivery failure; see the private tracker.':null,id).run();
 }catch(error){
  const message=explicitRejected?rejectionReason:started?(providerKnown?'Meta accepted this message but local confirmation is uncertain. Do not resend automatically.':'Provider acceptance is uncertain. Do not resend automatically.'):(error instanceof CheckoutError?error.message+' No provider request was made.':'Tracking or payload validation failed. No provider request was made.');
  await env.DB.prepare("UPDATE whatsapp_messages SET state=?,provider_id=COALESCE(provider_id,?),lease_until=0,error=? WHERE id=? AND state='SENDING'").bind(explicitRejected?'FAILED':started?'UNCONFIRMED':'REJECTED',providerKnown,message,id).run();
  try{await audit(env,explicitRejected?'send_failed_persistence_issue':started?'send_uncertain':'send_blocked_before_request',{...fields,provider_message_id:providerKnown||undefined,details:{reason:message}})}catch{/* No untracked provider request is retried. */}
 }
}
export async function dispatchDueWhatsApp(env:Env,max=5){if(!configured(env))return;await env.DB.prepare("UPDATE whatsapp_messages SET state='UNCONFIRMED',error='Interrupted send requires reconciliation.',lease_until=0 WHERE state='SENDING' AND lease_until<?").bind(Date.now()).run();const rows=(await env.DB.prepare("SELECT id FROM whatsapp_messages WHERE direction='OUT' AND state='QUEUED' AND due_at<=? ORDER BY due_at,seq LIMIT ?").bind(Date.now(),max).all<{id:string}>()).results;await Promise.allSettled(rows.map(row=>dispatch(env,row.id)));}
function incomingBody(message:Record<string,any>){if(message.type==='text')return String(message.text?.body||'').slice(0,3000);if(message.type==='interactive')return String(message.interactive?.button_reply?.title||message.interactive?.list_reply?.title||'').slice(0,3000);if(message.type==='button')return String(message.button?.text||'').slice(0,3000);return String(message[message.type]?.caption||'['+String(message.type)+']').slice(0,3000);}
export async function ingest(env:Env,input:Record<string,any>,defer?:(task:Promise<void>)=>void){
 if(!input||input.object!=='whatsapp_business_account'||!Array.isArray(input.entry))throw new CheckoutError(400,'Invalid WhatsApp event.');let count=0;
 for(const entry of input.entry)for(const change of Array.isArray(entry.changes)?entry.changes:[]){
  const value=change?.value;if(!value)continue;
  const waba_id=/^\d{5,30}$/.test(String(entry.id||''))?String(entry.id):undefined;
  if(['account_update','account_alerts','account_review_update','phone_number_quality_update','phone_number_name_update','business_capability_update','security'].includes(String(change.field))){
   const known=await senderState(env),associated=!!waba_id&&known?.waba_id===waba_id;
   await audit(env,'meta_account_event',{waba_id,phone_number_id:associated?env.WHATSAPP_PHONE_NUMBER_ID:null,details:{field:String(change.field),sender_association:associated?'verified_waba':'unknown',notice:accountNotice(env,value)}});
  }
  if(Array.isArray(value.errors)&&value.errors.length){
   const known=await senderState(env),associated=String(value.metadata?.phone_number_id||'')===env.WHATSAPP_PHONE_NUMBER_ID||(!!waba_id&&known?.waba_id===waba_id);
   const errors=value.errors.slice(0,10).map((e:any)=>metaError(env,e,null));
   await audit(env,'meta_webhook_errors',{waba_id,phone_number_id:associated?env.WHATSAPP_PHONE_NUMBER_ID:null,details:{sender_association:associated?'verified_sender_or_waba':'unknown',errors}});
   if(associated)for(const error of errors)if(error.code)await blockSender(env,error.code,error.message||'Meta reported an account restriction.');
  }
  if(!value.metadata?.phone_number_id)continue;
  if(String(value.metadata.phone_number_id)!==env.WHATSAPP_PHONE_NUMBER_ID)continue;
  const display=safeMetaText(env,value.metadata.display_phone_number,80);
  await env.DB.prepare('INSERT INTO whatsapp_sender_diagnostics(phone_number_id,display_phone_number,waba_id,updated_at) VALUES(?,?,?,?) ON CONFLICT(phone_number_id) DO UPDATE SET display_phone_number=COALESCE(whatsapp_sender_diagnostics.display_phone_number,excluded.display_phone_number),waba_id=COALESCE(excluded.waba_id,whatsapp_sender_diagnostics.waba_id),updated_at=excluded.updated_at').bind(env.WHATSAPP_PHONE_NUMBER_ID,display,waba_id||null,now()).run();
  for(const message of Array.isArray(value.messages)?value.messages:[]){
   if(++count>100)throw new CheckoutError(413,'Too many WhatsApp events.');
   const provider=text(message.id,'provider reference',200),phone=text(message.from,'WhatsApp number',30);if(!/^\d{7,20}$/.test(phone))throw new CheckoutError(400,'Invalid WhatsApp number.');
   const duplicate=await env.DB.prepare('SELECT m.id,m.conversation_id,m.body,m.message_type,m.occurred_at,c.phone FROM whatsapp_messages m JOIN whatsapp_conversations c ON c.id=m.conversation_id WHERE m.provider_id=?').bind(provider).first<{id:string;conversation_id:string;body:string;message_type:string;occurred_at:string;phone:string}>();if(duplicate){const command=duplicate.message_type==='text'?preferenceCommand(duplicate.body):null,eventMs=Date.parse(duplicate.occurred_at);if(command&&Number.isSafeInteger(eventMs)&&eventMs>=0&&eventMs<=Date.now()+300000)await applyPreference(env,duplicate.phone,command,eventMs,provider,duplicate.conversation_id);await audit(env,'inbound_duplicate_ignored',{waba_id,provider_message_id:provider,recipient_phone:phone,details:{reason:'provider_message_already_stored'}});continue;}
   const timestamp=Number(message.timestamp)*1000;if(!Number.isSafeInteger(timestamp)||timestamp<0||timestamp>Date.now()+300000)throw new CheckoutError(400,'Invalid event time.');
   const id='wa-'+await hash(phone),messageId=crypto.randomUUID(),name=String(value.contacts?.find((x:Record<string,any>)=>x.wa_id===phone)?.profile?.name||'').slice(0,120),content=incomingBody(message),at=new Date(timestamp).toISOString();
   const stored={type:message.type,...(['image','document','video','audio'].includes(message.type)?{media:{id:String(message[message.type]?.id||''),mime_type:String(message[message.type]?.mime_type||''),filename:String(message[message.type]?.filename||'')}}:{})};
   await env.DB.batch([
    env.DB.prepare("INSERT INTO whatsapp_conversations(id,phone,display_name,last_customer_at,last_message_at,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET display_name=CASE WHEN excluded.display_name<>'' THEN excluded.display_name ELSE whatsapp_conversations.display_name END,last_customer_at=MAX(last_customer_at,excluded.last_customer_at),last_message_at=MAX(last_message_at,excluded.last_message_at),status='OPEN'").bind(id,phone,name,timestamp,at,now()),
    env.DB.prepare("INSERT OR IGNORE INTO whatsapp_messages(id,conversation_id,direction,message_type,body,payload_json,provider_id,state,created_at,occurred_at) VALUES(?,?,'IN',?,?,?,?,'RECEIVED',?,?)").bind(messageId,id,String(message.type).slice(0,40),content,JSON.stringify(stored),provider,now(),at),
    env.DB.prepare('UPDATE whatsapp_conversations SET last_inbound_seq=COALESCE((SELECT MAX(seq) FROM whatsapp_messages WHERE conversation_id=? AND direction=\'IN\'),0) WHERE id=?').bind(id,id)
   ]);
   const winner=await env.DB.prepare('SELECT id FROM whatsapp_messages WHERE provider_id=?').bind(provider).first<{id:string}>();
   await audit(env,'inbound_received',{id:'inbound:'+await hash(provider),waba_id,conversation_id:id,message_id:winner?.id,provider_message_id:provider,recipient_phone:phone,occurred_at:at,details:{sender_display_phone_number:display,event_age_ms:Date.now()-timestamp,message_type:String(message.type),customer_initiated:true}});
   const command=message.type==='text'?preferenceCommand(content):null;
   if(command){await applyPreference(env,phone,command,timestamp,provider,id);continue;}
   const aiEnabled=env.WHATSAPP_AI_ENABLED==='true'||(env.WHATSAPP_AI_ENABLED!=='false'&&!!(env.GEMINI_API_KEY||env.GROQ_API_KEY||env.GROQ_API_KEY_FALLBACK));
   if(winner?.id===messageId&&aiEnabled&&message.type==='text'){
    const work=async()=>{
    const auditFields={waba_id,conversation_id:id,provider_message_id:provider,recipient_phone:phone};
    if(Date.now()-timestamp>300000){await audit(env,'ai_reply_skipped',{...auditFields,details:{reason:'stale_inbound',event_age_ms:Date.now()-timestamp,max_auto_reply_age_ms:300000}});return;}
    try{
     await assertSenderReady(env);
     await assertContactAllowed(env,phone);
     if((await contactPreference(env,phone))?.human_hold){await audit(env,'ai_reply_skipped',{...auditFields,details:{reason:'human_assistance_hold'}});return;}
     await audit(env,'ai_generation_started',{...auditFields,details:{triggering_inbound_id:provider,event_age_ms:Date.now()-timestamp}});
     const generated=await answer(env,conversation([{role:'user',content}]),'whatsapp',async event=>{await audit(env,'ai_provider_diagnostic',{...auditFields,details:{...event,channel:'whatsapp'}});});
     const latest=await env.DB.prepare("SELECT id FROM whatsapp_messages WHERE conversation_id=? AND direction='IN' ORDER BY occurred_at DESC,seq DESC LIMIT 1").bind(id).first<{id:string}>();
     if(latest?.id!==messageId||Date.now()-timestamp>300000){await audit(env,'ai_reply_skipped',{...auditFields,details:{reason:latest?.id!==messageId?'newer_inbound_arrived':'stale_after_generation',ai_provider:generated.provider||'rules',ai_model:generated.model||null}});return;}
     const disclosed=await env.DB.prepare("SELECT 1 AS found FROM whatsapp_messages m JOIN whatsapp_audit_events a ON a.message_id=m.id AND a.event_type='message_origin' WHERE m.conversation_id=? AND m.direction='OUT' AND m.state IN ('DELIVERED','READ') AND m.occurred_at>? AND json_extract(a.details_json,'$.automation_disclosed')=1 LIMIT 1").bind(id,new Date(Date.now()-86400000).toISOString()).first();
     const prefix=disclosed?'':'Opus Zimbabwe — automated assistant\n\n';
     if(!generated.handoff){
      const chat=(await env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id=?').bind(id).first<WhatsAppConversation>())!;
      const replyId='ai-'+await hash(provider);
      await audit(env,'message_origin',{id:'origin:'+replyId,...auditFields,message_id:replyId,details:{origin:'ai_reply',ai_provider:generated.provider||'rules',ai_model:generated.model||null,triggering_inbound_id:provider,triggering_inbound_local_id:messageId,customer_initiated:true,automation_disclosed:!disclosed}});
      const queued=await enqueue(env,chat,{id:replyId,kind:'text',body:prefix+whatsappText(generated.answer),delay:0},'ai');await dispatch(env,queued.id);
     }else{
      await requestHuman(env,phone,id,provider);
      await audit(env,'ai_handoff',{...auditFields,details:{ai_provider:'rules',reason:'human_assistance'}});
      const chat=(await env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id=?').bind(id).first<WhatsAppConversation>())!;
      const replyId='ai-'+await hash(provider);
      await audit(env,'message_origin',{id:'origin:'+replyId,...auditFields,message_id:replyId,details:{origin:'human_handoff_ack',ai_provider:'rules',ai_model:null,triggering_inbound_id:provider,customer_initiated:true,automation_disclosed:!disclosed}});
      const queued=await enqueue(env,chat,{id:replyId,kind:'text',body:prefix+'Your request for human assistance is in the Opus inbox. Automatic replies for this conversation are paused. Please leave the details you want Opus to review.',delay:0},'ai');await dispatch(env,queued.id);
     }
    }catch{await audit(env,'ai_reply_failed_or_paused',{...auditFields,details:{reason:'generation_unavailable_or_sender_paused',human_inbox_retained:true}});}
    };
    const task=work();if(defer)defer(task);else await task;
   }
  }
  for(const status of Array.isArray(value.statuses)?value.statuses:[]){if(++count>100)throw new CheckoutError(413,'Too many WhatsApp events.');const provider=String(status.id||'');const mapped:Record<string,string>={sent:'SENT',delivered:'DELIVERED',read:'READ',failed:'FAILED'};if(!Object.hasOwn(mapped,status.status)||!provider||provider.length>200)continue;
   const rank={sent:1,failed:1,delivered:2,read:3}[status.status as 'sent']||0,at=Number(status.timestamp)*1000;if(!Number.isSafeInteger(at)||at>Date.now()+300000||at<0)continue;
   const linked=await env.DB.prepare('SELECT id,conversation_id FROM whatsapp_messages WHERE provider_id=?').bind(provider).first<{id:string;conversation_id:string}>();
   const errors=Array.isArray(status.errors)?status.errors.slice(0,10).map((e:any)=>metaError(env,e,null)):[];
   await audit(env,'delivery_'+status.status,{waba_id,message_id:linked?.id,conversation_id:linked?.conversation_id,provider_message_id:provider,recipient_phone:/^\d{7,20}$/.test(String(status.recipient_id||''))?String(status.recipient_id):undefined,occurred_at:new Date(at).toISOString(),details:{status:status.status,errors,sender_display_phone_number:display,event_age_ms:Date.now()-at}});
   for(const error of errors)if(error.code)await blockSender(env,error.code,error.message||'Meta reported an account restriction.');
   await env.DB.prepare('INSERT INTO whatsapp_delivery_events(provider_id,state,rank,occurred_at) VALUES(?,?,?,?) ON CONFLICT(provider_id) DO UPDATE SET state=excluded.state,rank=excluded.rank,occurred_at=excluded.occurred_at WHERE excluded.rank>rank OR (excluded.rank=rank AND excluded.occurred_at>=occurred_at)').bind(provider,mapped[status.status],rank,at).run();
   // Late or repeated status events cannot downgrade a delivered/read message.
   await env.DB.prepare("UPDATE whatsapp_messages SET state=?,error=? WHERE provider_id=? AND direction='OUT' AND state<>'READ' AND (state<>'DELIVERED' OR ?='READ')").bind(mapped[status.status],status.status==='failed'?'Provider reported delivery failure.':null,provider,mapped[status.status]).run();
  }
 }
}
