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

export async function readContent(env: Env) {
  const [serviceRows, pricingRows, heroRow] = await Promise.all([
    env.DB.prepare('SELECT * FROM services ORDER BY order_index, name').all<DbService>(),
    env.DB.prepare('SELECT * FROM pricing_cards ORDER BY order_index, name').all<DbPricing>(),
    env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind('hero_background').first<{ value: string }>(),
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

  return {
    services,
    pricing,
    settings: { hero_background: heroRow?.value || '/images/hero-bg.jpg' },
  };
}

export function isUrlPath(value: string): boolean {
  if (value.length > 500) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  return /^https:\/\//i.test(value);
}
