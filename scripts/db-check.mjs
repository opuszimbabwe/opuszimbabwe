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

console.log('Checking local D1 database (opuszim-content)...\n');

// 1. Tables exist
const tables = query("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('services','pricing_cards','settings') ORDER BY name");
console.log('Schema:');
check('tables exist (services, pricing_cards, settings)', tables.length === 3, tables.map((t) => t.name).join(', '));

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

// 3. Write round-trip (update + restore) to prove the database is writable
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
