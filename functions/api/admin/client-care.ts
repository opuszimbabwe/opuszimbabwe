import {requireAdmin,json} from '../../_lib/auth';
import {trustedOrigin,readPaymentJson,CheckoutError,limitAttempts,findPayment,reconcile} from '../../_lib/payments';
import {clientProject,issueCareOrder,findCareOrder,clientEvent,iso,currentPeriod} from '../../_lib/client-care';
import {processDocumentJob,reconcileOrders,checkJobDelivery} from '../../_lib/operations';
import {receiptEmail} from '../../../lib/receipt-contact';
import type {PagesHandler} from '../../_lib/types';
import type {ClientJob} from '../../../lib/client-care';
const fail=(e:unknown)=>json({error:e instanceof CheckoutError?e.message:'The customer-care workspace could not complete this request.'},e instanceof CheckoutError?e.status:503,{'cache-control':'no-store'});
export const onRequestGet:PagesHandler=async c=>{
 const actor=await requireAdmin(c);if(actor instanceof Response)return actor;
 try{
  const [projects,orders,jobs,events,checks,repositories,repositoryEvents,releaseIssues]=await Promise.all([
   c.env.DB.prepare("SELECT * FROM care_projects WHERE id<>'opus' ORDER BY name").all(),
   c.env.DB.prepare('SELECT id,project_id,period,recipient,amount_minor,currency,state,payment_id,expires_at,created_at,updated_at FROM care_orders ORDER BY created_at DESC LIMIT 100').all(),
   c.env.DB.prepare('SELECT j.id,j.kind,j.order_id,j.status,j.attempts,j.next_at,j.error,j.email_status,j.provider_id,j.created_at,j.updated_at,CASE WHEN j.pdf_key IS NOT NULL THEN 1 ELSE 0 END AS pdf_available FROM ops_jobs j ORDER BY created_at DESC LIMIT 100').all(),
   c.env.DB.prepare("SELECT * FROM care_events WHERE project_id<>'opus' ORDER BY created_at DESC LIMIT 60").all(),
   c.env.DB.prepare("SELECT c.* FROM care_checks c WHERE project_id<>'opus' AND slot=(SELECT MAX(slot) FROM care_checks WHERE project_id=c.project_id) ORDER BY project_id").all(),
   c.env.DB.prepare('SELECT * FROM care_repository_integrations').all(),
   c.env.DB.prepare('SELECT * FROM care_repository_events ORDER BY occurred_at DESC LIMIT 40').all(),
   c.env.DB.prepare("SELECT * FROM care_release_issues ORDER BY CASE WHEN status='OPEN' THEN 0 ELSE 1 END,opened_at DESC LIMIT 80").all(),
  ]);
  return json({release_issues:releaseIssues.results,repositories:repositories.results,repository_events:repositoryEvents.results,projects:projects.results,orders:orders.results,jobs:jobs.results,events:events.results,checks:checks.results,renderer_configured:Boolean(c.env.CARE_RENDERER&&c.env.CARE_RENDER_SECRET),email_configured:Boolean(c.env.RESEND_API_KEY&&c.env.RECEIPT_FROM_EMAIL),current_period:currentPeriod()},200,{'cache-control':'no-store'});
 }catch(e){return fail(e);}
};
export const onRequestPost:PagesHandler=async c=>{
 const actor=await requireAdmin(c);if(actor instanceof Response)return actor;
 try{
  trustedOrigin(c.request);await limitAttempts(c,'client-care-admin',30);const b=await readPaymentJson(c.request);
  if(b.action==='issue')return json(await issueCareOrder(c.env,b.project_id,b.period,actor));
  if(b.action==='process'){await reconcileOrders(c.env);return json(await processDocumentJob(c.env));}
  if(b.action==='delivery')return json(await checkJobDelivery(c.env,b.job_id));
  if(b.action==='settings'){
   const p=await clientProject(c.env,b.project_id),email=receiptEmail(b.email);if(!email||typeof b.enabled!=='boolean'||typeof b.auto_documents!=='boolean'||!['progress-and-final','final-only'].includes(String(b.report_policy)))throw new CheckoutError(400,'Enter an authorised recipient and valid project options.');
   await c.env.DB.prepare('UPDATE care_projects SET email=?,enabled=?,auto_documents=?,report_policy=? WHERE id=?').bind(email,b.enabled?1:0,b.auto_documents?1:0,b.report_policy,p.id).run();
   await clientEvent(c.env,p.id,'settings','Customer care settings updated','Recipient changes apply to new orders only.',actor);
  }else if(b.action==='replace'){
   const order=await findCareOrder(c.env,b.order_id);
   const revoked=await c.env.DB.prepare("UPDATE care_orders SET state='CANCELLED',updated_at=? WHERE id=? AND state='OPEN' AND payment_id IS NULL RETURNING id").bind(iso(),order.id).first();if(!revoked)throw new CheckoutError(409,'A payment has already started; check its status instead of making a replacement.');
   return json(await issueCareOrder(c.env,order.project_id,order.period,actor));
  }else if(b.action==='retry'){
   if(typeof b.job_id!=='string')throw new CheckoutError(400,'Choose a valid job.');
   const reset=await c.env.DB.prepare("UPDATE ops_jobs SET status='READY',email_status='NOT_SENT',next_at=?,lease_until=0,error=NULL,updated_at=? WHERE id=? AND status IN ('WAITING_CONFIG','ACTION_REQUIRED','RETRY') AND email_status IN ('NOT_SENT','REJECTED') AND provider_id IS NULL RETURNING id").bind(Date.now(),iso(),b.job_id).first();
   if(!reset)throw new CheckoutError(409,'An accepted or uncertain email must be checked with the provider, not resent.');
  }else if(b.action==='note'){
   const p=await clientProject(c.env,b.project_id);if(typeof b.title!=='string'||!b.title.trim()||b.title.length>120||typeof b.note!=='string'||b.note.length>1000||typeof b.client_visible!=='boolean'||!['maintenance','deployment','backup','note'].includes(String(b.category)))throw new CheckoutError(400,'Enter a valid maintenance record.');
   await clientEvent(c.env,p.id,String(b.category),b.title.trim(),b.note.trim(),actor,b.client_visible);
  }else throw new CheckoutError(400,'Choose a valid customer-care action.');
  return json({ok:true},200,{'cache-control':'no-store'});
 }catch(e){return fail(e);}
};
export const onRequestPut:PagesHandler=async c=>{
 const actor=await requireAdmin(c);if(actor instanceof Response)return actor;
 try{
  const b=await readPaymentJson(c.request);trustedOrigin(c.request);if(typeof b.job_id!=='string')throw new CheckoutError(400,'Choose a document.');
  const job=await c.env.DB.prepare('SELECT * FROM ops_jobs WHERE id=?').bind(b.job_id).first<ClientJob>();if(!job?.pdf_key)throw new CheckoutError(404,'Document not found.');
  const order=await findCareOrder(c.env,job.order_id);if(order.state!=='PAID'||!order.payment_id)throw new CheckoutError(409,'A verified payment is required.');const p=await findPayment(c.env,order.payment_id);if(!p)throw new CheckoutError(404,'Payment not found.');await reconcile(c.env,{...p,checked_at:0},false,true);
  const file=await c.env.MEDIA.get(job.pdf_key);if(!file)throw new CheckoutError(404,'Document not found.');return new Response(file.body,{headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="Opus-care-${order.period}-${job.kind.toLowerCase()}.pdf"`,'cache-control':'no-store'}});
 }catch(e){return fail(e);}
};
