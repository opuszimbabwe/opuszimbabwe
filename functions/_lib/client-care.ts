import {hash,accessToken,CheckoutError,type PaymentRow} from './payments';
import {receiptEmail} from '../../lib/receipt-contact';
import type {ClientProject,ClientOrder,PublicCareOrder} from '../../lib/client-care';
import type {CareCheck,CareSnapshot} from '../../lib/care';
import type {Env} from './types';
export type StoredCareOrder=ClientOrder&{token_hash:string};
export const iso=()=>new Date().toISOString();
export const currentPeriod=()=>new Date(Date.now()+7200000).toISOString().slice(0,7);
export function monthBounds(value:unknown){
 if(typeof value!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value))throw new CheckoutError(400,'Choose a valid billing month.');
 const [year,month]=value.split('-').map(Number);return {period:value,start:new Date(Date.UTC(year,month-1,1)-7200000).toISOString(),end:new Date(Date.UTC(year,month,1)-7200000).toISOString()};
}
export async function clientProject(env:Env,id:unknown){
 if(typeof id!=='string'||!/^[-a-z0-9]{1,60}$/.test(id)||id==='opus')throw new CheckoutError(400,'Choose a customer project.');
 const p=await env.DB.prepare("SELECT * FROM care_projects WHERE id=? AND id<>'opus'").bind(id).first<ClientProject>();
 if(!p)throw new CheckoutError(404,'Customer project not found.');return p;
}
export async function clientEvent(env:Env,project:string,category:string,title:string,note:string,actor:string,visible=false){
 await env.DB.prepare('INSERT INTO care_events(id,project_id,category,title,note,actor,created_at,client_visible) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),project,category,title,note,actor,iso(),visible?1:0).run();
}
export async function findCareOrder(env:Env,id:unknown){
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw new CheckoutError(400,'Choose a valid maintenance order.');
 const row=await env.DB.prepare('SELECT * FROM care_orders WHERE id=?').bind(id).first<StoredCareOrder>();if(!row)throw new CheckoutError(404,'Maintenance order not found.');return row;
}
export async function authorisedCareOrder(env:Env,id:unknown,token:unknown){const row=await findCareOrder(env,id);if(row.token_hash!==await hash(accessToken(token)))throw new CheckoutError(404,'Maintenance order not found.');return row;}
export async function publicCareOrder(env:Env,row:ClientOrder):Promise<PublicCareOrder>{
 const p=await clientProject(env,row.project_id);const docs=(await env.DB.prepare('SELECT kind,status,email_status,pdf_key FROM ops_jobs WHERE order_id=? ORDER BY kind').bind(row.id).all<{kind:string;status:string;email_status:string;pdf_key:string|null}>()).results;
 return {id:row.id,period:row.period,amount_minor:row.amount_minor,currency:row.currency,state:row.state,payment_id:row.payment_id,expires_at:row.expires_at,project:p.name,documents:docs.map(d=>({kind:d.kind,status:d.status,email_status:d.email_status,available:row.state==='PAID'&&Boolean(d.pdf_key)}))};
}
export async function issueCareOrder(env:Env,projectId:unknown,period:unknown,actor:string){
 const p=await clientProject(env,projectId),bounds=monthBounds(period);
 if(!p.enabled||!p.auto_documents||!receiptEmail(p.email))throw new CheckoutError(409,'Enable the project and automatic documents, and save its authorised recipient first.');
 if(p.plan_usd!==10)throw new CheckoutError(400,'The automated maintenance pilot is fixed at USD 10 per month.');
 if(bounds.period>currentPeriod()||Date.parse(bounds.end)<Date.now()-90*86400000)throw new CheckoutError(400,'Choose the current month or a completed month within the 90-day reporting window.');
 await env.DB.prepare("UPDATE care_orders SET state='EXPIRED',updated_at=? WHERE project_id=? AND period=? AND state='OPEN' AND expires_at<?").bind(iso(),p.id,bounds.period,Date.now()).run();
 const id=crypto.randomUUID(),token=[...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join('');
 try{await env.DB.prepare("INSERT INTO care_orders(id,project_id,period,token_hash,recipient,amount_minor,expires_at,created_at,updated_at) VALUES(?,?,?,?,?,1000,?,?,?)").bind(id,p.id,bounds.period,await hash(token),p.email,Date.now()+30*86400000,iso(),iso()).run();}
 catch{throw new CheckoutError(409,'This project already has an active order for that month. Use its existing link, or replace an unpaid link. Do not create another payment.');}
 await clientEvent(env,p.id,'billing','Private maintenance payment link created',`${bounds.period} · USD 10`,actor);
 return {order:await publicCareOrder(env,await findCareOrder(env,id)),url:`https://payments.opuszim.co.zw/payments/?care_order=${id}&care_token=${token}`};
}
export async function claimCarePayment(env:Env,row:StoredCareOrder,paymentId:string){
 const claimed=await env.DB.prepare("UPDATE care_orders SET payment_id=?,state='PAYMENT_PENDING',updated_at=? WHERE id=? AND state='OPEN' AND payment_id IS NULL AND expires_at>? RETURNING id").bind(paymentId,iso(),row.id,Date.now()).first();
 if(!claimed)throw new CheckoutError(409,'This maintenance order already has a payment attempt or has expired. Check it before paying again.');
}
export async function fulfilCarePayment(env:Env,payment:PaymentRow){
 if(!payment.care_order_id)return;
 const order=await findCareOrder(env,payment.care_order_id);
 if(order.payment_id!==payment.id)throw new CheckoutError(409,'Maintenance payment linkage did not match.');
 if(payment.status==='REVERSED'){
  await env.DB.batch([env.DB.prepare("UPDATE care_orders SET state='REVERSED',updated_at=? WHERE id=?").bind(iso(),order.id),env.DB.prepare("UPDATE ops_jobs SET status='ACTION_REQUIRED',error='Payment reversed; do not send further documents.',updated_at=? WHERE order_id=? AND status<>'DONE'").bind(iso(),order.id)]);return;
 }
 if(['FAILED','CANCELLED','EXPIRED'].includes(payment.status)){
  await env.DB.prepare("UPDATE care_orders SET state='PAYMENT_FAILED',updated_at=? WHERE id=? AND state='PAYMENT_PENDING'").bind(iso(),order.id).run();return;
 }
 if(payment.status!=='SUCCESS')return;
 if(payment.currency!=='USD'||payment.amount_minor!==1000||order.amount_minor!==1000||order.currency!=='USD')throw new CheckoutError(409,'Maintenance payment must match the exact USD 10 order.');
 if(order.state==='REVERSED')return;
 if(!['PAYMENT_PENDING','PAID'].includes(order.state)){await env.DB.prepare("UPDATE care_orders SET state='ACTION_REQUIRED',updated_at=? WHERE id=?").bind(iso(),order.id).run();await clientEvent(env,order.project_id,'billing','Payment requires reconciliation','A previously closed order received a later success; do not create another charge.','automation');return;}
 await env.DB.prepare("UPDATE care_orders SET state='PAID',updated_at=? WHERE id=? AND state='PAYMENT_PENDING'").bind(iso(),order.id).run();
 const p=await clientProject(env,order.project_id),bounds=monthBounds(order.period),ended=Date.parse(bounds.end)<=Date.now();
 const queue=async(kind:string,next:number)=>{await env.DB.prepare("INSERT OR IGNORE INTO ops_jobs(id,kind,order_id,next_at,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(`${kind.toLowerCase()}-${order.id}`,kind,order.id,next,iso(),iso()).run();};
 // One progress packet (including receipt) and one final report; never one job per callback.
 if(!ended&&p.report_policy==='progress-and-final')await queue('PROGRESS',Date.now());
 await queue('FINAL',ended?Date.now():Date.parse(bounds.end)+60000);
}

export async function clientSnapshot(env:Env,p:ClientProject,period:string):Promise<CareSnapshot>{
 const bounds=monthBounds(period),end=new Date(Math.min(Date.parse(bounds.end),Date.now())).toISOString();
 const [stats,last,incidents,notes,totals]=await Promise.all([
  env.DB.prepare('SELECT COUNT(*) AS n,COALESCE(SUM(ok),0) AS passed,ROUND(AVG(latency_ms)) AS ms FROM care_checks WHERE project_id=? AND checked_at>=? AND checked_at<?').bind(p.id,bounds.start,end).first<{n:number;passed:number;ms:number|null}>(),
  env.DB.prepare('SELECT * FROM care_checks WHERE project_id=? AND checked_at>=? AND checked_at<? ORDER BY slot DESC LIMIT 1').bind(p.id,bounds.start,end).all<CareCheck>(),
  env.DB.prepare('SELECT target,opened_at,resolved_at,detail FROM care_incidents WHERE project_id=? AND opened_at<? AND (resolved_at IS NULL OR resolved_at>=?) ORDER BY opened_at DESC LIMIT 12').bind(p.id,end,bounds.start).all<{target:string;opened_at:string;resolved_at:string|null;detail:string}>(),
  env.DB.prepare("SELECT category,title,note,created_at FROM care_events WHERE project_id=? AND client_visible=1 AND category IN ('maintenance','deployment','backup','note') AND created_at>=? AND created_at<? ORDER BY created_at DESC LIMIT 8").bind(p.id,bounds.start,end).all<{category:string;title:string;note:string;created_at:string}>(),
  env.DB.prepare('SELECT COUNT(*) AS total,SUM(CASE WHEN resolved_at IS NULL OR resolved_at>=? THEN 1 ELSE 0 END) AS open FROM care_incidents WHERE project_id=? AND opened_at<? AND (resolved_at IS NULL OR resolved_at>=?)').bind(end,p.id,end,bounds.start).first<{total:number;open:number}>(),
 ]);
 const checks=stats?.n||0,successful=stats?.passed||0,expected=Math.max(0,Math.floor((Date.parse(end)-Date.parse(bounds.start))/300000));
 const open=totals?.open||0;
 const actions=[...(open?['Investigate the open public website check incident.']:[]),...(checks<expected*.95?['Review monitoring gaps; checks started partway through this period or were interrupted.']:[]),'Connect repository, hosting and backup integrations before including their private evidence.'];
 return {project:p.name,month:period,generated_at:iso(),period_start:bounds.start,period_end:end,checks,successful,expected,coverage:expected?Math.min(100,checks/expected*100):0,sample_availability:checks?successful/checks*100:null,target_definitions:[{id:'website',name:'Public website',url:p.site_url}],targets:[{name:'Public website',checks,successful,average_ms:stats?.ms??null}],latest_checks:last.results,incidents:totals?.total||0,open_incidents:open,incident_details:incidents.results,maintenance:notes.results,backup_status:'Backup verification is not connected.',actions};
}

export async function monitorClients(env:Env){
 const slot=Math.floor(Date.now()/300000),lock=await env.DB.prepare('INSERT OR IGNORE INTO client_monitor_runs(slot) VALUES(?) RETURNING slot').bind(slot).first();if(!lock)return;
 const projects=(await env.DB.prepare("SELECT * FROM care_projects WHERE id<>'opus' AND enabled=1 ORDER BY COALESCE(last_tick,'') LIMIT 3").all<ClientProject>()).results;
 for(const p of projects){
  // Pilot targets are an explicit allowlist. New hosts must be added deliberately, not supplied by visitors.
  if(!['https://www.greatcouples.org.zw/','https://greatcouples.org.zw/'].includes(p.site_url))continue;
  const start=Date.now();let status:number|null=null,ok=0,detail='Public HTTPS request timed out or could not connect.';
  try{const r=await fetch(p.site_url,{redirect:'manual',signal:AbortSignal.timeout(15000),headers:{'user-agent':'OpusCare/1.0','cache-control':'no-cache'}});status=r.status;ok=r.status===200&&(r.headers.get('content-type')||'').includes('text/html')?1:0;detail=ok?'Public HTML page and HTTPS connection verified.':`Public website returned HTTP ${r.status} or unexpected content.`;await r.body?.cancel();}catch{}
  const at=iso();await env.DB.prepare("INSERT OR IGNORE INTO care_checks(project_id,target,slot,checked_at,ok,status,latency_ms,detail) VALUES(?,'website',?,?,?,?,?,?)").bind(p.id,slot,at,ok,status,Date.now()-start,detail).run();
  const recent=(await env.DB.prepare("SELECT * FROM care_checks WHERE project_id=? AND target='website' ORDER BY slot DESC LIMIT 3").bind(p.id).all<CareCheck>()).results;
  if(recent.length===3&&recent.every((c,i)=>c.slot===slot-i&&!c.ok)){
   const added=await env.DB.prepare("INSERT OR IGNORE INTO care_incidents(id,project_id,target,opened_at,detail) VALUES(?,?,'website',?,?) RETURNING id").bind(crypto.randomUUID(),p.id,recent[2].checked_at,detail).first();
   if(added)await clientEvent(env,p.id,'incident','Public website checks failed repeatedly',detail,'monitor');
  }
  if(recent.length>=2&&recent.slice(0,2).every((c,i)=>c.slot===slot-i&&c.ok)){
   const closed=await env.DB.prepare("UPDATE care_incidents SET resolved_at=? WHERE project_id=? AND target='website' AND resolved_at IS NULL RETURNING id").bind(at,p.id).first();
   if(closed)await clientEvent(env,p.id,'recovery','Public website checks recovered','Two adjacent checks passed.','monitor');
  }
  await env.DB.prepare('UPDATE care_projects SET last_tick=? WHERE id=?').bind(at,p.id).run();
 }
 await env.DB.prepare('UPDATE client_monitor_runs SET completed_at=? WHERE slot=?').bind(iso(),slot).run();
 await env.DB.prepare('DELETE FROM client_monitor_runs WHERE slot<?').bind(slot-25920).run();
}
