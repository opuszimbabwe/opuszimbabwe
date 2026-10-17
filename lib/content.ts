// Site content model + built-in static fallback content.
// The public site always renders these values first (static export);
// when the Cloudflare Pages Functions API (/api/content) is reachable,
// client components upgrade to the D1-backed values.

export type ServiceRecord = {
  id: string;
  tagline: string;
  name: string;
  description: string; // home Services card copy
  page_description: string; // /services list copy
  items: string[];
  icon: string;
  gradient: string;
  card_bg_color: string; // admin-controlled bottom text section background colour
  slug: string;
  image: string;
  order_index: number;
  visible: boolean;
};

export type HeroCycle = {
  question: string;
  solution: string;
  image: string;
  href: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  logo: string;
  visible: boolean;
};

export type WhyItem = { title: string; body: string; icon?: string };
export type RelatedItem = { label: string; href: string };

export type ServiceToolItem = {
  name: string;
  logo: string;
};

export type DomainPriceItem = {
  extension: string;
  price: string;
  registration_time: string;
};

export type EmailPlanItem = {
  plan: string;
  price: string;
  mailboxes: string;
};

export type ServicePageDetails = {
  service_id: string;
  problem_text: string;
  what_heading: string;
  what_intro: string;
  what_items: WhyItem[];
  price_range: string;
  price_summary: string;
  price_note: string;
  hosting_price?: string;
  domain_prices?: DomainPriceItem[];
  email_plans?: EmailPlanItem[];
  process_steps: WhyItem[];
  tools_items: ServiceToolItem[];
  tools_note: string;
  cta_heading: string;
  cta_body: string;
  cta_button: string;
  cta_url: string;
};

// Per-service page content: full-bleed hero (image or gradient background),
// "Why Opus Zimbabwe?" cards and "Related services" links.
export type ServiceExtras = {
  service_id: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_intro: string;
  hero_cta: string;
  hero_background: string;
  visual_background: string;
  hero_background_kind: 'image' | 'gradient';
  hero_gradient: string;
  why_items: WhyItem[];
  related_items: RelatedItem[];
};

export type ProjectRecord = {
  id: string;
  name: string;
  url: string;
  tag: string;
  location: string;
  description: string;
  /** Admin-uploaded screenshot of the live project (may be empty). */
  screenshot: string;
  status: 'active' | 'coming_soon';
  order_index: number;
  visible: boolean;
};

// Trusted partner ("Partners who trust us" logo row on the home page).
// `url` is optional — without it the logo renders unlinked.
// `bg_color` is admin-controlled per partner (e.g. `#000000` for Killing Giants).
export type PartnerRecord = {
  id: string;
  name: string;
  logo: string;
  url: string;
  bg_color: string;
  order_index: number;
  visible: boolean;
};

export type PricingRecord = {
  id: string;
  name: string;
  monthly_price: string; // Price / Price Range (e.g. "$30 – $59.99")
  yearly_price: string; // What it covers / summary (e.g. "Entry website with hosting from $10/month")
  features: string[];
  order_index: number;
  visible: boolean;
};

export type FaqItem = { q: string; a: string };
export type ApproachItem = { title: string; body: string; icon: string };
export type SocialLink = { label: string; href: string; icon: string };
export type ContactCard = { title: string; line: string; note: string; href: string; icon: string };
export type BuiltForZimbabwe = { eyebrow: string; heading: string; body: string; image: string };

export type HomeSectionsConfig = {
  hero_headline_main: string;
  hero_headline_accent: string;
  hero_bg: string;
  payment_label: string;
  services_heading: string;
  services_bg: string;
  partners_heading: string;
  partners_subheading: string;
  partners_bg: string;
  how_it_works_heading: string;
  how_it_works_bg: string;
  projects_heading: string;
  projects_bg: string;
  why_heading: string;
  why_bg: string;
  faq_heading: string;
  faq_bg: string;
  cta_heading: string;
  cta_subheading: string;
  cta_bg: string;
};

export type SiteSettings = {
  hero_background: string;
  hero_cycles: HeroCycle[];
  payment_methods: PaymentMethod[];
  home_sections: HomeSectionsConfig;
  why_choose_us: WhyItem[];
  service_pages: Record<string, ServicePageDetails>;
  navbar_logo: string;
  favicon_icon: string;
  browser_title: string;
  manifest_icon: string;
  footer_socials: SocialLink[];
  contact_cards: ContactCard[];
  faq_home: FaqItem[];
  faq_page: FaqItem[];
  approach_items: ApproachItem[];
  built_for_zimbabwe: BuiltForZimbabwe;
};

export type SiteContent = {
  services: ServiceRecord[];
  pricing: PricingRecord[];
  projects: ProjectRecord[];
  partners: PartnerRecord[];
  extras: Record<string, ServiceExtras>;
  settings: SiteSettings;
};

// Default 6 rotating hero cycles from the Homepage Redesign Brief.
export const DEFAULT_HERO_CYCLES: HeroCycle[] = [
  {
    question: 'Still losing customers who search for you online and find nothing?',
    solution:
      'We build fast, credible websites for Zimbabwean businesses, NGOs, schools and churches — ready from day one.',
    image: '/images/hero-website-design.png',
    href: '/services/web-design/',
  },
  {
    question: 'Still running your business on spreadsheets and WhatsApp groups?',
    solution:
      'We build custom systems — school management, inventory, POS, CRM, booking and HR — around how you actually work.',
    image: '/images/hero-software-systems.png',
    href: '/services/software-development/',
  },
  {
    question: 'Still paying staff to do work a system could handle automatically?',
    solution:
      'We build WhatsApp chatbots, customer support AI and automated workflows that run quietly in the background.',
    image: '/images/hero-ai-automation.png',
    href: '/services/ai-automation/',
  },
  {
    question: 'Does your brand look as serious as the work you actually do?',
    solution:
      'We design logos, flyers, brochures, business cards and social graphics that make your business look the part.',
    image: '/images/hero-graphic-design.png',
    href: '/services/graphic-design/',
  },
  {
    question: 'Still sending business emails from a Gmail address?',
    solution:
      'We register your .co.zw domain, set up reliable hosting and give your team professional email addresses.',
    image: '/images/hero-domains-hosting.png',
    href: '/services/domains-hosting/',
  },
  {
    question: 'Are your payment system, website and WhatsApp still not talking to each other?',
    solution:
      'We connect EcoCash, Paynow, your CRM, WhatsApp and Google into one joined-up system with no manual copying.',
    image: '/images/hero-api-integrations.png',
    href: '/services/api-integrations/',
  },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'ecocash', name: 'EcoCash', logo: '/images/ecocash-logo.png', visible: true },
  { id: 'innbucks', name: 'InnBucks', logo: '/images/innbucks-logo.svg', visible: true },
  { id: 'onemoney', name: 'OneMoney', logo: '/images/onemoney-logo.svg', visible: true },
  { id: 'paynow', name: 'Paynow', logo: '/images/paynow-logo.png', visible: true },
  { id: 'zipit', name: 'ZIPIT', logo: '/images/zipit-logo.svg', visible: true },
];

export const DEFAULT_WHY_CHOOSE_US: WhyItem[] = [
  {
    title: 'Fast Turnaround',
    body: 'Most projects delivered faster than the industry standard without cutting corners on quality.',
    icon: '',
  },
  {
    title: 'Affordable Pricing',
    body: 'Professional digital services priced for Zimbabwean businesses and organisations, not international budgets.',
    icon: '',
  },
  {
    title: 'Local Payments',
    body: 'Pay with EcoCash, OneMoney, InnBucks, Zimswitch or ZIPIT. No USD card required.',
    icon: '',
  },
  {
    title: 'Local Support',
    body: 'Reach us on WhatsApp, phone, live chat or email. We pick up.',
    icon: '',
  },
  {
    title: 'Support After Launch',
    body: 'We don’t disappear after go-live. Your business keeps running and so do we.',
    icon: '',
  },
  {
    title: 'Direct Communication',
    body: 'You speak to the people doing the work, not a sales team or a ticketing system.',
    icon: '',
  },
];

