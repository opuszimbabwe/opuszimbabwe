// D1 content access helpers shared by the API routes.

import { Env } from './types';

export type DbService = {
  id: string;
  tagline: string;
  name: string;
  description: string;
  page_description: string;
  items: string;
  icon: string;
  gradient: string;
  slug: string;
  image: string;
  order_index: number;
  visible: number;
};

export type DbPricing = {
  id: string;
  name: string;
  monthly_price: string;
  yearly_price: string;
  features: string;
  order_index: number;
  visible: number;
};

export type DbExtras = {
  service_id: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_intro: string;
  hero_cta: string;
  hero_background: string;
  hero_background_kind: string;
  hero_gradient: string;
  why_items: string;
  related_items: string;
};

export type DbProject = {
  id: string;
  name: string;
  url: string;
  tag: string;
  location: string;
  description: string;
  status: string;
  order_index: number;
  visible: number;
};

// Settings whose value is a site-relative or https URL.
export const URL_SETTINGS = ['hero_background', 'navbar_logo', 'manifest_icon'] as const;
// Settings whose value is a JSON document (arrays, or the built_for_zimbabwe object).
export const JSON_SETTINGS = [
  'footer_socials',
  'contact_cards',
  'faq_home',
  'faq_page',
  'approach_items',
  'built_for_zimbabwe',
] as const;

export const ALL_SETTINGS: string[] = [...URL_SETTINGS, ...JSON_SETTINGS];

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function parseJsonUnknown(value: unknown): unknown | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapExtras(row: DbExtras) {
  return {
    service_id: row.service_id,
    hero_eyebrow: row.hero_eyebrow,
    hero_headline: row.hero_headline,
    hero_intro: row.hero_intro,
    hero_cta: row.hero_cta,
    hero_background: row.hero_background,
    hero_background_kind: row.hero_background_kind === 'gradient' ? 'gradient' : 'image',
    hero_gradient: row.hero_gradient,
    why_items: parseJsonUnknown(row.why_items) ?? [],
    related_items: parseJsonUnknown(row.related_items) ?? [],
  };
}

export async function readContent(env: Env) {
  const [serviceRows, pricingRows, projectRows, extrasRows, settingsRows] = await Promise.all([
    env.DB.prepare('SELECT * FROM services ORDER BY order_index, name').all<DbService>(),
    env.DB.prepare('SELECT * FROM pricing_cards ORDER BY order_index, name').all<DbPricing>(),
    env.DB.prepare('SELECT * FROM projects ORDER BY order_index, name').all<DbProject>(),
    env.DB.prepare('SELECT * FROM service_extras').all<DbExtras>(),
    env.DB.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>(),
  ]);

  const services = (serviceRows.results || []).map((row) => ({
    id: row.id,
    tagline: row.tagline,
    name: row.name,
    description: row.description,
    page_description: row.page_description,
    items: parseJsonArray(row.items),
    icon: row.icon,
    gradient: row.gradient,
    slug: row.slug,
    image: row.image,
    order_index: row.order_index,
    visible: row.visible === 1,
  }));

  const pricing = (pricingRows.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    monthly_price: row.monthly_price,
    yearly_price: row.yearly_price,
    features: parseJsonArray(row.features),
    order_index: row.order_index,
    visible: row.visible === 1,
  }));

  const projects = (projectRows.results || []).map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    tag: row.tag,
    location: row.location,
    description: row.description,
    status: row.status === 'coming_soon' ? 'coming_soon' : 'active',
    order_index: row.order_index,
    visible: row.visible === 1,
  }));

  // Keyed by service id so the site can look up a service page hero in one step.
  const extras: Record<string, ReturnType<typeof mapExtras>> = {};
  for (const row of extrasRows.results || []) {
    extras[row.service_id] = mapExtras(row);
  }

  const settingsMap: Record<string, string> = {};
  for (const row of settingsRows.results || []) {
    settingsMap[row.key] = row.value;
  }

  return {
    services,
    pricing,
    projects,
    extras,
    settings: {
      hero_background: settingsMap.hero_background || '',
      navbar_logo: settingsMap.navbar_logo || '',
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

// Links used in admin-managed content: site paths, https URLs, mailto: and tel:.
export function isSafeLink(value: string): boolean {
  if (!value || value.length > 500) return false;
  if (isUrlPath(value)) return true;
  return /^(mailto:|tel:)/i.test(value);
}

// Gradient strings produced by the admin gradient builder, e.g. "160deg,#1a1a1a,#454545".
const GRADIENT_PATTERN = /^\d{1,3}deg\s*,\s*(#[0-9a-fA-F]{3,8}\s*,\s*){0,3}#[0-9a-fA-F]{3,8}$/;

export function isGradient(value: string): boolean {
  if (!value || value.length > 200) return false;
  return GRADIENT_PATTERN.test(value.trim());
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

// Validate + normalise one admin-submitted setting. Returns the stored string
// value, or null when the value is unusable for that key.
export function sanitizeSetting(key: string, value: unknown): string | null {
  if (URL_SETTINGS.includes(key as any)) {
    if (typeof value !== 'string' || !isUrlPath(value)) return null;
    return value;
  }

  switch (key) {
    case 'footer_socials': {
      const cleaned = entries(value, 20)
        .map((x) => ({
          label: text(x.label, 120).trim(),
          href: text(x.href, 500).trim(),
          icon: text(x.icon, 60).trim() || 'Globe',
        }))
        .filter((x) => x.label && isSafeLink(x.href));
      if (cleaned.length === 0) return null;
      return JSON.stringify(cleaned);
    }
    case 'contact_cards': {
      const cleaned = entries(value, 20)
        .map((x) => ({
          title: text(x.title, 120).trim(),
          line: text(x.line, 300).trim(),
          note: text(x.note, 300).trim(),
          href: text(x.href, 500).trim(),
          icon: text(x.icon, 60).trim() || 'Mail',
        }))
        .filter((x) => x.title && (!x.href || isSafeLink(x.href)));
      if (cleaned.length === 0) return null;
      return JSON.stringify(cleaned);
    }
    case 'faq_home':
    case 'faq_page': {
      const cleaned = entries(value, 40)
        .map((x) => ({ q: text(x.q, 500).trim(), a: text(x.a, 3000).trim() }))
        .filter((x) => x.q && x.a);
      if (cleaned.length === 0) return null;
      return JSON.stringify(cleaned);
    }
    case 'approach_items': {
      const cleaned = entries(value, 12)
        .map((x) => ({
          title: text(x.title, 200).trim(),
          body: text(x.body, 600).trim(),
          icon: text(x.icon, 60).trim() || 'Globe',
        }))
        .filter((x) => x.title);
      if (cleaned.length === 0) return null;
      return JSON.stringify(cleaned);
    }
    case 'built_for_zimbabwe': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
      const source = value as Record<string, unknown>;
      const image = text(source.image, 500).trim();
      if (image && !isUrlPath(image)) return null;
      return JSON.stringify({
        eyebrow: text(source.eyebrow, 200).trim(),
        heading: text(source.heading, 500).trim(),
        body: text(source.body, 3000).trim(),
        image,
      });
    }
    default:
      return null;
  }
}
