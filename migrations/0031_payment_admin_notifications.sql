-- Internal outbox: no customer access tokens or payment credentials.
CREATE TABLE IF NOT EXISTS payment_admin_notifications (
 payment_id TEXT PRIMARY KEY,
 recipient TEXT NOT NULL,
 state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN ('PENDING','SENDING','ACCEPTED','FAILED','UNCONFIRMED')),
 provider_id TEXT,
 error_code TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
