import {requireAdmin} from '../../_lib/auth';
import {hash,TOKEN,identifier,CheckoutError,failure,rate} from '../../_lib/http';
import {download} from '../../_lib/files';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{
 const raw=c.params.id,id=identifier(Array.isArray(raw)?raw[0]:raw,'project');const url=new URL(c.request.url),token=c.request.headers.get('authorization')?.replace(/^Bearer /,'')||url.searchParams.get('token')||'';
 const identity=await requireAdmin(c);if(identity instanceof Response){if(!TOKEN.test(token))throw new CheckoutError(404,'Download not found.');const grant=await c.env.DB.prepare('SELECT g.project_id FROM project_download_grants g JOIN project_downloads d ON d.project_id=g.project_id AND d.sha256=g.download_sha256 WHERE g.token_hash=? AND g.project_id=? AND g.expires_at>?').bind(await hash(token),id,Date.now()).first();if(!grant)throw new CheckoutError(404,'Download not found.');}
 await rate(c,'project-download',60);const row=await c.env.DB.prepare('SELECT storage_key,filename FROM project_downloads WHERE project_id=?').bind(id).first<{storage_key:string;filename:string}>();const object=row?await c.env.MEDIA.get(row.storage_key):null;if(!object)throw new CheckoutError(404,'Download not found.');return download(object,row!.filename,'application/zip');
 }catch(e){return failure(e)}};
