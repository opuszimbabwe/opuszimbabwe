import { upgradeHeroDesign } from '../../lib/hero-design';
import { validDesign } from '../../lib/section-design';
// Shared D1 helpers for reading and validating site content.

import { D1Database } from './types';

export interface ServiceRow {
  id: string;
  tagline: string;
  name: string;
  description: string;
  page_description: string;
  items: string; // JSON string[]
  icon: string;
  gradient: string;
  card_bg_color?: string;
  slug: string;
  image: string;
  order_index: number;
  visible: number;
}

export interface PricingRow {
  id: string;
  name: string;
  monthly_price: string;
  yearly_price: string;
  features: string; // JSON string[]
  order_index: number;
  visible: number;
}

export interface ServiceExtrasRow {
  service_id: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_intro: string;
  hero_cta: string;
  hero_background: string;
  visual_background: string;
  hero_background_kind: string;
  hero_gradient: string;
  why_items: string; // JSON
  related_items: string; // JSON
}

export interface ProjectRow {
  id: string;
  name: string;
  url: string;
  tag: string;
  location: string;
  description: string;
  screenshot?: string;
  status: string;
  order_index: number;
  visible: number;
}

export interface PartnerRow {
  id: string;
  name: string;
  logo: string;
  url: string;
  bg_color?: string;
  order_index: number;
  visible: number;
}

export const URL_SETTINGS = ['hero_background', 'navbar_logo', 'favicon_icon', 'manifest_icon'] as const;
export const TEXT_SETTINGS = ['browser_title'] as const;
export const JSON_SETTINGS = [
  'hero_design',
  'cta_design',
  'contact_hero_design',
  'hero_cycles',
  'payment_methods',
  'home_sections',
  'why_choose_us',
  'service_pages',
  'footer_socials',
  'contact_cards',
  'faq_home',
  'faq_page',
  'approach_items',
  'built_for_zimbabwe',
] as const;
export const ALL_SETTINGS: readonly string[] = [...URL_SETTINGS, ...TEXT_SETTINGS, ...JSON_SETTINGS];

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === 'string');
    }
  } catch {
    // ignore
  }
  return [];
}

