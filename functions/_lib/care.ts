import {CARE_TARGETS,CARE_PDF_VERSION, type CareCheck, type CareEvent, type CareIncident, type CareProject, type CareReport, type CareSnapshot} from '../../lib/care';
import {receiptEmail} from '../../lib/receipt-contact';
import {CheckoutError,hash} from './payments';
import type {Env} from './types';
import {emailConfigured} from './receipts';

const nowISO=()=>new Date().toISOString();
const safe=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const reportColumns='id,month,snapshot,state,approved_by,approved_at,delivery_status,delivery_error,delivery_attempt,recipient,provider_id,pdf_key,revision,pdf_version,updated_at';
type StoredReport=Omit<CareReport,'snapshot'>&{snapshot:string;pdf_hash:string|null;delivery_attempt:number};
export async function project(env:Env){
 const p=await env.DB.prepare("SELECT * FROM care_projects WHERE id='opus'").first<CareProject>();
 if(!p)throw new CheckoutError(503,'The maintenance database is not ready.');
 return p;
}
export async function event(env:Env,category:string,title:string,note:string,actor:string,at=nowISO()){
 await env.DB.prepare('INSERT INTO care_events(id,project_id,category,title,note,actor,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'opus',category,title,note,actor,at).run();
}
export async function careState(env:Env){
 const [p,checks,incidents,events,reports,plans,editions]=await Promise.all([
  project(env),
  env.DB.prepare("SELECT * FROM care_checks WHERE project_id='opus' AND slot=(SELECT MAX(slot) FROM care_checks WHERE project_id='opus') ORDER BY target").all<CareCheck>(),
  env.DB.prepare("SELECT * FROM care_incidents WHERE project_id='opus' ORDER BY opened_at DESC LIMIT 40").all<CareIncident>(),
  env.DB.prepare("SELECT * FROM care_events WHERE project_id='opus' ORDER BY created_at DESC LIMIT 60").all<CareEvent>(),
  env.DB.prepare(`SELECT ${reportColumns} FROM care_reports WHERE project_id='opus' ORDER BY month DESC LIMIT 24`).all<StoredReport>(),
  env.DB.prepare('SELECT * FROM care_plans ORDER BY price_usd').all<{features:string}>(),
  env.DB.prepare("SELECT e.report_id,e.revision,e.approved_at,e.delivery_status FROM care_report_editions e JOIN care_reports r ON r.id=e.report_id WHERE r.project_id='opus' ORDER BY e.revision DESC").all<{report_id:string;revision:number;approved_at:string;delivery_status:string}>(),
 ]);
 return {project:p,checks:checks.results,incidents:incidents.results,events:events.results,reports:reports.results.map(r=>({...r,snapshot:JSON.parse(r.snapshot),editions:editions.results.filter(e=>e.report_id===r.id)})),plans:plans.results.map(r=>({...r,features:JSON.parse(r.features)})),email_configured:emailConfigured(env),scheduler_configured:Boolean(env.MAINTENANCE_CRON_SECRET),targets:CARE_TARGETS,pdf_version:CARE_PDF_VERSION};
}

async function probe(target:typeof CARE_TARGETS[number],slot:number):Promise<CareCheck>{
 const start=Date.now(),checked_at=nowISO();
 try{
  // Fixed public GETs only: never follow redirects, submit forms, or create payments.
  const response=await fetch(target.url,{headers:{'user-agent':'OpusCare/1.0','cache-control':'no-cache'},redirect:'manual',signal:AbortSignal.timeout(18000)});
  let ok=response.status===200,detail=ok?'HTTPS response verified.':`HTTP ${response.status}.`;
  if(ok&&(target.id==='content'||target.id==='payments')){
   const b=await response.json() as Record<string,unknown>;
   ok=target.id==='content'?Array.isArray(b.services)&&Boolean(b.settings):b.configured===true&&Array.isArray(b.methods)&&b.methods.length>0;
   detail=ok?'HTTPS and service response verified.':'The service response did not pass its health check.';
  }else{
   const type=response.headers.get('content-type')||'';
   ok=ok&&type.includes('text/html');
   if(!ok&&response.status===200)detail='Expected an HTML page.';
   await response.body?.cancel();
  }
  return {target:target.id,slot,checked_at,ok:ok?1:0,status:response.status,latency_ms:Date.now()-start,detail};
 }catch{return {target:target.id,slot,checked_at,ok:0,status:null,latency_ms:Date.now()-start,detail:'HTTPS request timed out, failed TLS verification, or could not connect.'};}
}

async function incidentForCheck(env:Env,check:CareCheck){
 const recent=(await env.DB.prepare("SELECT * FROM care_checks WHERE project_id='opus' AND target=? ORDER BY slot DESC LIMIT 3").bind(check.target).all<CareCheck>()).results;
 const consecutive=(n:number,ok:number)=>recent.length>=n&&recent.slice(0,n).every((r,i)=>r.slot===check.slot-i&&r.ok===ok);
 if(consecutive(3,0)){
  const id=crypto.randomUUID();
  const inserted=await env.DB.prepare("INSERT OR IGNORE INTO care_incidents(id,project_id,target,opened_at,detail) VALUES(?,'opus',?,?,?) RETURNING id").bind(id,check.target,recent[2].checked_at,check.detail).first<{id:string}>();
  if(inserted)await event(env,'incident',`${CARE_TARGETS.find(t=>t.id===check.target)!.name}: repeated check failures`,check.detail,'monitor',recent[2].checked_at);
 }
 if(consecutive(2,1)){
  const resolved=await env.DB.prepare("UPDATE care_incidents SET resolved_at=? WHERE project_id='opus' AND target=? AND resolved_at IS NULL RETURNING id").bind(check.checked_at,check.target).first<{id:string}>();
  if(resolved)await event(env,'recovery',`${CARE_TARGETS.find(t=>t.id===check.target)!.name}: checks recovered`,'Two consecutive checks passed.','monitor',check.checked_at);
 }
}

async function notifyIncidents(env:Env){
 if(!emailConfigured(env))return;
 const pending=(await env.DB.prepare("SELECT * FROM care_incidents WHERE alert_status='PENDING' AND resolved_at IS NULL ORDER BY opened_at LIMIT 4").all<CareIncident>()).results;
 for(const incident of pending){
  const p=await env.DB.prepare('SELECT name,alert_email FROM care_projects WHERE id=? AND enabled=1').bind((incident as CareIncident&{project_id:string}).project_id).first<{name:string;alert_email:string}>();if(!p?.alert_email)continue;
  const lock=await env.DB.prepare("UPDATE care_incidents SET alert_status='SENDING' WHERE id=? AND alert_status='PENDING' RETURNING id").bind(incident.id).first();
  if(!lock)continue;
  // At most five operational alert attempts per UTC day, leaving free-tier capacity for receipts.
  const budget=await env.DB.prepare('INSERT INTO care_alert_budget(day,attempts) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET attempts=attempts+1 WHERE attempts<5 RETURNING attempts').bind(nowISO().slice(0,10)).first();
  if(!budget){await env.DB.prepare("UPDATE care_incidents SET alert_status='PENDING',alert_error='Daily alert cap reached; see the incident in admin.' WHERE id=?").bind(incident.id).run();continue;}
  try{
   const r=await fetch('https://api.resend.com/emails',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json','Idempotency-Key':`opus-care-alert-${incident.id}`},body:JSON.stringify({from:env.RECEIPT_FROM_EMAIL,to:[p.alert_email],reply_to:'support@opuszim.co.zw',subject:`Opus care alert — ${CARE_TARGETS.find(t=>t.id===incident.target)?.name||incident.target}`,text:`Three consecutive checks failed.\nProject: ${p.name}\nFirst failed check: ${incident.opened_at}\n${incident.detail}\nReview: https://opuszim.co.zw/sysadmin/\nNo repair or payment was attempted automatically.`})});
   const body=await r.json().catch(()=>null) as {id?:string}|null;
   const accepted=r.ok&&typeof body?.id==='string';
   await env.DB.prepare('UPDATE care_incidents SET alert_status=?,alert_error=? WHERE id=?').bind(accepted?'ACCEPTED':([400,401,403,422,429].includes(r.status)?'FAILED':'UNCONFIRMED'),accepted?null:'Alert acceptance could not be confirmed. Check Resend before sending manually.',incident.id).run();
  }catch{await env.DB.prepare("UPDATE care_incidents SET alert_status='UNCONFIRMED',alert_error='Provider response was uncertain; no automatic resend.' WHERE id=?").bind(incident.id).run();}
 }
}

export async function runCare(env:Env){
 const p=await project(env);
 if(!p.enabled)return {skipped:'Monitoring paused.'};
 const slot=Math.floor(Date.now()/300000),started=nowISO();
 const lock=await env.DB.prepare('INSERT OR IGNORE INTO care_runs(slot,started_at) VALUES(?,?) RETURNING slot').bind(slot,started).first();
 if(!lock)return {skipped:'This five-minute check is already recorded or running.'};
 try{
  const checks=await Promise.all(CARE_TARGETS.map(t=>probe(t,slot)));
  for(const c of checks){
   await env.DB.prepare("INSERT OR IGNORE INTO care_checks(project_id,target,slot,checked_at,ok,status,latency_ms,detail) VALUES('opus',?,?,?,?,?,?,?)").bind(c.target,c.slot,c.checked_at,c.ok,c.status,c.latency_ms,c.detail).run();
   await incidentForCheck(env,c);
  }
  await notifyIncidents(env);
  const completed=nowISO();
  await env.DB.prepare("UPDATE care_projects SET last_tick=? WHERE id='opus'").bind(completed).run();
  await env.DB.prepare('UPDATE care_runs SET completed_at=? WHERE slot=?').bind(completed,slot).run();
  // A previous-month draft is created only after that month has closed in Harare.
  const today=new Date(Date.now()+7200000),firstThis=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),1));
  const previous=new Date(firstThis.getTime()-86400000).toISOString().slice(0,7);
  const exists=await env.DB.prepare("SELECT id FROM care_reports WHERE project_id='opus' AND month=?").bind(previous).first();
  const firstMonth=new Date(Date.parse(p.created_at)+7200000).toISOString().slice(0,7);
  if(!exists&&previous>=firstMonth)await draftReport(env,previous,'monitor',false);
  await env.DB.batch([
   env.DB.prepare("DELETE FROM care_checks WHERE checked_at < strftime('%Y-%m-%dT%H:%M:%fZ','now','-90 days')"),
   env.DB.prepare('DELETE FROM care_runs WHERE slot<?').bind(slot-25920),
  ]);
  return {checked:checks.length,failed:checks.filter(c=>!c.ok).length};
 }catch(error){await env.DB.prepare("UPDATE care_runs SET error='Check run did not complete.' WHERE slot=?").bind(slot).run();throw error;}
}

