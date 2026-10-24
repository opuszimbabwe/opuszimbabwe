// Audit real LOCAL admin saves and public rendering; restores the original content.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const entry = `/tmp/opus-audit-${process.pid}.ts`, bundle = entry + '.cjs';
fs.writeFileSync(entry, `export { normalizeContent } from '${process.cwd()}/lib/content'; export { heroPreset } from '${process.cwd()}/lib/hero-design';`);
execFileSync('node_modules/.bin/esbuild', [entry, '--bundle', '--platform=node', `--outfile=${bundle}`]);
const { normalizeContent, heroPreset } = require(bundle); fs.unlinkSync(entry); fs.unlinkSync(bundle);
const base = 'http://127.0.0.1:8788';
const headers = { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'local-admin-audit' };
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
 const context = await browser.newContext({ viewport: { width: 1440, height: 1050 } });
 const original = await (await context.request.get(base + '/api/content')).json();
 const settings = normalizeContent(original).settings;
 const put = async (path, data, expected = 200, method = 'PUT') => { const r = await context.request.fetch(base + path, { method, headers, data }); assert.equal(r.status(), expected, await r.text()); };
 const get = async () => (await context.request.get(base + '/api/content')).json();
 const admin = await context.newPage(); const errors = []; admin.on('pageerror', e => errors.push(e.message));
 async function save(button, endpoint) {
   const next = admin.waitForResponse(r => r.url().endsWith(endpoint) && r.request().method() !== 'GET');
   await button.click(); assert.equal((await next).status(), 200);
   await admin.waitForFunction(() => [...document.querySelectorAll('button')].filter(b => b.textContent.trim().startsWith('Save')).every(b => !b.disabled));
 }
 const tab = async name => admin.getByRole('button', { name, exact: true }).click();
 try {
   await admin.goto(base + '/sysadmin/'); await tab('Home Hero Design');
   await admin.getByLabel('Hero layout', { exact: true }).selectOption('full_bleed');
   await admin.getByLabel('Hero corner style', { exact: true }).selectOption('individual');
   for (const [name, value] of [['Top left hero corner', '0'], ['Top right hero corner', '0'], ['Bottom left hero corner', '64'], ['Bottom right hero corner', '64']]) await admin.getByRole('slider', { name: new RegExp('^' + name) }).fill(value);
   await save(admin.getByRole('button', { name: 'Save hero design', exact: true }).first(), '/api/admin/settings');
   const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
   await page.goto(base); await page.locator('.site-content[data-loading="false"]').waitFor();
   assert.deepEqual(await page.locator('.home-hero-surface').evaluate(e => { const s = getComputedStyle(e); return [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomLeftRadius, s.borderBottomRightRadius]; }), ['0px', '0px', '64px', '64px']);
   await admin.getByText('Original service carousel content', { exact: true }).click();
   await save(admin.getByRole('button', { name: 'Save hero cycles', exact: true }), '/api/admin/settings');
   console.log('PASS: integrated hero/carousel controls and square-top, rounded-bottom save and render');
   for (const [name, endpoint] of [
      ['Homepage Sections', '/api/admin/settings'], ['Local Payments', '/api/admin/settings'], ['Trusted Partners', '/api/admin/partners'],
      ['Live Work (Projects)', '/api/admin/projects'], ['Pricing & Price Ranges', '/api/admin/pricing'], ['Service Page Content', '/api/admin/settings'],
   ]) {
     await admin.getByRole('button', { name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
     await save(admin.getByRole('button', { name: /^Save / }).first(), endpoint);
     if (name === 'Trusted Partners') await admin.getByText('Partners and section heading saved.', { exact: true }).waitFor();
   }
   await admin.getByRole('button', { name: /^Services \(6 Cards\)/ }).click();
   for (const service of original.services) {
     await admin.getByRole('button', { name: service.name, exact: true }).click();
     await save(admin.getByRole('button', { name: 'Save ' + service.name, exact: true }).first(), '/api/admin/services');
   }
   await tab('How It Works & Why Us');
   for (const i of [0, 1]) await save(admin.getByRole('button', { name: /^Save / }).nth(i), '/api/admin/settings');
   await tab('FAQs (Home & Page)');
   for (const i of [0, 1]) await save(admin.getByRole('button', { name: /^Save / }).nth(i), '/api/admin/settings');
   await tab('Brand, Icons & Contact');
   for (const name of ['Save branding', 'Save socials', 'Save contact hero', 'Save contact cards']) await save(admin.getByRole('button', { name, exact: true }), '/api/admin/settings');
   console.log('PASS: every existing admin save group and all six service editors complete successfully');
   const why = Array.from({ length: 8 }, (_, i) => ({ title: `Audit reason ${i}`, body: 'Current admin-managed text.', icon: 'Globe' }));
   const faq = Array.from({ length: 4 }, (_, i) => ({ q: `Audit question ${i}?`, a: 'Current answer.' }));
   const colours = { ...settings.home_sections, how_it_works_bg: '#dce8f7', projects_bg: '#fff8f4', faq_bg: '#f8f8f6', partners_subheading: '' };
   await put('/api/admin/settings', { why_choose_us: why, faq_home: faq, home_sections: colours, navbar_logo: '/images/icon-192.png', browser_title: 'Current audit title' });
   await page.goto(base); await page.locator('.site-content[data-loading="false"]').waitFor();
   for (let i = 0; i < why.length; i++) { await page.getByRole('heading', { name: why[i].title, exact: true }).scrollIntoViewIfNeeded(); }
   await page.waitForFunction(() => [...document.querySelectorAll('[data-reason-index]')].every(e => getComputedStyle(e).opacity === '1'));
   assert.equal(await page.getByRole('button', { name: /^Audit question/ }).count(), 4);
   assert.equal(await page.getByRole('heading', { name: colours.how_it_works_heading, exact: true }).evaluate(e => getComputedStyle(e.closest('section')).backgroundColor), 'rgb(220, 232, 247)');
   assert.match(await page.locator('#footer img[alt="Opus Zimbabwe"]').getAttribute('src'), /icon-192/);
   assert.equal(await page.title(), 'Current audit title');
   console.log('PASS: eight added Why Us cards reveal, fourth FAQ renders, selected section colours and branding apply');
   let release, started; const pending = new Promise(resolve => started = resolve); let requests = 0;
   const stale = await get();
   await page.route('**/api/content', async route => { requests++; if (requests === 1) { await new Promise(resolve => { release = resolve; started(); }); await route.fulfill({ json: stale }); } else await route.continue(); });
   await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await pending;
   await put('/api/admin/settings', { browser_title: 'Fresh after concurrent save' });
   await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'opus-content-updated' })));
   release(); await page.waitForFunction(() => document.title === 'Fresh after concurrent save');
   assert.ok(requests >= 2); assert.equal(await page.locator('.site-content').getAttribute('data-loading'), 'false');
   await page.unroute('**/api/content');
   console.log('PASS: save during an in-flight read queues a fresh read instead of retaining stale content');
   const empty = { faq_home: [], faq_page: [], why_choose_us: [], approach_items: [], footer_socials: [], contact_cards: [] };
   await put('/api/admin/settings', empty); await put('/api/admin/partners', { partners: [] }); await put('/api/admin/projects', { projects: [] }); await put('/api/admin/pricing', { cards: [] });
   await page.goto(base); await page.locator('.site-content[data-loading="false"]').waitFor();
   assert.equal(await page.locator('.approach-step').count(), 0); assert.equal(await page.locator('[data-reason-index]').count(), 0); assert.equal(await page.locator('a[aria-label="Facebook"]').count(), 0);
   assert.equal(await page.getByRole('button', { name: /^Audit question/ }).count(), 0);
   const partners = Array.from({ length: 7 }, (_, i) => ({ id: `audit-partner-${i}`, name: `Audit partner ${i}`, logo: '/images/logo-full.png', url: '', visible: true, bg_color: '#ffffff' }));
   const projects = [{ id: 'audit-project', name: 'Audit project', url: 'https://example.com', tag: 'Website', location: 'Zimbabwe', description: 'Managed project.', status: 'active', visible: true }];
   await put('/api/admin/partners', { partners }); await put('/api/admin/projects', { projects }); await page.evaluate(() => window.dispatchEvent(new Event('focus')));
   await page.getByRole('img', { name: 'Audit partner 0', exact: true }).scrollIntoViewIfNeeded();
   await page.waitForFunction(() => [...document.querySelectorAll('img[alt^="Audit partner"]')].length === 7 && [...document.querySelectorAll('img[alt^="Audit partner"]')].every(e => getComputedStyle(e.closest('a, [class*="rounded-2xl"]')).opacity === '1'));
   await page.getByRole('heading', { name: 'Audit project', exact: true }).scrollIntoViewIfNeeded();
   assert.ok(await page.getByRole('heading', { name: 'Audit project', exact: true }).isVisible());
   const contact = await context.newPage(); await contact.goto(base + '/contact/'); await contact.locator('.site-content[data-loading="false"]').waitFor();
   assert.equal(await contact.locator('a').filter({ hasText: 'Send email' }).count(), 0);
   console.log('PASS: remove-all stays empty; partners/projects added after an empty response reappear correctly');
   const hidden = original.services[0]; await put('/api/admin/services', { ...hidden, visible: false }, 200, 'PATCH');
   await page.goto(base); await page.locator('.site-content[data-loading="false"]').waitFor();
   assert.equal(await page.locator(`header a[href="/services/${hidden.slug}/"]`).count(), 0); assert.equal(await page.locator(`#footer a[href="/services/${hidden.slug}/"]`).count(), 0);
   console.log('PASS: service visibility also applies to navigation and footer');
   const failedAdmin = await context.newPage();
   await failedAdmin.route('**/api/content', route => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
   await failedAdmin.goto(base + '/sysadmin/');
   await failedAdmin.getByRole('alert').filter({ hasText: 'We couldn’t load the latest site content.' }).waitFor();
   assert.equal(await failedAdmin.getByRole('button', { name: /^Save / }).count(), 0);
   await failedAdmin.unroute('**/api/content');
   await failedAdmin.getByRole('button', { name: 'Retry latest content', exact: true }).click();
   await failedAdmin.getByRole('button', { name: 'Save page sections', exact: true }).waitFor();
   assert.deepEqual(errors, []);
   console.log('PASS: failed fresh reads expose no seed editor; Retry latest content recovers current content');
 } finally {
   await put('/api/admin/settings', settings);
   await put('/api/admin/partners', { partners: original.partners }); await put('/api/admin/projects', { projects: original.projects }); await put('/api/admin/pricing', { cards: original.pricing });
   for (const service of original.services) await put('/api/admin/services', { ...service, extras: original.extras[service.id] }, 200, 'PATCH');
   await browser.close();
 }
})().catch(error => { console.error(error); process.exit(1); });
