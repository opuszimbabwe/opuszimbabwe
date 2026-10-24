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
const services = query('SELECT id, name, slug, icon, image, card_bg_color, order_index, visible, items FROM services ORDER BY order_index');
check('6 service rows', services.length === 6, `found ${services.length}`);
const expectedIds = ['web-design', 'software-development', 'ai-automation', 'graphic-design', 'domains-hosting', 'api-integrations'];
check('service ids match static fallback', JSON.stringify(services.map((s) => s.id)) === JSON.stringify(expectedIds));
check(
  'service images are static paths',
  services.every((s) => typeof s.image === 'string' && s.image.startsWith('/images/'))
);
check(
  'service card_bg_color is a hex colour for every row',
  services.every((s) => typeof s.card_bg_color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(s.card_bg_color))
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
check('6 pricing cards', pricing.length === 6, `found ${pricing.length}`);
check(
  'pricing names (Starter, Standard, Business, Professional, Premium, Custom)',
  JSON.stringify(pricing.map((p) => p.name)) ===
    JSON.stringify(['Starter', 'Standard', 'Business', 'Professional', 'Premium', 'Custom'])
);
check(
  'pricing cards use price ranges',
  pricing.every((p) => /\$|custom/i.test(p.monthly_price)) &&
    pricing[0].monthly_price === '$30 – $59.99' &&
    pricing[5].monthly_price === 'Custom quote',
  pricing.map((p) => p.monthly_price).join(' | ')
);
check(
  'pricing cards describe what they cover',
  pricing.every((p) => typeof p.yearly_price === 'string' && p.yearly_price.length > 5)
);
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

// 2b. Individual service page content (migration 0008)
console.log('\nIndividual service pages:');
const servicePagesRow = query("SELECT value FROM settings WHERE key='service_pages'");
check('service_pages setting present', servicePagesRow.length === 1, `${servicePagesRow.length} rows`);
let servicePages = {};
try {
  servicePages = JSON.parse(servicePagesRow[0]?.value || '{}');
} catch {
  servicePages = {};
}
check(
  'service_pages has all 6 services',
  JSON.stringify(Object.keys(servicePages).sort()) === JSON.stringify([...expectedIds].sort()),
  Object.keys(servicePages).join(', ')
);
check(
  'every service page has problem, what, price and process content',
  Object.values(servicePages).every(
    (p) =>
      p.problem_text &&
      p.what_heading &&
      Array.isArray(p.what_items) &&
      p.what_items.length > 0 &&
      p.price_range &&
      p.price_summary &&
      Array.isArray(p.process_steps) &&
      p.process_steps.length > 0 &&
      p.cta_heading &&
      p.cta_url === 'https://wa.me/263710740387'
  )
);
check(
  'web design price range seeded',
  servicePages['web-design']?.price_range === '$30 – $1,000+',
  servicePages['web-design']?.price_range
);
check(
  'domains page has domain table + email plans',
  (servicePages['domains-hosting']?.domain_prices || []).length === 6 &&
    (servicePages['domains-hosting']?.email_plans || []).length === 3
);
check(
  'tools logos are site paths for every page',
  Object.values(servicePages).every((p) =>
    (p.tools_items || []).every((t) => typeof t.logo === 'string' && t.logo.startsWith('/images/'))
  )
);
const brandTitle = query("SELECT value FROM settings WHERE key='browser_title'");
check('browser_title setting present', brandTitle.length === 1 && brandTitle[0].value.length > 5, brandTitle[0]?.value);
const favicon = query("SELECT value FROM settings WHERE key='favicon_icon'");
check('favicon_icon setting present', favicon.length === 1 && favicon[0].value.startsWith('/images/'), favicon[0]?.value);

// 3. Service page heroes, Why Opus cards and related links (migration 0003)
console.log('\nService heroes / Why Opus / related:');
const extras = query('SELECT service_id, hero_eyebrow, hero_headline, hero_intro, hero_cta, hero_background, visual_background, hero_background_kind, hero_gradient, why_items, related_items FROM service_extras ORDER BY service_id');
check('6 service_extras rows', extras.length === 6, `found ${extras.length}`);
check(
  'one extras row per service',
  JSON.stringify(extras.map((e) => e.service_id).sort()) === JSON.stringify([...expectedIds].sort())
);
check(
  'hero headline + intro + cta set for every row',
  extras.every((e) => e.hero_headline && e.hero_intro && e.hero_cta)
);
const headlineFor = (id) => extras.find((e) => e.service_id === id)?.hero_headline;
check(
  'web design hero headline matches brief',
  headlineFor('web-design') === 'Website design. Built for business.'
);
check(
  'software hero headline matches brief',
  headlineFor('software-development') === 'Software built around the way your organisation actually works.'
);
check(
  'graphic design hero headline matches brief',
  headlineFor('graphic-design') === 'Your brand is the first impression. Make it the right one.'
);
check(
  'api integrations hero headline matches brief',
  headlineFor('api-integrations') === 'Your systems should work together. We make sure they do.'
);
check(
  'hero background is a site path for every row',
  extras.every((e) => typeof e.hero_background === 'string' && e.hero_background.startsWith('/images/'))
);
check(
  'visual/example image is set for every row',
  extras.every((e) => typeof e.visual_background === 'string' && e.visual_background.startsWith('/images/'))
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

// 4. Projects (live projects only — ZimTrade & Agricom removed)
console.log('\nProjects:');
const projects = query('SELECT id, name, url, tag, location, description, screenshot, status, order_index, visible FROM projects ORDER BY order_index');
check('2 live project rows', projects.length === 2, `found ${projects.length}`);
check(
  'project names (Great Couples, Prime PIDG)',
  ['Great Couples International Trust', 'Prime Property Investment & Development Group'].every(
    (name) => projects.some((p) => p.name === name)
  )
);
check(
  'ZimTrade and Agricom removed permanently',
  !projects.some((p) => p.id === 'zimtrade' || p.id === 'agricom')
);
check(
  'all projects are active with an https link',
  projects.every((p) => p.status === 'active' && /^https:\/\//.test(p.url))
);
check(
  'projects have a screenshot column (empty until admin uploads)',
  projects.every((p) => typeof p.screenshot === 'string' && (p.screenshot === '' || p.screenshot.startsWith('/') || p.screenshot.startsWith('https://')))
);

// 5. Trusted partners (migration 0004 + 0007 bg_color)
console.log('\nTrusted partners:');
const partners = query('SELECT id, name, logo, url, bg_color, order_index, visible FROM partners ORDER BY order_index');
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
  'Killing Giants has black background (#000000)',
  partners.find((p) => p.id === 'killing-giants')?.bg_color === '#000000'
);
check(
  'partner URLs are empty or https',
  partners.every((p) => p.url === '' || /^https:\/\//.test(p.url))
);

// 6. Branding / home / FAQ settings (migration 0003)
console.log('\nBranding, home & FAQ settings:');
const settingsRows = query('SELECT key, value FROM settings');
const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
check('navbar_logo uses the transparent logo', settingsMap.navbar_logo === '/images/logo-full.png', settingsMap.navbar_logo);
check('manifest_icon setting present', settingsMap.manifest_icon === '/images/icon-512.png', settingsMap.manifest_icon);

const socials = parseJson('footer_socials JSON parses', settingsMap.footer_socials);
check('footer_socials has 5 links with labels + hrefs', Array.isArray(socials) && socials.length === 5 && socials.every((s) => s && s.label && s.href && s.icon));

const contactCards = parseJson('contact_cards JSON parses', settingsMap.contact_cards);
check('contact_cards has 4 cards with titles + hrefs', Array.isArray(contactCards) && contactCards.length === 4 && contactCards.every((c) => c && c.title && c.href && c.icon));

const faqHome = parseJson('faq_home JSON parses', settingsMap.faq_home);
check('faq_home has question/answer pairs', Array.isArray(faqHome) && faqHome.length >= 3 && faqHome.every((f) => f && f.q && f.a));

const faqPage = parseJson('faq_page JSON parses', settingsMap.faq_page);
check('faq_page has question/answer pairs', Array.isArray(faqPage) && faqPage.length >= 8 && faqPage.every((f) => f && f.q && f.a));

const approach = parseJson('approach_items JSON parses', settingsMap.approach_items);
check('approach_items has 5 steps with icons', Array.isArray(approach) && approach.length === 5 && approach.every((a) => a && a.title && a.body && a.icon));

const heroCycles = parseJson('hero_cycles JSON parses', settingsMap.hero_cycles);
check(
  'hero_cycles has 6 cycles with question, solution, image and href',
  Array.isArray(heroCycles) &&
    heroCycles.length === 6 &&
    heroCycles.every((c) => c && c.question && c.solution && c.image && c.href)
);

const paymentMethods = parseJson('payment_methods JSON parses', settingsMap.payment_methods);
check(
  'payment_methods has 5 methods with logos',
  Array.isArray(paymentMethods) &&
    paymentMethods.length === 5 &&
    paymentMethods.every((m) => m && m.name && m.logo)
);

const whyChooseUs = parseJson('why_choose_us JSON parses', settingsMap.why_choose_us);
check(
  'why_choose_us has 6 reason cards',
  Array.isArray(whyChooseUs) &&
    whyChooseUs.length === 6 &&
    whyChooseUs.every((w) => w && w.title && w.body)
);

const homeSections = parseJson('home_sections JSON parses', settingsMap.home_sections);
check(
  'home headings do not over-emphasise "real"',
  homeSections &&
    !/real/i.test(homeSections.projects_heading || '') &&
    !/real/i.test(homeSections.partners_heading || '')
);
check(
  'Trusted By subheading seeded',
  (homeSections?.partners_subheading || '').includes(
    'Trusted by businesses, NGOs, and institutions across Zimbabwe.'
  )
);
check(
  'home_sections has "Partners who trust us" and white backgrounds',
  homeSections &&
    homeSections.partners_heading === 'Partners who trust us' &&
    homeSections.services_bg === '#ffffff' &&
    homeSections.partners_bg === '#ffffff'
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