function parseJsonUnknown(raw: string | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mapExtras(e: ServiceExtrasRow) {
  return {
    service_id: e.service_id,
    hero_eyebrow: e.hero_eyebrow,
    hero_headline: e.hero_headline,
    hero_intro: e.hero_intro,
    hero_cta: e.hero_cta,
    hero_background: e.hero_background,
    visual_background: e.visual_background || '',
    hero_background_kind: e.hero_background_kind === 'gradient' ? 'gradient' : 'image',
    hero_gradient: e.hero_gradient,
    why_items: Array.isArray(parseJsonUnknown(e.why_items)) ? parseJsonUnknown(e.why_items) : [],
    related_items: Array.isArray(parseJsonUnknown(e.related_items)) ? parseJsonUnknown(e.related_items) : [],
  };
}

export async function readAllContent(db: D1Database) {
  const [servicesRows, pricingRows, settingsRows] = await Promise.all([
    db
      .prepare(
        'SELECT id, tagline, name, description, page_description, items, icon, gradient, card_bg_color, slug, image, order_index, visible FROM services ORDER BY order_index ASC'
      )
      .all<ServiceRow>()
      .catch(() =>
        db
          .prepare(
            'SELECT id, tagline, name, description, page_description, items, icon, gradient, slug, image, order_index, visible FROM services ORDER BY order_index ASC'
          )
          .all<ServiceRow>()
      ),
    db
      .prepare(
        'SELECT id, name, monthly_price, yearly_price, features, order_index, visible FROM pricing_cards ORDER BY order_index ASC'
      )
      .all<PricingRow>(),
    db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>(),
  ]);

  const [extrasRows, projectRows, partnerRows] = await Promise.all([
    db
      .prepare(
        'SELECT service_id, hero_eyebrow, hero_headline, hero_intro, hero_cta, hero_background, visual_background, hero_background_kind, hero_gradient, why_items, related_items FROM service_extras'
      )
      .all<ServiceExtrasRow>()
      .catch(() =>
        db
          .prepare(
            "SELECT service_id, hero_eyebrow, hero_headline, hero_intro, hero_cta, hero_background, '' AS visual_background, hero_background_kind, hero_gradient, why_items, related_items FROM service_extras"
          )
          .all<ServiceExtrasRow>()
      )
      .catch(() => ({ results: [] as ServiceExtrasRow[] })),
    db
      .prepare(
        'SELECT id, name, url, tag, location, description, screenshot, status, order_index, visible FROM projects ORDER BY order_index ASC'
      )
      .all<ProjectRow>()
      .catch(() =>
        db
          .prepare(
            "SELECT id, name, url, tag, location, description, '' AS screenshot, status, order_index, visible FROM projects ORDER BY order_index ASC"
          )
          .all<ProjectRow>()
      )
      .catch(() => ({ results: [] as ProjectRow[] })),
    db
      .prepare('SELECT id, name, logo, url, bg_color, order_index, visible FROM partners ORDER BY order_index ASC')
      .all<PartnerRow>()
      .catch(() =>
        db
          .prepare('SELECT id, name, logo, url, order_index, visible FROM partners ORDER BY order_index ASC')
          .all<PartnerRow>()
      )
      .catch(() => ({ results: [] as PartnerRow[] })),
  ]);

  const extrasByService = new Map<string, ReturnType<typeof mapExtras>>();
  for (const row of extrasRows.results || []) {
    extrasByService.set(row.service_id, mapExtras(row));
  }

  const services = (servicesRows.results || []).map((s) => ({
    ...s,
    items: parseJsonArray(s.items),
    card_bg_color: s.card_bg_color || '#ffffff',
    visible: Boolean(s.visible),
    extras: extrasByService.get(s.id) || null,
  }));

  const pricing = (pricingRows.results || []).map((p) => ({
    ...p,
    features: parseJsonArray(p.features),
    visible: Boolean(p.visible),
  }));

  const projects = (projectRows.results || []).map((p) => ({
    id: p.id,
    name: p.name,
    url: p.url,
    tag: p.tag,
    location: p.location,
    description: p.description,
    screenshot: p.screenshot || '',
    status: p.status === 'coming_soon' ? 'coming_soon' : 'active',
    order_index: p.order_index,
    visible: Boolean(p.visible),
  }));

  const partners = (partnerRows.results || []).map((p) => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    url: p.url,
    bg_color: p.bg_color || (p.id === 'killing-giants' ? '#000000' : '#ffffff'),
    order_index: p.order_index,
    visible: Boolean(p.visible),
  }));

  const extras: Record<string, ReturnType<typeof mapExtras>> = {};
  for (const row of extrasRows.results || []) {
    extras[row.service_id] = mapExtras(row);
  }

  const settingsMap: Record<string, string> = {};
  for (const row of settingsRows.results || []) {
    settingsMap[row.key] = row.value;
  }

  return {
    revision: Number(settingsMap.content_revision || 0),
    services,
    pricing,
    projects,
    partners,
    extras,
    settings: {
      hero_background: settingsMap.hero_background || '',
      hero_design: parseJsonUnknown(settingsMap.hero_design),
      cta_design: parseJsonUnknown(settingsMap.cta_design),
      contact_hero_design: parseJsonUnknown(settingsMap.contact_hero_design),
      hero_cycles: parseJsonUnknown(settingsMap.hero_cycles),
      payment_methods: parseJsonUnknown(settingsMap.payment_methods),
      home_sections: parseJsonUnknown(settingsMap.home_sections),
      why_choose_us: parseJsonUnknown(settingsMap.why_choose_us),
      service_pages: parseJsonUnknown(settingsMap.service_pages),
      navbar_logo: settingsMap.navbar_logo || '',
      favicon_icon: settingsMap.favicon_icon || '',
      browser_title: settingsMap.browser_title || '',
      manifest_icon: settingsMap.manifest_icon || '',
      footer_socials: parseJsonUnknown(settingsMap.footer_socials),
      contact_cards: parseJsonUnknown(settingsMap.contact_cards),
      faq_home: parseJsonUnknown(settingsMap.faq_home),
      faq_page: parseJsonUnknown(settingsMap.faq_page),
      approach_items: parseJsonUnknown(settingsMap.approach_items),
      built_for_zimbabwe: parseJsonUnknown(settingsMap.built_for_zimbabwe),
    },
  };
}

