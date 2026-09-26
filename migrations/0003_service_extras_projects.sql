-- Service page heroes / Why Opus / related links, plus the projects table.
--
-- Additive and safe to apply on top of existing production data: it only
-- creates new tables and inserts rows that are not already present
-- (INSERT OR IGNORE), so nothing that exists today is modified or removed.

-- Per-service page content: full-bleed hero (image or gradient background),
-- the "Why Opus Zimbabwe?" cards and the "Related services" links.
CREATE TABLE IF NOT EXISTS service_extras (
  service_id TEXT PRIMARY KEY NOT NULL,
  hero_eyebrow TEXT NOT NULL DEFAULT '',
  hero_headline TEXT NOT NULL DEFAULT '',
  hero_intro TEXT NOT NULL DEFAULT '',
  hero_cta TEXT NOT NULL DEFAULT '',
  hero_background TEXT NOT NULL DEFAULT '',
  hero_background_kind TEXT NOT NULL DEFAULT 'image', -- 'image' | 'gradient'
  hero_gradient TEXT NOT NULL DEFAULT '160deg,#1a1a1a,#454545',
  why_items TEXT NOT NULL DEFAULT '[]',
  related_items TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Client projects. status: 'active' (renders as a link) or
-- 'coming_soon' (renders as a badge, no link).
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  tag TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  order_index INTEGER NOT NULL DEFAULT 0,
  visible INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_projects_order ON projects (order_index);

-- ---------------------------------------------------------------------------
-- Seed: service heroes, Why Opus cards and related links.
-- Mirrors the content baked into the static service pages so the D1-backed
-- site renders identically on first deploy.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO service_extras (
  service_id, hero_eyebrow, hero_headline, hero_intro, hero_cta,
  hero_background, hero_background_kind, hero_gradient, why_items, related_items
) VALUES
(
  'web-design',
  'Website Design & Development',
  'A website that represents your business the way it deserves to be represented.',
  'We design and develop professional websites for businesses, NGOs, schools, churches and organisations across Zimbabwe — built to be fast, credible and ready to grow with you.',
  'View Packages',
  '/images/hero-website-design.png',
  'image',
  '160deg,#1a1a1a,#454545',
  '[{"title":"Fast turnaround","body":"Starter websites in 3–7 working days. Larger projects are scoped before work begins."},{"title":"No outsourcing","body":"Every project is handled directly by our team."},{"title":"Support after launch","body":"Ongoing maintenance and support available from $10/month."},{"title":"Local payment methods","body":"EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted."}]',
  '[{"label":"AI Solutions & Automation","href":"/services/ai-automation"},{"label":"Graphic Design & Branding","href":"/services/graphic-design"},{"label":"Domain & Hosting","href":"/services/domains-hosting"},{"label":"API & Integrations","href":"/services/api-integrations"}]'
),
(
  'software-development',
  'Software & System Development',
  'Stop managing your business on paper and WhatsApp groups.',
  'We build custom management systems, platforms and business tools that bring your operations into one organised digital environment — built around the way your organisation actually works.',
  'Discuss Your System',
  '/images/hero-software-systems.png',
  'image',
  '160deg,#1a1a1a,#454545',
  '[{"title":"Built around your workflow","body":"Systems designed from your real processes, not adapted from another organisation."},{"title":"No outsourcing","body":"Every project is handled directly by our team."},{"title":"Support after launch","body":"Ongoing maintenance and support available from $10/month."},{"title":"Local payment methods","body":"EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted."}]',
  '[{"label":"Website Design & Development","href":"/services/web-design"},{"label":"AI Solutions & Automation","href":"/services/ai-automation"},{"label":"API & Integrations","href":"/services/api-integrations"},{"label":"Domain & Hosting","href":"/services/domains-hosting"}]'
),
(
  'ai-automation',
  'AI Solutions & Automation',
  'Your business should not be paying people to do what a system can do automatically.',
  'We build practical AI tools and automated workflows that reduce repetitive work, improve how you respond to customers, and free your team to focus on what actually requires human attention.',
  'Explore AI Solutions',
  '/images/hero-ai-automation.png',
  'image',
  '160deg,#1a1a1a,#454545',
  '[{"title":"Practical, not theoretical","body":"We automate processes that already cost you time — nothing speculative."},{"title":"No outsourcing","body":"Every project is handled directly by our team."},{"title":"Support after launch","body":"Ongoing maintenance and support available from $10/month."},{"title":"Local payment methods","body":"EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted."}]',
  '[{"label":"Website Design & Development","href":"/services/web-design"},{"label":"Software & Systems","href":"/services/software-development"},{"label":"API & Integrations","href":"/services/api-integrations"},{"label":"Domain & Hosting","href":"/services/domains-hosting"}]'
),
(
  'graphic-design',
  'Graphic Design & Branding',
  'Look as professional as the service you provide.',
  'We design logos, marketing materials and visual identities that make your business look credible, consistent and ready to compete.',
  'Start a Design Project',
  '/images/hero-graphic-design.png',
  'image',
  '160deg,#E85D2A,#F4A226',
  '[{"title":"Fast turnaround","body":"First concepts delivered quickly, with revisions included."},{"title":"Every format you need","body":"Print and digital files supplied ready to use."},{"title":"No outsourcing","body":"Every project is handled directly by our team."},{"title":"Local payment methods","body":"EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted."}]',
  '[{"label":"Website Design & Development","href":"/services/web-design"},{"label":"Domain & Hosting","href":"/services/domains-hosting"},{"label":"AI Solutions & Automation","href":"/services/ai-automation"},{"label":"Software & Systems","href":"/services/software-development"}]'
),
(
  'domains-hosting',
  'Domain Registration & Web Hosting',
  'Your domain. Your email. Your business, online and credible.',
  'We register domains, set up reliable hosting and configure professional business email — the digital infrastructure every serious organisation needs.',
  'Register a Domain',
  '/images/hero-domains-hosting.png',
  'image',
  '160deg,#454545,#6b7280',
  '[{"title":"Configured correctly","body":"Domains, DNS, hosting and email set up properly from day one."},{"title":"You keep ownership","body":"Everything is registered in your name, not ours."},{"title":"Support after launch","body":"Ongoing assistance and renewals handled with you."},{"title":"Local payment methods","body":"EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted."}]',
  '[{"label":"Website Design & Development","href":"/services/web-design"},{"label":"Business Email & Hosting","href":"/domains"},{"label":"API & Integrations","href":"/services/api-integrations"},{"label":"Graphic Design & Branding","href":"/services/graphic-design"}]'
),
(
  'api-integrations',
  'API & System Integrations',
  'Your platforms should talk to each other — so your team does not have to.',
  'We connect your website, software, payment systems and third-party platforms so your digital tools work as one joined-up system instead of a collection of disconnected parts.',
  'Discuss Your Integration',
  '/images/hero-api-integrations.png',
  'image',
  '160deg,#1a1a1a,#6b7280',
  '[{"title":"Less manual work","body":"Data flows between your platforms automatically."},{"title":"Fewer errors","body":"No more re-capturing the same information twice."},{"title":"Support after launch","body":"Ongoing monitoring and maintenance available."},{"title":"Local payment methods","body":"EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted."}]',
  '[{"label":"Website Design & Development","href":"/services/web-design"},{"label":"Software & Systems","href":"/services/software-development"},{"label":"AI Solutions & Automation","href":"/services/ai-automation"},{"label":"Domain & Hosting","href":"/services/domains-hosting"}]'
);

-- ---------------------------------------------------------------------------
-- Seed: projects.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO projects (id, name, url, tag, location, description, status, order_index, visible) VALUES
(
  'great-couples',
  'Great Couples International Trust',
  'https://greatcouples.org.zw',
  'Website Design & Development',
  'Zimbabwe / International',
  'A full website for an international trust focused on strengthening marriages and families across Africa. Includes service pages, event information, contact integration and WhatsApp support.',
  'active',
  0,
  1
),
(
  'prime-pidg',
  'Prime Property Investment & Development Group',
  'https://primepidg.co.zw',
  'Website Design & Development',
  'Harare, Zimbabwe',
  'A corporate website for a Zimbabwean property investment and development company. Built to establish credibility, present their portfolio and generate professional enquiries.',
  'active',
  1,
  1
),
(
  'zimtrade',
  'ZimTrade Export Platform',
  '',
  'Software & Systems',
  'Harare, Zimbabwe',
  'An export-intelligence platform for Zimbabwean producers: company directory, market briefings and enquiry routing in one system.',
  'coming_soon',
  2,
  1
),
(
  'agricom',
  'Agricom Commodity Marketplace',
  '',
  'Software & Systems',
  'Harare, Zimbabwe',
  'A commodity marketplace connecting Zimbabwean farmers to buyers, with live pricing, listings and order tracking.',
  'coming_soon',
  3,
  1
);

-- ---------------------------------------------------------------------------
-- Seed: branding, home sections and FAQ lists.
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO settings (key, value) VALUES
('navbar_logo', '/images/logo.png'),
('manifest_icon', '/images/icon-512.png'),
('footer_socials', '[{"label":"Facebook","href":"https://www.facebook.com/opuszim","icon":"Facebook"},{"label":"Instagram","href":"https://www.instagram.com/opuszimbabwe","icon":"Instagram"},{"label":"LinkedIn","href":"https://www.linkedin.com/in/opuszimbabwe","icon":"Linkedin"},{"label":"X","href":"https://x.com/OpusZimbabwe","icon":"Twitter"},{"label":"WhatsApp","href":"https://wa.me/263773979162","icon":"MessageCircle"}]'),
('contact_cards', '[{"title":"WhatsApp","line":"+263 776 396 530","note":"Usually within the hour","href":"https://wa.me/263776396530","icon":"MessageCircle"},{"title":"Email","line":"info.opuszim@gmail.com","note":"Within 1 business day","href":"mailto:info.opuszim@gmail.com","icon":"Mail"},{"title":"Call Us","line":"0776 396 530","note":"0773 979 162","href":"tel:+263776396530","icon":"Phone"}]'),
('faq_home', '[{"q":"How do I pay for a project?","a":"You can use EcoCash, OneMoney, InnBucks, Zimswitch and other supported Zimbabwean payment methods."},{"q":"How long does a project take?","a":"Timing depends on the scope. We confirm a delivery plan after understanding your requirements."},{"q":"Do you provide domains, hosting and business email?","a":"Yes. Domain registration, hosting and professional business email are available through Opus Zimbabwe."}]'),
('faq_page', '[{"q":"How much does a website cost?","a":"Starter websites begin at $30. Standard packages start at $60. Business packages start at $100. Pricing depends on the number of pages, features and complexity required. Custom projects are quoted after a brief consultation — no obligation to proceed."},{"q":"How long does a project take?","a":"Starter websites are typically delivered in 3 to 7 working days. Standard builds take 1 to 2 weeks. Business and Professional packages take 2 to 4 weeks. Software systems and custom projects are scoped individually. We confirm a timeline before any work begins."},{"q":"Do you handle domains, hosting and business email?","a":"Yes. We register domains across all major extensions including .co.zw, .com, .org and others. We also set up web hosting, SSL certificates and professional business email. Everything is configured correctly from the start."},{"q":"What happens after my project is delivered?","a":"Every project includes a handover and a period of post-launch support. Ongoing maintenance, updates and technical support are available from $10 per month. You will never be left managing a website or system alone."},{"q":"My project does not fit a package — can you still help?","a":"Yes. If your requirements are more specific or complex than our packages cover, contact us and we will scope and quote a custom solution for you directly."},{"q":"How do I pay for a project?","a":"We accept EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT. No foreign currency is required. Payment schedules for larger projects are agreed upfront."},{"q":"Do you work with small businesses and startups?","a":"Yes — this is exactly who we are built for. We work with individuals, small businesses, NGOs, schools and churches that need professional digital work at a price that makes sense for where they are right now."},{"q":"What is OpusEdu?","a":"OpusEdu is our dedicated school management platform, purpose-built for Zimbabwean schools. It covers admissions, fees, timetables, results and communication in one system."}]'),
('approach_items', '[{"title":"Get Online","body":"Build the digital presence your customers can find.","icon":"Globe"},{"title":"Operate Better","body":"Replace repetitive manual processes.","icon":"Settings"},{"title":"Automate","body":"Let technology handle repetitive tasks.","icon":"Bot"},{"title":"Connect","body":"Integrate the platforms you already use.","icon":"Link2"},{"title":"Grow","body":"Build a foundation that expands with you.","icon":"TrendingUp"}]'),
('built_for_zimbabwe', '{"eyebrow":"Built for Zimbabwe","heading":"Professional digital services that understand your market, your clients, and your budget.","body":"Most digital agencies in Zimbabwe either overcharge or underdeliver. Opus Zimbabwe was built to close that gap — corporate quality, local understanding, and a team that is reachable when you need them.","image":"/images/hero-digital-solutions.png"}');
