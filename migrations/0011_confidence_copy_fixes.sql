-- 0011_confidence_copy_fixes.sql
-- Copy corrections on the home page:
--   * the Trusted By subheading was seeded empty
--   * the Projects heading over-emphasised "real" (Live work. Real clients.
--     Real results.) — replaced with a confident, factual heading
--
-- Only rewrites the seeded/empty values, so admin-edited copy is preserved.

UPDATE settings
SET value = json_set(
      value,
      '$.projects_heading',
      'Live work we have delivered.'
    ),
    updated_at = datetime('now')
WHERE key = 'home_sections'
  AND (
    json_extract(value, '$.projects_heading') IS NULL
    OR json_extract(value, '$.projects_heading') IN (
      '',
      'Live work. Real clients. Real results.',
      'Projects we have delivered.'
    )
  );

UPDATE settings
SET value = json_set(
      value,
      '$.partners_subheading',
      'Trusted by businesses, NGOs, and institutions across Zimbabwe.'
    ),
    updated_at = datetime('now')
WHERE key = 'home_sections'
  AND (
    json_extract(value, '$.partners_subheading') IS NULL
    OR trim(json_extract(value, '$.partners_subheading')) = ''
  );

UPDATE settings
SET value = json_set(
      value,
      '$.how_it_works_heading',
      'How we take your project from idea to launch.'
    ),
    updated_at = datetime('now')
WHERE key = 'home_sections'
  AND (
    json_extract(value, '$.how_it_works_heading') IS NULL
    OR json_extract(value, '$.how_it_works_heading') IN ('', 'How it works.')
  );
