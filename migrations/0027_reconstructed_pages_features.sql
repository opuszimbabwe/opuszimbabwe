-- Reconstructed from the captured live schema. Contains no customer rows.
-- Apply locally for verification; production migrations require a reviewed release.

CREATE TABLE IF NOT EXISTS website_chat_sessions(id TEXT PRIMARY KEY,token_hash TEXT UNIQUE NOT NULL,name TEXT NOT NULL,created_at TEXT NOT NULL,last_activity TEXT NOT NULL,expires_at INTEGER NOT NULL,request_hash TEXT NOT NULL,admin_read_seq INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS website_chat_attachments(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES website_chat_sessions(id) ON DELETE CASCADE,storage_key TEXT NOT NULL,filename TEXT NOT NULL,content_type TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS website_chat_messages(seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,session_id TEXT NOT NULL REFERENCES website_chat_sessions(id) ON DELETE CASCADE,direction TEXT NOT NULL CHECK(direction IN('IN','OUT')),body TEXT NOT NULL DEFAULT '',attachment_id TEXT REFERENCES website_chat_attachments(id),created_at TEXT NOT NULL, reply_to_id TEXT, edited_at TEXT, deleted_at TEXT);

CREATE TABLE IF NOT EXISTS admin_push_jobs(id TEXT PRIMARY KEY,channel TEXT NOT NULL DEFAULT 'whatsapp',state TEXT NOT NULL DEFAULT 'QUEUED',created_at TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS admin_push_subscriptions(id TEXT PRIMARY KEY,admin_email TEXT NOT NULL,endpoint TEXT NOT NULL,p256dh TEXT NOT NULL,auth TEXT NOT NULL,created_at TEXT NOT NULL,last_error TEXT,disabled INTEGER NOT NULL DEFAULT 0);

CREATE TABLE IF NOT EXISTS local_domain_applications (
 id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL,
 fingerprint TEXT NOT NULL,
 request_hash TEXT NOT NULL,
 extension TEXT NOT NULL CHECK(extension IN ('.co.zw','.org.zw','.ac.zw')),
 domain_name TEXT NOT NULL,
 full_name TEXT NOT NULL,
 company_name TEXT NOT NULL,
 physical_address TEXT NOT NULL,
 phone TEXT NOT NULL,
 email TEXT NOT NULL,
 core_business TEXT NOT NULL,
 nameservers TEXT NOT NULL DEFAULT '',
 message TEXT NOT NULL DEFAULT '',
 letter_key TEXT,
 letter_filename TEXT,
 letter_type TEXT,
 letter_size INTEGER,
 state TEXT NOT NULL DEFAULT 'NEW' CHECK(state IN ('NEW','REVIEWED','COMPLETED')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS opus_chat_files (id TEXT PRIMARY KEY,session_id TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,filename TEXT NOT NULL,mime TEXT NOT NULL,size INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT (datetime('now')));

CREATE TABLE IF NOT EXISTS opus_customer_codes (number INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS project_downloads(project_id TEXT PRIMARY KEY,storage_key TEXT NOT NULL,filename TEXT NOT NULL,version TEXT NOT NULL,sha256 TEXT NOT NULL,size INTEGER NOT NULL,updated_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS site_feedback(id TEXT PRIMARY KEY,rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),comment TEXT NOT NULL DEFAULT '',page TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'NEW' CHECK(state IN('NEW','REVIEWED')),request_hash TEXT NOT NULL,created_at TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS website_chat_message_hides(viewer_key TEXT NOT NULL,message_id TEXT NOT NULL,PRIMARY KEY(viewer_key,message_id));

CREATE TABLE IF NOT EXISTS website_chat_session_clears(session_id TEXT PRIMARY KEY,through_seq INTEGER NOT NULL);

CREATE TABLE IF NOT EXISTS website_chat_session_hides(viewer_key TEXT NOT NULL,session_id TEXT NOT NULL,hidden_seq INTEGER NOT NULL,PRIMARY KEY(viewer_key,session_id));

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
 id TEXT PRIMARY KEY, phone TEXT NOT NULL, display_name TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','HANDLED')),
 last_customer_at INTEGER NOT NULL DEFAULT 0, last_message_at TEXT NOT NULL,
 last_inbound_seq INTEGER NOT NULL DEFAULT 0, read_seq INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
, photo_key TEXT);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
 seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
 conversation_id TEXT NOT NULL REFERENCES whatsapp_conversations(id),
 direction TEXT NOT NULL CHECK(direction IN ('IN','OUT')), message_type TEXT NOT NULL,
 body TEXT NOT NULL, payload_json TEXT, provider_id TEXT UNIQUE,
 state TEXT NOT NULL, error TEXT, created_at TEXT NOT NULL, occurred_at TEXT NOT NULL,
 due_at INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0,
 lease_until INTEGER NOT NULL DEFAULT 0, admin_email TEXT
);

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  message_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_download_grants (
 token_hash TEXT PRIMARY KEY,
 project_id TEXT NOT NULL REFERENCES project_downloads(project_id) ON DELETE CASCADE,
 download_sha256 TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS project_download_grants_expiry ON project_download_grants(expires_at);
CREATE TABLE IF NOT EXISTS whatsapp_delivery_events (
 provider_id TEXT PRIMARY KEY,
 state TEXT NOT NULL,
 rank INTEGER NOT NULL,
 occurred_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS reconstructed_chat_session_seq ON website_chat_messages(session_id,seq);
CREATE INDEX IF NOT EXISTS reconstructed_chat_unread ON website_chat_messages(session_id,direction,seq);
CREATE INDEX IF NOT EXISTS reconstructed_chat_activity ON website_chat_sessions(last_activity);
CREATE INDEX IF NOT EXISTS reconstructed_whatsapp_conversation_seq ON whatsapp_messages(conversation_id,seq);
CREATE INDEX IF NOT EXISTS reconstructed_whatsapp_queue ON whatsapp_messages(state,due_at);
CREATE INDEX IF NOT EXISTS reconstructed_feedback_created ON site_feedback(created_at);
CREATE INDEX IF NOT EXISTS reconstructed_local_domains_created ON local_domain_applications(created_at);
