// Site content model + built-in static fallback content.
// The public site always renders these values first (static export);
// when the Cloudflare Pages Functions API (/api/content) is reachable,
// client components upgrade to the D1-backed values.

export type ServiceRecord = {
  id: string;
  tagline: string;
  name: string;
  description: string; // home "What We Do" card copy
  page_description: string; // /services list copy
  items: string[];
  icon: string;
  gradient: string;
  slug: string;
  image: string;
  order_index: number;
  visible: boolean;
};

export type WhyItem = { title: string; body: string };
export type RelatedItem = { label: string; href: string };

// Per-service page content: full-bleed hero (image or gradient background),
// "Why Opus Zimbabwe?" cards and "Related services" links.
export type ServiceExtras = {
  service_id: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_intro: string;
  hero_cta: string;
  hero_background: string;
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
  status: 'active' | 'coming_soon';
  order_index: number;
  visible: boolean;
};

// Trusted partner ("Organisations We Have Built For" logo row on the home page).
// `url` is optional — without it the logo renders unlinked.
export type PartnerRecord = {
  id: string;
  name: string;
  logo: string;
  url: string;
  order_index: number;
  visible: boolean;
};

export type PricingRecord = {
  id: string;
  name: string;
  monthly_price: string;
  yearly_price: string;
  features: string[];
  order_index: number;
  visible: boolean;
};

export type FaqItem = { q: string; a: string };
export type ApproachItem = { title: string; body: string; icon: string };
export type SocialLink = { label: string; href: string; icon: string };
export type ContactCard = { title: string; line: string; note: string; href: string; icon: string };
export type BuiltForZimbabwe = { eyebrow: string; heading: string; body: string; image: string };

export type SiteSettings = {
  hero_background: string;
  navbar_logo: string;
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

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_background: '/images/hero-bg.jpg',
  navbar_logo: '/images/logo.png',
  manifest_icon: '/images/icon-512.png',
  footer_socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/opuszim', icon: 'Facebook' },
    { label: 'Instagram', href: 'https://www.instagram.com/opuszimbabwe', icon: 'Instagram' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/opuszimbabwe', icon: 'Linkedin' },
    { label: 'X', href: 'https://x.com/OpusZimbabwe', icon: 'Twitter' },
    { label: 'WhatsApp', href: 'https://wa.me/263773979162', icon: 'MessageCircle' },
  ],
  contact_cards: [
    { title: 'WhatsApp', line: '+263 776 396 530', note: 'Usually within the hour', href: 'https://wa.me/263776396530', icon: 'MessageCircle' },
    { title: 'Email', line: 'info.opuszim@gmail.com', note: 'Within 1 business day', href: 'mailto:info.opuszim@gmail.com', icon: 'Mail' },
    { title: 'Call Us', line: '0776 396 530', note: '0773 979 162', href: 'tel:+263776396530', icon: 'Phone' },
  ],
  faq_home: [
    { q: 'How do I pay for a project?', a: 'You can use EcoCash, OneMoney, InnBucks, Zimswitch and other supported Zimbabwean payment methods.' },
    { q: 'How long does a project take?', a: 'Timing depends on the scope. We confirm a delivery plan after understanding your requirements.' },
    { q: 'Do you provide domains, hosting and business email?', a: 'Yes. Domain registration, hosting and professional business email are available through Opus Zimbabwe.' },
  ],
  faq_page: [
    { q: 'How much does a website cost?', a: 'Starter websites begin at $30. Standard packages start at $60. Business packages start at $100. Pricing depends on the number of pages, features and complexity required. Custom projects are quoted after a brief consultation — no obligation to proceed.' },
    { q: 'How long does a project take?', a: 'Starter websites are typically delivered in 3 to 7 working days. Standard builds take 1 to 2 weeks. Business and Professional packages take 2 to 4 weeks. Software systems and custom projects are scoped individually. We confirm a timeline before any work begins.' },
    { q: 'Do you handle domains, hosting and business email?', a: 'Yes. We register domains across all major extensions including .co.zw, .com, .org and others. We also set up web hosting, SSL certificates and professional business email. Everything is configured correctly from the start.' },
    { q: 'What happens after my project is delivered?', a: 'Every project includes a handover and a period of post-launch support. Ongoing maintenance, updates and technical support are available from $10 per month. You will never be left managing a website or system alone.' },
    { q: 'My project does not fit a package — can you still help?', a: 'Yes. If your requirements are more specific or complex than our packages cover, contact us and we will scope and quote a custom solution for you directly.' },
    { q: 'How do I pay for a project?', a: 'We accept EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT. No foreign currency is required. Payment schedules for larger projects are agreed upfront.' },
    { q: 'Do you work with small businesses and startups?', a: 'Yes — this is exactly who we are built for. We work with individuals, small businesses, NGOs, schools and churches that need professional digital work at a price that makes sense for where they are right now.' },
    { q: 'What is OpusEdu?', a: 'OpusEdu is our dedicated school management platform, purpose-built for Zimbabwean schools. It covers admissions, fees, timetables, results and communication in one system.' },
  ],
  approach_items: [
    { title: 'Get Online', body: 'Build the digital presence your customers can find.', icon: 'Globe' },
    { title: 'Operate Better', body: 'Replace repetitive manual processes.', icon: 'Settings' },
    { title: 'Automate', body: 'Let technology handle repetitive tasks.', icon: 'Bot' },
    { title: 'Connect', body: 'Integrate the platforms you already use.', icon: 'Link2' },
    { title: 'Grow', body: 'Build a foundation that expands with you.', icon: 'TrendingUp' },
  ],
  built_for_zimbabwe: {
    eyebrow: 'Built for Zimbabwe',
    heading: 'Professional digital services that understand your market, your clients, and your budget.',
    body: 'Most digital agencies in Zimbabwe either overcharge or underdeliver. Opus Zimbabwe was built to close that gap — corporate quality, local understanding, and a team that is reachable when you need them.',
    image: '/images/hero-digital-solutions.png',
  },
};

