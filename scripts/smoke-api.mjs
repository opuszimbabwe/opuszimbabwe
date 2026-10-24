#!/usr/bin/env node
// End-to-end smoke test for the admin API + static site.
// Requires the local Pages server: npm run build && npm run pages:local
// Usage: node scripts/smoke-api.mjs [baseUrl]

const BASE = process.argv[2] || process.env.BASE_URL || 'http://127.0.0.1:8788';

const ACCESS_HEADERS = {
  'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com',
  'Cf-Access-Jwt-Assertion': 'local-smoke-test-token',
};

const SERVICE_IDS = [
  'web-design',
  'software-development',
  'ai-automation',
  'graphic-design',
  'domains-hosting',
  'api-integrations',
];

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
    check('navbar uses the transparent Opus logo', text.includes('/images/logo-full.png'));
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
    check('6 pricing cards from D1', Array.isArray(content?.pricing) && content.pricing.length === 6, `got ${content?.pricing?.length}`);
    check(
      'pricing cards carry price ranges',
      content?.pricing?.[0]?.monthly_price === '$30 – $59.99' && content?.pricing?.[5]?.monthly_price === 'Custom quote',
      content?.pricing?.[0]?.monthly_price
    );
    check('pricing cards carry "what it covers" copy', typeof content?.pricing?.[0]?.yearly_price === 'string' && content.pricing[0].yearly_price.length > 5);
    check('hero background setting', content?.settings?.hero_background === '/images/hero-bg.jpg', content?.settings?.hero_background);
    check(
      'service_pages content served for all 6 services',
      Object.keys(content?.settings?.service_pages || {}).length === 6,
      Object.keys(content?.settings?.service_pages || {}).join(', ')
    );
    check(
      'web-design price range in service page content',
      content?.settings?.service_pages?.['web-design']?.price_range === '$30 – $1,000+',
      content?.settings?.service_pages?.['web-design']?.price_range
    );
    check(
      'home section headings avoid over-emphasised "real"',
      !/real/i.test(content?.settings?.home_sections?.projects_heading || '') &&
        !/real/i.test(content?.settings?.home_sections?.partners_heading || '')
    );
    check(
      'trusted-by subheading served',
      String(content?.settings?.home_sections?.partners_subheading || '').includes('Trusted by businesses')
    );
    check(
      'projects expose a screenshot field',
      Array.isArray(content?.projects) && content.projects.every((p) => typeof p.screenshot === 'string')
    );
    check(
      'browser title + favicon settings served',
      !!content?.settings?.browser_title && String(content?.settings?.favicon_icon || '').startsWith('/images/')
    );
  }
  {
    const { res, text } = await req('/services/web-design/');
    check('GET /services/web-design/ responds 200', res.status === 200);
    check(
      'web design page renders brief headline',
      text.includes('A website that represents your business the way it deserves to be represented.')
    );
    check('web design page renders problem section', text.includes('Most Zimbabwean businesses are invisible online.'));
    check('web design page renders tools strip', text.includes('/images/tools/nextjs.svg'));
    check(
      'service page renders the six brief sections only',
      text.includes('The problem') &&
        text.includes('What we build') &&
        text.includes('Tools we use') &&
        !text.includes('Why Opus Zimbabwe?') &&
        !text.includes('01 — Introduction')
    );
  }
  {
    const { res, text } = await req('/services/domains-hosting/');
    check('GET /services/domains-hosting/ responds 200', res.status === 200);
    check('domains page renders domain pricing table', text.includes('.co.zw') && text.includes('Within 24 hours'));
    check('domains page renders WhatsApp CTA link', text.includes('https://wa.me/263710740387'));
  }
  {
    const { res } = await req('/images/tools/nextjs.svg');
    check('tool logo asset served', res.status === 200);
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
      body: JSON.stringify({ id: 'web-design', tagline: 'SMOKE TEST TAGLINE', card_bg_color: '#fff4ec' }),
    });
    check('PATCH service succeeds', res.status === 200 && json?.ok === true);
    const after = await req('/api/content');
    const changed = after.json?.services?.find((s) => s.id === 'web-design');
    check('change visible via /api/content', changed?.tagline === 'SMOKE TEST TAGLINE' && changed?.card_bg_color === '#fff4ec');
    check('other fields untouched by partial PATCH', changed?.image === original?.image && changed?.description === original?.description && (changed?.items || []).length === (original?.items || []).length);

    // restore
    await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'web-design', tagline: 'Online Presence', card_bg_color: '#ffffff' }),
    });
    const restored = await req('/api/content');
    const back = restored.json?.services?.find((s) => s.id === 'web-design');
    check('service restored', back?.tagline === 'Online Presence' && back?.card_bg_color === '#ffffff' && back?.image === '/images/service-web-design.png');
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
          { id: 'starter', name: 'Starter', monthly_price: '$35 – $39', yearly_price: 'Edited coverage', features: ['Edited feature'], visible: true },
          { id: '', name: 'Smoke Plan', monthly_price: '$9', yearly_price: 'Test coverage', features: ['Test only'], visible: true },
        ],
      }),
    });
    check('PUT pricing (edit + add + remove) succeeds', res.status === 200 && json?.count === 2, `count=${json?.count}`);
    const after = await req('/api/content');
    const cards = after.json?.pricing || [];
    check('now 2 cards', cards.length === 2, `got ${cards.length}`);
    check('edited price range applied', cards.find((c) => c.id === 'starter')?.monthly_price === '$35 – $39');
    check('edited coverage applied', cards.find((c) => c.id === 'starter')?.yearly_price === 'Edited coverage');
    check('new card present', cards.some((c) => c.name === 'Smoke Plan'));

    // restore the seeded 3 cards
    await req('/api/admin/pricing', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        cards: [
          { id: 'starter', name: 'Starter', monthly_price: '$30 – $59.99', yearly_price: 'Entry website with hosting from $10/month', features: ['Up to 5 pages & mobile responsive', 'Contact form & basic SEO setup', 'SSL certificate included', '3–7 day delivery'], visible: true },
          { id: 'standard', name: 'Standard', monthly_price: '$60 – $99.99', yearly_price: 'Standard website package', features: ['Up to 8 pages & mobile responsive', 'Contact & enquiry forms', 'Enhanced SEO & WhatsApp integration', 'SSL certificate included'], visible: true },
          { id: 'business', name: 'Business', monthly_price: '$100 – $199.99', yearly_price: 'Growing organisations — includes free first-year .co.zw / .org.zw / .ac.zw domain', features: ['Built for growing organisations', 'CMS / content management & portfolio sections', 'Full SEO optimisation & WhatsApp integration', 'SSL certificate included'], visible: true },
          { id: 'professional', name: 'Professional', monthly_price: '$200 – $499.99', yearly_price: 'Larger or more advanced requirements — .com / .net / .org available', features: ['.com / .net / .org domain extensions available', 'Booking systems, portals or e-commerce ready', 'Local payment integration (EcoCash, InnBucks, Paynow)', 'Priority support & custom workflows'], visible: true },
          { id: 'premium', name: 'Premium', monthly_price: '$500 – $1,000', yearly_price: 'Advanced website requirements', features: ['Advanced website & platform requirements', 'Custom integrations & multi-system workflows', 'High-volume e-commerce or institutional portals', 'Performance & security architecture', 'Dedicated post-launch support'], visible: true },
          { id: 'custom', name: 'Custom', monthly_price: 'Custom quote', yearly_price: 'Standalone custom scope — contact us for a quote', features: ['Standalone custom scope tailored to your organisation', 'Unlimited pages & bespoke functionality', 'Custom software, AI & API integrations', 'Dedicated project architecture & timeline', 'Ongoing support included'], visible: true },
        ],
      }),
    });
    const restored = await req('/api/content');
    check('pricing restored to 6 seeded cards', restored.json?.pricing?.length === 6 && restored.json?.pricing?.[0]?.monthly_price === '$30 – $59.99');
    check(
      'custom pricing card restored',
      restored.json?.pricing?.[5]?.name === 'Custom' && restored.json?.pricing?.[5]?.monthly_price === 'Custom quote'
    );
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

  console.log('\nService page content editing:');
  {
    const before = await req('/api/content');
    const pages = before.json?.settings?.service_pages || {};
    const seeded = pages['ai-automation'];
    const edited = { ...seeded, price_range: 'Starting from $75', problem_text: 'Smoke-test problem paragraph.' };
    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ service_pages: { ...pages, 'ai-automation': edited } }),
    });
    check('PUT service_pages succeeds', res.status === 200, `HTTP ${res.status}`);
    const after = await req('/api/content');
    check('edited price range saved', after.json?.settings?.service_pages?.['ai-automation']?.price_range === 'Starting from $75');
    check('edited problem text saved', after.json?.settings?.service_pages?.['ai-automation']?.problem_text === 'Smoke-test problem paragraph.');
    check(
      'other service pages untouched',
      after.json?.settings?.service_pages?.['web-design']?.price_range === '$30 – $1,000+'
    );

    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ service_pages: pages }),
    });
    const restored = await req('/api/content');
    check(
      'service page restored',
      restored.json?.settings?.service_pages?.['ai-automation']?.price_range === 'Starting from $50'
    );
  }
  {
    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        browser_title: 'Opus Zimbabwe — Test Title',
        favicon_icon: '/images/favicon-96x96.png',
      }),
    });
    check('PUT browser title + favicon succeeds', res.status === 200);
    const after = await req('/api/content');
    check('browser title updated', after.json?.settings?.browser_title === 'Opus Zimbabwe — Test Title');
    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ browser_title: 'Opus Zimbabwe — Digital Services for Zimbabwe' }),
    });
  }
  {
    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ favicon_icon: 'javascript:alert(1)' }),
    });
    check('unsafe favicon URL rejected (400)', res.status === 400);
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

  // -------------------------------------------------------------------------
  // Service page heroes, Why Opus cards and related links (migration 0003)
  // -------------------------------------------------------------------------
  console.log('\nService heroes / Why Opus / related:');
  {
    const before = await req('/api/content');
    const extras = before.json?.extras || {};
    check('extras returned for all 6 services', SERVICE_IDS.every((id) => !!extras[id]), `${Object.keys(extras).length} keys`);

    const original = extras['web-design'];
    check(
      'web-design hero + Why Opus + related links seeded',
      original?.hero_headline === 'A website that represents your business the way it deserves to be represented.' &&
        original?.hero_background === '/images/hero-website-design.png' &&
        original?.why_items?.length === 4 &&
        original?.related_items?.length === 4
    );

    const { res, json } = await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        id: 'web-design',
        extras: { hero_background_kind: 'gradient', hero_gradient: '135deg,#123456,#abcdef' },
      }),
    });
    check('PATCH hero background (gradient) succeeds', res.status === 200 && json?.ok === true, `extras_updated=${json?.extras_updated}`);
    const after = await req('/api/content');
    const changed = after.json?.extras?.['web-design'];
    check(
      'gradient hero visible via /api/content',
      changed?.hero_background_kind === 'gradient' && changed?.hero_gradient === '135deg,#123456,#abcdef'
    );

    const badGradient = await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'web-design', extras: { hero_gradient: 'url(javascript:alert(1))' } }),
    });
    check('invalid hero gradient rejected (400)', badGradient.res.status === 400);

    const badBackground = await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'web-design', extras: { hero_background: 'javascript:alert(1)' } }),
    });
    check('unsafe hero background rejected (400)', badBackground.res.status === 400);

    const { res: patchRes } = await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        id: 'web-design',
        extras: {
          hero_eyebrow: 'SMOKE HERO EYEBROW',
          why_items: [{ title: 'Smoke reason', body: 'Smoke body' }],
          related_items: [{ label: 'Smoke link', href: '/services/web-design' }],
        },
      }),
    });
    check('PATCH hero eyebrow / why / related succeeds', patchRes.status === 200);
    const afterEdit = await req('/api/content');
    const edited = afterEdit.json?.extras?.['web-design'];
    check(
      'hero eyebrow, Why Opus and related updated',
      edited?.hero_eyebrow === 'SMOKE HERO EYEBROW' &&
        edited?.why_items?.length === 1 &&
        edited?.why_items?.[0]?.title === 'Smoke reason' &&
        edited?.related_items?.length === 1 &&
        edited?.related_items?.[0]?.label === 'Smoke link'
    );

    await req('/api/admin/services', {
      method: 'PATCH',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ id: 'web-design', extras: original }),
    });
    const restored = await req('/api/content');
    const back = restored.json?.extras?.['web-design'];
    check(
      'hero / why / related restored',
      back?.hero_eyebrow === original.hero_eyebrow &&
        back?.hero_background_kind === 'image' &&
        back?.why_items?.length === 4 &&
        back?.related_items?.length === 4
    );
  }

  // -------------------------------------------------------------------------
  // Projects: 2 active live projects only
  // -------------------------------------------------------------------------
  console.log('\nProjects:');
  {
    const before = await req('/api/content');
    const seeded = before.json?.projects || [];
    check(
      '2 live projects from D1 (Great Couples + Prime PIDG)',
      seeded.length === 2 &&
        seeded.every((p) => p.status === 'active' && /^https:\/\//.test(p.url))
    );

    const unauth = await req('/api/admin/projects', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ projects: [] }),
    });
    check('projects mutation without Access headers rejected (401)', unauth.res.status === 401);

    const badUrl = await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ projects: [{ id: 'x', name: 'Bad', url: 'javascript:alert(1)', status: 'active' }] }),
    });
    check('non-https project URL rejected (400)', badUrl.res.status === 400);

    const noUrl = await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ projects: [{ id: 'x', name: 'No link', url: '', status: 'active' }] }),
    });
    check('active project without URL rejected (400)', noUrl.res.status === 400);

    const badShot = await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        projects: [{ id: 'x', name: 'Bad shot', url: 'https://example.com', screenshot: 'javascript:alert(1)', status: 'active' }],
      }),
    });
    check('unsafe project screenshot rejected (400)', badShot.res.status === 400);

    const { res, json } = await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        projects: [
          { ...seeded[0], description: 'SMOKE EDIT', screenshot: '/images/hero-website-design.png' },
          { id: '', name: 'Smoke Project', url: 'https://example.com', tag: 'Smoke', location: 'Harare', description: 'Test only', screenshot: '/images/service-software.jpg', status: 'active', visible: true },
        ],
      }),
    });
    check('PUT projects (edit + add + remove) succeeds', res.status === 200 && json?.count === 2, `count=${json?.count}`);

    const after = await req('/api/content');
    const projects = after.json?.projects || [];
    check(
      'edited + new project visible via /api/content',
      projects.length === 2 &&
        projects.find((p) => p.id === seeded[0].id)?.description === 'SMOKE EDIT' &&
        projects.some((p) => p.name === 'Smoke Project' && p.status === 'active')
    );
    check(
      'project screenshots saved + served',
      projects.find((p) => p.id === seeded[0].id)?.screenshot === '/images/hero-website-design.png' &&
        projects.find((p) => p.name === 'Smoke Project')?.screenshot === '/images/service-software.jpg'
    );

    await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ projects: seeded }),
    });
    const restored = await req('/api/content');
    check(
      'projects restored to 2 seeded rows',
      restored.json?.projects?.length === 2 &&
        restored.json?.projects?.[0]?.description === seeded[0].description
    );
  }

  // -------------------------------------------------------------------------
  // Trusted partners (migration 0004) — admin add/edit/remove
  // -------------------------------------------------------------------------
  console.log('\nTrusted partners:');
  {
    const before = await req('/api/content');
    const seeded = before.json?.partners || [];
    check(
      '4 partners from D1 (names + static logos, one linked)',
      seeded.length === 4 &&
        seeded.every((p) => p.name && p.logo?.startsWith('/images/partner-')) &&
        seeded.filter((p) => p.url?.startsWith('https://')).length === 1
    );

    const unauth = await req('/api/admin/partners', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ partners: [] }),
    });
    check('partners mutation without Access headers rejected (401)', unauth.res.status === 401);

    const badUrl = await req('/api/admin/partners', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ partners: [{ id: 'x', name: 'Bad', logo: '/images/logo.png', url: 'javascript:alert(1)' }] }),
    });
    check('non-https partner URL rejected (400)', badUrl.res.status === 400);

    const badLogo = await req('/api/admin/partners', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ partners: [{ id: 'x', name: 'Bad', logo: 'javascript:alert(1)', url: '' }] }),
    });
    check('unsafe partner logo rejected (400)', badLogo.res.status === 400);

    const { res, json } = await req('/api/admin/partners', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        partners: [
          { ...seeded[0], name: 'SMOKE PARTNER' },
          { id: '', name: 'Smoke Partner', logo: '/images/logo.png', url: 'https://example.com', visible: true },
        ],
      }),
    });
    check('PUT partners (edit + add + remove) succeeds', res.status === 200 && json?.count === 2, `count=${json?.count}`);

    const after = await req('/api/content');
    const partners = after.json?.partners || [];
    check(
      'edited + new partner visible via /api/content',
      partners.length === 2 &&
        partners.some((p) => p.name === 'SMOKE PARTNER') &&
        partners.some((p) => p.name === 'Smoke Partner' && p.url === 'https://example.com')
    );

    await req('/api/admin/partners', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ partners: seeded }),
    });
    const restored = await req('/api/content');
    check(
      'partners restored to 4 seeded rows',
      restored.json?.partners?.length === 4 && restored.json?.partners?.[0]?.name === seeded[0].name
    );
  }

  // -------------------------------------------------------------------------
  // Branding + the admin-served web manifest
  // -------------------------------------------------------------------------
  console.log('\nBranding & manifest:');
  {
    const before = await req('/api/content');
    const original = {
      navbar_logo: before.json?.settings?.navbar_logo,
      manifest_icon: before.json?.settings?.manifest_icon,
      socials: before.json?.settings?.footer_socials,
      cards: before.json?.settings?.contact_cards,
    };

    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ navbar_logo: '/images/logo-light.png' }),
    });
    const afterLogo = await req('/api/content');
    check(
      'PUT navbar_logo succeeds and is visible',
      res.status === 200 && afterLogo.json?.settings?.navbar_logo === '/images/logo-light.png'
    );

    const badLogo = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ navbar_logo: 'javascript:alert(1)' }),
    });
    check('unsafe navbar logo rejected (400)', badLogo.res.status === 400);

    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ navbar_logo: original.navbar_logo }),
    });
    const restoredLogo = await req('/api/content');
    check('navbar logo restored', restoredLogo.json?.settings?.navbar_logo === original.navbar_logo);

    const { res: iconRes } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ manifest_icon: '/images/icon-192.png' }),
    });
    check('PUT manifest_icon succeeds', iconRes.status === 200);

    const manifest = await req('/api/manifest');
    check(
      'GET /api/manifest responds 200 application/manifest+json',
      manifest.res.status === 200 &&
        (manifest.res.headers.get('content-type') || '').includes('application/manifest+json')
    );
    check(
      'manifest serves the admin-set icon with site metadata',
      Array.isArray(manifest.json?.icons) &&
        manifest.json.icons.some((i) => i.src === '/images/icon-192.png') &&
        manifest.json.name === 'Opus Zimbabwe — Digital Services for Zimbabwe' &&
        manifest.json.start_url === '/' &&
        manifest.json.display === 'standalone'
    );

    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ manifest_icon: original.manifest_icon }),
    });
    const restoredManifest = await req('/api/manifest');
    check('manifest icon restored', restoredManifest.json?.icons?.some((i) => i.src === original.manifest_icon));

    const { res: brandRes } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        footer_socials: [{ label: 'Smoke', href: 'https://example.com', icon: 'Globe' }],
        contact_cards: [{ title: 'Smoke card', line: 'line', note: 'note', href: 'https://example.com', icon: 'Mail' }],
      }),
    });
    const afterBrand = await req('/api/content');
    check(
      'PUT footer_socials + contact_cards succeeds and is visible',
      brandRes.status === 200 &&
        afterBrand.json?.settings?.footer_socials?.length === 1 &&
        afterBrand.json?.settings?.footer_socials?.[0]?.label === 'Smoke' &&
        afterBrand.json?.settings?.contact_cards?.length === 1 &&
        afterBrand.json?.settings?.contact_cards?.[0]?.title === 'Smoke card'
    );

    const badSocial = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ footer_socials: [{ label: 'Bad', href: 'javascript:alert(1)', icon: 'Globe' }] }),
    });
    check('unsafe social link rejected (400)', badSocial.res.status === 400);

    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ footer_socials: original.socials, contact_cards: original.cards }),
    });
    const restoredBrand = await req('/api/content');
    check(
      'footer socials + contact cards restored',
      restoredBrand.json?.settings?.footer_socials?.length === original.socials.length &&
        restoredBrand.json?.settings?.contact_cards?.length === original.cards.length
    );
  }

  // -------------------------------------------------------------------------
  // Home sections (approach, Built for Zimbabwe) and both FAQ lists
  // -------------------------------------------------------------------------
  console.log('\nHome sections & FAQ lists:');
  {
    const before = await req('/api/content');
    const original = {
      heroCycles: before.json?.settings?.hero_cycles,
      approach: before.json?.settings?.approach_items,
      built: before.json?.settings?.built_for_zimbabwe,
      faqHome: before.json?.settings?.faq_home,
      faqPage: before.json?.settings?.faq_page,
    };
    check(
      'home sections seeded (6 hero cycles, 5 approach steps, 3 home FAQs, 8 page FAQs)',
      original.heroCycles?.length === 6 &&
        original.approach?.length === 5 &&
        original.faqHome?.length === 3 &&
        original.faqPage?.length === 8
    );

    const { res: cycleRes } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        hero_cycles: original.heroCycles.map((c, idx) =>
          idx === 0 ? { ...c, question: 'SMOKE HERO QUESTION?' } : c
        ),
      }),
    });
    const afterCycle = await req('/api/content');
    check(
      'PUT hero_cycles succeeds and updates cycle 1',
      cycleRes.status === 200 &&
        afterCycle.json?.settings?.hero_cycles?.[0]?.question === 'SMOKE HERO QUESTION?'
    );
    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ hero_cycles: original.heroCycles }),
    });

    const { res } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        approach_items: [{ title: 'Smoke step', body: 'Smoke body', icon: 'Bot' }],
        built_for_zimbabwe: { eyebrow: 'Smoke eyebrow', heading: 'Smoke heading', body: 'Smoke body', image: '/images/hero-bg.jpg' },
      }),
    });
    check('PUT approach_items + built_for_zimbabwe succeeds', res.status === 200);

    const after = await req('/api/content');
    check(
      'approach + Built for Zimbabwe visible via /api/content',
      after.json?.settings?.approach_items?.length === 1 &&
        after.json?.settings?.approach_items?.[0]?.title === 'Smoke step' &&
        after.json?.settings?.built_for_zimbabwe?.heading === 'Smoke heading'
    );

    const badBuilt = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        built_for_zimbabwe: { eyebrow: 'x', heading: 'y', body: 'z', image: 'javascript:alert(1)' },
      }),
    });
    check('unsafe Built for Zimbabwe image rejected (400)', badBuilt.res.status === 400);

    const { res: faqRes } = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        faq_home: [{ q: 'Smoke home question', a: 'Smoke home answer' }],
        faq_page: [{ q: 'Smoke page question', a: 'Smoke page answer' }],
      }),
    });
    const afterFaq = await req('/api/content');
    check(
      'both FAQ lists save independently',
      faqRes.status === 200 &&
        afterFaq.json?.settings?.faq_home?.length === 1 &&
        afterFaq.json?.settings?.faq_home?.[0]?.q === 'Smoke home question' &&
        afterFaq.json?.settings?.faq_page?.length === 1 &&
        afterFaq.json?.settings?.faq_page?.[0]?.q === 'Smoke page question'
    );

    const badFaq = await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ faq_home: 'not-an-array' }),
    });
    await req('/api/admin/settings', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        approach_items: original.approach,
        built_for_zimbabwe: original.built,
        faq_home: original.faqHome,
        faq_page: original.faqPage,
      }),
    });
    const restored = await req('/api/content');
    check(
      'non-array FAQ rejected (400) and home/FAQ content restored',
      badFaq.res.status === 400 &&
        restored.json?.settings?.approach_items?.length === original.approach.length &&
        restored.json?.settings?.built_for_zimbabwe?.heading === original.built.heading &&
        restored.json?.settings?.faq_home?.length === original.faqHome.length &&
        restored.json?.settings?.faq_page?.length === original.faqPage.length
    );
  }

  // -------------------------------------------------------------------------
  // Static export renders the new content
  // -------------------------------------------------------------------------
  console.log('\nStatic export (new sections):');
  {
    const { res, text } = await req('/services/web-design/');
    check('service page renders its full-bleed hero headline', res.status === 200 && text.includes('A website that represents your business'));

    const projects = await req('/projects/');
    check(
      'projects page renders live projects (without ZimTrade or Agricom)',
      projects.res.status === 200 &&
        projects.text.includes('Great Couples International Trust') &&
        !projects.text.includes('ZimTrade') &&
        !projects.text.includes('Agricom')
    );

    const contact = await req('/contact/?service=Website%20Design%20%26%20Development&domain=example.co.zw');
    check('contact prefill URL (?service=…&domain=…) responds 200', contact.res.status === 200);

    const home = await req('/');
    check(
      'home renders the static hero headline, payment strip, "Partners who trust us", and why-choose-us cards',
      home.text.includes('Your business is struggling.') &&
        (home.text.includes('Let&#x27;s change that.') || home.text.includes("Let's change that.")) &&
        home.text.includes('We accept local payments') &&
        home.text.includes('Partners who trust us') &&
        home.text.includes('/images/partner-great-couples.png') &&
        home.text.includes('Why choose us.') &&
        home.text.includes('Fast Turnaround')
    );
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
