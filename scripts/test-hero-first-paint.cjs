// Read-only regression: delayed content, absent CSS, saved split arrangement and imagery.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const base = process.env.BASE_URL || 'http://127.0.0.1:8788';
(async () => {
  const bundle = `/tmp/opus-first-paint-${process.pid}.cjs`;
  execFileSync('node_modules/.bin/esbuild', ['lib/content.ts', '--bundle', '--platform=node', `--outfile=${bundle}`]);
  const { normalizeContent } = require(bundle); fs.unlinkSync(bundle);
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const raw = await (await context.request.get(base + '/api/content')).json();
    const fixture = normalizeContent(raw);
    fixture.settings.hero_design.text_position = 'left';
    fixture.settings.hero_design.text_align = 'left';
    fixture.settings.hero_design.layout = 'split';
    fixture.settings.hero_design.show_media = true;
    fixture.settings.hero_design.media_image = '';
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    let release, started;
    const pending = new Promise(resolve => started = resolve);
    await page.route('**/api/content', async route => {
      await new Promise(resolve => { release = resolve; started(); });
      await route.fulfill({ json: fixture });
    });
    await page.route('**/*.css', route => route.abort());
    await page.goto(base, { waitUntil: 'domcontentloaded' }); await pending;
    assert.equal(await page.locator('.site-content').isVisible(), false);
    assert.equal(await page.locator('.home-hero-shell').count(), 0);
    release(); await page.locator('.site-content[data-loading="false"]').waitFor();
    assert.equal(await page.locator('.home-hero-shell').getAttribute('data-position'), 'left');
    console.log('PASS: no default hero and no visible fallback even with CSS blocked');
    await page.unroute('**/*.css');
    await page.unroute('**/api/content');
    await page.route('**/api/content', route => route.fulfill({ json: fixture }));
    await page.reload(); await page.locator('.site-content[data-loading="false"]').waitFor();
    const text = await page.locator('.home-hero-text').boundingBox();
    const media = await page.locator('.home-hero-media').boundingBox();
    assert.ok(text.x < media.x, 'saved left text must precede the image');
    const sources = await page.locator('.home-hero-media img').evaluateAll(images => images.map(image => image.getAttribute('src')));
    assert.equal(sources.length, 6);
    assert.ok(sources.every(source => source.startsWith('/images/editorial/')));
    await page.waitForFunction(() => [...document.querySelectorAll('.home-hero-media img')].every(image => image.complete && image.naturalWidth > 0));
    await page.screenshot({ path: '/tmp/opus-hero-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: '/tmp/opus-hero-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: reload respects saved text-left split; six local images load; mobile has no horizontal overflow');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
