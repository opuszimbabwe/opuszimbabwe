import {requireAdmin,json} from '../../_lib/auth';
import {reportById} from '../../_lib/care';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{
 const actor=await requireAdmin(c);if(actor instanceof Response)return actor;
 try{
  const report=await reportById(c.env,new URL(c.request.url).searchParams.get('id'));
  const edition=new URL(c.request.url).searchParams.get('revision');
  let key=report.pdf_key;
  if(edition!==null){if(!/^[1-9]\d{0,5}$/.test(edition))return json({error:'Invalid edition.'},400);const archived=await c.env.DB.prepare('SELECT pdf_key FROM care_report_editions WHERE report_id=? AND revision=?').bind(report.id,Number(edition)).first<{pdf_key:string}>();key=archived?.pdf_key||null;}
  const object=key?await c.env.MEDIA.get(key):null;
  if(!object)return json({error:'Approved PDF not found.'},404);
  return new Response(object.body,{headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="Opus-care-${report.month}-edition-${edition||report.revision}.pdf"`,'cache-control':'no-store','x-content-type-options':'nosniff'}});
 }catch{return json({error:'Report unavailable.'},404);}
};
