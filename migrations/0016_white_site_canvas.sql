-- Replace the previous neutral canvas presets, leaving custom colours/images intact.
UPDATE settings
SET value = json_set(value,
  '$.hero_bg', CASE WHEN lower(json_extract(value, '$.hero_bg')) IN ('#f8f8f6','#f8fafc','#fff8f4') THEN '#ffffff' ELSE json_extract(value, '$.hero_bg') END,
  '$.partners_bg', CASE WHEN lower(json_extract(value, '$.partners_bg')) IN ('#f8f8f6','#f8fafc','#fff8f4') THEN '#ffffff' ELSE json_extract(value, '$.partners_bg') END,
  '$.how_it_works_bg', CASE WHEN lower(json_extract(value, '$.how_it_works_bg')) IN ('#f8f8f6','#f8fafc','#fff8f4') THEN '#ffffff' ELSE json_extract(value, '$.how_it_works_bg') END,
  '$.projects_bg', CASE WHEN lower(json_extract(value, '$.projects_bg')) IN ('#f8f8f6','#f8fafc','#fff8f4') THEN '#ffffff' ELSE json_extract(value, '$.projects_bg') END,
  '$.faq_bg', CASE WHEN lower(json_extract(value, '$.faq_bg')) IN ('#f8f8f6','#f8fafc','#fff8f4') THEN '#ffffff' ELSE json_extract(value, '$.faq_bg') END)
WHERE key = 'home_sections' AND json_valid(value);
UPDATE settings SET value = json_set(value, '$.background.background_color', '#ffffff')
WHERE key = 'hero_design' AND json_valid(value)
AND lower(json_extract(value, '$.background.background_color')) IN ('#f8f8f6','#f8fafc','#fff8f4');
UPDATE service_extras SET hero_headline = 'Website design. Built for business.'
WHERE service_id = 'web-design' AND hero_headline = 'A website that represents your business the way it deserves to be represented.';
-- Clear only the previous empty-image grey canvas overlay. Custom campaigns stay intact.
UPDATE settings SET value = json_set(value, '$.background.overlay_opacity', 0)
WHERE key = 'hero_design' AND json_valid(value)
AND json_extract(value, '$.background.background_image') = ''
AND json_extract(value, '$.background.overlay_gradient') = '180deg,#b3b3b3,#ffffff';
-- Public content saves and this one-time design update share the freshness revision.
UPDATE settings SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = 'content_revision';
