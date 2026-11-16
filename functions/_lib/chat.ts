import {hash,now,TOKEN,UUID,CheckoutError,body,origin,rate,response,identifier,text,integer} from './http';
import type {PagesContext} from './types';
export interface ChatSession {id:string;token_hash:string;name:string;created_at:string;last_activity:string;expires_at:number;admin_read_seq:number;request_hash:string}
export interface ChatMessage {seq:number;id:string;session_id:string;direction:'IN'|'OUT';body:string;attachment_id:string|null;created_at:string;reply_to_id:string|null;edited_at:string|null;deleted_at:string|null}
export const COOKIE='__Host-opus_chat';
export async function session(c:PagesContext,required=true){
 const raw=(c.request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';
 const row=TOKEN.test(raw)?await c.env.DB.prepare('SELECT * FROM website_chat_sessions WHERE token_hash=? AND expires_at>?').bind(await hash(raw),Date.now()).first<ChatSession>():null;
 if(!row&&required)throw new CheckoutError(401,'Open your website conversation first.');return row;
}
export function publicSession(row:ChatSession){return {id:row.id,name:row.name,expires_at:row.expires_at,admin_read_seq:row.admin_read_seq,last_activity:row.last_activity};}
export async function messages(c:PagesContext,id:string,before?:number){
 const result=await c.env.DB.prepare('SELECT * FROM website_chat_messages WHERE session_id=? AND seq<? ORDER BY seq DESC LIMIT 100').bind(id,before||Number.MAX_SAFE_INTEGER).all<ChatMessage>();return result.results.reverse();
}
export async function createSession(c:PagesContext){
 origin(c.request);const data=await body(c.request);const name=text(data.name??'Website visitor','name',100);
 const existing=await session(c,false);if(existing)return response({session:publicSession(existing)});
 await rate(c,'chat-session',20);const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
 const row:ChatSession={id:crypto.randomUUID(),token_hash:await hash(token),name,created_at:now(),last_activity:now(),expires_at:Date.now()+30*86400000,request_hash:await hash(c.request.headers.get('cf-connecting-ip')||'local'),admin_read_seq:0};
 await c.env.DB.prepare('INSERT INTO website_chat_sessions(id,token_hash,name,created_at,last_activity,expires_at,request_hash,admin_read_seq) VALUES(?,?,?,?,?,?,?,0)').bind(row.id,row.token_hash,row.name,row.created_at,row.last_activity,row.expires_at,row.request_hash).run();
 return response({session:publicSession(row)},201,{'set-cookie':COOKIE+'='+token+'; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax'});
}
export async function writeMessage(c:PagesContext,id:string,direction:'IN'|'OUT',data:Record<string,unknown>){
 const messageId=identifier(data.id,'message reference');if(!UUID.test(messageId))throw new CheckoutError(400,'Use a valid message reference.');
 const content=text(data.body??'','message',3000,false);const attachment=data.attachment_id?identifier(data.attachment_id,'attachment'):null;
 if(!content&&!attachment)throw new CheckoutError(400,'Write a message or attach a file.');
 const reply=data.reply_to?identifier(data.reply_to,'reply reference'):null;
 const existing=await c.env.DB.prepare('SELECT * FROM website_chat_messages WHERE id=?').bind(messageId).first<ChatMessage>();
 const match=(row:ChatMessage)=>row.session_id===id&&row.direction===direction&&row.body===content&&row.attachment_id===attachment&&row.reply_to_id===reply;
 if(existing){if(!match(existing))throw new CheckoutError(409,'This message reference is already in use.');return {message:existing,duplicate:true};}
 if(reply&&!await c.env.DB.prepare('SELECT id FROM website_chat_messages WHERE id=? AND session_id=?').bind(reply,id).first())throw new CheckoutError(400,'Reply to a message in this conversation.');
 if(attachment&&!await c.env.DB.prepare('SELECT id FROM website_chat_attachments WHERE id=? AND session_id=?').bind(attachment,id).first())throw new CheckoutError(400,'Attachment does not belong to this conversation.');
 await rate(c,'chat-message:'+id,60);
 try{await c.env.DB.batch([
  c.env.DB.prepare('INSERT INTO website_chat_messages(id,session_id,direction,body,attachment_id,created_at,reply_to_id) VALUES(?,?,?,?,?,?,?)').bind(messageId,id,direction,content,attachment,now(),reply),
  c.env.DB.prepare('UPDATE website_chat_sessions SET last_activity=? WHERE id=?').bind(now(),id)
 ]);}catch(error){const row=await c.env.DB.prepare('SELECT * FROM website_chat_messages WHERE id=?').bind(messageId).first<ChatMessage>();if(row&&match(row))return {message:row,duplicate:true};if(row)throw new CheckoutError(409,'This message reference is already in use.');throw error;}
 return {message:(await c.env.DB.prepare('SELECT * FROM website_chat_messages WHERE id=?').bind(messageId).first<ChatMessage>())!,duplicate:false};
}
export async function inbox(c:PagesContext){
 const url=new URL(c.request.url),selected=url.searchParams.get('session');if(selected)identifier(selected,'conversation');
 const sessions=(await c.env.DB.prepare(`SELECT s.id,s.name,s.created_at,s.last_activity,s.expires_at,s.admin_read_seq,
 (SELECT body FROM website_chat_messages m WHERE m.session_id=s.id ORDER BY seq DESC LIMIT 1) AS preview,
 (SELECT COUNT(*) FROM website_chat_messages m WHERE m.session_id=s.id AND m.direction='IN' AND m.seq>s.admin_read_seq) AS unread
 FROM website_chat_sessions s WHERE EXISTS(SELECT 1 FROM website_chat_messages m WHERE m.session_id=s.id) OR s.id=? ORDER BY s.last_activity DESC,s.id LIMIT 100`).bind(selected||'').all()).results;
 if(selected&&!await c.env.DB.prepare('SELECT id FROM website_chat_sessions WHERE id=?').bind(selected).first())throw new CheckoutError(404,'Conversation not found.');
 return {sessions,messages:selected?await messages(c,selected,integer(url.searchParams.get('before'),Number.MAX_SAFE_INTEGER,1)):[]};
}
