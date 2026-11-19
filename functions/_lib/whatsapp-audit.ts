import type {Env} from './types';
import {now,CheckoutError} from './http';
export const WA_TRACKER_VERSION='wa-tracker-20261120-1';
export interface AuditFields {id?:string;phone_number_id?:string|null;waba_id?:string;conversation_id?:string;message_id?:string;provider_message_id?:string;recipient_phone?:string;occurred_at?:string;details?:Record<string,unknown>}
export function safeMetaText(env:Env,value:unknown,max=1200):string|null{
 if(typeof value!=='string')return null;
 let s=value;
 for(const key of [env.WHATSAPP_TOKEN,env.WHATSAPP_APP_SECRET,env.WHATSAPP_VERIFY_TOKEN,env.GROQ_API_KEY,env.GROQ_API_KEY_FALLBACK,env.GEMINI_API_KEY])if(key)s=s.split(key).join('[redacted]');
 return s.replace(/Bearer\s+[^\s"<>]+/gi,'Bearer [redacted]').replace(/EAA[A-Za-z0-9_-]{20,}/g,'[redacted]').replace(/https?:\/\/[^\s<>"\\]+/g,u=>{try{const x=new URL(u);x.username='';x.password='';x.search='';x.hash='';return x.href}catch{return '[url]'}}).slice(0,max);
}
export async function audit(env:Env,event_type:string,fields:AuditFields={}){
 const details={tracker_version:WA_TRACKER_VERSION,app_id:/^\d{5,30}$/.test(env.WHATSAPP_APP_ID||'')?env.WHATSAPP_APP_ID:null,...fields.details};
 await env.DB.prepare('INSERT OR IGNORE INTO whatsapp_audit_events(id,event_type,created_at,occurred_at,phone_number_id,waba_id,conversation_id,message_id,provider_message_id,recipient_phone,details_json) VALUES(?,?,?,?,?,?,?,?,?,?,?)').bind(fields.id||crypto.randomUUID(),event_type,now(),fields.occurred_at||null,fields.phone_number_id===undefined?(env.WHATSAPP_PHONE_NUMBER_ID||null):fields.phone_number_id,fields.waba_id||null,fields.conversation_id||null,fields.message_id||null,fields.provider_message_id||null,fields.recipient_phone||null,JSON.stringify(details)).run();
}
export function metaError(env:Env,value:any,http_status:number|null){
 const e=value?.error||value||{};const n=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)?v:null;
 return {http_status,code:n(e.code),subcode:n(e.error_subcode),type:safeMetaText(env,e.type,100),message:safeMetaText(env,e.message,800),details:safeMetaText(env,e.error_data?.details||e.details,1200),trace_id:safeMetaText(env,e.fbtrace_id,200),title:safeMetaText(env,e.title,300),is_transient:e.is_transient===true};
}
export async function senderState(env:Env){return env.DB.prepare('SELECT * FROM whatsapp_sender_diagnostics WHERE phone_number_id=?').bind(env.WHATSAPP_PHONE_NUMBER_ID||'').first<Record<string,any>>();}
export async function blockSender(env:Env,code:number|null,reason:string){
 if(code!==null&&![190,131031,131048].includes(code))return;
 const at=now();await env.DB.batch([
  env.DB.prepare('INSERT INTO whatsapp_sender_diagnostics(phone_number_id,blocked_code,blocked_at,blocked_reason,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(phone_number_id) DO UPDATE SET blocked_code=excluded.blocked_code,blocked_at=excluded.blocked_at,blocked_reason=excluded.blocked_reason,updated_at=excluded.updated_at').bind(env.WHATSAPP_PHONE_NUMBER_ID||'',code,at,reason,at),
  env.DB.prepare("UPDATE whatsapp_messages SET state='CANCELLED',error='Sender paused after a Meta restriction/authentication error. Review before creating a new reply.' WHERE direction='OUT' AND state='QUEUED'")
 ]);
 await audit(env,'sender_paused',{details:{code,reason}});
}
export async function assertSenderReady(env:Env){const s=await senderState(env);if(s?.blocked_at)throw new CheckoutError(409,'WhatsApp sending is paused after a Meta restriction/authentication error. Review the private tracker before resuming.');}
export async function originInfo(env:Env,message_id:string){const row=await env.DB.prepare("SELECT details_json FROM whatsapp_audit_events WHERE message_id=? AND event_type='message_origin' ORDER BY created_at DESC LIMIT 1").bind(message_id).first<{details_json:string}>();return row?JSON.parse(row.details_json):{origin:'legacy-or-staff',ai_provider:null,ai_model:null,triggering_inbound_id:null};}
export async function rememberIdentity(env:Env,phone_number_id:string,data:any){
 if(data?.id!==phone_number_id)throw new CheckoutError(502,'Meta returned a different sender ID.');
 const identity={id:phone_number_id,display_phone_number:safeMetaText(env,data.display_phone_number,80),verified_name:safeMetaText(env,data.verified_name,160),quality_rating:safeMetaText(env,data.quality_rating,40),code_verification_status:safeMetaText(env,data.code_verification_status,80),platform_type:safeMetaText(env,data.platform_type,80)};
 await env.DB.prepare('INSERT INTO whatsapp_sender_diagnostics(phone_number_id,display_phone_number,verified_name,quality_rating,identity_checked_at,identity_json,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(phone_number_id) DO UPDATE SET display_phone_number=excluded.display_phone_number,verified_name=excluded.verified_name,quality_rating=excluded.quality_rating,identity_checked_at=excluded.identity_checked_at,identity_json=excluded.identity_json,updated_at=excluded.updated_at').bind(phone_number_id,identity.display_phone_number,identity.verified_name,identity.quality_rating,now(),JSON.stringify(identity),now()).run();
 await audit(env,'sender_identity_verified',{details:identity});return identity;
}
export async function verifySenderIdentity(env:Env){
 const id=env.WHATSAPP_PHONE_NUMBER_ID;if(!id||!/^\d{5,30}$/.test(id)||!env.WHATSAPP_TOKEN)throw new CheckoutError(503,'WhatsApp sender credentials are not configured.');
 // GET only: does not register a number, send a message or change account state.
 const r=await fetch('https://graph.facebook.com/v23.0/'+id+'?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type',{headers:{authorization:'Bearer '+env.WHATSAPP_TOKEN},redirect:'manual',signal:AbortSignal.timeout(15000)});
 let data:any;try{data=JSON.parse((await r.text()).slice(0,65536))}catch{data={}}
 if(!r.ok){const error=metaError(env,data,r.status);await audit(env,'sender_identity_lookup_failed',{details:error});throw new CheckoutError(502,'Meta could not verify the configured sender. See the private tracker for the reported error.');}
 return rememberIdentity(env,id,data);
}
export async function diagnostics(env:Env,before?:string,beforeId?:string){
 const events=(await env.DB.prepare('SELECT * FROM whatsapp_audit_events WHERE (? IS NULL OR created_at<? OR (created_at=? AND id<?)) ORDER BY created_at DESC,id DESC LIMIT 100').bind(before||null,before||null,before||null,beforeId||'').all<Record<string,any>>()).results.map(r=>({...r,details:JSON.parse(r.details_json),details_json:undefined}));
 const recent=(await env.DB.prepare("SELECT m.id,m.created_at,m.occurred_at,m.direction,m.message_type,m.body,m.state,m.error,m.attempts,m.admin_email,c.phone AS recipient_phone,EXISTS(SELECT 1 FROM whatsapp_audit_events a WHERE a.message_id=m.id AND a.event_type='send_started') AS sender_captured FROM whatsapp_messages m JOIN whatsapp_conversations c ON c.id=m.conversation_id ORDER BY m.seq DESC LIMIT 50").all()).results;
 return {tracker_version:WA_TRACKER_VERSION,configured_phone_number_id:env.WHATSAPP_PHONE_NUMBER_ID||null,sender:await senderState(env),events,recent_messages:recent,server_time:now(),historical_sender_warning:'Legacy messages do not establish the historical sender or AI model. High number quality is distinct from account restrictions.'};
}
export async function resumeSender(env:Env,confirmed:unknown,actor:string){
 if(confirmed!==true)throw new CheckoutError(400,'Confirm that the Meta restriction has been reviewed and resolved.');
 await audit(env,'sender_resumed_by_admin',{details:{actor:actor.includes('@')?'authorised-admin':actor,acknowledged_meta_review:true}});
 await env.DB.prepare('UPDATE whatsapp_sender_diagnostics SET blocked_code=NULL,blocked_at=NULL,blocked_reason=NULL,updated_at=? WHERE phone_number_id=?').bind(now(),env.WHATSAPP_PHONE_NUMBER_ID||'').run();
 // Cancelled/failed/uncertain messages are never requeued by this action.
}
export async function pruneAudit(env:Env){await env.DB.prepare('DELETE FROM whatsapp_audit_events WHERE created_at<?').bind(new Date(Date.now()-90*86400000).toISOString()).run();}

