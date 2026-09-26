#!/usr/bin/env node
// Local database checks: verifies the D1 schema and seed content applied by
// `npm run db:migrate:local` using `wrangler d1 execute --local`.

import { execFileSync } from 'node:child_process';

const DB = 'opuszim-content';

function query(sql) {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', DB, '--local', '--json', '--command', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WRANGLER_SEND_METRICS: 'false', CI: '1' } }
  );
  const start = out.indexOf('[');
  if (start === -1) throw new Error(`Unexpected wrangler output:\n${out}`);
  const parsed = JSON.parse(out.slice(start));
  return parsed[0]?.results ?? [];
}

let failures = 0;
function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function parseJson(label, value) {
  try {
    return JSON.parse(value);
  } catch {
    check(label, false, 'invalid JSON');
    return null;
  }
}

console.log('Checking local D1 database (opuszim-content)...\n');

// 1. Tables exist
const tables = query("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('services','pricing_cards','settings','service_extras','projects','partners') ORDER BY name");
console.log('Schema:');
check(
  'tables exist (services, pricing_cards, settings, service_extras, projects, partners)',
  tables.length === 6,
  tables.map((t) => t.name).join(', ')
);

// 2. Seed counts
console.log('\nSeed content:');
const services = query('SELECT id, name, slug, icon, image, order_index, visible, items FROM services ORDER BY order_index');
check('6 service rows', services.length === 6, `found ${services.length}`);
const expectedIds = ['web-design', 'software-development', 'ai-automation', 'graphic-design', 'domains-hosting', 'api-integrations'];
check('service ids match static fallback', JSON.stringify(services.map((s) => s.id)) === JSON.stringify(expectedIds));
check(
  'service images are static paths',
  services.every((s) => typeof s.image === 'string' && s.image.startsWith('/images/'))
);
let itemsOk = true;
for (const s of services) {
  try {
    const parsed = JSON.parse(s.items);
    if (!Array.isArray(parsed) || parsed.length === 0) itemsOk = false;
  } catch {
    itemsOk = false;
  }
}
check('service items JSON parses for every row', itemsOk);

const pricing = query('SELECT id, name, monthly_price, yearly_price, features, order_index FROM pricing_cards ORDER BY order_index');
check('3 pricing cards', pricing.length === 3, `found ${pricing.length}`);
check('pricing names (Starter, Professional, Custom)', JSON.stringify(pricing.map((p) => p.name)) === JSON.stringify(['Starter', 'Professional', 'Custom']));
let featuresOk = true;
for (const p of pricing) {
  try {
    const parsed = JSON.parse(p.features);
    if (!Array.isArray(parsed) || parsed.length === 0) featuresOk = false;
  } catch {
    featuresOk = false;
  }
}
check('pricing features JSON parses for every row', featuresOk);

const hero = query("SELECT value FROM settings WHERE key='hero_background'");
check('hero_background setting present', hero.length === 1 && hero[0].value === '/images/hero-bg.jpg', hero[0]?.value);

