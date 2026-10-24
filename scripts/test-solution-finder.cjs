// LOCAL guided-selling checks. No enquiry or external message is submitted.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process'); const fs = require('node:fs');
const file = `/tmp/opus-guide-${process.pid}.cjs`;
execFileSync('node_modules/.bin/esbuild', ['lib/hero-design.ts', '--bundle', '--platform=node', `--outfile=${file}`]);
const { DEFAULT_HERO_DESIGN, heroPreset } = require(file); fs.unlinkSync(file);
const base = 'http://127.0.0.1:8788';
const headers = { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'local-guide-test' };
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
 const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
 const original = await (await context.request.get(base + '/api/content')).json();
 const put = async design => { const r = await context.request.put(base + '/api/admin/settings', { headers, data: { hero_design: design } }); assert.equal(r.status(), 200, await r.text()); };
 try {
  await put(heroPreset('campaign')); const page = await context.newPage(); const writes = [], errors = [];
  page.on('request', r => { if (r.method() !== 'GET') writes.push(r.url()); }); page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.locator('.site-content[data-loading="false"]').waitFor();
  const trigger = page.getByRole('button', { name: 'Help me choose', exact: true });
  await trigger.click(); const dialog = page.getByRole('dialog'); await dialog.waitFor();
  assert.equal(await dialog.getByRole('button', { name: 'Continue', exact: true }).isEnabled(), false);
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); assert.ok(await dialog.evaluate(e => e.contains(document.activeElement))); }
  await page.keyboard.press('Escape'); assert.equal(await dialog.isVisible(), false); assert.ok(await trigger.evaluate(e => e === document.activeElement));
  const goals = [
   ['Our website or online presence', 'web-design'], ['How we manage our operations', 'software-development'],
   ['Repetitive work, customer responses or AI', 'ai-automation'], ['Our brand and marketing materials', 'graphic-design'],
   ['Our domain, hosting or business email', 'domains-hosting'], ['How our existing tools work together', 'api-integrations'],
  ];
  for (const [goal, slug] of goals) {
   await trigger.click(); await dialog.getByRole('radio', { name: goal, exact: true }).check(); await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
   await dialog.getByRole('radio', { name: 'A school or training provider', exact: true }).check(); await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
   await dialog.getByRole('radio', { name: 'We want to improve what we already have', exact: true }).check(); await dialog.getByRole('button', { name: 'See my next step', exact: true }).click();
   assert.equal(await dialog.getByRole('link', { name: 'Explore this service', exact: true }).getAttribute('href'), `/services/${slug}/`);
   assert.match(await dialog.innerText(), /For schools/);
   assert.match(await dialog.innerText(), /nothing has been submitted yet/);
   await dialog.getByRole('button', { name: 'Close solution finder', exact: true }).click();
  }
  console.log('PASS: all six service recommendations, tailored context, keyboard trap, Escape and focus return');
  await trigger.click(); await dialog.getByRole('radio', { name: goals[4][0], exact: true }).check(); await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('radio', { name: 'A school or training provider', exact: true }).check(); await dialog.getByRole('button', { name: 'Continue', exact: true }).click();
  await dialog.getByRole('radio', { name: 'We need help defining the right approach', exact: true }).check(); await dialog.getByRole('button', { name: 'See my next step', exact: true }).click();
  await dialog.getByRole('link', { name: 'Discuss this with Opus', exact: true }).click(); await page.waitForURL('**/contact/**');
  await page.waitForFunction(() => document.querySelector('textarea')?.value.includes('A school or training provider'));
  assert.match(await page.locator('textarea').inputValue(), /domain, hosting or business email/); assert.deepEqual(writes, []);
  console.log('PASS: contact brief carries the answers; no lead or external message is submitted automatically');
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await phone.goto(base); await phone.locator('.site-content[data-loading="false"]').waitFor(); await phone.getByRole('button', { name: 'Help me choose', exact: true }).tap();
  const sheet = phone.getByRole('dialog'); assert.ok(await sheet.evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; }));
  assert.equal(await sheet.evaluate(e => getComputedStyle(e).animationName), 'none');
  assert.equal(await phone.locator('body').evaluate(e => getComputedStyle(e).overflow), 'hidden');
  assert.deepEqual(errors, []); console.log('PASS: phone bottom-sheet sizing, scroll lock and reduced-motion support');
 } finally { await put(original.settings.hero_design || DEFAULT_HERO_DESIGN); await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