export const DEFAULT_HOME_SECTIONS: HomeSectionsConfig = {
  hero_headline_main: 'Your business is working hard.',
  hero_headline_accent: 'The results should show it.',
  hero_bg: '#f8f8f6',
  payment_label: 'We accept local payments',
  services_heading: 'One team. Every digital capability your organisation needs.',
  services_bg: '#ffffff',
  partners_heading: 'Partners who trust us',
  partners_subheading: 'Trusted by businesses, NGOs, and institutions across Zimbabwe.',
  partners_bg: '#f8f8f6',
  how_it_works_heading: 'How we take your project from idea to launch.',
  how_it_works_bg: '#ffffff',
  projects_heading: 'Live work we have delivered.',
  projects_bg: '#f8f8f6',
  why_heading: 'Why choose us.',
  why_bg: '#ffffff',
  faq_heading: 'Common questions.',
  faq_bg: '#f8f8f6',
  cta_heading: 'Ready to get your business going?',
  cta_subheading: 'Tell us what you need and we will take it from there.',
  cta_bg: '#ffffff',
};

// Full individual service pages copy (Sections 1–6) — editable by admin in /admin.
export const DEFAULT_SERVICE_PAGES: Record<string, ServicePageDetails> = {
  'web-design': {
    service_id: 'web-design',
    problem_text:
      'Most Zimbabwean businesses are invisible online. Your customers are searching for what you sell right now. If you do not have a professional website, they are finding your competitor instead.',
    what_heading: 'What we build',
    what_intro:
      'We build websites that work. Not just visually — but technically, commercially and practically for the Zimbabwean market.',
    what_items: [
      {
        title: 'Business websites',
        body: 'Professional, fast and credible. Built to represent your business and convert visitors into customers.',
      },
      {
        title: 'E-commerce stores',
        body: 'Sell online with local payment integration. EcoCash, InnBucks, Paynow and more — built in from day one.',
      },
      {
        title: 'Landing pages',
        body: 'Single-purpose pages designed to capture leads, promote a service or drive one specific action.',
      },
      {
        title: 'School websites',
        body: 'Built for Zimbabwean educational institutions. Timetables, notices, staff pages and parent communication.',
      },
      {
        title: 'NGO & church sites',
        body: 'Professional digital presence for organisations, ministries and charities across Zimbabwe.',
      },
      {
        title: 'Website redesigns',
        body: 'If your current site is outdated, slow or not converting, we rebuild it properly.',
      },
      {
        title: 'Website maintenance',
        body: 'Ongoing updates, security and performance so your site never falls behind.',
      },
    ],
    price_range: '$30 – $1,000+',
    price_summary: 'Packages from $30 up to custom enterprise scope.',
    price_note: 'Hosting from $10/month. Every package includes mobile responsiveness, SSL security and local support.',
    process_steps: [
      { title: 'Brief', body: 'You tell us what you need. We ask the right questions.' },
      { title: 'Design', body: 'We design your site and show you before we build anything.' },
      { title: 'Build', body: 'We build it exactly as approved. You stay updated throughout.' },
      { title: 'Review', body: 'You check everything. We fix anything that needs changing.' },
      { title: 'Launch', body: 'We go live. We stay available after launch for support.' },
    ],
    tools_items: [
      { name: 'Next.js', logo: '/images/tools/nextjs.svg' },
      { name: 'WordPress', logo: '/images/tools/wordpress.svg' },
      { name: 'PHP', logo: '/images/tools/php.svg' },
      { name: 'Tailwind', logo: '/images/tools/tailwind.svg' },
    ],
    tools_note: 'and more depending on your requirements.',
    cta_heading: 'Ready to get your business online?',
    cta_body: 'Tell us what you need and we will come back to you with a clear plan and a quote.',
    cta_button: 'Talk to us on WhatsApp',
    cta_url: 'https://wa.me/263710740387',
  },
  'software-development': {
    service_id: 'software-development',
    problem_text:
      'Manual processes are costing your organisation time and money every single day. Spreadsheets break. WhatsApp threads get lost. Staff repeat the same tasks manually. We build the systems that fix this permanently.',
    what_heading: 'What we build',
    what_intro: '',
    what_items: [
      {
        title: 'School management systems',
        body: 'Admissions, fees, timetables, results, staff and parent communication in one platform.',
      },
      {
        title: 'Inventory systems',
        body: 'Track stock, manage suppliers and get alerts before you run out — in real time.',
      },
      {
        title: 'POS systems',
        body: 'Point of sale built for Zimbabwean businesses. Local payment methods included.',
      },
      {
        title: 'CRM systems',
        body: 'Manage your customers, leads and follow-ups in one place so nothing falls through.',
      },
      {
        title: 'Booking systems',
        body: 'Let customers book appointments, slots or services online — automatically confirmed.',
      },
      {
        title: 'HR systems',
        body: 'Staff records, leave management, payroll tracking and performance in one organised system.',
      },
      {
        title: 'Custom enterprise systems',
        body: 'If your requirement does not fit a category, we scope and build it from scratch.',
      },
    ],
    price_range: 'Starting from $100',
    price_summary: 'Quoted by scope after a brief consultation.',
    price_note: 'Every project gets a fixed quote before we start. No surprises mid-build.',
    process_steps: [
      {
        title: 'Understand',
        body: 'We learn exactly how your organisation operates before writing a single line of code.',
      },
      {
        title: 'Plan',
        body: 'We map out the full system, get your approval on the scope and confirm the price.',
      },
      {
        title: 'Build',
        body: 'We build in stages so you can see progress throughout, not just at the end.',
      },
      {
        title: 'Review',
        body: 'You test everything. We fix, adjust and refine until it is right.',
      },
      {
        title: 'Launch & Support',
        body: 'We deploy, train your team and stay available for ongoing support.',
      },
    ],
    tools_items: [
      { name: 'Python', logo: '/images/tools/python.svg' },
      { name: 'Java', logo: '/images/tools/java.svg' },
      { name: 'PHP', logo: '/images/tools/php.svg' },
      { name: 'Supabase', logo: '/images/tools/supabase.svg' },
      { name: 'VB.NET', logo: '/images/tools/vbnet.svg' },
      { name: 'XAMPP', logo: '/images/tools/xampp.svg' },
    ],
    tools_note: 'and more depending on your requirements.',
    cta_heading: 'Ready to replace manual processes with something that actually works?',
    cta_body:
      'Tell us what your organisation needs and we will come back to you with a clear scope and a fixed quote.',
    cta_button: 'Talk to us on WhatsApp',
    cta_url: 'https://wa.me/263710740387',
  },
  'ai-automation': {
    service_id: 'ai-automation',
    problem_text:
      'If your team is answering the same customer questions every day, chasing the same follow-ups, capturing the same data manually — that is time and money leaving your business every single hour. Automation fixes this permanently.',
    what_heading: 'What we build',
    what_intro: '',
    what_items: [
      {
        title: 'WhatsApp chatbots',
        body: 'Automated responses, lead capture and customer support on the platform your customers already use.',
      },
      {
        title: 'Customer support AI',
        body: 'Handle common enquiries, booking confirmations and follow-ups automatically — 24 hours a day.',
      },
      {
        title: 'Workflow automation',
        body: 'Connect your tools so information moves between them without anyone doing it manually.',
      },
      {
        title: 'AI document processing',
        body: 'Extract, sort and organise information from documents automatically.',
      },
      {
        title: 'Full business AI',
        body: 'End-to-end automation of a business process — from trigger to outcome with no manual steps.',
      },
    ],
    price_range: 'Starting from $50',
    price_summary: 'Quoted by scope after a brief consultation.',
    price_note: 'Every automation project is scoped individually. We tell you exactly what it will cost before we start.',
    process_steps: [
      {
        title: 'Understand',
        body: 'We identify exactly which processes are costing your team the most time.',
      },
      {
        title: 'Plan',
        body: 'We design the automation and show you how it will work before we build it.',
      },
      {
        title: 'Build',
        body: 'We build, connect and test everything until it runs without errors.',
      },
      {
        title: 'Review',
        body: 'You run it in a real environment. We adjust until it works exactly as needed.',
      },
      {
        title: 'Launch & Support',
        body: 'We hand over with full training and stay available for changes.',
      },
    ],
    tools_items: [
      { name: 'Zapier', logo: '/images/tools/zapier.svg' },
      { name: 'Make', logo: '/images/tools/make.svg' },
      { name: 'n8n', logo: '/images/tools/n8n.svg' },
      { name: 'WhatsApp Business API', logo: '/images/tools/whatsapp.svg' },
    ],
    tools_note: 'and more depending on your requirements.',
    cta_heading: 'Want to see what automation could do for your business?',
    cta_body:
      'Tell us which processes are slowing you down and we will show you exactly how we would automate them.',
    cta_button: 'Talk to us on WhatsApp',
    cta_url: 'https://wa.me/263710740387',
  },
  'graphic-design': {
    service_id: 'graphic-design',
    problem_text:
      'Customers decide whether to trust a business within seconds of seeing it. An inconsistent logo, an amateur flyer or a poorly designed social media page tells your customer that your business is not serious — before they have read a single word.',
    what_heading: 'What we design',
    what_intro: '',
    what_items: [
      {
        title: 'Logos & visual identity',
        body: 'A logo that represents your business accurately and looks credible at every size and on every surface.',
      },
      {
        title: 'Flyers & posters',
        body: 'Print and digital marketing materials designed to capture attention and communicate clearly.',
      },
      {
        title: 'Brochures',
        body: 'Multi-page company profiles, product catalogues and service brochures designed for professional use.',
      },
      {
        title: 'Business cards',
        body: 'Cards that leave an impression and give the right information in the right way.',
      },
      {
        title: 'Social media graphics',
        body: 'Consistent, on-brand visuals for your social media presence across all platforms.',
      },
      {
        title: 'Video advertisements',
        body: 'Short promotional videos for social media, WhatsApp and digital advertising.',
      },
      {
        title: 'Banners & signage',
        body: 'Large format designs for physical locations, events and outdoor advertising.',
      },
    ],
    price_range: 'Starting from $5 per job',
    price_summary: 'Quoted based on the scope and volume of work required.',
    price_note: 'We give you a clear price before we start. No surprises.',
    process_steps: [
      {
        title: 'Brief',
        body: 'You tell us what you need and share any existing brand assets or references.',
      },
      {
        title: 'Concept',
        body: 'We design initial concepts and present them for your feedback.',
      },
      {
        title: 'Refine',
        body: 'We adjust until the result is exactly right.',
      },
      {
        title: 'Deliver',
        body: 'You receive all final files in every format you need — print-ready and digital.',
      },
    ],
    tools_items: [
      { name: 'Adobe Illustrator', logo: '/images/tools/illustrator.svg' },
      { name: 'Photoshop', logo: '/images/tools/photoshop.svg' },
      { name: 'Photopea', logo: '/images/tools/photopea.svg' },
      { name: 'Canva', logo: '/images/tools/canva.svg' },
    ],
    tools_note: 'and more depending on your requirements.',
    cta_heading: 'Ready to make your business look the part?',
    cta_body: 'Send us a message and tell us what you need. We will come back to you with a quote and a timeline.',
    cta_button: 'Talk to us on WhatsApp',
    cta_url: 'https://wa.me/263710740387',
  },
  'domains-hosting': {
    service_id: 'domains-hosting',
    problem_text:
      'A business still using a Gmail address or operating without a professional domain tells every customer it is not fully serious. The foundation of your digital presence costs less than most people think — and we set it up so you never have to think about it again.',
    what_heading: 'What we provide',
    what_intro: '',
    what_items: [
      {
        title: '.co.zw and local domains',
        body: 'Registered within 24 hours. You own the domain. We manage everything else.',
      },
      {
        title: '.com, .net, .org domains',
        body: 'International extensions registered and active typically within minutes.',
      },
      {
        title: 'Web hosting',
        body: 'Enterprise-grade infrastructure. Fast, secure and reliable. Your site stays online.',
      },
      {
        title: 'Business email hosting',
        body: 'Professional email addresses on your own domain for your entire team.',
      },
      {
        title: 'SSL certificates',
        body: 'Your site secured and trusted by every browser.',
      },
      {
        title: 'DNS configuration',
        body: 'Everything configured correctly so your domain, hosting and email all work together.',
      },
      {
        title: 'Website migration',
        body: 'Moving from another provider? We handle the transfer without downtime.',
      },
    ],
    price_range: 'Domains from $5/year · Hosting from $10/month',
    price_summary: 'Full domain registration, web hosting and business email packages.',
    price_note: 'You own every domain registered in your name.',
    hosting_price: 'from $10/month',
    domain_prices: [
      { extension: '.co.zw', price: '$5/year', registration_time: 'Within 24 hours' },
      { extension: '.org.zw', price: '$6/year', registration_time: '1–3 working days' },
      { extension: '.ac.zw', price: '$6/year', registration_time: '1–3 working days' },
      { extension: '.com', price: '$15/year', registration_time: 'Typically within minutes' },
      { extension: '.net', price: '$20/year', registration_time: 'Typically within minutes' },
      { extension: '.org', price: '$15/year', registration_time: 'Typically within minutes' },
    ],
    email_plans: [
      { plan: 'Essential', price: '$20/month', mailboxes: 'Up to 5 mailboxes' },
      { plan: 'Business', price: '$30/month', mailboxes: 'Up to 10 mailboxes' },
      { plan: 'Professional', price: '$50/month', mailboxes: 'Up to 25 mailboxes' },
    ],
    process_steps: [
      {
        title: 'Choose',
        body: 'Tell us the domain you want and we check availability immediately.',
      },
      {
        title: 'Register',
        body: 'We handle the full registration process and confirm when it is live.',
      },
      {
        title: 'Configure',
        body: 'We set up hosting, email and DNS so everything works together correctly.',
      },
      {
        title: 'Hand over',
        body: 'You receive full access to everything. You own it all.',
      },
    ],
    tools_items: [
      { name: 'Cloudflare', logo: '/images/tools/cloudflare.svg' },
      { name: 'Vercel', logo: '/images/tools/vercel.svg' },
      { name: 'Netlify', logo: '/images/tools/netlify.svg' },
    ],
    tools_note: 'and more depending on your requirements.',
    cta_heading: 'Ready to get your domain and hosting sorted today?',
    cta_body:
      'Tell us the domain name you want and we will check availability and come back to you immediately.',
    cta_button: 'Talk to us on WhatsApp',
    cta_url: 'https://wa.me/263710740387',
  },
  'api-integrations': {
    service_id: 'api-integrations',
    problem_text:
      'When your payment system does not talk to your website, when your CRM does not update automatically, when your team is manually copying information between platforms — your business is paying for the same work twice. Integration fixes this.',
    what_heading: 'What we integrate',
    what_intro: '',
    what_items: [
      {
        title: 'Local payment gateways',
        body: 'EcoCash, Paynow, Pesepay, Linkwasha, Payonify and more — connected directly to your website or system.',
      },
      {
        title: 'International payment gateways',
        body: 'Stripe, Payoneer and other international processors for businesses operating beyond Zimbabwe.',
      },
      {
        title: 'WhatsApp Business API',
        body: 'Connect WhatsApp to your CRM, booking system or customer support workflow.',
      },
      {
        title: 'Social media platforms',
        body: 'Meta, Facebook, Instagram and X connected individually to your website or backend systems.',
      },
      {
        title: 'Google ecosystem',
        body: 'Search APIs, Maps, Calendar, AI APIs and the full range of Google services integrated into your platforms.',
      },
      {
        title: 'CRM integrations',
        body: 'Connect your customer management system to every other tool your business uses.',
      },
      {
        title: 'Custom multi-system integrations',
        body: 'Any combination of platforms, connected cleanly and reliably.',
      },
    ],
    price_range: 'Starting from $100',
    price_summary: 'Quoted by scope after a brief consultation.',
    price_note:
      'Recurring third-party or API costs from external providers are separate where applicable. We tell you about these upfront before we start.',
    process_steps: [
      {
        title: 'Understand',
        body: 'We map exactly which systems need to connect and what data needs to flow between them.',
      },
      {
        title: 'Plan',
        body: 'We design the integration architecture and confirm the scope and price.',
      },
      {
        title: 'Build',
        body: 'We connect, configure and test every integration until data flows correctly.',
      },
      {
        title: 'Review',
        body: 'You test in a real environment. We fix anything that does not work exactly as expected.',
      },
      {
        title: 'Hand over',
        body: 'Full documentation and training so your team understands what was built and how it works.',
      },
    ],
    tools_items: [
      { name: 'EcoCash', logo: '/images/ecocash-logo.png' },
      { name: 'Paynow', logo: '/images/paynow-logo.png' },
      { name: 'Stripe', logo: '/images/tools/stripe.svg' },
      { name: 'Meta', logo: '/images/tools/meta.svg' },
      { name: 'Google', logo: '/images/tools/google.svg' },
      { name: 'WhatsApp Business API', logo: '/images/tools/whatsapp.svg' },
    ],
    tools_note: 'and more depending on your requirements.',
    cta_heading: 'Want your platforms to stop operating in silos?',
    cta_body:
      'Tell us which systems you need connected and we will come back to you with a clear integration plan and a fixed quote.',
    cta_button: 'Talk to us on WhatsApp',
    cta_url: 'https://wa.me/263710740387',
  },
};

