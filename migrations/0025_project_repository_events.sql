CREATE TABLE care_repository_integrations (
 project_id TEXT PRIMARY KEY,
 repository_id INTEGER NOT NULL UNIQUE,
 repository TEXT NOT NULL,
 enabled INTEGER NOT NULL DEFAULT 1,
 last_event_at TEXT
);
INSERT INTO care_repository_integrations(project_id,repository_id,repository)
VALUES('great-couples',1312317100,'Opus-Zimbabwe/great-couples-international-trust-23941f01');
CREATE TABLE care_repository_events (
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 event TEXT NOT NULL,
 status TEXT NOT NULL,
 context TEXT NOT NULL,
 commit_sha TEXT NOT NULL,
 url TEXT NOT NULL,
 occurred_at TEXT NOT NULL,
 received_at TEXT NOT NULL
);
CREATE INDEX care_repository_events_project_time ON care_repository_events(project_id,occurred_at DESC);
