import type {Env} from './types';
import {Buffer} from 'node:buffer';
const fileHash=async(bytes:Uint8Array)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer))].map(x=>x.toString(16).padStart(2,'0')).join('');
import type {ClientJob} from '../../lib/client-care';
import type {CareSnapshot} from '../../lib/care';
import {findPayment,reconcile,receipt,hash,CheckoutError,type PaymentRow} from './payments';
import {clientProject,findCareOrder,fulfilCarePayment,clientSnapshot,monthBounds,iso,clientEvent} from './client-care';
import {carePacketHTML,careEmail} from '../../lib/care-packet';
import {emailConfigured} from './receipts';

async function jobEvent(env:Env,id:string,stage:string,detail:string){await env.DB.prepare('INSERT INTO ops_job_events(id,job_id,stage,detail,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,stage,detail.slice(0,500),iso()).run();}
async function defer(env:Env,job:ClientJob,message:string,delay=300000,status='RETRY'){
 const next=Date.now()+delay;
 await env.DB.prepare('UPDATE ops_jobs SET status=?,error=?,next_at=?,lease_until=0,updated_at=? WHERE id=?').bind(status,message,next,iso(),job.id).run();
 await jobEvent(env,job.id,status,message);
}
export async function reconcileOrders(env:Env){
 // Bounded safe recovery. No payment initiation or blind registrar purchase retries.
 const rows=(await env.DB.prepare(`SELECT p.* FROM customer_payments p WHERE p.gateway_reference IS NOT NULL AND p.status NOT IN ('FAILED','CANCELLED','EXPIRED','REVERSED') AND (
 (p.care_order_id IS NOT NULL AND EXISTS(SELECT 1 FROM care_orders c WHERE c.id=p.care_order_id AND c.state='PAYMENT_PENDING')) OR
 EXISTS(SELECT 1 FROM domain_orders d WHERE d.payment_id=p.id AND d.state IN ('PAYMENT_PENDING','PAID','REGISTERING','UNCONFIRMED'))
 ) ORDER BY p.checked_at ASC LIMIT 2`).all<PaymentRow>()).results;
 for(const row of rows){try{const verified=await reconcile(env,{...row,checked_at:0},false,row.status==='SUCCESS');if(verified.status==='SUCCESS'||verified.status==='REVERSED'){
  if(verified.care_order_id)await fulfilCarePayment(env,verified);
  else await (await import('./domains')).fulfilDomainPayment(env,verified);
 }else if(['FAILED','CANCELLED','EXPIRED'].includes(verified.status)){if(verified.care_order_id)await fulfilCarePayment(env,verified);else await (await import('./domains')).fulfilDomainPayment(env,verified);}
 }catch{const current=await findPayment(env,row.id);if(current?.status==='REVERSED'){if(current.care_order_id)await fulfilCarePayment(env,current);else await (await import('./domains')).fulfilDomainPayment(env,current);}/* Other provider failures remain tracked for the next safe pass. */}}
}

export async function processDocumentJob(env:Env){
 const now=Date.now();
 // A dead worker may have been stopped after provider acceptance. Never replay an uncertain send.
 await env.DB.prepare("UPDATE ops_jobs SET status=CASE WHEN email_status='SENDING' THEN 'UNCONFIRMED' ELSE 'RETRY' END,error=CASE WHEN email_status='SENDING' THEN 'Email acceptance needs provider confirmation; no automatic resend.' ELSE 'Worker lease expired; safe document work will resume.' END,next_at=?,lease_until=0,updated_at=? WHERE status='RUNNING' AND lease_until<?").bind(now,iso(),now).run();
 const job=await env.DB.prepare("UPDATE ops_jobs SET status='RUNNING',attempts=attempts+1,lease_until=?,updated_at=? WHERE id=(SELECT id FROM ops_jobs WHERE status IN ('READY','RETRY') AND next_at<=? ORDER BY next_at,created_at LIMIT 1) AND status IN ('READY','RETRY') RETURNING *").bind(now+180000,iso(),now).first<ClientJob>();
 if(!job)return {processed:0};
 try{
  const order=await findCareOrder(env,job.order_id),p=await clientProject(env,order.project_id);
  if(order.state!=='PAID'||!order.payment_id){await defer(env,job,'A verified paid maintenance order is required.',0,'ACTION_REQUIRED');return {processed:1};}
  if(!p.enabled||!p.auto_documents){await defer(env,job,'Automatic documents are disabled for this project.',0,'WAITING_CONFIG');return {processed:1};}
  if(!emailConfigured(env)||!env.CARE_RENDERER||!env.CARE_RENDER_SECRET){await defer(env,job,'Email sender or background renderer is not configured.',0,'WAITING_CONFIG');return {processed:1};}
  const bounds=monthBounds(order.period);
  if(job.kind==='FINAL'&&Date.now()<Date.parse(bounds.end)){await defer(env,job,'Waiting for the billing month to close.',Date.parse(bounds.end)-Date.now()+60000);return {processed:1};}
  const payment=await findPayment(env,order.payment_id);if(!payment)throw new CheckoutError(409,'The linked payment could not be found.');
  const verified=await reconcile(env,{...payment,checked_at:0},false,true);
  if(verified.amount_minor!==1000||verified.currency!=='USD'||verified.care_order_id!==order.id||verified.payer_email!==order.recipient)throw new CheckoutError(409,'Payment and maintenance order details did not match.');
  let snapshot=job.snapshot?JSON.parse(job.snapshot) as CareSnapshot:await clientSnapshot(env,p,order.period);
  if(!job.snapshot){await env.DB.prepare('UPDATE ops_jobs SET snapshot=? WHERE id=?').bind(JSON.stringify(snapshot),job.id).run();await jobEvent(env,job.id,'VERIFIED','Exact USD 10 payment verified; report snapshot fixed.');}
  let key=job.pdf_key;
  if(!key){
   const html=carePacketHTML(snapshot,receipt(verified),job.kind);
   const response=await env.CARE_RENDERER.fetch('https://care-renderer.internal/render',{method:'POST',headers:{authorization:`Bearer ${env.CARE_RENDER_SECRET}`,'content-type':'application/json'},body:JSON.stringify({html}),signal:AbortSignal.timeout(65000)});
   if(!response.ok){await defer(env,job,response.status===422?'The PDF needs manual review because its size exceeded the safe limit.':'The cloud renderer is busy, unavailable or at its free allowance. The job remains queued.',response.status===422?0:3600000,response.status===422||job.attempts>=24?'ACTION_REQUIRED':'RETRY');return {processed:1};}
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length>250000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new CheckoutError(503,'The cloud renderer did not return a valid PDF.');
   key=`care_private_job_${job.id}_${crypto.randomUUID()}.pdf`;const digest=await fileHash(bytes);
   await env.MEDIA.put(key,bytes.buffer as ArrayBuffer,{httpMetadata:{contentType:'application/pdf'}});
   await env.DB.prepare('UPDATE ops_jobs SET pdf_key=?,pdf_hash=?,updated_at=? WHERE id=?').bind(key,digest,iso(),job.id).run();
   await jobEvent(env,job.id,'PDF_READY','Branded receipt/report packet stored privately.');
  }
  // A reversal after rendering still blocks the mail. Refresh before the irreversible send.
  const fresh=await reconcile(env,{...verified,checked_at:0},false,true);
  const currentOrder=await findCareOrder(env,order.id);if(currentOrder.state!=='PAID'||fresh.status!=='SUCCESS')throw new CheckoutError(409,'Payment no longer permits document delivery.');
  const budget=await env.DB.prepare('INSERT INTO ops_mail_budget(day,attempts) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET attempts=attempts+1 WHERE attempts<90 RETURNING attempts').bind(iso().slice(0,10)).first();
  if(!budget){await defer(env,job,'Daily document-email budget reached; queued for the next UTC day.',Math.max(60000,Date.parse(iso().slice(0,10)+'T00:00:00Z')+86400000-Date.now()));return {processed:1};}
  const object=await env.MEDIA.get(key);if(!object)throw new CheckoutError(503,'The generated document could not be loaded.');
  const bytes=new Uint8Array(await new Response(object.body).arrayBuffer());
  const stored=await env.DB.prepare('SELECT pdf_hash FROM ops_jobs WHERE id=?').bind(job.id).first<{pdf_hash:string}>();if(!stored||await fileHash(bytes)!==stored.pdf_hash)throw new CheckoutError(409,'The private PDF failed its integrity check.');
  const mail=careEmail(p.name,order.period,job.kind,receipt(fresh).reference||fresh.id);
  const reserved=await env.DB.prepare("UPDATE ops_jobs SET email_status='SENDING',updated_at=? WHERE id=? AND status='RUNNING' AND email_status='NOT_SENT' AND lease_until=? RETURNING id").bind(iso(),job.id,job.lease_until).first();if(!reserved){await defer(env,job,'This email attempt is already recorded; check provider status.',0,'UNCONFIRMED');return {processed:1};}
  try{
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json','Idempotency-Key':`opus-care-${job.id}-${job.attempts}`},redirect:'manual',signal:AbortSignal.timeout(15000),body:JSON.stringify({from:env.RECEIPT_FROM_EMAIL,to:[order.recipient],reply_to:'support@opuszim.co.zw',...mail,tags:[{name:'opus_care_job',value:job.id}],attachments:[{filename:`Opus-${p.id}-${order.period}-${job.kind.toLowerCase()}.pdf`,content:Buffer.from(bytes).toString('base64')}]})});
   const body=await r.json().catch(()=>null) as {id?:string}|null;
   if(r.ok&&body?.id&&/^[a-z0-9-]{1,100}$/i.test(body.id)){
    await env.DB.prepare("UPDATE ops_jobs SET status='DONE',email_status='ACCEPTED',provider_id=?,error=NULL,lease_until=0,updated_at=? WHERE id=?").bind(body.id,iso(),job.id).run();
    await jobEvent(env,job.id,'ACCEPTED','Email provider accepted the document packet; acceptance is not delivery.');
    await clientEvent(env,p.id,'report',job.kind==='FINAL'?'Final maintenance report emailed':'Payment receipt and progress report emailed',`${order.period} · provider accepted`, 'automation');
   }else if(r.status===429){await env.DB.prepare("UPDATE ops_jobs SET email_status='NOT_SENT' WHERE id=?").bind(job.id).run();await defer(env,job,'The email provider declined due to rate/usage limits; queued for retry.',3600000);}
   else if([400,401,403,422].includes(r.status)){await env.DB.prepare("UPDATE ops_jobs SET email_status='REJECTED' WHERE id=?").bind(job.id).run();await defer(env,job,'The provider rejected the email. Check the sender and authorised recipient before retrying.',0,'ACTION_REQUIRED');}
   else {await env.DB.prepare("UPDATE ops_jobs SET email_status='UNCONFIRMED' WHERE id=?").bind(job.id).run();await defer(env,job,'Email acceptance is uncertain. Check Resend before sending again.',0,'UNCONFIRMED');}
  }catch{await env.DB.prepare("UPDATE ops_jobs SET email_status='UNCONFIRMED' WHERE id=?").bind(job.id).run();await defer(env,job,'Email acceptance is uncertain. No automatic resend will be attempted.',0,'UNCONFIRMED');}
 }catch(error){
  const recorded=await env.DB.prepare('SELECT payment_id FROM care_orders WHERE id=?').bind(job.order_id).first<{payment_id:string|null}>();if(recorded?.payment_id){const state=await findPayment(env,recorded.payment_id);if(state?.status==='REVERSED')await fulfilCarePayment(env,state);}
  const permanent=error instanceof CheckoutError&&[400,404,409].includes(error.status);
  await defer(env,job,permanent?(error as Error).message:'A provider check or document step could not complete; the paid order remains tracked.',Math.min(3600000,60000*2**Math.min(job.attempts,5)),permanent||job.attempts>=12?'ACTION_REQUIRED':'RETRY');
 }
 return {processed:1};
}

export async function checkJobDelivery(env:Env,id:unknown){
 if(typeof id!=='string'||! /^(progress|final)-[a-f0-9-]{36}$/.test(id))throw new CheckoutError(400,'Choose a valid document job.');
 const job=await env.DB.prepare('SELECT * FROM ops_jobs WHERE id=?').bind(id).first<ClientJob>();if(!job)throw new CheckoutError(404,'Document job not found.');if(!job.provider_id)return {status:job.email_status};
 const r=await fetch('https://api.resend.com/emails/'+encodeURIComponent(job.provider_id),{headers:{authorization:`Bearer ${env.RESEND_API_KEY}`},redirect:'manual',signal:AbortSignal.timeout(12000)}),body=await r.json().catch(()=>null) as {id?:string;last_event?:string}|null;
 if(!r.ok||body?.id!==job.provider_id)throw new CheckoutError(503,'The email provider could not confirm delivery status.');
 const map:Record<string,string>={sent:'ACCEPTED',delivered:'DELIVERED',opened:'DELIVERED',clicked:'DELIVERED',bounced:'BOUNCED',complained:'COMPLAINED',failed:'FAILED',delivery_delayed:'DELAYED'};
 const status=map[body.last_event||'']||job.email_status;await env.DB.prepare('UPDATE ops_jobs SET email_status=?,updated_at=? WHERE id=?').bind(status,iso(),job.id).run();return {status};
}
