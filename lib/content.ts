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

export type PricingRecord = {
  id: string;
  name: string;
  monthly_price: string;
  yearly_price: string;
  features: string[];
  order_index: number;
  visible: boolean;
};

export type SiteSettings = {
  hero_background: string;
};

export type SiteContent = {
  services: ServiceRecord[];
  pricing: PricingRecord[];
  settings: SiteSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_background: '/images/hero-bg.jpg',
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

export const staticContent: SiteContent = {
  services: staticServices,
  pricing: staticPricing,
  settings: DEFAULT_SETTINGS,
};

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').slice(0, 40);
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
  const hero = raw.settings && typeof raw.settings === 'object' ? str(raw.settings.hero_background, '') : '';
  return {
    services,
    pricing,
    settings: { hero_background: hero || DEFAULT_SETTINGS.hero_background },
  };
}