// 3. Service page heroes, Why Opus cards and related links (migration 0003)
console.log('\nService heroes / Why Opus / related:');
const extras = query('SELECT service_id, hero_eyebrow, hero_headline, hero_intro, hero_cta, hero_background, hero_background_kind, hero_gradient, why_items, related_items FROM service_extras ORDER BY service_id');
check('6 service_extras rows', extras.length === 6, `found ${extras.length}`);
check(
  'one extras row per service',
  JSON.stringify(extras.map((e) => e.service_id).sort()) === JSON.stringify([...expectedIds].sort())
);
check(
  'hero headline + intro + cta set for every row',
  extras.every((e) => e.hero_headline && e.hero_intro && e.hero_cta)
);
check(
  'hero background is a site path for every row',
  extras.every((e) => typeof e.hero_background === 'string' && e.hero_background.startsWith('/images/'))
);
check(
  'hero background kind is image or gradient',
  extras.every((e) => e.hero_background_kind === 'image' || e.hero_background_kind === 'gradient')
);
check(
  'hero gradient is well formed',
  extras.every((e) => /^\d{1,3}deg\s*,\s*(#[0-9a-fA-F]{3,8}\s*,\s*){0,3}#[0-9a-fA-F]{3,8}$/.test((e.hero_gradient || '').trim()))
);
let whyOk = true;
let relatedOk = true;
for (const e of extras) {
  const why = parseJson('why_items JSON parses', e.why_items);
  const related = parseJson('related_items JSON parses', e.related_items);
  if (!Array.isArray(why) || why.length === 0 || why.some((x) => !x || !x.title)) whyOk = false;
  if (!Array.isArray(related) || related.length === 0 || related.some((x) => !x || !x.label || !x.href)) relatedOk = false;
}
check('why_items: every row has titled cards', whyOk);
check('related_items: every row has labelled links', relatedOk);

// 4. Projects (migration 0003)
console.log('\nProjects:');
const projects = query('SELECT id, name, url, tag, location, description, status, order_index, visible FROM projects ORDER BY order_index');
check('4 project rows', projects.length === 4, `found ${projects.length}`);
check(
  'project names (Great Couples, Prime PIDG, ZimTrade, Agricom)',
  ['Great Couples International Trust', 'Prime Property Investment & Development Group', 'ZimTrade Export Platform', 'Agricom Commodity Marketplace'].every(
    (name) => projects.some((p) => p.name === name)
  )
);
check(
  'statuses are active or coming_soon',
  projects.every((p) => p.status === 'active' || p.status === 'coming_soon')
);
check(
  'active projects have an https link, coming_soon projects have none',
  projects.every((p) => (p.status === 'active' ? /^https:\/\//.test(p.url) : p.url === ''))
);

// 5. Trusted partners (migration 0004)
console.log('\nTrusted partners:');
const partners = query('SELECT id, name, logo, url, order_index, visible FROM partners ORDER BY order_index');
check('4 partner rows', partners.length === 4, `found ${partners.length}`);
check(
  'partner names (Great Couples, ForgePoint, Rays of Hope, Killing Giants)',
  ['Great Couples International Trust', 'ForgePoint Technologies', 'Rays of Hope Academy', 'Killing Giants'].every(
    (name) => partners.some((p) => p.name === name)
  )
);
check(
  'partner logos are site paths',
  partners.every((p) => typeof p.logo === 'string' && p.logo.startsWith('/images/'))
);
check(
  'partner URLs are empty or https',
  partners.every((p) => p.url === '' || /^https:\/\//.test(p.url))
);

// 6. Branding / home / FAQ settings (migration 0003)
console.log('\nBranding, home & FAQ settings:');
const settingsRows = query('SELECT key, value FROM settings');
const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
check('navbar_logo setting present', settingsMap.navbar_logo === '/images/logo.png', settingsMap.navbar_logo);
check('manifest_icon setting present', settingsMap.manifest_icon === '/images/icon-512.png', settingsMap.manifest_icon);

const socials = parseJson('footer_socials JSON parses', settingsMap.footer_socials);
check('footer_socials has 5 links with labels + hrefs', Array.isArray(socials) && socials.length === 5 && socials.every((s) => s && s.label && s.href && s.icon));

const contactCards = parseJson('contact_cards JSON parses', settingsMap.contact_cards);
check('contact_cards has 3 cards with titles + hrefs', Array.isArray(contactCards) && contactCards.length === 3 && contactCards.every((c) => c && c.title && c.href && c.icon));

const faqHome = parseJson('faq_home JSON parses', settingsMap.faq_home);
check('faq_home has question/answer pairs', Array.isArray(faqHome) && faqHome.length >= 3 && faqHome.every((f) => f && f.q && f.a));

const faqPage = parseJson('faq_page JSON parses', settingsMap.faq_page);
check('faq_page has question/answer pairs', Array.isArray(faqPage) && faqPage.length >= 8 && faqPage.every((f) => f && f.q && f.a));

const approach = parseJson('approach_items JSON parses', settingsMap.approach_items);
check('approach_items has 5 steps with icons', Array.isArray(approach) && approach.length === 5 && approach.every((a) => a && a.title && a.body && a.icon));

const built = parseJson('built_for_zimbabwe JSON parses', settingsMap.built_for_zimbabwe);
check(
  'built_for_zimbabwe has heading, body and image',
  built && typeof built === 'object' && !Array.isArray(built) && Boolean(built.eyebrow && built.heading && built.body && built.image)
);

// 7. Write round-trip (update + restore) to prove the database is writable
console.log('\nWrite round-trip:');
try {
  query("UPDATE settings SET value='/tmp/db-check-probe.png' WHERE key='hero_background'");
  const probe = query("SELECT value FROM settings WHERE key='hero_background'");
  check('settings update works', probe[0]?.value === '/tmp/db-check-probe.png');
  query("UPDATE settings SET value='/images/hero-bg.jpg' WHERE key='hero_background'");
  const restored = query("SELECT value FROM settings WHERE key='hero_background'");
  check('settings restored to default', restored[0]?.value === '/images/hero-bg.jpg');
} catch (err) {
  check('settings write round-trip', false, err.message);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) FAILED`);
  process.exit(1);
}
console.log('\nAll local database checks passed.');
