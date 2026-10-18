-- 0012_process_rail_icons.sql
-- The How It Works section is now a numbered process rail with circular icon badges
-- (see components/OpusApproach.tsx). The seeded icons were generic (Globe / Settings /
-- Bot / Link2 / TrendingUp) and read oddly inside a step badge, so each step gets a
-- line icon that matches what the step actually is:
--   Understand -> Search   Plan -> PenTool   Build -> Wrench
--   Review -> ClipboardCheck   Launch & Support -> Rocket
--
-- Each badge is only re-pointed while the step still holds the icon this site seeded,
-- so a step renamed or given a custom/uploaded icon in /admin is left untouched.

UPDATE settings
SET value = json_set(value, '$[0].icon', 'Search'),
    updated_at = datetime('now')
WHERE key = 'approach_items'
  AND json_extract(value, '$[0].title') = 'Understand'
  AND json_extract(value, '$[0].icon') IN ('', 'Globe', 'Search');

UPDATE settings
SET value = json_set(value, '$[1].icon', 'PenTool'),
    updated_at = datetime('now')
WHERE key = 'approach_items'
  AND json_extract(value, '$[1].title') = 'Plan'
  AND json_extract(value, '$[1].icon') IN ('', 'Settings', 'PenTool');

UPDATE settings
SET value = json_set(value, '$[2].icon', 'Wrench'),
    updated_at = datetime('now')
WHERE key = 'approach_items'
  AND json_extract(value, '$[2].title') = 'Build'
  AND json_extract(value, '$[2].icon') IN ('', 'Bot', 'LayoutDashboard', 'Wrench');

UPDATE settings
SET value = json_set(value, '$[3].icon', 'ClipboardCheck'),
    updated_at = datetime('now')
WHERE key = 'approach_items'
  AND json_extract(value, '$[3].title') = 'Review'
  AND json_extract(value, '$[3].icon') IN ('', 'Link2', 'ClipboardCheck');

UPDATE settings
SET value = json_set(value, '$[4].icon', 'Rocket'),
    updated_at = datetime('now')
WHERE key = 'approach_items'
  AND json_extract(value, '$[4].title') = 'Launch & Support'
  AND json_extract(value, '$[4].icon') IN ('', 'TrendingUp', 'Rocket');
