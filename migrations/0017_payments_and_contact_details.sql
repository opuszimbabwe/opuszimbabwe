CREATE TABLE IF NOT EXISTS customer_payments (
 id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL UNIQUE,
 fingerprint TEXT NOT NULL,
 payer_name TEXT NOT NULL,
 payer_email TEXT NOT NULL,
 payer_phone TEXT NOT NULL DEFAULT '',
 invoice TEXT NOT NULL,
 amount_minor INTEGER NOT NULL CHECK(amount_minor > 0),
 amount_paid_minor INTEGER,
 currency TEXT NOT NULL,
 method_code TEXT NOT NULL,
 method_name TEXT NOT NULL,
 gateway_reference TEXT UNIQUE,
 redirect_url TEXT,
 status TEXT NOT NULL DEFAULT 'CREATING',
 transaction_date TEXT,
 checked_at INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS customer_payments_created ON customer_payments(created_at DESC);
CREATE TABLE IF NOT EXISTS payment_rate_limits (
 bucket TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
UPDATE settings SET value = '[{"title":"Email","line":"support@opuszim.co.zw","note":"Primary email for enquiries and support","href":"mailto:support@opuszim.co.zw","icon":"Mail"},{"title":"Secondary email","line":"opuszimbabwe@outlook.com","note":"An alternative way to reach us","href":"mailto:opuszimbabwe@outlook.com","icon":"Mail"},{"title":"Direct contact","line":"0710 740 387","note":"Project enquiries and direct contact","href":"tel:+263710740387","icon":"Phone"},{"title":"Support only","line":"0773 979 162","note":"Payment and technical support","href":"tel:+263773979162","icon":"Phone"}]'
WHERE key = 'contact_cards';
UPDATE settings SET value = replace(value, '263776396530', '263710740387') WHERE key = 'footer_socials';
UPDATE settings SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'content_revision';
