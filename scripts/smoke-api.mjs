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
  // Projects (migration 0003): active = link, coming_soon = badge
  // -------------------------------------------------------------------------
  console.log('\nProjects:');
  {
    const before = await req('/api/content');
    const seeded = before.json?.projects || [];
    check(
      '4 projects from D1 (2 active, 2 coming_soon, badge rows unlinked)',
      seeded.length === 4 &&
        seeded.filter((p) => p.status === 'active').length === 2 &&
        seeded.filter((p) => p.status === 'coming_soon').length === 2 &&
        seeded.filter((p) => p.status === 'coming_soon').every((p) => p.url === '')
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

    const { res, json } = await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({
        projects: [
          { ...seeded[0], description: 'SMOKE EDIT' },
          { id: '', name: 'Smoke Project', url: 'https://example.com', tag: 'Smoke', location: 'Harare', description: 'Test only', status: 'active', visible: true },
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

    await req('/api/admin/projects', {
      method: 'PUT',
      headers: ACCESS_HEADERS,
      body: JSON.stringify({ projects: seeded }),
    });
    const restored = await req('/api/content');
    check(
      'projects restored to 4 seeded rows',
      restored.json?.projects?.length === 4 &&
        restored.json?.projects?.[0]?.description === seeded[0].description
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
      approach: before.json?.settings?.approach_items,
      built: before.json?.settings?.built_for_zimbabwe,
      faqHome: before.json?.settings?.faq_home,
      faqPage: before.json?.settings?.faq_page,
    };
    check(
      'home sections seeded (5 approach steps, 3 home FAQs, 8 page FAQs, Built heading)',
      original.approach?.length === 5 &&
        original.faqHome?.length === 3 &&
        original.faqPage?.length === 8 &&
        Boolean(original.built?.heading)
    );

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
      'projects page renders seeded projects (active link + coming soon badge)',
      projects.res.status === 200 &&
        projects.text.includes('Great Couples International Trust') &&
        projects.text.includes('Coming soon')
    );

    const contact = await req('/contact/?service=Website%20Design%20%26%20Development&domain=example.co.zw');
    check('contact prefill URL (?service=…&domain=…) responds 200', contact.res.status === 200);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
