-- Additive wallet presentation and one-shot OTP state; never stores OTP values.
CREATE TABLE IF NOT EXISTS payment_wallet_state (
 payment_id TEXT PRIMARY KEY REFERENCES customer_payments(id),
 kind TEXT NOT NULL CHECK(kind IN ('innbucks','omari','onemoney')),
 instructions_json TEXT NOT NULL DEFAULT '{}',
 otp_state TEXT NOT NULL DEFAULT 'NOT_REQUIRED' CHECK(otp_state IN ('NOT_REQUIRED','AWAITING','SUBMITTING','SUBMITTED','UNCERTAIN')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