export function accountNotice(env:Env,value:unknown,depth=0):unknown{
 if(depth>4)return '[truncated]';
 if(typeof value==='string')return safeMetaText(env,value,1000);
 if(typeof value==='number'||typeof value==='boolean'||value===null)return value;
 if(Array.isArray(value))return value.slice(0,20).map(v=>accountNotice(env,v,depth+1));
 if(value&&typeof value==='object'){const out:Record<string,unknown>={};for(const[k,v]of Object.entries(value).slice(0,25)){if(/token|secret|signature|authorization|password|verification_code|pin/i.test(k))out[k]='[redacted]';else if(!['messages','contacts'].includes(k))out[k]=accountNotice(env,v,depth+1)}return out;}
 return null;
}

export function metaHeaders(env:Env,headers:Headers){
 return {retry_after:safeMetaText(env,headers.get('retry-after'),80),request_id:safeMetaText(env,headers.get('x-fb-request-id'),200),trace_header:safeMetaText(env,headers.get('x-fb-trace-id'),200),app_usage:safeMetaText(env,headers.get('x-app-usage'),3000),business_usage:safeMetaText(env,headers.get('x-business-use-case-usage'),3000)};
}

export async function verifySenderHealth(env:Env){
 const id=env.WHATSAPP_PHONE_NUMBER_ID;if(!id||!/^\d{5,30}$/.test(id)||!env.WHATSAPP_TOKEN)throw new CheckoutError(503,'WhatsApp sender credentials are not configured.');
 const r=await fetch('https://graph.facebook.com/v23.0/'+id+'?fields=health_status',{headers:{authorization:'Bearer '+env.WHATSAPP_TOKEN},redirect:'manual',signal:AbortSignal.timeout(15000)});
 let data:any;try{data=JSON.parse((await r.text()).slice(0,65536))}catch{data={}}
 if(!r.ok){await audit(env,'sender_health_lookup_failed',{details:metaError(env,data,r.status)});throw new CheckoutError(502,'Meta did not return messaging health. See the private tracker for its reported error.');}
 if(!data.health_status||typeof data.health_status!=='object')throw new CheckoutError(502,'Meta returned no health status.');
 const errors=(items:any)=>Array.isArray(items)?items.slice(0,10).map(e=>({error_code:typeof e.error_code==='number'?e.error_code:safeMetaText(env,e.error_code,40),error_description:safeMetaText(env,e.error_description,1600),possible_solution:safeMetaText(env,e.possible_solution,1600)})):[];
 const health={can_send_message:safeMetaText(env,data.health_status.can_send_message,80),errors:errors(data.health_status.errors),entities:(Array.isArray(data.health_status.entities)?data.health_status.entities:[]).slice(0,30).map((e:any)=>({entity_type:safeMetaText(env,e.entity_type,80),id:/^\d{5,30}$/.test(String(e.id||''))?String(e.id):null,can_send_message:safeMetaText(env,e.can_send_message,80),errors:errors(e.errors)}))};
 const waba=health.entities.find((e:any)=>e.entity_type==='WABA')?.id||null,app=health.entities.find((e:any)=>e.entity_type==='APP')?.id||null;
 await env.DB.prepare('INSERT INTO whatsapp_sender_diagnostics(phone_number_id,waba_id,app_id,health_checked_at,health_json,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(phone_number_id) DO UPDATE SET waba_id=COALESCE(excluded.waba_id,whatsapp_sender_diagnostics.waba_id),app_id=COALESCE(excluded.app_id,whatsapp_sender_diagnostics.app_id),health_checked_at=excluded.health_checked_at,health_json=excluded.health_json,updated_at=excluded.updated_at').bind(id,waba,app,now(),JSON.stringify(health),now()).run();
 await audit(env,'sender_health_checked',{waba_id:waba||undefined,details:{app_id:app,health}});
 if(health.can_send_message==='BLOCKED')await blockSender(env,null,'Meta Health Status reports messaging BLOCKED. Review the health entities and provider reasons before resuming.');
 return health;
}
