-- Minimal durable service-message preferences. No marketing consent is inferred.
CREATE TABLE IF NOT EXISTS whatsapp_contact_preferences (
 recipient_phone TEXT PRIMARY KEY,
 stopped INTEGER NOT NULL DEFAULT 0 CHECK(stopped IN (0,1)),
 event_ms INTEGER NOT NULL DEFAULT 0,
 provider_message_id TEXT,
 human_hold INTEGER NOT NULL DEFAULT 0 CHECK(human_hold IN (0,1)),
 human_requested_at TEXT,
 updated_at TEXT NOT NULL
);
