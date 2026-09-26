-- Seed content: identical to the built-in static fallback so the D1-backed
-- site renders the same as the static export on first deploy.

INSERT OR IGNORE INTO services (id, tagline, name, description, page_description, items, icon, gradient, slug, image, order_index, visible) VALUES
(
  'web-design',
  'Online Presence',
  'Website Design & Development',
  'Your website is often the first thing a customer sees. We build websites that represent your business professionally, load fast, work on every device, and are ready from day one.',
  'We design and develop professional websites for businesses, NGOs, schools, churches and organisations across Zimbabwe — built to be fast, credible and ready to grow with you.',
  '["Business Websites","E-Commerce","Landing Pages","School Websites","NGO & Church Sites","Website Redesign","Website Maintenance"]',
  'Globe',
  '160deg,#1a1a1a,#454545',
  'web-design',
  '/images/service-web-design.png',
  0,
  1
),
(
  'software-development',
  'Business Systems',
  'Software & Systems',
  'Manual processes slow businesses down. We build management systems, platforms and tools that bring your operations into one organised digital environment — built around how your organisation actually works.',
  'We build custom management systems, platforms and business tools that bring your operations into one organised digital environment — built around the way your organisation actually works.',
  '["School Management Systems","Inventory Systems","POS Systems","CRM Systems","Booking Systems","HR Systems","Custom Enterprise Systems"]',
  'LayoutDashboard',
  '160deg,#1a1a1a,#454545',
  'software-development',
  '/images/service-software.jpg',
  1,
  1
),
(
  'ai-automation',
  'AI & Automation',
  'AI & Automation',
  'Repetitive tasks are costing you time and money. We build practical AI tools and automated workflows — from WhatsApp chatbots to full business automation — that work quietly in the background so your team doesn''t have to.',
  'We build practical AI tools and automated workflows that reduce repetitive work and help your organisation operate more efficiently — grounded in what your business actually needs.',
  '["AI Chatbots","WhatsApp Chatbots","Workflow Automation","Customer Support AI","AI Document Processing","Full Business AI"]',
  'Bot',
  '160deg,#1a1a1a,#454545',
  'ai-automation',
  '/images/service-ai.jpg',
  2,
  1
),
(
  'graphic-design',
  'Brand & Design',
  'Graphic Design & Branding',
  'Credibility starts with how you look. We design logos, flyers, social media graphics, brochures and marketing materials that make your business look as professional as the service you provide.',
  'We design logos, marketing materials and visual identities that make your business look credible, consistent and ready to compete — across digital and print platforms.',
  '["Logo Design","Flyer & Poster Design","Brochure Design","Business Cards","Social Media Graphics","Video Advertisements","Banners & Signage"]',
  'Palette',
  '160deg,#E85D2A,#F4A226',
  'graphic-design',
  '/images/service-graphic.png',
  3,
  1
),
(
  'domains-hosting',
  'Domains & Hosting',
  'Domain & Hosting',
  'A professional domain, reliable hosting and a business email address are the foundation of any credible digital presence. We handle the setup and keep everything running.',
  'We register domains, set up reliable hosting and configure professional business email — the digital infrastructure every serious organisation needs, configured correctly from the start.',
  '[".co.zw Domains",".com Domains","Web Hosting","Business Email Hosting","SSL Certificates","DNS Configuration","Website Migration"]',
  'Server',
  '160deg,#454545,#6b7280',
  'domains-hosting',
  '/images/service-hosting.png',
  4,
  1
),
(
  'api-integrations',
  'Integrations',
  'API & Integrations',
  'Your website, payment system, CRM and communication tools should not operate in silos. We connect your platforms so data flows between them, reducing manual work and improving how your business runs.',
  'We connect your website, software, payment platforms and third-party tools so your digital systems work as one joined-up environment instead of a collection of disconnected parts.',
  '["Paynow Integration","EcoCash Integration","Stripe Integration","WhatsApp Business API","Google APIs","CRM Integrations","Custom Multi-System Integration"]',
  'Plug',
  '160deg,#1a1a1a,#6b7280',
  'api-integrations',
  '/images/service-api.jpg',
  5,
  1
);

INSERT OR IGNORE INTO pricing_cards (id, name, monthly_price, yearly_price, features, order_index, visible) VALUES
(
  'starter',
  'Starter',
  '$30',
  '$25/mo',
  '["Up to 5 pages","Mobile responsive","Contact form","Basic SEO setup","SSL certificate","3-7 day delivery"]',
  0,
  1
),
(
  'professional',
  'Professional',
  '$60',
  '$50/mo',
  '["Up to 10 pages","Mobile responsive","Contact & enquiry forms","Full SEO optimisation","SSL certificate","WhatsApp integration","1-2 week delivery"]',
  1,
  1
),
(
  'custom',
  'Custom',
  'Let''s talk',
  'Let''s talk',
  '["Unlimited pages","Custom functionality","E-commerce or booking","API integrations","Ongoing support included","Custom timeline"]',
  2,
  1
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('hero_background', '/images/hero-bg.jpg');
