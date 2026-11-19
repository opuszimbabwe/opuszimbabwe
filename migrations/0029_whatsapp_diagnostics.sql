-- Additive diagnostics only. No changes to existing messages or payment tables.
CREATE TABLE IF NOT EXISTS whatsapp_audit_events (
 id TEXT PRIMARY KEY,
 event_type TEXT NOT NULL,
 created_at TEXT NOT NULL,
 occurred_at TEXT,
 phone_number_id TEXT,
 waba_id TEXT,
 conversation_id TEXT,
 message_id TEXT,
 provider_message_id TEXT,
 recipient_phone TEXT,
 details_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS whatsapp_audit_created ON whatsapp_audit_events(created_at);
CREATE INDEX IF NOT EXISTS whatsapp_audit_message ON whatsapp_audit_events(message_id,created_at);
CREATE INDEX IF NOT EXISTS whatsapp_audit_provider ON whatsapp_audit_events(provider_message_id);
CREATE TABLE IF NOT EXISTS whatsapp_sender_diagnostics (
 phone_number_id TEXT PRIMARY KEY,
 display_phone_number TEXT,
 verified_name TEXT,
 quality_rating TEXT,
 identity_checked_at TEXT,
 identity_json TEXT,
 waba_id TEXT,
 app_id TEXT,
 health_checked_at TEXT,
 health_json TEXT,
 blocked_code INTEGER,
 blocked_at TEXT,
 blocked_reason TEXT,
 updated_at TEXT NOT NULL
);
