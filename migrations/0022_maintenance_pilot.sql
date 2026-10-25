CREATE TABLE IF NOT EXISTS care_projects (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
 alert_email TEXT NOT NULL DEFAULT '', plan_usd INTEGER NOT NULL DEFAULT 10,
 enabled INTEGER NOT NULL DEFAULT 1, last_tick TEXT, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
INSERT OR IGNORE INTO care_projects(id,name,alert_email) VALUES('opus','Opus Zimbabwe','support@opuszim.co.zw');
CREATE TABLE IF NOT EXISTS care_checks (
 project_id TEXT NOT NULL, target TEXT NOT NULL, slot INTEGER NOT NULL,
 checked_at TEXT NOT NULL, ok INTEGER NOT NULL, status INTEGER, latency_ms INTEGER NOT NULL,
 detail TEXT NOT NULL, PRIMARY KEY(project_id,target,slot)
);
CREATE INDEX IF NOT EXISTS care_checks_date ON care_checks(checked_at);
CREATE TABLE IF NOT EXISTS care_incidents (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, target TEXT NOT NULL,
 opened_at TEXT NOT NULL, resolved_at TEXT, detail TEXT NOT NULL,
 alert_status TEXT NOT NULL DEFAULT 'PENDING', alert_error TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS care_incident_open ON care_incidents(project_id,target) WHERE resolved_at IS NULL;
CREATE TABLE IF NOT EXISTS care_events (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, category TEXT NOT NULL,
 title TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS care_events_project ON care_events(project_id,created_at);
CREATE TABLE IF NOT EXISTS care_reports (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL, month TEXT NOT NULL,
 snapshot TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'DRAFT',
 approved_by TEXT, approved_at TEXT, pdf_key TEXT, pdf_hash TEXT,
 recipient TEXT, provider_id TEXT, delivery_status TEXT NOT NULL DEFAULT 'NOT_SENT', delivery_error TEXT,
 delivery_attempt INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id,month)
);
CREATE TABLE IF NOT EXISTS care_runs (
 slot INTEGER PRIMARY KEY, started_at TEXT NOT NULL, completed_at TEXT, error TEXT
);
CREATE TABLE IF NOT EXISTS care_alert_budget(day TEXT PRIMARY KEY, attempts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS care_plans (
 price_usd INTEGER PRIMARY KEY, name TEXT NOT NULL, summary TEXT NOT NULL,
 features TEXT NOT NULL, visible INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO care_plans VALUES
 (10,'Monitor','Know how your project is performing.','["Five-minute uptime and HTTPS checks","Incident and maintenance history","Monthly report reviewed by our team","Repairs and development quoted separately"]',1),
 (20,'Keep current','Monitoring, plus small content changes.','["Everything in Monitor","Up to 30 minutes of content updates per month","Text and image changes to existing pages","New pages and development quoted separately"]',1),
 (60,'Maintain','Regular care for your existing website or system.','["Everything in Monitor","Up to 2 hours of maintenance per month","Content updates and compatible dependency updates","Changes tested before release"]',1),
 (120,'Priority','More maintenance time and priority support.','["Everything in Maintain","Up to 5 hours total maintenance per month","Priority handling during business hours","New features and major repairs quoted separately"]',1);