// Defaults for the site-wide settings row.
export const DEFAULT_SETTINGS: SiteSettings = {
  hero_background: '/images/hero-bg.jpg',
  hero_cycles: DEFAULT_HERO_CYCLES,
  payment_methods: DEFAULT_PAYMENT_METHODS,
  home_sections: DEFAULT_HOME_SECTIONS,
  why_choose_us: DEFAULT_WHY_CHOOSE_US,
  service_pages: DEFAULT_SERVICE_PAGES,
  navbar_logo: '/images/logo-full.png',
  favicon_icon: '/images/favicon-96x96.png',
  browser_title: 'Opus Zimbabwe — Digital Services for Zimbabwe',
  manifest_icon: '/images/icon-512.png',
  footer_socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/share/17Pf93s1pA/?mibextid=wwXIfr', icon: 'Facebook' },
    { label: 'Instagram', href: 'https://www.instagram.com/opuszimbabwe?igsh=MWltZXp1NXh0MGZ0bQ%3D%3D&utm_source=qr', icon: 'Instagram' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/opus-zimbabwe-3150723b9', icon: 'Linkedin' },
    { label: 'X / Twitter', href: 'https://x.com/opuszimbabwe?s=21', icon: 'Twitter' },
    { label: 'WhatsApp', href: 'https://wa.me/263776396530', icon: 'MessageCircle' },
  ],
  contact_cards: [
    { title: 'Email', line: 'info.opuszim@gmail.com', note: 'We respond within 24 hours', href: 'mailto:info.opuszim@gmail.com', icon: 'Mail' },
    { title: 'Phone / WhatsApp', line: '0776 396 530 | 0710 740 387', note: 'Mon–Fri, 8am–6pm CAT', href: 'https://wa.me/263776396530', icon: 'Phone' },
    { title: 'Start a WhatsApp Chat', line: 'Chat with our team now', note: 'Fastest way to reach us', href: 'https://wa.me/263776396530', icon: 'MessageCircle' },
  ],
  faq_home: [
    { q: 'How do I pay for a project?', a: 'You can use EcoCash, OneMoney, InnBucks, Zimswitch and other supported Zimbabwean payment methods.' },
    { q: 'How long does a project take?', a: 'Timing depends on the scope. We confirm a delivery plan after understanding your requirements.' },
    { q: 'Do you provide domains, hosting and business email?', a: 'Yes. Domain registration, hosting and professional business email are available through Opus Zimbabwe.' },
  ],
  faq_page: [
    { q: 'How long does it take to build a website?', a: 'A standard business website takes 3–7 working days. Larger or more complex projects take 1–4 weeks depending on scope. We give you a clear timeline before we start.' },
    { q: 'How do I pay?', a: 'We accept EcoCash, OneMoney, InnBucks, Zimswitch, ZIPIT and USD cash or bank transfer. A deposit is required before work begins, with the balance due on completion.' },
    { q: 'Do I own my website and domain after you build it?', a: 'Yes, completely. Your domain is registered in your name and your website files belong to you. We do not hold your assets hostage.' },
    { q: 'What if I need changes after the website launches?', a: 'All packages include a post-launch support window. Ongoing maintenance packages are available from $10/month.' },
    { q: 'Can you redesign my existing website?', a: 'Yes. We can rebuild your current site from scratch or modernise what you already have while keeping your domain and content.' },
    { q: 'Do you work with clients outside Harare?', a: 'Yes. We work with clients across Zimbabwe and internationally. Everything can be managed remotely via WhatsApp, email and video calls.' },
    { q: 'What do you need from me to get started?', a: 'A brief description of your business, any existing branding (logo, colours) and an idea of what you want the website or system to do. We guide you through the rest.' },
    { q: 'Can you build a system specifically for my school, clinic or business?', a: 'Yes. Custom software and management systems are one of our core services. We scope every project individually based on your actual requirements.' },
  ],
  approach_items: [
    { title: 'Understand', body: 'We take time to learn your business, your customers, and what you actually need before anything is built.', icon: 'Globe' },
    { title: 'Plan', body: 'We map out exactly what will be built, how long it will take, and what it will cost — no surprises.', icon: 'Settings' },
    { title: 'Build', body: 'We do the work. You stay updated throughout, not just at the end.', icon: 'LayoutDashboard' },
    { title: 'Review', body: 'You check everything before it goes live. If something needs changing, we change it.', icon: 'Link2' },
    { title: 'Launch & Support', body: 'We go live and stay with you. If something breaks or needs updating, we are reachable.', icon: 'TrendingUp' },
  ],
  built_for_zimbabwe: {
    eyebrow: 'Built for Zimbabwe',
    heading: 'World-class execution. Local understanding.',
    body: 'We understand how business works here. We accept EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT. We price in USD at rates that make sense locally. We communicate on WhatsApp because that is where you are. And we build to an international standard because your business deserves nothing less.',
    image: '/images/gold-wave-bg.jpg',
  },
};

