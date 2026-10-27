ALTER TABLE care_projects ADD COLUMN site_url TEXT NOT NULL DEFAULT '';
ALTER TABLE care_projects ADD COLUMN auto_documents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE care_projects ADD COLUMN report_policy TEXT NOT NULL DEFAULT 'progress-and-final';
INSERT OR IGNORE INTO care_projects(id,name,email,alert_email,plan_usd,enabled,site_url,auto_documents)
 VALUES('great-couples','Great Couples International Trust','','support@opuszim.co.zw',10,1,'https://www.greatcouples.org.zw/',0);
ALTER TABLE care_events ADD COLUMN client_visible INTEGER NOT NULL DEFAULT 0;
ALTER TABLE customer_payments ADD COLUMN care_order_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS care_payment_once ON customer_payments(care_order_id) WHERE care_order_id IS NOT NULL;
CREATE TABLE care_orders (
 id TEXT PRIMARY KEY,project_id TEXT NOT NULL,period TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,recipient TEXT NOT NULL,amount_minor INTEGER NOT NULL DEFAULT 1000,
 currency TEXT NOT NULL DEFAULT 'USD',state TEXT NOT NULL DEFAULT 'OPEN',payment_id TEXT UNIQUE,
 expires_at INTEGER NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX care_billing_period_once ON care_orders(project_id,period) WHERE state IN ('OPEN','PAYMENT_PENDING','PAID','REVERSED');
CREATE TABLE ops_jobs (
 id TEXT PRIMARY KEY,kind TEXT NOT NULL,order_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'READY',attempts INTEGER NOT NULL DEFAULT 0,
 next_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,
 error TEXT,pdf_key TEXT,pdf_hash TEXT,snapshot TEXT,
 email_status TEXT NOT NULL DEFAULT 'NOT_SENT',provider_id TEXT,
 created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 UNIQUE(kind,order_id)
);
CREATE INDEX ops_jobs_ready ON ops_jobs(status,next_at);
CREATE TABLE ops_job_events (
 id TEXT PRIMARY KEY,job_id TEXT NOT NULL,stage TEXT NOT NULL,detail TEXT NOT NULL,created_at TEXT NOT NULL
);
CREATE TABLE client_monitor_runs(slot INTEGER PRIMARY KEY,completed_at TEXT);
CREATE TABLE ops_mail_budget(day TEXT PRIMARY KEY,attempts INTEGER NOT NULL);
