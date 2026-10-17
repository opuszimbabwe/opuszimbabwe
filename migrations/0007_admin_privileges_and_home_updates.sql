-- Migration 0007: Admin privileges for Partner tile backgrounds, Local Payments,
-- Why Choose Us cards, and Homepage section headings & white/warm section backgrounds.

ALTER TABLE partners ADD COLUMN bg_color TEXT NOT NULL DEFAULT '#ffffff';

UPDATE partners SET bg_color = '#000000' WHERE id = 'killing-giants';

INSERT INTO settings (key, value, updated_at) VALUES (
  'payment_methods',
  '[{"id":"ecocash","name":"EcoCash","logo":"/images/ecocash-logo.png","visible":true},{"id":"innbucks","name":"InnBucks","logo":"/images/innbucks-logo.svg","visible":true},{"id":"onemoney","name":"OneMoney","logo":"/images/onemoney-logo.svg","visible":true},{"id":"paynow","name":"Paynow","logo":"/images/paynow-logo.png","visible":true},{"id":"zipit","name":"ZIPIT","logo":"/images/zipit-logo.svg","visible":true}]',
  datetime('now')
) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;

INSERT INTO settings (key, value, updated_at) VALUES (
  'why_choose_us',
  '[{"title":"Fast Turnaround","body":"Most projects delivered faster than the industry standard without cutting corners on quality.","icon":""},{"title":"Affordable Pricing","body":"Professional digital services priced for Zimbabwean businesses and organisations, not international budgets.","icon":""},{"title":"Local Payments","body":"Pay with EcoCash, OneMoney, InnBucks, Zimswitch or ZIPIT. No USD card required.","icon":""},{"title":"Local Support","body":"Reach us on WhatsApp, phone, live chat or email. We pick up.","icon":""},{"title":"Support After Launch","body":"We don’t disappear after go-live. Your business keeps running and so do we.","icon":""},{"title":"Direct Communication","body":"You speak to the people doing the work, not a sales team or a ticketing system.","icon":""}]',
  datetime('now')
) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;

INSERT INTO settings (key, value, updated_at) VALUES (
  'home_sections',
  '{"hero_headline_main":"Your business is working hard.","hero_headline_accent":"The results should show it.","hero_bg":"#f8f8f6","payment_label":"We accept local payments","services_heading":"One team. Every digital capability your organisation needs.","services_bg":"#ffffff","partners_heading":"Partners who trust us","partners_subheading":"","partners_bg":"#f8f8f6","how_it_works_heading":"How it works.","how_it_works_bg":"#ffffff","projects_heading":"Live work. Real clients. Real results.","projects_bg":"#f8f8f6","why_heading":"Why choose us.","why_bg":"#ffffff","faq_heading":"Common questions.","faq_bg":"#f8f8f6","cta_heading":"Ready to get your business going?","cta_subheading":"Tell us what you need and we will take it from there.","cta_bg":"#ffffff"}',
  datetime('now')
) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
