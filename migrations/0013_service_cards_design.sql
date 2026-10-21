-- 0013_service_cards_design.sql
-- The homepage service cards now follow the light neutral, raised-card
-- reference design. Move the seeded section background from white to a
-- soft grey so the white rounded cards and shadows read clearly.
-- Preserve any background colour intentionally changed in the admin.

UPDATE settings
SET value = json_set(
      value,
      '$.services_bg',
      '#f4f4f4'
    ),
    updated_at = datetime('now')
WHERE key = 'home_sections'
  AND json_extract(value, '$.services_bg') IN ('#ffffff', '#FFFFFF', '');
