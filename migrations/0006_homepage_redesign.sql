-- Homepage redesign migration:
-- 1. Add per-card bottom text section background colour (`card_bg_color`) to `services`
-- 2. Seed `hero_cycles` in `settings` (6 independently editable hero cycles)
-- 3. Update `approach_items` to the 5 How It Works steps (Understand -> Plan -> Build -> Review -> Launch & Support)
-- 4. Permanently remove ZimTrade Export Platform and Agricom Commodity Marketplace from `projects`

ALTER TABLE services ADD COLUMN card_bg_color TEXT NOT NULL DEFAULT '#ffffff';

DELETE FROM projects WHERE id IN ('zimtrade', 'agricom') OR status = 'coming_soon';

INSERT INTO settings (key, value, updated_at) VALUES (
  'hero_cycles',
  '[{"question":"Are you invisible online?","solution":"A professional website puts your business where your customers are already looking.","image":"/images/hero-website-design.png","href":"/services/web-design/"},{"question":"Are manual processes slowing you down?","solution":"We build systems that run your operations so your team focuses on what matters.","image":"/images/hero-software-systems.png","href":"/services/software-development/"},{"question":"Are you doing the same tasks every single day?","solution":"We automate repetitive work so your business keeps moving without everything depending on you.","image":"/images/hero-ai-automation.png","href":"/services/ai-automation/"},{"question":"Does your business look as professional as the service you provide?","solution":"We design brands that make customers trust you before they even speak to you.","image":"/images/hero-graphic-design.png","href":"/services/graphic-design/"},{"question":"Is your business still using a Gmail address?","solution":"A professional domain and business email tells customers you are serious about what you do.","image":"/images/hero-domains-hosting.png","href":"/services/domains-hosting/"},{"question":"Are your systems talking to each other or are you the one passing information between them?","solution":"We connect your platforms so data flows automatically and nothing falls through the gaps.","image":"/images/hero-api-integrations.png","href":"/services/api-integrations/"}]',
  datetime('now')
) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;

INSERT INTO settings (key, value, updated_at) VALUES (
  'approach_items',
  '[{"title":"Understand","body":"We take time to learn your business, your customers, and what you actually need before anything is built.","icon":"Globe"},{"title":"Plan","body":"We map out exactly what will be built, how long it will take, and what it will cost — no surprises.","icon":"Settings"},{"title":"Build","body":"We do the work. You stay updated throughout, not just at the end.","icon":"Bot"},{"title":"Review","body":"You check everything before it goes live. If something needs changing, we change it.","icon":"Link2"},{"title":"Launch & Support","body":"We go live and stay with you. If something breaks or needs updating, we are reachable.","icon":"TrendingUp"}]',
  datetime('now')
) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
