-- 0009_transparent_navbar_logo.sql
-- The navbar must use the transparent Opus logo (/images/logo-full.png),
-- never the old white-background variant. Only replace the seeded default;
-- an admin-uploaded logo is left untouched.

UPDATE settings
SET value = '/images/logo-full.png', updated_at = datetime('now')
WHERE key = 'navbar_logo' AND value = '/images/logo.png';

INSERT INTO settings (key, value, updated_at)
SELECT 'navbar_logo', '/images/logo-full.png', datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'navbar_logo');
