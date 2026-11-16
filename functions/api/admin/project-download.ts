import {admin,form,text,identifier,hash,now,CheckoutError,response,failure,rate} from '../../_lib/http';
import {fileName} from '../../_lib/files';
import type {PagesHandler} from '../../_lib/types';
export const onRequestPost:PagesHandler=async c=>{try{await admin(c,true);await rate(c,'project-download-upload',10);const data=await form(c.request,20*1024*1024+65536),id=identifier(data.get('project_id')??data.get('id'),'project'),version=text(data.get('version'),'version',80),file=data.get('file');
 if(!await c.env.DB.prepare('SELECT id FROM projects WHERE id=?').bind(id).first())throw new CheckoutError(404,'Project not found.');
 if(!(file instanceof File)||!file.size||file.size>20*1024*1024||!file.name.toLowerCase().endsWith('.zip'))throw new CheckoutError(400,'Upload a project ZIP up to 20 MB.');
 const content=new Uint8Array(await file.arrayBuffer());if(content[0]!==80||content[1]!==75||![3,5,7].includes(content[2]))throw new CheckoutError(415,'Use a ZIP archive.');
 const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',content))].map(x=>x.toString(16).padStart(2,'0')).join(''),key='private/project-downloads/'+id+'/'+crypto.randomUUID();
 const token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');const expires=Date.now()+7*86400000;
 await c.env.MEDIA.put(key,content.buffer,{httpMetadata:{contentType:'application/zip'}});
 try{await c.env.DB.batch([
  c.env.DB.prepare('INSERT INTO project_downloads(project_id,storage_key,filename,version,sha256,size,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(project_id) DO UPDATE SET storage_key=excluded.storage_key,filename=excluded.filename,version=excluded.version,sha256=excluded.sha256,size=excluded.size,updated_at=excluded.updated_at').bind(id,key,fileName(file.name),version,sha256,content.length,now()),
  c.env.DB.prepare('INSERT INTO project_download_grants(token_hash,project_id,download_sha256,expires_at) VALUES(?,?,?,?)').bind(await hash(token),id,sha256,expires)
 ]);}catch(e){await c.env.MEDIA.delete(key);throw e;}
 return response({ok:true,project_id:id,version,sha256,size:content.length,download_url:'/api/downloads/'+encodeURIComponent(id)+'?token='+token,expires_at:expires},201);
 }catch(e){return failure(e)}};
