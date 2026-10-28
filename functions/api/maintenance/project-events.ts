import {reconcileReleaseIssues} from '../../_lib/release-issues';
import {githubIdentity} from '../../_lib/github-identity';
import {json} from '../../_lib/auth';
import type {PagesHandler} from '../../_lib/types';
const reply=(body:unknown,status=200)=>json(body,status,{'cache-control':'no-store'});
export const onRequestPost:PagesHandler=async c=>{
 const identity=await githubIdentity(c.request.headers.get('authorization'));
 if(!identity)return reply({error:'Unauthorized'},401);
 try{
  const reader=c.request.body?.getReader();if(!reader)return reply({error:'Missing event'},400);
  const chunks:Uint8Array[]=[];let size=0;while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>16384){await reader.cancel();return reply({error:'Event too large'},413)}chunks.push(next.value)}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length}
  const body=new TextDecoder().decode(bytes),encoder=new TextEncoder();
  let e;try{e=JSON.parse(body)}catch{return reply({error:'Invalid event'},400)}
  if(!e||typeof e!=='object'||!Number.isSafeInteger(e.repository_id)||typeof e.repository!=='string'||typeof e.sha!=='string'||! /^[a-f0-9]{40}$/.test(e.sha)||e.branch!=='main'||!['push','deployment'].includes(e.event)||!['changed','pending','success','failure','error'].includes(e.status)||typeof e.context!=='string'||e.context.length>100||typeof e.occurred_at!=='string'||!Number.isFinite(Date.parse(e.occurred_at))||Date.parse(e.occurred_at)>Date.now()+300000)return reply({error:'Invalid event'},400);
  if(e.repository_id!==Number(identity.repository_id)||e.repository!==identity.repository||(e.event==='push'&&(identity.event_name!=='push'||e.sha!==identity.sha))||(e.event==='deployment'&&identity.event_name!=='status'))return reply({error:'Event identity mismatch'},403);
  const integration=await c.env.DB.prepare('SELECT r.* FROM care_repository_integrations r JOIN care_projects p ON p.id=r.project_id WHERE r.repository_id=? AND r.repository=? AND r.enabled=1 AND p.enabled=1').bind(e.repository_id,e.repository).first<{project_id:string;repository:string}>();
  if(!integration)return reply({error:'Repository is not configured'},403);
  let url='https://github.com/'+integration.repository+'/commit/'+e.sha;
  if(e.event==='deployment'&&typeof e.url==='string')try{const u=new URL(e.url);if(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname==='vercel.com'||u.hostname==='github.com'))url=u.href.slice(0,500);}catch{}
  const occurred=new Date(e.occurred_at).toISOString(),now=new Date().toISOString();
  const id=[...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode([e.repository_id,e.event,e.sha,e.status,e.context,occurred].join('|'))))].map(x=>x.toString(16).padStart(2,'0')).join('');
  await c.env.DB.batch([
   c.env.DB.prepare('INSERT INTO care_repository_events(id,project_id,event,status,context,commit_sha,url,occurred_at,received_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(id,integration.project_id,e.event,e.status,e.context,e.sha,url,occurred,now),
   c.env.DB.prepare('UPDATE care_repository_integrations SET last_event_at=MAX(COALESCE(last_event_at,?),?) WHERE project_id=?').bind(now,now,integration.project_id),
   c.env.DB.prepare("DELETE FROM care_repository_events WHERE received_at<datetime('now','-90 days')").bind(),
  ]);
  await reconcileReleaseIssues(c.env,integration.project_id);
  return reply({ok:true});
 }catch{return reply({error:'Event could not be recorded'},503)}
};
