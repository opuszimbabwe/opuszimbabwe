import {requireAdmin,json} from '../../_lib/auth';
import {careState,runCare,event,draftReport,approveReport,sendReport,reportDelivery} from '../../_lib/care';
import {receiptEmail} from '../../../lib/receipt-contact';
import {trustedOrigin,CheckoutError,limitAttempts} from '../../_lib/payments';
import type {PagesHandler} from '../../_lib/types';
const fail=(e:unknown)=>json({error:e instanceof CheckoutError?e.message:'The care workspace is temporarily unavailable.'},e instanceof CheckoutError?e.status:503,{'cache-control':'no-store'});
export const onRequestGet:PagesHandler=async c=>{const actor=await requireAdmin(c);if(actor instanceof Response)return actor;try{return json(await careState(c.env),200,{'cache-control':'no-store'});}catch(e){return fail(e);}};
export const onRequestPost:PagesHandler=async c=>{
 const actor=await requireAdmin(c);if(actor instanceof Response)return actor;
 try{
  trustedOrigin(c.request);await limitAttempts(c,'care-admin',30);
  if(!c.request.headers.get('content-type')?.includes('application/json'))throw new CheckoutError(415,'JSON required.');
  const reader=c.request.body?.getReader();if(!reader)throw new CheckoutError(400,'Details required.');
  let raw='',size=0;const decoder=new TextDecoder();
  while(true){const x=await reader.read();if(x.done)break;size+=x.value.byteLength;if(size>370000){await reader.cancel();throw new CheckoutError(413,'Request is too large.');}raw+=decoder.decode(x.value,{stream:true});}raw+=decoder.decode();
  let b:Record<string,unknown>;try{b=JSON.parse(raw);if(!b||Array.isArray(b)||typeof b!=='object')throw Error();}catch{throw new CheckoutError(400,'Invalid request.');}
  const text=(v:unknown,max:number)=>{if(typeof v!=='string'||v.length>max||/[\u0000-\u0008\u000b-\u001f]/.test(v))throw new CheckoutError(400,'Check the entered text.');return v.trim();};
  if(b.action==='check')return json(await runCare(c.env));
  if(b.action==='plan'){
   if(![10,20,60,120].includes(Number(b.price_usd))||!Array.isArray(b.features)||b.features.length>8||typeof b.visible!=='boolean')throw new CheckoutError(400,'Check the plan details.');
   const name=text(b.name,60),summary=text(b.summary,180),features=b.features.map(x=>text(x,180)).filter(Boolean);
   if(!name||!summary||!features.length)throw new CheckoutError(400,'Plan name, summary and features are required.');
   await c.env.DB.prepare('UPDATE care_plans SET name=?,summary=?,features=?,visible=? WHERE price_usd=?').bind(name,summary,JSON.stringify(features),b.visible?1:0,Number(b.price_usd)).run();
   await event(c.env,'settings','Care plan updated',`USD ${Number(b.price_usd)}/month`,actor);
  }else if(b.action==='settings'){
   const email=text(b.email,254),alert=text(b.alert_email,254);
   if(email&&!receiptEmail(email)||alert&&!receiptEmail(alert))throw new CheckoutError(400,'Enter valid email addresses.');
   if(![10,20,60,120].includes(Number(b.plan_usd))||typeof b.enabled!=='boolean')throw new CheckoutError(400,'Choose a valid plan and monitoring state.');
   await c.env.DB.prepare("UPDATE care_projects SET email=?,alert_email=?,plan_usd=?,enabled=? WHERE id='opus'").bind(email,alert,Number(b.plan_usd),b.enabled?1:0).run();
   await event(c.env,'settings','Monitoring settings updated','',actor);
  }else if(b.action==='event'){
   if(!['maintenance','deployment','backup','note'].includes(String(b.category)))throw new CheckoutError(400,'Choose a log category.');
   const title=text(b.title,120),note=text(b.note,1000);if(!title)throw new CheckoutError(400,'A log title is required.');
   await event(c.env,String(b.category),title,note,actor);
  }else if(b.action==='draft')await draftReport(c.env,b.month,actor);
  else if(b.action==='approve')await approveReport(c.env,b.id,b.updated_at,b.pdf,actor);
  else if(b.action==='send')return json(await sendReport(c.env,b.id,actor));
  else if(b.action==='delivery')return json(await reportDelivery(c.env,b.id));
  else if(b.action==='retry'){
   if(typeof b.id!=='string')throw new CheckoutError(400,'Choose a valid report.');
   const reset=await c.env.DB.prepare("UPDATE care_reports SET delivery_status='NOT_SENT',provider_id=NULL,delivery_error=NULL,delivery_attempt=delivery_attempt+1,updated_at=? WHERE id=? AND project_id='opus' AND delivery_status='FAILED' AND provider_id IS NULL RETURNING id").bind(new Date().toISOString(),b.id).first();
   if(!reset)throw new CheckoutError(409,'Only a provider-rejected email without an accepted reference can be prepared for retry. Check Resend for uncertain sends.');
   await event(c.env,'report','Rejected email prepared for retry','No automatic send was made.',actor);
  }
  else throw new CheckoutError(400,'Choose a valid action.');
  return json({ok:true},200,{'cache-control':'no-store'});
 }catch(e){return fail(e);}
};
