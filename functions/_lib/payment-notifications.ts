import type {Env} from './types';
import type {PaymentRow} from './payments';
const recipient='admin@opuszim.co.zw';
const configured=(env:Env)=>env.PAYMENT_ADMIN_NOTIFY_TO===recipient&&!!env.RESEND_API_KEY?.trim()&&!!env.RECEIPT_FROM_EMAIL?.trim()&&!/[\r\n]/.test(env.RECEIPT_FROM_EMAIL);
// Called only after independent payment verification. An existing SUCCESS is
// not backfilled; concurrent transitions share one durable, idempotent job.
export function paymentNotificationStatement(env:Env,id:string,status:string){
 if(!configured(env)||status!=='SUCCESS')return null;
 const at=new Date().toISOString();
 return env.DB.prepare("INSERT OR IGNORE INTO payment_admin_notifications(payment_id,recipient,state,created_at,updated_at) SELECT id,?,'PENDING',?,? FROM customer_payments WHERE id=? AND status NOT IN('SUCCESS','REVERSED')").bind(recipient,at,at,id);
}
export async function paymentAdminNotification(env:Env,_previous:PaymentRow,saved:PaymentRow){
 if(!configured(env)||saved.status!=='SUCCESS')return;
 await sendPending(env,saved.id);
}
async function sendPending(env:Env,id:string){
 const payment=await env.DB.prepare('SELECT * FROM customer_payments WHERE id=?').bind(id).first<PaymentRow>();
 if(!payment||payment.status!=='SUCCESS'){await env.DB.prepare("UPDATE payment_admin_notifications SET state='FAILED',error_code='payment_no_longer_successful',updated_at=? WHERE payment_id=? AND state='PENDING'").bind(new Date().toISOString(),id).run();return;}
 const claimed=await env.DB.prepare("UPDATE payment_admin_notifications SET state='SENDING',updated_at=? WHERE payment_id=? AND state='PENDING' RETURNING payment_id").bind(new Date().toISOString(),id).first();if(!claimed)return;
 let state='UNCONFIRMED',provider:string|null=null,error='provider_acceptance_uncertain';
 try{
  const amount=(payment.amount_minor/100).toFixed(2);
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'opus-payment-admin-'+id},redirect:'manual',signal:AbortSignal.timeout(15000),body:JSON.stringify({from:env.RECEIPT_FROM_EMAIL,to:[recipient],reply_to:'support@opuszim.co.zw',subject:'Payment received — '+payment.currency+' '+amount+' | Opus Pay',text:['Opus Pay — verified payment received','',payment.currency+' '+amount,'Invoice / project reference: '+payment.invoice,'Payment ID: '+id,'Provider reference: '+(payment.gateway_reference||'—'),'Method: '+payment.method_code,'Confirmed at: '+(payment.transaction_date||payment.updated_at),'','Review in the private Opus admin inbox: https://opuszim.co.zw/sysadmin/'].join('\n'),tags:[{name:'opus_payment_admin',value:id}]})});
  if(r.ok){let d:any;try{d=await r.json()}catch{d=null;}if(typeof d?.id==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(d.id)){state='ACCEPTED';provider=d.id;error='';}}
  else if([400,401,403,422,429].includes(r.status)){state='FAILED';error='provider_rejected_'+r.status;}
 }catch{/* Never replay a send whose provider acceptance is uncertain. */}
 await env.DB.prepare('UPDATE payment_admin_notifications SET state=?,provider_id=?,error_code=?,updated_at=? WHERE payment_id=? AND state=\'SENDING\'').bind(state,provider,error||null,new Date().toISOString(),id).run();
}
export async function processPaymentAdminNotifications(env:Env){
 if(!configured(env))return;
 await env.DB.prepare("UPDATE payment_admin_notifications SET state='UNCONFIRMED',error_code='interrupted_send_requires_review',updated_at=? WHERE state='SENDING' AND updated_at<?").bind(new Date().toISOString(),new Date(Date.now()-90000).toISOString()).run();
 const jobs=(await env.DB.prepare("SELECT payment_id FROM payment_admin_notifications WHERE state='PENDING' ORDER BY created_at LIMIT 5").all<{payment_id:string}>()).results;
 for(const job of jobs)await sendPending(env,job.payment_id);
}
