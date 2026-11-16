import {session} from './chat';
import {CheckoutError,UUID,form,rate,now,response} from './http';
import {MAX_ATTACHMENT,fileName,sniff,download} from './files';
import type {PagesContext} from './types';
interface Attachment{id:string;session_id:string;storage_key:string;filename:string;content_type:string;size:number}
export async function chatAttachment(c:PagesContext,id:string,staff=false){
 if(!UUID.test(id))throw new CheckoutError(404,'Attachment not found.');const who=staff?null:(await session(c))!;
 const row=await c.env.DB.prepare('SELECT * FROM website_chat_attachments WHERE id=?'+(staff?'':' AND session_id=?')).bind(...(staff?[id]:[id,who!.id])).first<Attachment>();
 if(!row)throw new CheckoutError(404,'Attachment not found.');const object=await c.env.MEDIA.get(row.storage_key);if(!object)throw new CheckoutError(404,'Attachment not found.');return download(object,row.filename,row.content_type,row.content_type.startsWith('image/'));
}
export async function uploadChatAttachment(c:PagesContext){
 const who=(await session(c))!;await rate(c,'chat-upload:'+who.id,20);const data=await form(c.request,MAX_ATTACHMENT+65536),file=data.get('file');if(!(file instanceof File)||!file.size||file.size>MAX_ATTACHMENT)throw new CheckoutError(400,'Choose a file up to 8 MB.');
 const name=fileName(file.name),bytes=new Uint8Array(await file.arrayBuffer()),mime=sniff(bytes,name),id=crypto.randomUUID(),key='private/chat/'+who.id+'/'+id;
 await c.env.MEDIA.put(key,bytes.buffer,{httpMetadata:{contentType:mime}});try{await c.env.DB.prepare('INSERT INTO website_chat_attachments(id,session_id,storage_key,filename,content_type,size,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,who.id,key,name,mime,bytes.length,now()).run();}catch(e){await c.env.MEDIA.delete(key);throw e;}
 return response({attachment:{id,filename:name,content_type:mime,size:bytes.length}},201);
}