export function isUrlPath(value: string): boolean {
  if (value.length > 500) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  return /^https:\/\//i.test(value);
}

export function isSafeLink(value: string): boolean {
  if (!value || value.length > 500) return false;
  if (isUrlPath(value)) return true;
  return /^(mailto:|tel:)/i.test(value);
}

const GRADIENT_PATTERN = /^\d{1,3}deg\s*,\s*(#[0-9a-fA-F]{3,8}\s*,\s*){0,3}#[0-9a-fA-F]{3,8}$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

export function isGradient(value: string): boolean {
  if (!value || value.length > 200) return false;
  return GRADIENT_PATTERN.test(value.trim());
}

export function isHexColor(value: string): boolean {
  if (!value || value.length > 20) return false;
  return HEX_COLOR_PATTERN.test(value.trim());
}

function text(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max) : '';
}

function entries(v: unknown, max: number): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .slice(0, max);
}

export function sanitizeSetting(key: string, value: unknown): string | null {
  if (URL_SETTINGS.includes(key as any)) {
    if (typeof value !== 'string' || !isUrlPath(value)) return null;
    return value;
  }

  if (key === 'browser_title') {
    const cleaned = text(value, 200).trim();
    if (!cleaned) return null;
    return cleaned;
  }

  switch (key) {
    case 'hero_design':
      { const design = upgradeHeroDesign(value); return design ? JSON.stringify(design) : null; }
    case 'cta_design':
    case 'contact_hero_design':
      return validDesign(value) ? JSON.stringify(value) : null;
    case 'hero_cycles': {
      const cleaned = entries(value, 16)
        .map((x) => ({
          headline_word: text(x.headline_word, 100).trim(),
          question: text(x.question, 500).trim(),
          solution: text(x.solution, 1000).trim(),
          image: text(x.image, 500).trim(),
          href: text(x.href, 500).trim(),
        }))
        .filter((x) => x.question && x.solution && isUrlPath(x.image) && isUrlPath(x.href));
      if (cleaned.length === 0) return null;
      return JSON.stringify(cleaned);
    }
    case 'payment_methods': {
      // Validate the full list before saving; never silently drop edited logos.
      if (!Array.isArray(value) || value.length > 24) return null;
      const cleaned = value.map((x, idx) => ({
        id: text(x?.id, 80).trim() || `pm_${idx}`,
        name: text(x?.name, 120).trim(),
        logo: text(x?.logo, 500).trim(),
        visible: x?.visible !== false && x?.visible !== 0 && x?.visible !== '0',
      }));
      if (cleaned.some(x => !x.name || !x.logo || !isUrlPath(x.logo)) || new Set(cleaned.map(x => x.id)).size !== cleaned.length) return null;
      return JSON.stringify(cleaned);
    }
    case 'why_choose_us': {
      if (!Array.isArray(value) || value.length > 20) return null;
      const cleaned = entries(value, 20)
        .map((x) => {
          const icon = text(x.icon, 500).trim();
          return {
            title: text(x.title, 200).trim(),
            body: text(x.body, 1000).trim(),
            icon: icon && (!icon.includes(':') || isUrlPath(icon)) ? icon : '',
          };
        })
        .filter((x) => x.title && x.body);
      if (cleaned.length !== value.length) return null;
      return JSON.stringify(cleaned);
    }
    case 'service_pages': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const out: Record<string, any> = {};
      for (const [id, raw] of Object.entries(value as Record<string, any>)) {
        if (!raw || typeof raw !== 'object') continue;
        const whatItems = entries(raw.what_items, 30)
          .map((x) => ({ title: text(x.title, 200).trim(), body: text(x.body, 800).trim() }))
          .filter((x) => x.title);
        const processSteps = entries(raw.process_steps, 20)
          .map((x) => ({ title: text(x.title, 200).trim(), body: text(x.body, 800).trim() }))
          .filter((x) => x.title);
        const toolsItems = entries(raw.tools_items, 30)
          .map((x) => {
            const logo = text(x.logo, 500).trim();
            return {
              name: text(x.name, 120).trim(),
              logo,
            };
          })
          .filter((x) => x.name);
        const domainPrices = entries(raw.domain_prices, 20)
          .map((x) => ({
            extension: text(x.extension, 40).trim(),
            price: text(x.price, 60).trim(),
            registration_time: text(x.registration_time, 120).trim(),
          }))
          .filter((x) => x.extension && x.price);
        const emailPlans = entries(raw.email_plans, 20)
          .map((x) => ({
            plan: text(x.plan, 80).trim(),
            price: text(x.price, 60).trim(),
            mailboxes: text(x.mailboxes, 120).trim(),
          }))
          .filter((x) => x.plan && x.price);

        for (const [field, cleaned, limit] of [
          ['what_items', whatItems, 30], ['process_steps', processSteps, 20], ['tools_items', toolsItems, 30],
          ['domain_prices', domainPrices, 20], ['email_plans', emailPlans, 20],
        ] as const) {
          if (raw[field] !== undefined && (!Array.isArray(raw[field]) || raw[field].length > limit || cleaned.length !== raw[field].length)) return null;
        }
        if (toolsItems.some(tool => tool.logo && !isUrlPath(tool.logo))) return null;
        const ctaUrl = text(raw.cta_url, 500).trim();
        if (ctaUrl && !isSafeLink(ctaUrl)) return null;
        out[id] = {
          service_id: id,
          problem_text: text(raw.problem_text, 2000).trim(),
          what_heading: text(raw.what_heading, 200).trim(),
          what_intro: text(raw.what_intro, 1000).trim(),
          what_items: whatItems,
          price_range: text(raw.price_range, 200).trim(),
          price_summary: text(raw.price_summary, 500).trim(),
          price_note: text(raw.price_note, 800).trim(),
          hosting_price: text(raw.hosting_price, 120).trim(),
          domain_prices: domainPrices,
          email_plans: emailPlans,
          process_steps: processSteps,
          tools_items: toolsItems,
          tools_note: text(raw.tools_note, 300).trim(),
          cta_heading: text(raw.cta_heading, 300).trim(),
          cta_body: text(raw.cta_body, 800).trim(),
          cta_button: text(raw.cta_button, 120).trim() || 'Talk to us on WhatsApp',
          cta_url: ctaUrl && isSafeLink(ctaUrl) ? ctaUrl : 'https://wa.me/263710740387',
        };
      }
      return JSON.stringify(out);
    }
    case 'home_sections': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const s = value as Record<string, unknown>;
      const color = (v: unknown, def: string) => {
        const c = text(v, 20).trim();
        return isHexColor(c) ? c : def;
      };
      return JSON.stringify({
        hero_headline_main: text(s.hero_headline_main, 300).trim() || 'Your business is working hard.',
        hero_headline_accent: text(s.hero_headline_accent, 300).trim() || 'The results should show it.',
        hero_bg: color(s.hero_bg, '#f8f8f6'),
        payment_label: text(s.payment_label, 200).trim() || 'We accept local payments',
        services_heading: text(s.services_heading, 300).trim() || 'One team. Every digital capability your organisation needs.',
        services_bg: color(s.services_bg, '#ffffff'),
        partners_heading: text(s.partners_heading, 300).trim() || 'Partners who trust us',
        partners_subheading:
          typeof s.partners_subheading === 'string' ? text(s.partners_subheading, 500).trim() :
          'Trusted by businesses, NGOs, and institutions across Zimbabwe.',
        partners_bg: color(s.partners_bg, '#f8f8f6'),
        how_it_works_heading: text(s.how_it_works_heading, 300).trim() || 'How we take your project from idea to launch.',
        how_it_works_bg: color(s.how_it_works_bg, '#f8fafc'),
        projects_heading: text(s.projects_heading, 300).trim() || 'Live work we have delivered.',
        projects_bg: color(s.projects_bg, '#f8fafc'),
        why_heading: text(s.why_heading, 300).trim() || 'Why choose us.',
        why_bg: color(s.why_bg, '#ffffff'),
        faq_heading: text(s.faq_heading, 300).trim() || 'Common questions.',
        faq_bg: color(s.faq_bg, '#f8fafc'),
        cta_heading: text(s.cta_heading, 300).trim() || 'Ready to get your business going?',
        cta_subheading: text(s.cta_subheading, 500).trim() || 'Tell us what you need and we will take it from there.',
        cta_bg: color(s.cta_bg, '#ffffff'),
      });
    }
    case 'footer_socials': {
      if (!Array.isArray(value) || value.length > 20) return null;
      const cleaned = entries(value, 20)
        .map((x) => ({
          label: text(x.label, 120).trim(),
          href: text(x.href, 500).trim(),
          icon: text(x.icon, 500).trim() || 'Globe',
        }))
        .filter((x) => x.label && isSafeLink(x.href));
      if (cleaned.length !== value.length) return null;
      return JSON.stringify(cleaned);
    }
    case 'contact_cards': {
      if (!Array.isArray(value) || value.length > 20) return null;
      const cleaned = entries(value, 20)
        .map((x) => ({
          title: text(x.title, 120).trim(),
          line: text(x.line, 300).trim(),
          note: text(x.note, 300).trim(),
          href: text(x.href, 500).trim(),
          icon: text(x.icon, 500).trim() || 'Mail',
        }))
        .filter((x) => x.title && (!x.href || isSafeLink(x.href)));
      if (cleaned.length !== value.length) return null;
      return JSON.stringify(cleaned);
    }
    case 'faq_home':
    case 'faq_page': {
      if (!Array.isArray(value) || value.length > 40) return null;
      const cleaned = entries(value, 40)
        .map((x) => ({
          q: text(x.q, 500).trim(),
          a: text(x.a, 3000).trim(),
        }))
        .filter((x) => x.q && x.a);
      if (cleaned.length !== value.length) return null;
      return JSON.stringify(cleaned);
    }
    case 'approach_items': {
      if (!Array.isArray(value) || value.length > 20) return null;
      const cleaned = entries(value, 20)
        .map((x) => ({
          title: text(x.title, 200).trim(),
          body: text(x.body, 600).trim(),
          icon: text(x.icon, 500).trim() || 'Globe',
        }))
        .filter((x) => x.title);
      if (cleaned.length !== value.length) return null;
      return JSON.stringify(cleaned);
    }
    case 'built_for_zimbabwe': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const v = value as Record<string, unknown>;
      const image = text(v.image, 500).trim();
      if (!image || !isUrlPath(image)) return null;
      return JSON.stringify({
        eyebrow: text(v.eyebrow, 200).trim(),
        heading: text(v.heading, 500).trim(),
        body: text(v.body, 3000).trim(),
        image,
      });
    }
    default:
      return null;
  }
}

/** Read every public content table from the Pages env binding. */
export async function readContent(env: { DB: D1Database }) {
  return readAllContent(env.DB);
}
