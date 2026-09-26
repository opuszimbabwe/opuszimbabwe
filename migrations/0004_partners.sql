-- Trusted partners ("Organisations We Have Built For" on the home page).
--
-- Additive and safe to apply on top of existing production data: it only
-- creates a new table and inserts rows that are not already present
-- (INSERT OR IGNORE), so nothing that exists today is modified or removed.

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_partners_order ON partners (order_index);

-- Seed: mirrors the partner logos currently baked into the home page.
INSERT OR IGNORE INTO partners (id, name, logo, url, order_index, visible) VALUES
(
  'great-couples',
  'Great Couples International Trust',
  '/images/partner-great-couples.png',
  'https://greatcouples.org.zw',
  0,
  1
),
(
  'forgepoint',
  'ForgePoint Technologies',
  '/images/partner-forgepoint.png',
  '',
  1,
  1
),
(
  'rays-of-hope',
  'Rays of Hope Academy',
  '/images/partner-rays-of-hope.png',
  '',
  2,
  1
),
(
  'killing-giants',
  'Killing Giants',
  '/images/partner-killing-giants.png',
  '',
  3,
  1
);
