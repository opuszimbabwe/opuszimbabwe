-- 0012_approach_section_design.sql
-- "How we take your project from idea to launch" section restyle:
-- the section background moves from pure white to the design's light
-- slate (#f8fafc) so the white step hubs read as a timeline.
-- Only rewrites the seeded value, so admin-edited backgrounds are preserved.

UPDATE settings
SET value = json_set(
      value,
      '$.how_it_works_bg',
      '#f8fafc'
    ),
    updated_at = datetime('now')
WHERE key = 'home_sections'
  AND json_extract(value, '$.how_it_works_bg') IN ('#ffffff', '#FFFFFF', '');
