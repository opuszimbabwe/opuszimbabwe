-- Read-only verification for the remote D1 database after applying
-- migrations 0006–0013. Run with:
--
--   npx wrangler d1 execute opuszim-content --remote --file=scripts/remote-verify.sql
--
-- Every row should read OK / show the expected value. Nothing here writes data.

-- 1. Migration ledger — should list 0001 … 0013.
SELECT 'd1_migrations' AS check_name,
       COUNT(*) AS rows_found,
       GROUP_CONCAT(name, ' | ') AS detail
FROM d1_migrations;

-- 2. Columns added by 0006, 0007 and 0010.
SELECT 'services.card_bg_color' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'MISSING' END AS result,
       '0006' AS migration
FROM pragma_table_info('services')
WHERE name = 'card_bg_color';

SELECT 'partners.bg_color' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'MISSING' END AS result,
       '0007' AS migration
FROM pragma_table_info('partners')
WHERE name = 'bg_color';

SELECT 'projects.screenshot' AS check_name,
       CASE WHEN COUNT(*) = 1 THEN 'OK' ELSE 'MISSING' END AS result,
       '0010' AS migration
FROM pragma_table_info('projects')
WHERE name = 'screenshot';

-- 3. Settings keys created/updated by 0006–0011.
SELECT 'settings:' || key AS check_name,
       CASE WHEN length(value) > 2 THEN 'OK' ELSE 'EMPTY' END AS result,
       length(value) AS bytes
FROM settings
WHERE key IN (
  'hero_cycles',
  'approach_items',
  'payment_methods',
  'why_choose_us',
  'home_sections',
  'service_pages',
  'favicon_icon',
  'browser_title',
  'navbar_logo'
)
ORDER BY key;

-- 4. Six service pages (0008).
SELECT 'service_pages keys' AS check_name,
       COUNT(*) AS rows_found,
       'expected 6' AS detail
FROM settings, json_each(settings.value)
WHERE settings.key = 'service_pages';

-- 5. Six website price-range packages (0008).
SELECT 'pricing_cards' AS check_name,
       COUNT(*) AS rows_found,
       GROUP_CONCAT(name || ' = ' || monthly_price, ' | ') AS detail
FROM pricing_cards;

-- 6. Home-page copy and section backgrounds from 0011–0013.
SELECT 'home_sections copy' AS check_name,
       json_extract(value, '$.partners_heading') AS partners_heading,
       json_extract(value, '$.projects_heading') AS projects_heading,
       json_extract(value, '$.partners_subheading') AS partners_subheading
FROM settings
WHERE key = 'home_sections';

SELECT 'home section backgrounds' AS check_name,
       json_extract(value, '$.services_bg') AS service_cards_background,
       json_extract(value, '$.how_it_works_bg') AS approach_background
FROM settings
WHERE key = 'home_sections';

-- 7. Transparent navbar logo (0009) — should be /images/logo-full.png.
SELECT 'navbar_logo' AS check_name, value AS result
FROM settings
WHERE key = 'navbar_logo';

-- 8. Live-work projects and their screenshots (0010).
SELECT 'projects' AS check_name,
       COUNT(*) AS rows_found,
       GROUP_CONCAT(name, ' | ') AS detail
FROM projects;

SELECT 'projects missing screenshot' AS check_name,
       COUNT(*) AS rows_found,
       'expected 0 once screenshots are uploaded' AS detail
FROM projects
WHERE screenshot = '';

-- 9. Killing Giants black tile (0007).
SELECT 'partners' AS check_name,
       name,
       bg_color
FROM partners
ORDER BY order_index;
