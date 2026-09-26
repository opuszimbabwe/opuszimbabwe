-- Admin-managed visual/example image for each service page.
-- The service page must not rely on an uneditable hardcoded example image.
ALTER TABLE service_extras ADD COLUMN visual_background TEXT NOT NULL DEFAULT '';

UPDATE service_extras
SET visual_background = CASE service_id
  WHEN 'web-design' THEN '/images/service-web-design.png'
  WHEN 'software-development' THEN '/images/service-software.jpg'
  WHEN 'ai-automation' THEN '/images/service-ai.jpg'
  WHEN 'graphic-design' THEN '/images/service-graphic.png'
  WHEN 'domains-hosting' THEN '/images/service-hosting.png'
  WHEN 'api-integrations' THEN '/images/service-api.jpg'
  ELSE hero_background
END
WHERE visual_background = '';