function period(month:unknown){
 if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new CheckoutError(400,'Choose a valid report month.');
 const [year,m]=month.split('-').map(Number);
 const start=new Date(Date.UTC(year,m-1,1)-7200000),end=new Date(Date.UTC(year,m,1)-7200000);
 if(start.getTime()>Date.now())throw new CheckoutError(400,'Future reports are unavailable.');
 if(start.getTime()<Date.now()-92*86400000)throw new CheckoutError(400,'Raw checks are retained for 90 days. Open an existing archived report for an older month.');
 return {month,start:start.toISOString(),end:new Date(Math.min(end.getTime(),Date.now())).toISOString()};
}
export async function draftReport(env:Env,month:unknown,actor:string,refresh=true){
 const bounds=period(month),p=await project(env);
 const old=await env.DB.prepare("SELECT id,state FROM care_reports WHERE project_id='opus' AND month=?").bind(bounds.month).first<{id:string;state:string}>();
 if(old&&(!refresh||old.state!=='DRAFT'))return old.id;
 const [stats,incidents,events,incidentDetails,latestChecks]=await Promise.all([
  env.DB.prepare("SELECT target,COUNT(*) AS checks,SUM(ok) AS successful,ROUND(AVG(latency_ms)) AS average_ms FROM care_checks WHERE project_id='opus' AND checked_at>=? AND checked_at<? GROUP BY target").bind(bounds.start,bounds.end).all<{target:string;checks:number;successful:number;average_ms:number}>(),
  env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN resolved_at IS NULL OR resolved_at>=? THEN 1 ELSE 0 END) AS open FROM care_incidents WHERE project_id='opus' AND opened_at<? AND (resolved_at IS NULL OR resolved_at>=?)").bind(bounds.end,bounds.end,bounds.start).first<{total:number;open:number}>(),
  env.DB.prepare("SELECT category,title,note,created_at FROM care_events WHERE project_id='opus' AND category IN ('maintenance','deployment','backup','note') AND created_at>=? AND created_at<? ORDER BY created_at DESC LIMIT 8").bind(bounds.start,bounds.end).all<CareEvent>(),
  env.DB.prepare("SELECT target,opened_at,resolved_at,detail FROM care_incidents WHERE project_id='opus' AND opened_at<? AND (resolved_at IS NULL OR resolved_at>=?) ORDER BY opened_at DESC LIMIT 12").bind(bounds.end,bounds.start).all<Pick<CareIncident,'target'|'opened_at'|'resolved_at'|'detail'>>(),
  env.DB.prepare("SELECT target,checked_at,ok,status,latency_ms,detail FROM (SELECT target,checked_at,ok,status,latency_ms,detail,ROW_NUMBER() OVER(PARTITION BY target ORDER BY slot DESC) AS n FROM care_checks WHERE project_id='opus' AND checked_at>=? AND checked_at<?) WHERE n=1").bind(bounds.start,bounds.end).all<CareCheck>(),
 ]);
 const checks=stats.results.reduce((n,x)=>n+x.checks,0),successful=stats.results.reduce((n,x)=>n+x.successful,0);
 const expected=Math.max(0,Math.floor((Date.parse(bounds.end)-Date.parse(bounds.start))/300000))*CARE_TARGETS.length;
 const actions:string[]=[];
 if((incidents?.open||0)>0)actions.push('Investigate unresolved service checks.');
 if(!checks||checks<expected*.95)actions.push('Review monitoring coverage and any gaps.');
 actions.push('Connect a backup verification source before reporting backup protection.');
 const snapshot:CareSnapshot={project:p.name,month:bounds.month,generated_at:nowISO(),period_start:bounds.start,period_end:bounds.end,checks,successful,expected,coverage:expected?Math.min(100,checks/expected*100):0,sample_availability:checks?successful/checks*100:null,targets:CARE_TARGETS.map(t=>({name:t.name,...(stats.results.find(s=>s.target===t.id)||{checks:0,successful:0,average_ms:null})})),incidents:incidents?.total||0,open_incidents:incidents?.open||0,latest_checks:latestChecks.results,incident_details:incidentDetails.results,maintenance:events.results,backup_status:'Not connected — no automated backup verification.',actions:actions.slice(0,3)};
 const id=old?.id||crypto.randomUUID(),now=nowISO();
 await env.DB.prepare("INSERT INTO care_reports(id,project_id,month,snapshot,created_at,updated_at) VALUES(?,'opus',?,?,?,?) ON CONFLICT(project_id,month) DO UPDATE SET snapshot=excluded.snapshot,updated_at=excluded.updated_at WHERE care_reports.state='DRAFT'").bind(id,bounds.month,JSON.stringify(snapshot),now,now).run();
 await event(env,'report','Report draft prepared',`${bounds.month}; admin review required.`,actor);
 return id;
}

