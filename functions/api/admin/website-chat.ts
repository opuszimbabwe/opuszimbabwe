import {inbox,writeMessage} from '../../_lib/chat';
import {admin,body,identifier,integer,CheckoutError,response,failure} from '../../_lib/http';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{await admin(c);const u=new URL(c.request.url),attachment=u.searchParams.get('attachment');if(attachment){const {chatAttachment}=await import('../../_lib/chat-attachments');return await chatAttachment(c,attachment,true);}return response(await inbox(c));}catch(e){return failure(e)}};
export const onRequestPost:PagesHandler=async c=>{try{await admin(c,true);const data=await body(c.request),id=identifier(data.session,'conversation');if(!await c.env.DB.prepare('SELECT id FROM website_chat_sessions WHERE id=?').bind(id).first())throw new CheckoutError(404,'Conversation not found.');
 if(data.action==='reply')return response(await writeMessage(c,id,'OUT',data),201);
 if(data.action==='read'){const seq=integer(data.seq,0);await c.env.DB.prepare('UPDATE website_chat_sessions SET admin_read_seq=MAX(admin_read_seq,MIN(?,COALESCE((SELECT MAX(seq) FROM website_chat_messages WHERE session_id=?),0))) WHERE id=?').bind(seq,id,id).run();return response({ok:true});}
 throw new CheckoutError(400,'Choose reply or read.');}catch(e){return failure(e)}};