export const DEFAULT_EXTRAS: Omit<ServiceExtras, 'service_id'> = {
  hero_eyebrow: '',
  hero_headline: '',
  hero_intro: '',
  hero_cta: '',
  hero_background: '',
  hero_background_kind: 'image',
  hero_gradient: '160deg,#1a1a1a,#454545',
  why_items: [
    { title: 'Fast turnaround', body: 'Starter websites in 3–7 working days. Larger projects are scoped before work begins.' },
    { title: 'No outsourcing', body: 'Every project is handled directly by our team.' },
    { title: 'Support after launch', body: 'Ongoing maintenance and support available from $10/month.' },
    { title: 'Local payment methods', body: 'EcoCash, OneMoney, InnBucks, Zimswitch and ZIPIT accepted.' },
  ],
  related_items: [
    { label: 'Website Design & Development', href: '/services/web-design' },
    { label: 'AI Solutions & Automation', href: '/services/ai-automation' },
    { label: 'Graphic Design & Branding', href: '/services/graphic-design' },
    { label: 'Domain & Hosting', href: '/services/domains-hosting' },
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
    slug: 'api-integrations',
    image: '/images/service-api.jpg',
    order_index: 5,
    visible: true,
  },
];

export const staticPricing: PricingRecord[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly_price: '$30',
    yearly_price: '$25/mo',
    features: ['Up to 5 pages', 'Mobile responsive', 'Contact form', 'Basic SEO setup', 'SSL certificate', '3-7 day delivery'],
    order_index: 0,
    visible: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthly_price: '$60',
    yearly_price: '$50/mo',
    features: ['Up to 10 pages', 'Mobile responsive', 'Contact & enquiry forms', 'Full SEO optimisation', 'SSL certificate', 'WhatsApp integration', '1-2 week delivery'],
    order_index: 1,
    visible: true,
  },
  {
    id: 'custom',
    name: 'Custom',
    monthly_price: "Let's talk",
    yearly_price: "Let's talk",
    features: ['Unlimited pages', 'Custom functionality', 'E-commerce or booking', 'API integrations', 'Ongoing support included', 'Custom timeline'],
    order_index: 2,
    visible: true,
  },
];

