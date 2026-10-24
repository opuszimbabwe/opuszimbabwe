-- Keep the reviewed pale section defaults while allowing every subsequent admin colour choice.
-- Run against production only after approval. Custom existing colours are preserved.
UPDATE settings SET value = json_set(value, '$.how_it_works_bg', '#f8fafc') WHERE key = 'home_sections' AND json_extract(value, '$.how_it_works_bg') = '#ffffff';
UPDATE settings SET value = json_set(value, '$.projects_bg', '#f8fafc') WHERE key = 'home_sections' AND json_extract(value, '$.projects_bg') = '#f8f8f6';
UPDATE settings SET value = json_set(value, '$.faq_bg', '#f8fafc') WHERE key = 'home_sections' AND json_extract(value, '$.faq_bg') = '#f8f8f6';
