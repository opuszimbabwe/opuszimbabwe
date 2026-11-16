import {createHmac,timingSafeEqual} from 'node:crypto';
import {CheckoutError,now,text,identifier,hash,integer} from './http';
import {answer,conversation} from './assistant';
import type {Env} from './types';
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
 if(!chat.last_customer_at||chat.last_customer_at+86400000<=due)throw new CheckoutError(409,'The 24-hour WhatsApp reply window is closed for this scheduled time.');
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
 if(!chat||chat.last_customer_at+86400000<=Date.now()){await env.DB.prepare("UPDATE whatsapp_messages SET state='REJECTED',error='Reply window closed.' WHERE id=? AND state='QUEUED'").bind(id).run();return;}
 const claim=await env.DB.prepare("UPDATE whatsapp_messages SET state='SENDING',attempts=attempts+1,lease_until=? WHERE id=? AND state='QUEUED' AND due_at<=? RETURNING id").bind(Date.now()+60000,id,Date.now()).first();if(!claim)return;
 try{const r=await graph(env,env.WHATSAPP_PHONE_NUMBER_ID+'/messages',{method:'POST',headers:{'content-type':'application/json'},body:item.payload_json!});const data=await r.json() as {messages?:{id?:string}[]};const provider=data.messages?.[0]?.id;if(!provider||provider.length>200)throw Error('Unconfirmed');await env.DB.batch([
   env.DB.prepare("UPDATE whatsapp_messages SET provider_id=?,state='SENT',lease_until=0,error=NULL WHERE id=? AND state='SENDING'").bind(provider,id),
   env.DB.prepare('UPDATE whatsapp_conversations SET last_message_at=? WHERE id=?').bind(now(),chat.id)
  ]);
  const delivered=await env.DB.prepare('SELECT state FROM whatsapp_delivery_events WHERE provider_id=?').bind(provider).first<{state:string}>();
  if(delivered)await env.DB.prepare('UPDATE whatsapp_messages SET state=? WHERE id=?').bind(delivered.state,id).run();
 }catch{await env.DB.prepare("UPDATE whatsapp_messages SET state='UNCONFIRMED',lease_until=0,error='Provider acceptance is uncertain. Do not resend automatically.' WHERE id=? AND state='SENDING'").bind(id).run();}
}
export async function dispatchDueWhatsApp(env:Env,max=5){if(!configured(env))return;await env.DB.prepare("UPDATE whatsapp_messages SET state='UNCONFIRMED',error='Interrupted send requires reconciliation.',lease_until=0 WHERE state='SENDING' AND lease_until<?").bind(Date.now()).run();const rows=(await env.DB.prepare("SELECT id FROM whatsapp_messages WHERE direction='OUT' AND state='QUEUED' AND due_at<=? ORDER BY due_at,seq LIMIT ?").bind(Date.now(),max).all<{id:string}>()).results;await Promise.allSettled(rows.map(row=>dispatch(env,row.id)));}
function incomingBody(message:Record<string,any>){if(message.type==='text')return String(message.text?.body||'').slice(0,3000);if(message.type==='interactive')return String(message.interactive?.button_reply?.title||message.interactive?.list_reply?.title||'').slice(0,3000);if(message.type==='button')return String(message.button?.text||'').slice(0,3000);return String(message[message.type]?.caption||'['+String(message.type)+']').slice(0,3000);}
export async function ingest(env:Env,input:Record<string,any>){
 if(!input||input.object!=='whatsapp_business_account'||!Array.isArray(input.entry))throw new CheckoutError(400,'Invalid WhatsApp event.');let count=0;
 for(const entry of input.entry)for(const change of Array.isArray(entry.changes)?entry.changes:[]){
  const value=change?.value;if(!value||String(value.metadata?.phone_number_id)!==env.WHATSAPP_PHONE_NUMBER_ID)continue;
  for(const message of Array.isArray(value.messages)?value.messages:[]){
   if(++count>100)throw new CheckoutError(413,'Too many WhatsApp events.');
   const provider=text(message.id,'provider reference',200),phone=text(message.from,'WhatsApp number',30);if(!/^\d{7,20}$/.test(phone))throw new CheckoutError(400,'Invalid WhatsApp number.');
   if(await env.DB.prepare('SELECT id FROM whatsapp_messages WHERE provider_id=?').bind(provider).first())continue;
   const timestamp=Number(message.timestamp)*1000;if(!Number.isSafeInteger(timestamp)||timestamp<0||timestamp>Date.now()+300000)throw new CheckoutError(400,'Invalid event time.');
   const id='wa-'+await hash(phone),messageId=crypto.randomUUID(),name=String(value.contacts?.find((x:Record<string,any>)=>x.wa_id===phone)?.profile?.name||'').slice(0,120),content=incomingBody(message),at=new Date(timestamp).toISOString();
   const stored={type:message.type,...(['image','document','video','audio'].includes(message.type)?{media:{id:String(message[message.type]?.id||''),mime_type:String(message[message.type]?.mime_type||''),filename:String(message[message.type]?.filename||'')}}:{})};
   await env.DB.batch([
    env.DB.prepare("INSERT INTO whatsapp_conversations(id,phone,display_name,last_customer_at,last_message_at,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET display_name=CASE WHEN excluded.display_name<>'' THEN excluded.display_name ELSE whatsapp_conversations.display_name END,last_customer_at=MAX(last_customer_at,excluded.last_customer_at),last_message_at=MAX(last_message_at,excluded.last_message_at),status='OPEN'").bind(id,phone,name,timestamp,at,now()),
    env.DB.prepare("INSERT OR IGNORE INTO whatsapp_messages(id,conversation_id,direction,message_type,body,payload_json,provider_id,state,created_at,occurred_at) VALUES(?,?,'IN',?,?,?,?,'RECEIVED',?,?)").bind(messageId,id,String(message.type).slice(0,40),content,JSON.stringify(stored),provider,now(),at),
    env.DB.prepare('UPDATE whatsapp_conversations SET last_inbound_seq=COALESCE((SELECT MAX(seq) FROM whatsapp_messages WHERE conversation_id=? AND direction=\'IN\'),0) WHERE id=?').bind(id,id)
   ]);
   const winner=await env.DB.prepare('SELECT id FROM whatsapp_messages WHERE provider_id=?').bind(provider).first<{id:string}>();
   const aiEnabled=env.WHATSAPP_AI_ENABLED==='true'||(env.WHATSAPP_AI_ENABLED!=='false'&&!!(env.GEMINI_API_KEY||env.GROQ_API_KEY||env.GROQ_API_KEY_FALLBACK));
   if(winner?.id===messageId&&aiEnabled&&message.type==='text'){
    try{const generated=await answer(env,conversation([{role:'user',content}]));if(!generated.handoff){const chat=(await env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id=?').bind(id).first<WhatsAppConversation>())!;const queued=await enqueue(env,chat,{id:'ai-'+await hash(provider),kind:'text',body:generated.answer,delay:0},'ai');await dispatch(env,queued.id);}}catch{/* The human inbox retains the inbound message if AI is unavailable. */}
   }
  }
  for(const status of Array.isArray(value.statuses)?value.statuses:[]){if(++count>100)throw new CheckoutError(413,'Too many WhatsApp events.');const provider=String(status.id||'');const mapped:Record<string,string>={sent:'SENT',delivered:'DELIVERED',read:'READ',failed:'FAILED'};if(!Object.hasOwn(mapped,status.status)||!provider||provider.length>200)continue;
   const rank={sent:1,failed:1,delivered:2,read:3}[status.status as 'sent']||0,at=Number(status.timestamp)*1000;if(!Number.isSafeInteger(at)||at>Date.now()+300000||at<0)continue;
   await env.DB.prepare('INSERT INTO whatsapp_delivery_events(provider_id,state,rank,occurred_at) VALUES(?,?,?,?) ON CONFLICT(provider_id) DO UPDATE SET state=excluded.state,rank=excluded.rank,occurred_at=excluded.occurred_at WHERE excluded.rank>rank OR (excluded.rank=rank AND excluded.occurred_at>=occurred_at)').bind(provider,mapped[status.status],rank,at).run();
   // Late or repeated status events cannot downgrade a delivered/read message.
   await env.DB.prepare("UPDATE whatsapp_messages SET state=?,error=? WHERE provider_id=? AND direction='OUT' AND state<>'READ' AND (state<>'DELIVERED' OR ?='READ')").bind(mapped[status.status],status.status==='failed'?'Provider reported delivery failure.':null,provider,mapped[status.status]).run();
  }
 }
}
