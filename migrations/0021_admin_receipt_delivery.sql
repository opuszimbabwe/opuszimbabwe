ALTER TABLE domain_orders ADD COLUMN receipt_email TEXT;
ALTER TABLE domain_orders ADD COLUMN receipt_whatsapp TEXT;
CREATE TABLE payment_receipts (
 id TEXT PRIMARY KEY,
 payment_id TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at INTEGER NOT NULL,
 issued_by TEXT NOT NULL,
 recipient_email TEXT NOT NULL DEFAULT '',
 email_status TEXT NOT NULL DEFAULT 'DRAFT',
 provider_id TEXT,
 email_error TEXT,
 sent_at TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX payment_receipts_payment ON payment_receipts(payment_id,created_at DESC);