export async function reportById(env:Env,id:unknown){
 if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw new CheckoutError(400,'Choose a valid report.');
 const r=await env.DB.prepare(`SELECT ${reportColumns},pdf_hash FROM care_reports WHERE id=? AND project_id='opus'`).bind(id).first<StoredReport>();
 if(!r)throw new CheckoutError(404,'Report not found.');
 return {...r,snapshot:JSON.parse(r.snapshot) as CareSnapshot};
}
export async function approveReport(env:Env,id:unknown,updated:unknown,base64:unknown,actor:string,version:unknown){
 if(version!==CARE_PDF_VERSION)throw new CheckoutError(409,'A newer PDF design is available. Reload the admin page before approving.');
 const r=await reportById(env,id);
 if(r.state!=='DRAFT'||r.updated_at!==updated)throw new CheckoutError(409,'The report changed. Reload it before approving.');
 if(typeof base64!=='string'||base64.length>350000||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw new CheckoutError(400,'A report PDF under 250 KB is required.');
 let bytes:Uint8Array;
 try{bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));}catch{throw new CheckoutError(400,'Invalid PDF.');}
 if(bytes.length>250000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new CheckoutError(400,'A valid report PDF under 250 KB is required.');
 const key=`care_private_${r.id}_${crypto.randomUUID()}.pdf`,digest=await hash(base64);
 await env.MEDIA.put(key,bytes.buffer as ArrayBuffer,{httpMetadata:{contentType:'application/pdf'}});
 const saved=await env.DB.prepare("UPDATE care_reports SET state='APPROVED',pdf_version=3,approved_by=?,approved_at=?,pdf_key=?,pdf_hash=?,updated_at=? WHERE id=? AND state='DRAFT' AND updated_at=? RETURNING id").bind(actor,nowISO(),key,digest,nowISO(),r.id,updated).first();
 if(!saved)throw new CheckoutError(409,'The report changed. Reload it before approving.');
 await event(env,'report','Report approved',`${r.month}; PDF stored privately.`,actor);
}
export async function reviseReport(env:Env,id:unknown,updated:unknown,actor:string){
 const r=await reportById(env,id);
 if(r.state!=='APPROVED'||r.updated_at!==updated||['SENDING','UNCONFIRMED'].includes(r.delivery_status))throw new CheckoutError(409,'Reload the report. An email in progress or with uncertain acceptance must be checked before revising.');
 const now=nowISO();
 await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO care_report_editions SELECT id,revision,month,snapshot,pdf_key,pdf_hash,pdf_version,approved_by,approved_at,recipient,provider_id,delivery_status,delivery_error,? FROM care_reports WHERE id=? AND state='APPROVED' AND updated_at=? AND delivery_status NOT IN ('SENDING','UNCONFIRMED')").bind(now,r.id,updated),
  env.DB.prepare("UPDATE care_reports SET revision=revision+1,state='DRAFT',pdf_key=NULL,pdf_hash=NULL,approved_by=NULL,approved_at=NULL,recipient=NULL,provider_id=NULL,delivery_status='NOT_SENT',delivery_error=NULL,delivery_attempt=delivery_attempt+1,pdf_version=0,updated_at=? WHERE id=? AND state='APPROVED' AND updated_at=? AND delivery_status NOT IN ('SENDING','UNCONFIRMED')").bind(now,r.id,updated),
 ]);
 const fresh=await reportById(env,r.id);
 if(fresh.state!=='DRAFT'||fresh.revision!==r.revision+1)throw new CheckoutError(409,'The report changed. Reload it.');
 await event(env,'report','New report edition prepared',`${r.month}; previous approved file and delivery record preserved.`,actor);
}
export async function sendReport(env:Env,id:unknown,actor:string){
 const r=await reportById(env,id),p=await project(env);
 if(r.state!=='APPROVED'||!r.pdf_key)throw new CheckoutError(409,'Review and approve the report PDF before sending.');
 if(r.delivery_status!=='NOT_SENT')return {status:r.delivery_status};
 if(!receiptEmail(p.email))throw new CheckoutError(400,'Save a report recipient email first.');
 if(!emailConfigured(env))throw new CheckoutError(503,'Configure receipt email delivery before sending reports.');
 const object=await env.MEDIA.get(r.pdf_key);
 if(!object)throw new CheckoutError(503,'The approved PDF could not be loaded.');
 const bytes=new Uint8Array(await new Response(object.body).arrayBuffer());
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 const base64=btoa(binary);
 if(await hash(base64)!==r.pdf_hash)throw new CheckoutError(503,'The approved PDF failed its integrity check.');
 const locked=await env.DB.prepare("UPDATE care_reports SET delivery_status='SENDING',recipient=?,updated_at=? WHERE id=? AND delivery_status='NOT_SENT' RETURNING id").bind(p.email,nowISO(),r.id).first();
 if(!locked)return {status:'Already processing'};
 try{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json','Idempotency-Key':`opus-care-report-${r.id}-${r.delivery_attempt}`},body:JSON.stringify({from:env.RECEIPT_FROM_EMAIL,to:[p.email],reply_to:'support@opuszim.co.zw',subject:`${p.name} — ${r.month} care report`,text:`Your reviewed monthly care report is attached.\n${r.snapshot.checks} checks recorded. ${r.snapshot.incidents} incidents.\nQuestions: support@opuszim.co.zw`,html:`<div style="font-family:Poppins,sans-serif;color:#0f0928"><h1>${safe(p.name)}</h1><p>Your ${safe(r.month)} care report is attached.</p><p>${r.snapshot.checks} checks recorded · ${r.snapshot.incidents} incidents</p><p>Questions? support@opuszim.co.zw</p></div>`,attachments:[{filename:`Opus-care-${r.month}-edition-${r.revision}.pdf`,content:base64}]})});
  const body=await response.json().catch(()=>null) as {id?:string}|null;
  const accepted=response.ok&&typeof body?.id==='string';
  const status=accepted?'ACCEPTED':([400,401,403,422,429].includes(response.status)?'FAILED':'UNCONFIRMED');
  await env.DB.prepare('UPDATE care_reports SET delivery_status=?,provider_id=?,delivery_error=?,updated_at=? WHERE id=?').bind(status,accepted?body!.id:null,accepted?null:'Check Resend before attempting another delivery.',nowISO(),r.id).run();
  await event(env,'report',`Report email ${status.toLowerCase()}`,r.month,actor);
  return {status};
 }catch{await env.DB.prepare("UPDATE care_reports SET delivery_status='UNCONFIRMED',delivery_error='Provider response was uncertain; no automatic resend.',updated_at=? WHERE id=?").bind(nowISO(),r.id).run();return {status:'UNCONFIRMED'};}
}
export async function reportDelivery(env:Env,id:unknown){
 const r=await reportById(env,id);
 if(!r.provider_id)return {status:r.delivery_status};
 const response=await fetch(`https://api.resend.com/emails/${encodeURIComponent(r.provider_id)}`,{headers:{authorization:`Bearer ${env.RESEND_API_KEY}`},redirect:'manual',signal:AbortSignal.timeout(12000)});
 const body=await response.json().catch(()=>null) as {id?:string;last_event?:string}|null;
 if(!response.ok||body?.id!==r.provider_id)throw new CheckoutError(503,'Email delivery status could not be confirmed.');
 const states:Record<string,string>={delivered:'DELIVERED',opened:'DELIVERED',clicked:'DELIVERED',sent:'ACCEPTED',bounced:'BOUNCED',failed:'FAILED',complained:'COMPLAINED',delivery_delayed:'DELAYED'};
 const status=states[body?.last_event||'']||r.delivery_status;
 await env.DB.prepare('UPDATE care_reports SET delivery_status=?,updated_at=? WHERE id=?').bind(status,nowISO(),r.id).run();return {status};
}
