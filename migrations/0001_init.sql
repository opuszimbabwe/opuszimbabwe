-- Opus Zimbabwe content schema (Cloudflare D1)

CREATE TABLE services (
  id TEXT PRIMARY KEY NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  page_description TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL DEFAULT '[]',
  icon TEXT NOT NULL DEFAULT 'Globe',
  gradient TEXT NOT NULL DEFAULT '160deg,#1a1a1a,#454545',
  slug TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pricing_cards (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  monthly_price TEXT NOT NULL DEFAULT '',
  yearly_price TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_services_order ON services (order_index);
CREATE INDEX idx_pricing_order ON pricing_cards (order_index);
