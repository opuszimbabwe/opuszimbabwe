// Read-only local tests for fresh first paint, navigation and history restoration.
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:8788';
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const context = await browser.newContext({viewport:{width:1440,height:1000}});
  const documentResponse = await context.request.get(base);
  const response = await context.request.get(base+'/api/content');
  for(const r of [documentResponse,response]) {
   assert.match(r.headers()['cache-control'],/no-store/);
   assert.equal(r.headers()['cloudflare-cdn-cache-control'],'no-store');
  }
  let fixture = await response.json();
  const page = await context.newPage(); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  let release, begin, hold=true; let started=new Promise(r=>begin=r);
  await page.route('**/api/content',async route=>{
   if(hold){hold=false; await new Promise(r=>{release=r;begin()});}
   await route.fulfill({json:fixture,headers:{'cache-control':'no-store'}});
  });
  await page.goto(base,{waitUntil:'domcontentloaded'}); await started;
  assert.equal(await page.locator('.site-content').isVisible(),false);
  release(); await page.locator('.site-content[data-loading="false"]').waitFor();
  console.log('PASS: HTML/API are no-store and first paint waits for fresh content');
  fixture=structuredClone(fixture); fixture.settings.navbar_logo='/images/icon-192.png';
  hold=true; started=new Promise(r=>begin=r);
  await page.locator('nav[aria-label="Primary"]').getByRole('link',{name:'Services',exact:true}).click();
  await started; assert.equal(await page.locator('.site-content').isVisible(),false);
  release(); await page.locator('.site-content[data-loading="false"]').waitFor();
  assert.match(await page.locator('header img').first().getAttribute('src'),/icon-192/);
  console.log('PASS: client navigation hides the previous snapshot until the new read completes');
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  assert.equal(await page.locator('.site-content').isVisible(),false);
  fixture.settings.navbar_logo='/images/icon-512.png'; hold=true; started=new Promise(r=>begin=r);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await started; assert.equal(await page.locator('.site-content').isVisible(),false);
  release(); await page.waitForFunction(()=>!document.documentElement.hasAttribute('data-content-returning') && document.querySelector('.site-content')?.dataset.loading==='false');
  assert.match(await page.locator('header img').first().getAttribute('src'),/icon-512/);
  console.log('PASS: exit/history restoration masks cached DOM and fetches current content');
  const failed = await context.newPage();
  await failed.route('**/api/content',r=>r.fulfill({status:503,json:{error:'unavailable'}}));
  await failed.goto(base); await failed.getByRole('button',{name:'Retry latest content',exact:true}).waitFor();
  assert.equal(await failed.locator('.site-content').isVisible(),false);
  await failed.unroute('**/api/content'); await failed.route('**/api/content',r=>r.fulfill({json:fixture}));
  await failed.getByRole('button',{name:'Retry latest content',exact:true}).click();
  await failed.locator('.site-content[data-loading="false"]').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: failed fresh loads show a retry screen, never an old design');
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
