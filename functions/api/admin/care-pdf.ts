import {requireAdmin,json} from '../../_lib/auth';
import {reportById} from '../../_lib/care';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{
 const actor=await requireAdmin(c);if(actor instanceof Response)return actor;
 try{
  const report=await reportById(c.env,new URL(c.request.url).searchParams.get('id'));
  const object=report.pdf_key?await c.env.MEDIA.get(report.pdf_key):null;
  if(!object)return json({error:'Approved PDF not found.'},404);
  return new Response(object.body,{headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="Opus-care-${report.month}.pdf"`,'cache-control':'no-store','x-content-type-options':'nosniff'}});
 }catch{return json({error:'Report unavailable.'},404);}
};