// Service page heroes / Why Opus / related links — mirrors migrations/0003.
export const staticExtras: Record<string, ServiceExtras> = {
  'web-design': {
    service_id: 'web-design',
    hero_eyebrow: 'Website Design & Development',
    hero_headline: 'A website that represents your business the way it deserves to be represented.',
    hero_intro: 'We design and develop professional websites for businesses, NGOs, schools, churches and organisations across Zimbabwe — built to be fast, credible and ready to grow with you.',
    hero_cta: 'View Packages',
    hero_background: '/images/hero-website-design.png',
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
    hero_headline: 'Stop managing your business on paper and WhatsApp groups.',
    hero_intro: 'We build custom management systems, platforms and business tools that bring your operations into one organised digital environment — built around the way your organisation actually works.',
    hero_cta: 'Discuss Your System',
    hero_background: '/images/hero-software-systems.png',
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
    hero_headline: 'Your business should not be paying people to do what a system can do automatically.',
    hero_intro: 'We build practical AI tools and automated workflows that reduce repetitive work, improve how you respond to customers, and free your team to focus on what actually requires human attention.',
    hero_cta: 'Explore AI Solutions',
    hero_background: '/images/hero-ai-automation.png',
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
    hero_headline: 'Look as professional as the service you provide.',
    hero_intro: 'We design logos, marketing materials and visual identities that make your business look credible, consistent and ready to compete.',
    hero_cta: 'Start a Design Project',
    hero_background: '/images/hero-graphic-design.png',
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
    hero_headline: 'Your domain. Your email. Your business, online and credible.',
    hero_intro: 'We register domains, set up reliable hosting and configure professional business email — the digital infrastructure every serious organisation needs.',
    hero_cta: 'Register a Domain',
    hero_background: '/images/hero-domains-hosting.png',
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
    hero_headline: 'Your platforms should talk to each other — so your team does not have to.',
    hero_intro: 'We connect your website, software, payment systems and third-party platforms so your digital tools work as one joined-up system instead of a collection of disconnected parts.',
    hero_cta: 'Discuss Your Integration',
    hero_background: '/images/hero-api-integrations.png',
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

export const staticProjects: ProjectRecord[] = [
  {
    id: 'great-couples',
    name: 'Great Couples International Trust',
    url: 'https://greatcouples.org.zw',
    tag: 'Website Design & Development',
    location: 'Zimbabwe / International',
    description:
      'A full website for an international trust focused on strengthening marriages and families across Africa. Includes service pages, event information, contact integration and WhatsApp support.',
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
    status: 'active',
    order_index: 1,
    visible: true,
  },
  {
    id: 'zimtrade',
    name: 'ZimTrade Export Platform',
    url: '',
    tag: 'Software & Systems',
    location: 'Harare, Zimbabwe',
    description:
      'An export-intelligence platform for Zimbabwean producers: company directory, market briefings and enquiry routing in one system.',
    status: 'coming_soon',
    order_index: 2,
    visible: true,
  },
  {
    id: 'agricom',
    name: 'Agricom Commodity Marketplace',
    url: '',
    tag: 'Software & Systems',
    location: 'Harare, Zimbabwe',
    description:
      'A commodity marketplace connecting Zimbabwean farmers to buyers, with live pricing, listings and order tracking.',
    status: 'coming_soon',
    order_index: 3,
    visible: true,
  },
];

// Trusted partners — mirrors migrations/0004_partners.sql.
export const staticPartners: PartnerRecord[] = [
  {
    id: 'great-couples',
    name: 'Great Couples International Trust',
    logo: '/images/partner-great-couples.png',
    url: 'https://greatcouples.org.zw',
    order_index: 0,
    visible: true,
  },
  {
    id: 'forgepoint',
    name: 'ForgePoint Technologies',
    logo: '/images/partner-forgepoint.png',
    url: '',
    order_index: 1,
    visible: true,
  },
  {
    id: 'rays-of-hope',
    name: 'Rays of Hope Academy',
    logo: '/images/partner-rays-of-hope.png',
    url: '',
    order_index: 2,
    visible: true,
  },
  {
    id: 'killing-giants',
    name: 'Killing Giants',
    logo: '/images/partner-killing-giants.png',
    url: '',
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

// Look up the extras for a service, falling back to the built-in copy.
export function extrasFor(content: SiteContent | null, serviceId: string | undefined): ServiceExtras | null {
  if (!content || !serviceId) return null;
  const fromContent = content.extras?.[serviceId];
  if (fromContent) return fromContent;
  return staticExtras[serviceId] || null;
}

// Build a /contact link that pre-fills the enquiry form.
// `domain` is set by domain CTAs (e.g. "/contact?service=…&domain=.co.zw");
// pass an empty string to pre-fill the service with a blank domain field.
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
  return {
    id,
    name,
    logo: str(raw.logo, '').slice(0, 500),
    url: str(raw.url, '').slice(0, 500),
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

function normalizeSocials(raw: unknown, fallback: SocialLink[]): SocialLink[] {
  const items = objectArray(raw, 20)
    .map((x) => ({
      label: str(x.label, '').slice(0, 120),
      href: str(x.href, '').slice(0, 500),
      icon: str(x.icon, 'Globe').slice(0, 60),
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
      icon: str(x.icon, 'Mail').slice(0, 60),
    }))
    .filter((x) => x.title);
  return items.length ? items : fallback;
}

function normalizeApproach(raw: unknown, fallback: ApproachItem[]): ApproachItem[] {
  const items = objectArray(raw, 20)
    .map((x) => ({
      title: str(x.title, '').slice(0, 200),
      body: str(x.body, '').slice(0, 600),
      icon: str(x.icon, 'Globe').slice(0, 60),
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
  // Rows that arrive attached to the service itself also count.
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
    navbar_logo: str((rawSettings as any).navbar_logo, DEFAULT_SETTINGS.navbar_logo) || DEFAULT_SETTINGS.navbar_logo,
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
