#!/usr/bin/env node
// End-to-end smoke test for the admin API + static site.
// Requires the local Pages server: npm run build && npm run pages:local
// Usage: node scripts/smoke-api.mjs [baseUrl]

const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:8788';

const ACCESS_HEADERS = {
  'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com',
  'Cf-Access-Jwt-Assertion': 'local-smoke-test-token',
};

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

async function req(path, { method = 'GET', headers = {}, body, raw = false } = {}) {
  const res = await fetch(BASE + path, { method, headers, body, redirect: 'manual' });
  if (raw) return { res, buf: Buffer.from(await res.arrayBuffer()) };
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { res, text, json };
}

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

async function main() {
  console.log(`Smoke-testing ${BASE}\n`);

  console.log('Static site:');
  {
    const { res, text } = await req('/');
    check('GET / responds 200 HTML', res.status === 200 && (res.headers.get('content-type') || '').includes('text/html'));
    check('home renders static fallback service card', text.includes('Website Design &amp; Development') && text.includes('/images/service-web-design.png'));
  }
  {
    const { res, text } = await req('/admin/');
    check('GET /admin/ responds 200', res.status === 200);
    check('/admin is noindex', text.includes('noindex'));
    check('/admin renders dashboard shell', text.includes('Content admin'));
  }
  {
    const { res, text } = await req('/robots.txt');
    check('robots.txt disallows /admin/', res.status === 200 && text.includes('/admin/'));
  }

  console.log('\nPublic content API:');
  let content;
  {
    const { res, json } = await req('/api/content');
    check('GET /api/content responds 200 JSON', res.status === 200 && !!json);
    content = json;
    check('6 services from D1', Array.isArray(content?.services) && content.services.length === 6, `got ${content?.services?.length}`);
    check('3 pricing cards from D1', Array.isArray(content?.pricing) && content.pricing.length === 3, `got ${content?.pricing?.length}`);
    check('hero background setting', content?.settings?.hero_background === '/images/hero-bg.jpg', content?.settings?.hero_background);
  }

  console.log('\nAccess control (simulated Cloudflare Access):');
  {
    const { res, json } = await req('/api/admin/session');
    check('session rejected without Access headers (401)', res.status === 401 && json?.error === 'unauthorized');
  }
  {
    const { res, json } = await req('/api/admin/session', { headers: ACCESS_HEADERS });
    check('session accepted with Access headers', res.status === 200 && json?.email === 'info.opuszim@gmail.com', json?.email);
  }
  {
    const { res } = await req('/api/admin/session', {
      headers: { ...ACCESS_HEADERS, 'Cf-Access-Authenticated-User-Email': 'intruder@example.com' },
    });
    check('wrong email rejected (401)', res.status === 401);
  }
  {
    const { res } = await req('/api/admin/session', {
      headers: { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com' },
    });
    check('email header without JWT rejected (401)', res.status === 401);
  }
  {
    const { res } = await req('/api/admin/pricing', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cards: [] }),
    });
    check('mutation without Access headers rejected (401)', res.status === 401);
  }

  console.log('\nService card editing:');
  {
    const before = await req('/api/content');
    const original = before.json?.services?.find((s) => s.id === 'web-design');
    check('web-design row intact before test', original?.image === '/images/service-web-design.png' && (original?.items || []).length > 0);

    const { res, json } = await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'web-design', tagline: 'SMOKE TEST TAGLINE' }),
    });
    check('PATCH service succeeds', res.status === 200 && json?.ok === true);
    const after = await req('/api/content');
    const changed = after.json?.services?.find((s) => s.id === 'web-design');
    check('change visible via /api/content', changed?.tagline === 'SMOKE TEST TAGLINE');
    check('other fields untouched by partial PATCH', changed?.image === original?.image && changed?.description === original?.description && (changed?.items || []).length === (original?.items || []).length);

    // restore
    await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'web-design', tagline: 'Online Presence' }),
    });
    const restored = await req('/api/content');
    const back = restored.json?.services?.find((s) => s.id === 'web-design');
    check('service restored', back?.tagline === 'Online Presence' && back?.image === '/images/service-web-design.png');
  }
  {
    const { res } = await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'no-such-service', name: 'Nope' }),
    });
    check('PATCH unknown service returns 404', res.status === 404);
  }

  console.log('\nPricing card add/edit/remove:');
  {
    const { res, json } = await req('/api/admin/pricing', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        cards: [
          { id: 'starter', name: 'Starter', monthly_price: '$35', yearly_price: '$30/mo', features: ['Edited feature'], visible: true },
          { id: '', name: 'Smoke Plan', monthly_price: '$9', yearly_price: '$9/mo', features: ['Test only'], visible: true },
        ],
      }),
    });
    check('PUT pricing (edit + add + remove) succeeds', res.status === 200 && json?.count === 2, `count=${json?.count}`);
    const after = await req('/api/content');
    const cards = after.json?.pricing || [];
    check('now 2 cards', cards.length === 2, `got ${cards.length}`);
    check('edited price applied', cards.find((c) => c.id === 'starter')?.monthly_price === '$35');
    check('new card present', cards.some((c) => c.name === 'Smoke Plan'));

    // restore the seeded 3 cards
    await req('/api/admin/pricing', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        cards: [
          { id: 'starter', name: 'Starter', monthly_price: '$30', yearly_price: '$25/mo', features: ['Up to 5 pages', 'Mobile responsive', 'Contact form', 'Basic SEO setup', 'SSL certificate', '3-7 day delivery'], visible: true },
          { id: 'professional', name: 'Professional', monthly_price: '$60', yearly_price: '$50/mo', features: ['Up to 10 pages', 'Mobile responsive', 'Contact & enquiry forms', 'Full SEO optimisation', 'SSL certificate', 'WhatsApp integration', '1-2 week delivery'], visible: true },
          { id: 'custom', name: 'Custom', monthly_price: "Let's talk", yearly_price: "Let's talk", features: ['Unlimited pages', 'Custom functionality', 'E-commerce or booking', 'API integrations', 'Ongoing support included', 'Custom timeline'], visible: true },
        ],
      }),
    });
    const restored = await req('/api/content');
    check('pricing restored to 3 seeded cards', restored.json?.pricing?.length === 3 && restored.json?.pricing?.[0]?.monthly_price === '$30');
  }

  console.log('\nHero background setting:');
  {
    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ hero_background: '/images/gold-wave-bg.jpg' }),
    });
    check('PUT settings succeeds', res.status === 200);
    const after = await req('/api/content');
    check('hero background updated', after.json?.settings?.hero_background === '/images/gold-wave-bg.jpg');
    await req('/api/admin/settings', { method: 'PUT', headers: ACCESS_HEADERS, body: JSON.stringify({ hero_background: '/images/hero-bg.jpg' }) });
    const restored = await req('/api/content');
    check('hero background restored', restored.json?.settings?.hero_background === '/images/hero-bg.jpg');
  }
  {
    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ hero_background: 'javascript:alert(1)' }),
    });
    check('unsafe URL rejected (400)', res.status === 400);
  }

  console.log('\nR2 image upload:');
  let uploadedUrl;
  {
    const { res } = await req('/api/admin/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nope: true }),
    });
    check('non-multipart upload rejected (400/401)', res.status === 400 || res.status === 401);
  }
  {
    const form = new FormData();
    form.append('file', new Blob([tinyPng], { type: 'image/png' }), 'smoke.png');
    const res = await fetch(BASE + '/api/admin/upload', { method: 'POST', headers: ACCESS_HEADERS, body: form });
    const json = await res.json().catch(() => null);
    check('upload with Access headers succeeds', res.status === 200 && !!json?.url, json?.url || `HTTP ${res.status}`);
    uploadedUrl = json?.url;
  }
  {
    const form = new FormData();
    form.append('file', new Blob([tinyPng], { type: 'image/png' }), 'smoke.png');
    const res = await fetch(BASE + '/api/admin/upload', { method: 'POST', body: form });
    check('upload without Access headers rejected (401)', res.status === 401);
  }
  if (uploadedUrl) {
    const { res, buf } = await req(uploadedUrl, { raw: true });
    check('uploaded image served from R2 (public GET)', res.status === 200 && (res.headers.get('content-type') || '').includes('image/png'));
    check('served bytes match upload', buf.equals(tinyPng));
    check('media responses are cached', (res.headers.get('cache-control') || '').includes('immutable'));
  }
  {
    const { res } = await req('/api/media/not-a-real-key.jpg');
    check('missing media key returns 404', res.status === 404);
    const bad = await req('/api/media/../../etc/passwd');
    check('path traversal key rejected', bad.res.status === 404 || bad.res.status === 400);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
