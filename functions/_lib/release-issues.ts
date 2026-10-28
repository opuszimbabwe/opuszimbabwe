import type {Env} from './types';
/** Keep every failed publication check. Only a later authenticated success from
 * the same project and deployment context can close it; a commit push cannot. */
export async function reconcileReleaseIssues(env:Env,project:string){
 await env.DB.prepare("INSERT INTO care_release_issues(id,project_id,failure_event_id,context,opened_at,failed_commit,failed_url,detail) SELECT 'release-'||id,project_id,id,context,occurred_at,commit_sha,url,'The website publication check failed.' FROM care_repository_events WHERE project_id=? AND event='deployment' AND status IN ('failure','error') ON CONFLICT(failure_event_id) DO NOTHING").bind(project).run();
 await env.DB.prepare(`UPDATE care_release_issues AS i SET
  (status,resolved_at,resolution_event_id,resolution_commit,resolution_url,resolution_detail)=
  (SELECT 'RESOLVED',s.occurred_at,s.id,s.commit_sha,s.url,
   CASE WHEN s.commit_sha=i.failed_commit THEN 'The update passed a later publication check.' ELSE 'A later update passed the publication check and superseded this failed release.' END
   FROM care_repository_events s WHERE s.project_id=i.project_id AND s.context=i.context AND s.event='deployment' AND s.status='success' AND s.occurred_at>i.opened_at ORDER BY s.occurred_at,s.id LIMIT 1)
  WHERE i.project_id=? AND i.status='OPEN' AND EXISTS
   (SELECT 1 FROM care_repository_events s WHERE s.project_id=i.project_id AND s.context=i.context AND s.event='deployment' AND s.status='success' AND s.occurred_at>i.opened_at)`).bind(project).run();
}
