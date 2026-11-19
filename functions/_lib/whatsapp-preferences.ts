import type {Env} from './types';
import {now,CheckoutError} from './http';
import {audit} from './whatsapp-audit';
export interface ContactPreference {recipient_phone:string;stopped:number;event_ms:number;provider_message_id:string|null;human_hold:number;human_requested_at:string|null;updated_at:string}
export function preferenceCommand(value:string):'STOP'|'START'|null{
 const s=value.normalize('NFKC').trim().toLowerCase().replace(/[.!?]+$/,'').trim();
 if(['stop','unsubscribe','stop messages','stop messaging me','stop sending me messages','please stop','unsubscribe me','remove me','regai kunditumira mameseji','musanditumire mameseji'].includes(s))return 'STOP';
 if(['start','resume','resume messages'].includes(s))return 'START';
 return null;
}
export async function contactPreference(env:Env,phone:string){return env.DB.prepare('SELECT * FROM whatsapp_contact_preferences WHERE recipient_phone=?').bind(phone).first<ContactPreference>();}
export async function applyPreference(env:Env,phone:string,command:'STOP'|'START',event_ms:number,provider_message_id:string,conversation_id:string){
 const stopped=command==='STOP'?1:0;
 await env.DB.batch([
  env.DB.prepare('INSERT INTO whatsapp_contact_preferences(recipient_phone,stopped,event_ms,provider_message_id,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(recipient_phone) DO UPDATE SET stopped=excluded.stopped,event_ms=excluded.event_ms,provider_message_id=excluded.provider_message_id,updated_at=excluded.updated_at WHERE excluded.event_ms>whatsapp_contact_preferences.event_ms OR (excluded.event_ms=whatsapp_contact_preferences.event_ms AND excluded.stopped>whatsapp_contact_preferences.stopped)').bind(phone,stopped,event_ms,provider_message_id,now()),
  env.DB.prepare("UPDATE whatsapp_messages SET state='CANCELLED',error='Customer requested STOP; this unsent reply was cancelled.' WHERE conversation_id=? AND direction='OUT' AND state='QUEUED' AND EXISTS(SELECT 1 FROM whatsapp_contact_preferences WHERE recipient_phone=? AND stopped=1)").bind(conversation_id,phone)
 ]);
 const effective=await contactPreference(env,phone);
 await audit(env,stopped?'contact_stop_received':'contact_start_received',{conversation_id,recipient_phone:phone,provider_message_id,details:{event_ms,effective_stopped:effective?.stopped===1,service_replies_only:true,marketing_consent:false,stale_command_ignored:effective?.provider_message_id!==provider_message_id}});
}
export async function assertContactAllowed(env:Env,phone:string){if((await contactPreference(env,phone))?.stopped)throw new CheckoutError(409,'This contact requested STOP. Sending remains blocked until they send START.');}
export async function requestHuman(env:Env,phone:string,conversation_id:string,provider_message_id:string){
 await env.DB.prepare('INSERT INTO whatsapp_contact_preferences(recipient_phone,human_hold,human_requested_at,updated_at) VALUES(?,1,?,?) ON CONFLICT(recipient_phone) DO UPDATE SET human_hold=1,human_requested_at=excluded.human_requested_at,updated_at=excluded.updated_at').bind(phone,now(),now()).run();
 await audit(env,'human_assistance_requested',{conversation_id,recipient_phone:phone,provider_message_id,details:{automatic_replies_paused:true}});
}
export async function resumeContactAutomation(env:Env,phone:string,actor:string){
 const p=await contactPreference(env,phone);if(p?.stopped)throw new CheckoutError(409,'Staff cannot override STOP. The contact must send START.');
 await env.DB.prepare('UPDATE whatsapp_contact_preferences SET human_hold=0,human_requested_at=NULL,updated_at=? WHERE recipient_phone=?').bind(now(),phone).run();
 await audit(env,'contact_automation_resumed',{recipient_phone:phone,details:{actor:actor.includes('@')?'authorised-admin':actor,marketing_consent:false}});
}
