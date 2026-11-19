import {admin,body,identifier,integer,CheckoutError,response,failure,rate} from '../../_lib/http';
import {configured,enqueue,dispatch,type WhatsAppConversation} from '../../_lib/whatsapp';
import {resumeContactAutomation} from '../../_lib/whatsapp-preferences';
import {diagnostics,verifySenderIdentity,verifySenderHealth,resumeSender,audit} from '../../_lib/whatsapp-audit';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{
 await admin(c);const url=new URL(c.request.url);
 if(url.searchParams.get('diagnostics')==='1'){const before=url.searchParams.get('before'),beforeId=url.searchParams.get('before_id');if(before&&(!/^\d{4}-\d{2}-\d{2}T/.test(before)||before.length>40||!beforeId||! /^[A-Za-z0-9:_-]{1,240}$/.test(beforeId)))throw new CheckoutError(400,'Invalid audit cursor.');return response(await diagnostics(c.env,before||undefined,beforeId||undefined));}
 const count=await c.env.DB.prepare("SELECT COUNT(*) AS total FROM whatsapp_messages m JOIN whatsapp_conversations c ON c.id=m.conversation_id WHERE m.direction='IN' AND m.seq>c.read_seq").first<{total:number}>();
 const website=await c.env.DB.prepare("SELECT COUNT(*) AS total FROM website_chat_messages m JOIN website_chat_sessions s ON s.id=m.session_id WHERE m.direction='IN' AND m.seq>s.admin_read_seq").first<{total:number}>();
 if(url.searchParams.get('summary')==='1')return response({unread:count?.total||0,website_unread:website?.total||0});
 const selected=url.searchParams.get('conversation')||'',status=url.searchParams.get('status')||'ALL',search=url.searchParams.get('search')||'';
 if(search.length>120||!['ALL','OPEN','HANDLED','all','open','handled'].includes(status))throw new CheckoutError(400,'Invalid inbox filter.');
 const conversations=(await c.env.DB.prepare(`SELECT c.*,(SELECT body FROM whatsapp_messages m WHERE m.conversation_id=c.id ORDER BY occurred_at DESC,seq DESC LIMIT 1) AS preview,(SELECT COUNT(*) FROM whatsapp_messages m WHERE m.conversation_id=c.id AND m.direction='IN' AND m.seq>c.read_seq) AS unread FROM whatsapp_conversations c WHERE (?='ALL' OR c.status=?) AND (c.phone LIKE ? ESCAPE '\\' OR c.display_name LIKE ? ESCAPE '\\') ORDER BY c.last_message_at DESC,c.id LIMIT 100`).bind(status.toUpperCase(),status.toUpperCase(),'%'+search.replace(/[\\%_]/g,'\\$&')+'%','%'+search.replace(/[\\%_]/g,'\\$&')+'%').all()).results;
 let conversation:WhatsAppConversation|null=null,messages:unknown[]=[],hasMore=false;
 if(selected){identifier(selected,'conversation');conversation=await c.env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id=?').bind(selected).first<WhatsAppConversation>();if(!conversation)throw new CheckoutError(404,'Conversation not found.');const before=integer(url.searchParams.get('before'),Number.MAX_SAFE_INTEGER,1);const rows=(await c.env.DB.prepare('SELECT * FROM whatsapp_messages WHERE conversation_id=? AND seq<? ORDER BY seq DESC LIMIT 101').bind(selected,before).all()).results;hasMore=rows.length>100;messages=rows.slice(0,100).reverse();}
 return response({configured:configured(c.env),sender_configured:configured(c.env),conversations,conversation,messages,hasMore,server_now:Date.now(),unread:count?.total||0,website_unread:website?.total||0});
 }catch(e){return failure(e)}};
export const onRequestPost:PagesHandler=async c=>{try{
 const email=await admin(c,true),data=await body(c.request);
 if(data.action==='diagnostics_verify_sender'){await rate(c,'whatsapp-diagnostics',5);return response({identity:await verifySenderIdentity(c.env)});}
 if(data.action==='diagnostics_verify_health'){await rate(c,'whatsapp-diagnostics',5);return response({health:await verifySenderHealth(c.env)});}
 if(data.action==='diagnostics_resume'){await rate(c,'whatsapp-diagnostics',5);await resumeSender(c.env,data.confirmed,email);return response({ok:true});}
 if(data.action==='diagnostics_resume_contact'){const phone=String(data.phone||'');if(!/^\d{7,20}$/.test(phone))throw new CheckoutError(400,'Choose a valid contact.');await resumeContactAutomation(c.env,phone,email);return response({ok:true});}
 const id=identifier(data.conversation_id,'conversation');
 const chat=await c.env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id=?').bind(id).first<WhatsAppConversation>();if(!chat)throw new CheckoutError(404,'Conversation not found.');
 if(data.action==='reply'){
  await rate(c,'whatsapp-reply',30);const message=await enqueue(c.env,chat,data,email);
  await audit(c.env,'message_origin',{id:'origin:'+message.id,message_id:message.id,conversation_id:chat.id,recipient_phone:chat.phone,details:{origin:'staff_reply',ai_provider:null,ai_model:null,customer_initiated:!!chat.last_customer_at}});
  if(message.due_at<=Date.now()&&message.state==='QUEUED'){const work=dispatch(c.env,message.id).catch(()=>{});if(c.waitUntil)c.waitUntil(work);else await work;}
  return response({ok:true,message},201);
 }
 if(data.action==='read'){const seq=integer(data.seq,0);await c.env.DB.prepare('UPDATE whatsapp_conversations SET read_seq=MAX(read_seq,MIN(?,last_inbound_seq)) WHERE id=?').bind(seq,id).run();return response({ok:true});}
 if(data.action==='status'){if(!['OPEN','HANDLED'].includes(String(data.status)))throw new CheckoutError(400,'Invalid conversation state.');await c.env.DB.prepare('UPDATE whatsapp_conversations SET status=? WHERE id=?').bind(data.status,id).run();return response({ok:true});}
 if(data.action==='cancel'){const message=identifier(data.id,'message');const row=await c.env.DB.prepare("UPDATE whatsapp_messages SET state='CANCELLED' WHERE id=? AND conversation_id=? AND state='QUEUED' RETURNING id").bind(message,id).first();if(!row)throw new CheckoutError(409,'Only a queued, unsent reply can be cancelled.');return response({ok:true});}
 throw new CheckoutError(400,'Choose reply, read, status or cancel.');
 }catch(e){return failure(e)}};
