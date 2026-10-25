ALTER TABLE customer_payments ADD COLUMN gateway_error_code TEXT;
ALTER TABLE customer_payments ADD COLUMN gateway_error_message TEXT;
CREATE TABLE IF NOT EXISTS domain_catalogue (
 extension TEXT PRIMARY KEY,
 registration_cost_minor INTEGER,
 renewal_cost_minor INTEGER,
 availability TEXT NOT NULL,
 reason TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS domain_orders (
 id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL UNIQUE,
 domain_name TEXT NOT NULL,
 extension TEXT NOT NULL,
 supplier_cost_minor INTEGER NOT NULL,
 renewal_cost_minor INTEGER,
 retail_minor INTEGER NOT NULL,
 markup_percent REAL NOT NULL,
 minimum_markup_minor INTEGER NOT NULL,
 contact_json TEXT NOT NULL,
 registration_json TEXT NOT NULL,
 terms_accepted_at TEXT NOT NULL,
 quote_expires_at INTEGER NOT NULL,
 state TEXT NOT NULL DEFAULT 'QUOTED',
 payment_id TEXT UNIQUE,
 supplier_status_json TEXT,
 supplier_started_at TEXT,
 last_error TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS domain_orders_state ON domain_orders(state, created_at DESC);
INSERT INTO settings (key,value) VALUES ('domain_pricing','{"markup_percent":25,"minimum_markup_minor":500,"rounding_minor":1}') ON CONFLICT(key) DO NOTHING;
