CREATE TABLE care_release_issues (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 failure_event_id TEXT UNIQUE,
 context TEXT NOT NULL,
 origin TEXT NOT NULL DEFAULT 'SIGNED_EVENT',
 status TEXT NOT NULL DEFAULT 'OPEN',
 opened_at TEXT NOT NULL,
 failed_commit TEXT NOT NULL,
 failed_url TEXT NOT NULL,
 detail TEXT NOT NULL,
 resolved_at TEXT,
 resolution_event_id TEXT,
 resolution_commit TEXT,
 resolution_url TEXT,
 resolution_detail TEXT
);
CREATE INDEX care_release_issues_project_status ON care_release_issues(project_id,status,opened_at DESC);
INSERT INTO care_release_issues(id,project_id,failure_event_id,context,opened_at,failed_commit,failed_url,detail)
SELECT 'release-'||id,project_id,id,context,occurred_at,commit_sha,url,'The website publication check failed.'
FROM care_repository_events WHERE event='deployment' AND status IN ('failure','error');
