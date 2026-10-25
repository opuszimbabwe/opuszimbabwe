ALTER TABLE care_reports ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE care_reports ADD COLUMN pdf_version INTEGER NOT NULL DEFAULT 1;
CREATE TABLE care_report_editions (
 report_id TEXT NOT NULL, revision INTEGER NOT NULL, month TEXT NOT NULL,
 snapshot TEXT NOT NULL, pdf_key TEXT NOT NULL, pdf_hash TEXT NOT NULL,
 pdf_version INTEGER NOT NULL, approved_by TEXT, approved_at TEXT,
 recipient TEXT, provider_id TEXT, delivery_status TEXT NOT NULL,
 delivery_error TEXT, created_at TEXT NOT NULL,
 PRIMARY KEY(report_id,revision)
);
-- Keep the original approved/emailed file and its delivery record intact.
-- The new design starts as a separate, unsent draft edition.
INSERT INTO care_report_editions
 SELECT id,revision,month,snapshot,pdf_key,pdf_hash,pdf_version,approved_by,approved_at,
 recipient,provider_id,delivery_status,delivery_error,strftime('%Y-%m-%dT%H:%M:%fZ','now')
 FROM care_reports WHERE state='APPROVED' AND pdf_key IS NOT NULL AND delivery_status NOT IN ('SENDING','UNCONFIRMED');
UPDATE care_reports SET revision=revision+1,state='DRAFT',pdf_key=NULL,pdf_hash=NULL,
 approved_by=NULL,approved_at=NULL,recipient=NULL,provider_id=NULL,
 delivery_status='NOT_SENT',delivery_error=NULL,delivery_attempt=delivery_attempt+1,pdf_version=0,
 updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE state='APPROVED' AND pdf_key IS NOT NULL AND delivery_status NOT IN ('SENDING','UNCONFIRMED');