// Defaults used when a service page has no row in `service_extras` yet.
export const DEFAULT_EXTRAS: Omit<ServiceExtras, 'service_id' | 'hero_eyebrow' | 'hero_headline' | 'hero_intro' | 'hero_cta'> = {
  hero_background: '/images/hero-website-design.png',
  visual_background: '/images/service-web-design.png',
  hero_background_kind: 'image',
  hero_gradient: '160deg,#1a1a1a,#454545',
  why_items: [
    { title: 'Fast turnaround', body: 'Starter websites in 3–7 working days. Larger projects are scoped before work begins.' },
    { title: 'No outsourcing', body: 'Every project is handled directly by our team.' },
    { title: 'Support after launch', body: 'Ongoing maintenance and support available from $10/month.' },
    { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
  ],
  related_items: [
    { label: 'AI Solutions & Automation', href: '/services/ai-automation' },
    { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
    { label: 'Domain & Hosting', href: '/services/domains-hosting' },
    { label: 'API & Integrations', href: '/services/api-integrations' },
  ],
};

// Exact copy of the service cards currently baked into the site.
export const staticServices: ServiceRecord[] = [
  {
    id: 'web-design',
    tagline: 'Online Presence',
    name: 'Website Design & Development',
    description:
      'Your website is often the first thing a customer sees. We build websites that represent your business professionally, load fast, work on every device, and are ready from day one.',
    page_description:
      'We design and develop professional websites for businesses, NGOs, schools, churches and organisations across Zimbabwe — built to be fast, credible and ready to grow with you.',
    items: ['Business Websites', 'E-Commerce', 'Landing Pages', 'School Websites', 'NGO & Church Sites', 'Website Redesign', 'Website Maintenance'],
    icon: 'Globe',
    gradient: '160deg,#1a1a1a,#454545',
    card_bg_color: '#ffffff',
    slug: 'web-design',
    image: '/images/service-web-design.png',
    order_index: 0,
    visible: true,
  },
  {
    id: 'software-development',
    tagline: 'Business Systems',
    name: 'Software & Systems',
    description:
      'Manual processes slow businesses down. We build management systems, platforms and tools that bring your operations into one organised digital environment — built around how your organisation actually works.',
    page_description:
      'We build custom management systems, platforms and business tools that bring your operations into one organised digital environment — built around the way your organisation actually works.',
    items: ['School Management Systems', 'Inventory Systems', 'POS Systems', 'CRM Systems', 'Booking Systems', 'HR Systems', 'Custom Enterprise Systems'],
    icon: 'LayoutDashboard',
    gradient: '160deg,#1a1a1a,#454545',
    card_bg_color: '#ffffff',
    slug: 'software-development',
    image: '/images/service-software.jpg',
    order_index: 1,
    visible: true,
  },
  {
    id: 'ai-automation',
    tagline: 'AI & Automation',
    name: 'AI & Automation',
    description:
      "Repetitive tasks are costing you time and money. We build practical AI tools and automated workflows — from WhatsApp chatbots to full business automation — that work quietly in the background so your team doesn't have to.",
    page_description:
      'We build practical AI tools and automated workflows that reduce repetitive work and help your organisation operate more efficiently — grounded in what your business actually needs.',
    items: ['AI Chatbots', 'WhatsApp Chatbots', 'Workflow Automation', 'Customer Support AI', 'AI Document Processing', 'Full Business AI'],
    icon: 'Bot',
    gradient: '160deg,#1a1a1a,#454545',
    card_bg_color: '#ffffff',
    slug: 'ai-automation',
    image: '/images/service-ai.jpg',
    order_index: 2,
    visible: true,
  },
  {
    id: 'graphic-design',
    tagline: 'Brand & Design',
    name: 'Graphic Design & Branding',
    description:
      'Credibility starts with how you look. We design logos, flyers, social media graphics, brochures and marketing materials that make your business look as professional as the service you provide.',
    page_description:
      'We design logos, marketing materials and visual identities that make your business look credible, consistent and ready to compete — across digital and print platforms.',
    items: ['Logo Design', 'Flyer & Poster Design', 'Brochure Design', 'Business Cards', 'Social Media Graphics', 'Video Advertisements', 'Banners & Signage'],
    icon: 'Palette',
    gradient: '160deg,#E85D2A,#F4A226',
    card_bg_color: '#ffffff',
    slug: 'graphic-design',
    image: '/images/service-graphic.png',
    order_index: 3,
    visible: true,
  },
  {
    id: 'domains-hosting',
    tagline: 'Domains & Hosting',
    name: 'Domain & Hosting',
    description:
      'A professional domain, reliable hosting and a business email address are the foundation of any credible digital presence. We handle the setup and keep everything running.',
    page_description:
      'We register domains, set up reliable hosting and configure professional business email — the digital infrastructure every serious organisation needs, configured correctly from the start.',
    items: ['.co.zw Domains', '.com Domains', 'Web Hosting', 'Business Email Hosting', 'SSL Certificates', 'DNS Configuration', 'Website Migration'],
    icon: 'Server',
    gradient: '160deg,#454545,#6b7280',
    card_bg_color: '#ffffff',
    slug: 'domains-hosting',
    image: '/images/service-hosting.png',
    order_index: 4,
    visible: true,
  },
  {
    id: 'api-integrations',
    tagline: 'Integrations',
    name: 'API & Integrations',
    description:
      'Your website, payment system, CRM and communication tools should not operate in silos. We connect your platforms so data flows between them, reducing manual work and improving how your business runs.',
    page_description:
      'We connect your website, software, payment platforms and third-party tools so your digital systems work as one joined-up environment instead of a collection of disconnected parts.',
    items: ['Paynow Integration', 'EcoCash Integration', 'Stripe Integration', 'WhatsApp Business API', 'Google APIs', 'CRM Integrations', 'Custom Multi-System Integration'],
    icon: 'Plug',
    gradient: '160deg,#1a1a1a,#6b7280',
    card_bg_color: '#ffffff',
    slug: 'api-integrations',
    image: '/images/service-api.jpg',
    order_index: 5,
    visible: true,
  },
];

// Website packages with price ranges (Section 3 of /services/web-design/).
export const staticPricing: PricingRecord[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly_price: '$30 – $59.99',
    yearly_price: 'Entry website with hosting from $10/month',
    features: ['Up to 5 pages & mobile responsive', 'Contact form & basic SEO setup', 'SSL certificate included', '3–7 day delivery'],
    order_index: 0,
    visible: true,
  },
  {
    id: 'standard',
    name: 'Standard',
    monthly_price: '$60 – $99.99',
    yearly_price: 'Standard website package',
    features: ['Up to 8 pages & mobile responsive', 'Contact & enquiry forms', 'Enhanced SEO & WhatsApp integration', 'SSL certificate included'],
    order_index: 1,
    visible: true,
  },
  {
    id: 'business',
    name: 'Business',
    monthly_price: '$100 – $199.99',
    yearly_price: 'Growing organisations — includes free first-year .co.zw / .org.zw / .ac.zw domain',
    features: ['Built for growing organisations', 'CMS / content management & portfolio sections', 'Full SEO optimisation & WhatsApp integration', 'SSL certificate included'],
    order_index: 2,
    visible: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthly_price: '$200 – $499.99',
    yearly_price: 'Larger or more advanced requirements — .com / .net / .org available',
    features: ['.com / .net / .org domain extensions available', 'Booking systems, portals or e-commerce ready', 'Local payment integration (EcoCash, InnBucks, Paynow)', 'Priority support & custom workflows'],
    order_index: 3,
    visible: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    monthly_price: '$500 – $1,000',
    yearly_price: 'Advanced website requirements',
    features: ['Advanced website & platform requirements', 'Custom integrations & multi-system workflows', 'High-volume e-commerce or institutional portals', 'Performance & security architecture', 'Dedicated post-launch support'],
    order_index: 4,
    visible: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    monthly_price: 'Custom quote',
    yearly_price: 'Standalone custom scope — contact us for a quote',
    features: ['Standalone custom scope tailored to your organisation', 'Unlimited pages & bespoke functionality', 'Custom software, AI & API integrations', 'Dedicated project architecture & timeline', 'Ongoing support included'],
    order_index: 5,
    visible: true,
  },
];

// Service page heroes / Why Opus / related links — updated with the exact 6 service page headlines & CTAs.
export const staticExtras: Record<string, ServiceExtras> = {
  'web-design': {
    service_id: 'web-design',
    hero_eyebrow: 'Website Design & Development',
    hero_headline: 'A website that represents your business the way it deserves to be represented.',
    hero_intro:
      'We design and develop professional websites for businesses, NGOs, schools, churches and organisations across Zimbabwe — built to be fast, credible and ready to grow with you.',
    hero_cta: 'View Packages',
    hero_background: '/images/hero-website-design.png',
    visual_background: '/images/service-web-design.png',
    hero_background_kind: 'image',
    hero_gradient: '160deg,#1a1a1a,#454545',
    why_items: [
      { title: 'Fast turnaround', body: 'Starter websites in 3–7 working days. Larger projects are scoped before work begins.' },
      { title: 'No outsourcing', body: 'Every project is handled directly by our team.' },
      { title: 'Support after launch', body: 'Ongoing maintenance and support available from $10/month.' },
      { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
    ],
    related_items: [
      { label: 'AI Solutions & Automation', href: '/services/ai-automation' },
      { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
      { label: 'Domain & Hosting', href: '/services/domains-hosting' },
      { label: 'API & Integrations', href: '/services/api-integrations' },
    ],
  },
  'software-development': {
    service_id: 'software-development',
    hero_eyebrow: 'Software & System Development',
    hero_headline: 'Software built around the way your organisation actually works.',
    hero_intro:
      'We build custom management systems, platforms and business tools that bring your operations into one organised digital environment — designed specifically for your organisation, not adapted from a generic template.',
    hero_cta: 'Discuss Your Project',
    hero_background: '/images/hero-software-systems.png',
    visual_background: '/images/service-software.jpg',
    hero_background_kind: 'image',
    hero_gradient: '160deg,#1a1a1a,#454545',
    why_items: [
      { title: 'Built around your workflow', body: 'Systems designed from your real processes, not adapted from another organisation.' },
      { title: 'No outsourcing', body: 'Every project is handled directly by our team.' },
      { title: 'Support after launch', body: 'Ongoing maintenance and support available from $10/month.' },
      { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
    ],
    related_items: [
      { label: 'Website Design & Development', href: '/services/web-design' },
      { label: 'AI Solutions & Automation', href: '/services/ai-automation' },
      { label: 'API & Integrations', href: '/services/api-integrations' },
      { label: 'Domain & Hosting', href: '/services/domains-hosting' },
    ],
  },
  'ai-automation': {
    service_id: 'ai-automation',
    hero_eyebrow: 'AI Solutions & Automation',
    hero_headline: 'Stop doing manually what technology can do for you.',
    hero_intro:
      'We build practical AI tools and automated workflows that reduce repetitive work and help your organisation operate more efficiently — grounded in what your business actually needs, not technology for the sake of it.',
    hero_cta: 'Discuss Your Project',
    hero_background: '/images/hero-ai-automation.png',
    visual_background: '/images/service-ai.jpg',
    hero_background_kind: 'image',
    hero_gradient: '160deg,#1a1a1a,#454545',
    why_items: [
      { title: 'Practical, not theoretical', body: 'We automate processes that already cost you time — nothing speculative.' },
      { title: 'No outsourcing', body: 'Every project is handled directly by our team.' },
      { title: 'Support after launch', body: 'Ongoing maintenance and support available from $10/month.' },
      { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
    ],
    related_items: [
      { label: 'Website Design & Development', href: '/services/web-design' },
      { label: 'Software & Systems', href: '/services/software-development' },
      { label: 'API & Integrations', href: '/services/api-integrations' },
      { label: 'Domain & Hosting', href: '/services/domains-hosting' },
    ],
  },
  'graphic-design': {
    service_id: 'graphic-design',
    hero_eyebrow: 'Graphic Design & Branding',
    hero_headline: 'Your brand is the first impression. Make it the right one.',
    hero_intro:
      'We design logos, marketing materials and visual identities that make your business look credible, consistent and ready to compete — across digital and print platforms.',
    hero_cta: 'See Our Work',
    hero_background: '/images/hero-graphic-design.png',
    visual_background: '/images/service-graphic.png',
    hero_background_kind: 'image',
    hero_gradient: '160deg,#E85D2A,#F4A226',
    why_items: [
      { title: 'Fast turnaround', body: 'First concepts delivered quickly, with revisions included.' },
      { title: 'Every format you need', body: 'Print and digital files supplied ready to use.' },
      { title: 'No outsourcing', body: 'Every project is handled directly by our team.' },
      { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
    ],
    related_items: [
      { label: 'Website Design & Development', href: '/services/web-design' },
      { label: 'Domain & Hosting', href: '/services/domains-hosting' },
      { label: 'AI Solutions & Automation', href: '/services/ai-automation' },
      { label: 'Software & Systems', href: '/services/software-development' },
    ],
  },
  'domains-hosting': {
    service_id: 'domains-hosting',
    hero_eyebrow: 'Domain Registration & Web Hosting',
    hero_headline: 'Your domain. Your brand. Your foundation — set up correctly from the start.',
    hero_intro:
      'We register domains, set up reliable hosting and configure professional business email — the digital infrastructure every serious organisation needs, handled correctly from day one.',
    hero_cta: 'View Pricing',
    hero_background: '/images/hero-domains-hosting.png',
    visual_background: '/images/service-hosting.png',
    hero_background_kind: 'image',
    hero_gradient: '160deg,#454545,#6b7280',
    why_items: [
      { title: 'Configured correctly', body: 'Domains, DNS, hosting and email set up properly from day one.' },
      { title: 'You keep ownership', body: 'Everything is registered in your name, not ours.' },
      { title: 'Support after launch', body: 'Ongoing assistance and renewals handled with you.' },
      { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
    ],
    related_items: [
      { label: 'Website Design & Development', href: '/services/web-design' },
      { label: 'Business Email & Hosting', href: '/domains' },
      { label: 'API & Integrations', href: '/services/api-integrations' },
      { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
    ],
  },
  'api-integrations': {
    service_id: 'api-integrations',
    hero_eyebrow: 'API & System Integrations',
    hero_headline: 'Your systems should work together. We make sure they do.',
    hero_intro:
      'We connect your website, software, payment platforms and third-party tools so your digital systems work as one joined-up environment instead of a collection of disconnected parts.',
    hero_cta: 'Discuss Your Project',
    hero_background: '/images/hero-api-integrations.png',
    visual_background: '/images/service-api.jpg',
    hero_background_kind: 'image',
    hero_gradient: '160deg,#1a1a1a,#6b7280',
    why_items: [
      { title: 'Less manual work', body: 'Data flows between your platforms automatically.' },
      { title: 'Fewer errors', body: 'No more re-capturing the same information twice.' },
      { title: 'Support after launch', body: 'Ongoing monitoring and maintenance available.' },
      { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
    ],
    related_items: [
      { label: 'Website Design & Development', href: '/services/web-design' },
      { label: 'Software & Systems', href: '/services/software-development' },
      { label: 'AI Solutions & Automation', href: '/services/ai-automation' },
      { label: 'Domain & Hosting', href: '/services/domains-hosting' },
    ],
  },
};

// Live projects only (ZimTrade and Agricom removed permanently per brief).
export const staticProjects: ProjectRecord[] = [
  {
    id: 'great-couples',
    name: 'Great Couples International Trust',
    url: 'https://greatcouples.org.zw',
    tag: 'Website Design & Development',
    location: 'Zimbabwe / International',
    description:
      'A full website for an international trust focused on strengthening marriages and families across Africa. Includes service pages, event information, contact integration and WhatsApp support.',
    screenshot: '',
    status: 'active',
    order_index: 0,
    visible: true,
  },
  {
    id: 'prime-pidg',
    name: 'Prime Property Investment & Development Group',
    url: 'https://primepidg.co.zw',
    tag: 'Website Design & Development',
    location: 'Harare, Zimbabwe',
    description:
      'A corporate website for a Zimbabwean property investment and development company. Built to establish credibility, present their portfolio and generate professional enquiries.',
    screenshot: '',
    status: 'active',
    order_index: 1,
    visible: true,
  },
];

// Trusted partners — Killing Giants has a black background (`#000000`) by default.
export const staticPartners: PartnerRecord[] = [
  {
    id: 'great-couples',
    name: 'Great Couples International Trust',
    logo: '/images/partner-great-couples.png',
    url: 'https://greatcouples.org.zw',
    bg_color: '#ffffff',
    order_index: 0,
    visible: true,
  },
  {
    id: 'forgepoint',
    name: 'ForgePoint Technologies',
    logo: '/images/partner-forgepoint.png',
    url: '',
    bg_color: '#ffffff',
    order_index: 1,
    visible: true,
  },
  {
    id: 'rays-of-hope',
    name: 'Rays of Hope Academy',
    logo: '/images/partner-rays-of-hope.png',
    url: '',
    bg_color: '#ffffff',
    order_index: 2,
    visible: true,
  },
  {
    id: 'killing-giants',
    name: 'Killing Giants',
    logo: '/images/partner-killing-giants.png',
    url: '',
    bg_color: '#000000',
    order_index: 3,
    visible: true,
  },
];

export const staticContent: SiteContent = {
  services: staticServices,
  pricing: staticPricing,
  projects: staticProjects,
  partners: staticPartners,
  extras: staticExtras,
  settings: DEFAULT_SETTINGS,
};

export function extrasFor(content: SiteContent | null, serviceId: string | undefined): ServiceExtras | null {
  if (!content || !serviceId) return null;
  const fromContent = content.extras?.[serviceId];
  if (fromContent) return fromContent;
  return staticExtras[serviceId] || null;
}

export function servicePageFor(
  content: SiteContent | null,
  serviceId: string | undefined
): ServicePageDetails | null {
  if (!serviceId) return null;
  const fromContent = content?.settings?.service_pages?.[serviceId];
  if (fromContent) return fromContent;
  return DEFAULT_SERVICE_PAGES[serviceId] || null;
}

export function contactHref(serviceName?: string, domain?: string): string {
  const params = new URLSearchParams();
  if (serviceName) params.set('service', serviceName);
  if (domain !== undefined) params.set('domain', domain);
  const query = params.toString();
  return query ? `/contact?${query}` : '/contact';
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').slice(0, 40);
}

function objectArray(v: unknown, max = 40): any[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object').slice(0, max);
}

function normalizeService(raw: any, index: number): ServiceRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = str(raw.id, '').trim();
  const name = str(raw.name, '').trim();
  if (!id || !name) return null;
  return {
    id,
    tagline: str(raw.tagline, ''),
    name,
    description: str(raw.description, ''),
    page_description: str(raw.page_description, ''),
    items: strArray(raw.items),
    icon: str(raw.icon, 'Globe'),
    gradient: str(raw.gradient, '160deg,#1a1a1a,#454545'),
    card_bg_color: str(raw.card_bg_color, '#ffffff').trim() || '#ffffff',
    slug: str(raw.slug, ''),
    image: str(raw.image, ''),
    order_index: Number.isFinite(Number(raw.order_index)) ? Number(raw.order_index) : index,
    visible: raw.visible === true || raw.visible === 1 || raw.visible === '1',
  };
}

function normalizePricing(raw: any, index: number): PricingRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const name = str(raw.name, '').trim();
  if (!name) return null;
  return {
    id: str(raw.id, '') || `card-${index}`,
    name,
    monthly_price: str(raw.monthly_price, ''),
    yearly_price: str(raw.yearly_price, ''),
    features: strArray(raw.features),
    order_index: Number.isFinite(Number(raw.order_index)) ? Number(raw.order_index) : index,
    visible: raw.visible === true || raw.visible === 1 || raw.visible === '1',
  };
}

function normalizeExtras(raw: any): ServiceExtras | null {
  if (!raw || typeof raw !== 'object') return null;
  const serviceId = str(raw.service_id, '').trim();
  if (!serviceId) return null;
  const kind = raw.hero_background_kind === 'gradient' ? 'gradient' : 'image';
  const why = objectArray(raw.why_items)
    .map((x) => ({ title: str(x.title, '').slice(0, 200), body: str(x.body, '').slice(0, 600) }))
    .filter((x) => x.title || x.body);
  const related = objectArray(raw.related_items)
    .map((x) => ({ label: str(x.label, '').slice(0, 200), href: str(x.href, '').slice(0, 300) }))
    .filter((x) => x.label || x.href);
  return {
    service_id: serviceId,
    hero_eyebrow: str(raw.hero_eyebrow, '').slice(0, 300),
    hero_headline: str(raw.hero_headline, '').slice(0, 500),
    hero_intro: str(raw.hero_intro, '').slice(0, 2000),
    hero_cta: str(raw.hero_cta, '').slice(0, 200),
    hero_background: str(raw.hero_background, '').slice(0, 500),
    visual_background: str(raw.visual_background, staticExtras[String(raw.service_id)]?.visual_background || '').slice(0, 500),
    hero_background_kind: kind,
    hero_gradient: str(raw.hero_gradient, '160deg,#1a1a1a,#454545').slice(0, 200),
    why_items: why,
    related_items: related,
  };
}

function normalizePartner(raw: any, index: number): PartnerRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = str(raw.id, '').trim();
  const name = str(raw.name, '').trim();
  if (!id || !name) return null;
  const defaultBg = id === 'killing-giants' ? '#000000' : '#ffffff';
  return {
    id,
    name,
    logo: str(raw.logo, '').slice(0, 500),
    url: str(raw.url, '').slice(0, 500),
    bg_color: str(raw.bg_color, defaultBg).trim() || defaultBg,
    order_index: Number.isFinite(Number(raw.order_index)) ? Number(raw.order_index) : index,
    visible: raw.visible === true || raw.visible === 1 || raw.visible === '1',
  };
}

function normalizeProject(raw: any, index: number): ProjectRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = str(raw.id, '').trim();
  const name = str(raw.name, '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    url: str(raw.url, '').slice(0, 500),
    tag: str(raw.tag, '').slice(0, 200),
    location: str(raw.location, '').slice(0, 200),
    description: str(raw.description, '').slice(0, 3000),
    screenshot: str(raw.screenshot, '').slice(0, 500),
    status: raw.status === 'coming_soon' ? 'coming_soon' : 'active',
    order_index: Number.isFinite(Number(raw.order_index)) ? Number(raw.order_index) : index,
    visible: raw.visible === true || raw.visible === 1 || raw.visible === '1',
  };
}

function normalizeFaq(raw: unknown, fallback: FaqItem[]): FaqItem[] {
  const items = objectArray(raw, 40)
    .map((x) => ({ q: str(x.q, '').slice(0, 500), a: str(x.a, '').slice(0, 3000) }))
    .filter((x) => x.q && x.a);
  return items.length ? items : fallback;
}

function normalizeHeroCycles(raw: unknown, fallback: HeroCycle[]): HeroCycle[] {
  const items = objectArray(raw, 16)
    .map((x) => ({
      question: str(x.question, '').slice(0, 500).trim(),
      solution: str(x.solution, '').slice(0, 1000).trim(),
      image: str(x.image, '').slice(0, 500).trim(),
      href: str(x.href, '').slice(0, 500).trim(),
    }))
    .filter((x) => x.question && x.solution && x.image && x.href);
  return items.length ? items : fallback;
}

function normalizePaymentMethods(raw: unknown, fallback: PaymentMethod[]): PaymentMethod[] {
  const items = objectArray(raw, 24)
    .map((x, idx) => ({
      id: str(x.id, `pm-${idx}`).slice(0, 80).trim() || `pm-${idx}`,
      name: str(x.name, '').slice(0, 120).trim(),
      logo: str(x.logo, '').slice(0, 500).trim(),
      visible: x.visible !== false && x.visible !== 0 && x.visible !== '0',
    }))
    .filter((x) => x.name && x.logo);
  return items.length ? items : fallback;
}

function normalizeWhyChooseUs(raw: unknown, fallback: WhyItem[]): WhyItem[] {
  const items = objectArray(raw, 20)
    .map((x) => ({
      title: str(x.title, '').slice(0, 200).trim(),
      body: str(x.body, '').slice(0, 1000).trim(),
      icon: str(x.icon, '').slice(0, 500).trim(),
    }))
    .filter((x) => x.title && x.body);
  return items.length ? items : fallback;
}

function normalizeServicePages(
  raw: unknown,
  fallback: Record<string, ServicePageDetails>
): Record<string, ServicePageDetails> {
  const result: Record<string, ServicePageDetails> = structuredClone(fallback);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
  for (const [id, val] of Object.entries(raw as Record<string, any>)) {
    const base = fallback[id];
    if (!base || !val || typeof val !== 'object') continue;
    const whatItems = objectArray(val.what_items, 30)
      .map((x) => ({ title: str(x.title, '').slice(0, 200), body: str(x.body, '').slice(0, 800) }))
      .filter((x) => x.title);
    const processSteps = objectArray(val.process_steps, 20)
      .map((x) => ({ title: str(x.title, '').slice(0, 200), body: str(x.body, '').slice(0, 800) }))
      .filter((x) => x.title);
    const toolsItems = objectArray(val.tools_items, 30)
      .map((x) => ({ name: str(x.name, '').slice(0, 120), logo: str(x.logo, '').slice(0, 500) }))
      .filter((x) => x.name);
    const domainPrices = objectArray(val.domain_prices, 20)
      .map((x) => ({
        extension: str(x.extension, '').slice(0, 40),
        price: str(x.price, '').slice(0, 60),
        registration_time: str(x.registration_time, '').slice(0, 120),
      }))
      .filter((x) => x.extension && x.price);
    const emailPlans = objectArray(val.email_plans, 20)
      .map((x) => ({
        plan: str(x.plan, '').slice(0, 80),
        price: str(x.price, '').slice(0, 60),
        mailboxes: str(x.mailboxes, '').slice(0, 120),
      }))
      .filter((x) => x.plan && x.price);

    result[id] = {
      service_id: id,
      problem_text: str(val.problem_text, base.problem_text).slice(0, 2000),
      what_heading: str(val.what_heading, base.what_heading).slice(0, 200),
      what_intro: str(val.what_intro, base.what_intro).slice(0, 1000),
      what_items: whatItems.length ? whatItems : base.what_items,
      price_range: str(val.price_range, base.price_range).slice(0, 200),
      price_summary: str(val.price_summary, base.price_summary).slice(0, 500),
      price_note: str(val.price_note, base.price_note).slice(0, 800),
      hosting_price: str(val.hosting_price, base.hosting_price || 'from $10/month').slice(0, 120),
      domain_prices: domainPrices.length ? domainPrices : base.domain_prices,
      email_plans: emailPlans.length ? emailPlans : base.email_plans,
      process_steps: processSteps.length ? processSteps : base.process_steps,
      tools_items: toolsItems.length ? toolsItems : base.tools_items,
      tools_note: str(val.tools_note, base.tools_note).slice(0, 300),
      cta_heading: str(val.cta_heading, base.cta_heading).slice(0, 300),
      cta_body: str(val.cta_body, base.cta_body).slice(0, 800),
      cta_button: str(val.cta_button, base.cta_button).slice(0, 120),
      cta_url: str(val.cta_url, base.cta_url).slice(0, 500),
    };
  }
  return result;
}

function normalizeHomeSections(raw: unknown, fallback: HomeSectionsConfig): HomeSectionsConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fallback;
  const s = raw as Record<string, unknown>;
  return {
    hero_headline_main: str(s.hero_headline_main, fallback.hero_headline_main).slice(0, 300),
    hero_headline_accent: str(s.hero_headline_accent, fallback.hero_headline_accent).slice(0, 300),
    hero_bg: str(s.hero_bg, fallback.hero_bg).slice(0, 20),
    payment_label: str(s.payment_label, fallback.payment_label).slice(0, 200),
    services_heading: str(s.services_heading, fallback.services_heading).slice(0, 300),
    services_bg: str(s.services_bg, fallback.services_bg).slice(0, 20),
    partners_heading: str(s.partners_heading, fallback.partners_heading).slice(0, 300),
    partners_subheading: str(s.partners_subheading, fallback.partners_subheading).slice(0, 500),
    partners_bg: str(s.partners_bg, fallback.partners_bg).slice(0, 20),
    how_it_works_heading: str(s.how_it_works_heading, fallback.how_it_works_heading).slice(0, 300),
    how_it_works_bg: str(s.how_it_works_bg, fallback.how_it_works_bg).slice(0, 20),
    projects_heading: str(s.projects_heading, fallback.projects_heading).slice(0, 300),
    projects_bg: str(s.projects_bg, fallback.projects_bg).slice(0, 20),
    why_heading: str(s.why_heading, fallback.why_heading).slice(0, 300),
    why_bg: str(s.why_bg, fallback.why_bg).slice(0, 20),
    faq_heading: str(s.faq_heading, fallback.faq_heading).slice(0, 300),
    faq_bg: str(s.faq_bg, fallback.faq_bg).slice(0, 20),
    cta_heading: str(s.cta_heading, fallback.cta_heading).slice(0, 300),
    cta_subheading: str(s.cta_subheading, fallback.cta_subheading).slice(0, 500),
    cta_bg: str(s.cta_bg, fallback.cta_bg).slice(0, 20),
  };
}

function normalizeSocials(raw: unknown, fallback: SocialLink[]): SocialLink[] {
  const items = objectArray(raw, 20)
    .map((x) => ({
      label: str(x.label, '').slice(0, 120),
      href: str(x.href, '').slice(0, 500),
      icon: str(x.icon, 'Globe').slice(0, 500),
    }))
    .filter((x) => x.label && x.href);
  return items.length ? items : fallback;
}

function normalizeContactCards(raw: unknown, fallback: ContactCard[]): ContactCard[] {
  const items = objectArray(raw, 20)
    .map((x) => ({
      title: str(x.title, '').slice(0, 120),
      line: str(x.line, '').slice(0, 300),
      note: str(x.note, '').slice(0, 300),
      href: str(x.href, '').slice(0, 500),
      icon: str(x.icon, 'Mail').slice(0, 500),
    }))
    .filter((x) => x.title);
  return items.length ? items : fallback;
}

function normalizeApproach(raw: unknown, fallback: ApproachItem[]): ApproachItem[] {
  const items = objectArray(raw, 20)
    .map((x) => ({
      title: str(x.title, '').slice(0, 200),
      body: str(x.body, '').slice(0, 600),
      icon: str(x.icon, 'Globe').slice(0, 500),
    }))
    .filter((x) => x.title);
  return items.length ? items : fallback;
}

function normalizeBuilt(raw: unknown): BuiltForZimbabwe {
  if (!raw || typeof raw !== 'object') return DEFAULT_SETTINGS.built_for_zimbabwe;
  const source = raw as Record<string, unknown>;
  return {
    eyebrow: str(source.eyebrow, DEFAULT_SETTINGS.built_for_zimbabwe.eyebrow).slice(0, 200),
    heading: str(source.heading, DEFAULT_SETTINGS.built_for_zimbabwe.heading).slice(0, 500),
    body: str(source.body, DEFAULT_SETTINGS.built_for_zimbabwe.body).slice(0, 3000),
    image: str(source.image, DEFAULT_SETTINGS.built_for_zimbabwe.image).slice(0, 500),
  };
}

// Validate whatever /api/content returned; return null when unusable so
// callers keep rendering the static fallback.
export function normalizeContent(raw: any): SiteContent | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.services) || !Array.isArray(raw.pricing)) return null;
  const services = raw.services
    .map(normalizeService)
    .filter((s: ServiceRecord | null): s is ServiceRecord => s !== null)
    .sort((a: ServiceRecord, b: ServiceRecord) => a.order_index - b.order_index);
  const pricing = raw.pricing
    .map(normalizePricing)
    .filter((p: PricingRecord | null): p is PricingRecord => p !== null)
    .sort((a: PricingRecord, b: PricingRecord) => a.order_index - b.order_index);

  const projects = Array.isArray(raw.projects)
    ? raw.projects
        .map(normalizeProject)
        .filter((p: ProjectRecord | null): p is ProjectRecord => p !== null)
        .sort((a: ProjectRecord, b: ProjectRecord) => a.order_index - b.order_index)
    : staticProjects;

  const partners = Array.isArray(raw.partners)
    ? raw.partners
        .map(normalizePartner)
        .filter((p: PartnerRecord | null): p is PartnerRecord => p !== null)
        .sort((a: PartnerRecord, b: PartnerRecord) => a.order_index - b.order_index)
    : staticPartners;

  const extras: Record<string, ServiceExtras> = { ...staticExtras };
  const rawExtras = raw.extras && typeof raw.extras === 'object' ? raw.extras : {};
  for (const value of Object.values(rawExtras as Record<string, unknown>)) {
    const normalized = normalizeExtras(value);
    if (normalized) extras[normalized.service_id] = normalized;
  }
  for (const rawService of raw.services) {
    if (rawService && typeof rawService === 'object' && rawService.extras) {
      const normalized = normalizeExtras(rawService.extras);
      if (normalized) extras[normalized.service_id] = normalized;
    }
  }

  const rawSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const hero = str((rawSettings as any).hero_background, '');
  const settings: SiteSettings = {
    hero_background: hero || DEFAULT_SETTINGS.hero_background,
    hero_cycles: normalizeHeroCycles((rawSettings as any).hero_cycles, DEFAULT_SETTINGS.hero_cycles),
    payment_methods: normalizePaymentMethods((rawSettings as any).payment_methods, DEFAULT_SETTINGS.payment_methods),
    home_sections: normalizeHomeSections((rawSettings as any).home_sections, DEFAULT_SETTINGS.home_sections),
    why_choose_us: normalizeWhyChooseUs((rawSettings as any).why_choose_us, DEFAULT_SETTINGS.why_choose_us),
    service_pages: normalizeServicePages((rawSettings as any).service_pages, DEFAULT_SETTINGS.service_pages),
    navbar_logo: str((rawSettings as any).navbar_logo, DEFAULT_SETTINGS.navbar_logo) || DEFAULT_SETTINGS.navbar_logo,
    favicon_icon: str((rawSettings as any).favicon_icon, DEFAULT_SETTINGS.favicon_icon) || DEFAULT_SETTINGS.favicon_icon,
    browser_title: str((rawSettings as any).browser_title, DEFAULT_SETTINGS.browser_title) || DEFAULT_SETTINGS.browser_title,
    manifest_icon: str((rawSettings as any).manifest_icon, DEFAULT_SETTINGS.manifest_icon) || DEFAULT_SETTINGS.manifest_icon,
    footer_socials: normalizeSocials((rawSettings as any).footer_socials, DEFAULT_SETTINGS.footer_socials),
    contact_cards: normalizeContactCards((rawSettings as any).contact_cards, DEFAULT_SETTINGS.contact_cards),
    faq_home: normalizeFaq((rawSettings as any).faq_home, DEFAULT_SETTINGS.faq_home),
    faq_page: normalizeFaq((rawSettings as any).faq_page, DEFAULT_SETTINGS.faq_page),
    approach_items: normalizeApproach((rawSettings as any).approach_items, DEFAULT_SETTINGS.approach_items),
    built_for_zimbabwe: normalizeBuilt((rawSettings as any).built_for_zimbabwe),
  };

  return { services, pricing, projects, partners, extras, settings };
}
