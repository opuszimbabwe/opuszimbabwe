// LOCAL test: immediate save snapshot and delayed-response ordering. Restores settings.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');const fs=require('node:fs');
const file=`/tmp/opus-snapshot-test-${process.pid}.cjs`;
execFileSync('node_modules/.bin/esbuild',['lib/content.ts','--bundle','--platform=node',`--outfile=${file}`]);
const {normalizeContent}=require(file);fs.unlinkSync(file);
const base='http://127.0.0.1:8788';
const headers={'Cf-Access-Authenticated-User-Email':'info.opuszim@gmail.com','Cf-Access-Jwt-Assertion':'local-snapshot-test'};
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const original=await(await context.request.get(base+'/api/content')).json();const previous=normalizeContent(original).settings;
 const put=async data=>{const response=await context.request.put(base+'/api/admin/settings',{headers,data});assert.equal(response.status(),200,await response.text());return response.json()};
 try{
  const page=await context.newPage();await page.goto(base+'/sysadmin/');await page.getByRole('button',{name:'Home Hero Design',exact:true}).click();
  await page.getByText('Copy, typography & buttons',{exact:true}).click();await page.getByLabel('Headline override',{exact:true}).fill('First delayed save');
  let release,begin,firstSnapshot;const started=new Promise(r=>begin=r);
  await page.route('**/api/admin/settings',async route=>{
   const response=await route.fetch();firstSnapshot=await response.json();await new Promise(r=>{release=r;begin()});await route.fulfill({response});
  });
  await page.getByRole('button',{name:'Save hero design',exact:true}).first().click();await started;
  assert.ok(firstSnapshot.content);assert.ok(Number.isSafeInteger(firstSnapshot.content.revision));
  const newerHero={...firstSnapshot.content.settings.hero_design,headline:'Newer committed save'};
  const logo=firstSnapshot.content.settings.navbar_logo.includes('icon-512')?'/images/icon-192.png':'/images/icon-512.png';
  const second=await put({hero_design:newerHero,navbar_logo:logo});
  assert.ok(second.content.revision>firstSnapshot.content.revision);
  await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'opus-content-updated'})));
  await page.waitForFunction(logo=>document.querySelector('header img')?.getAttribute('src')?.includes(logo),logo);
  release();await page.getByText('Home hero design saved.',{exact:true}).waitFor();
  assert.ok((await page.locator('header img').first().getAttribute('src')).includes(logo));
  assert.equal((await(await context.request.get(base+'/api/content')).json()).settings.hero_design.headline,'Newer committed save');
  console.log('PASS: delayed older save cannot overwrite newer committed settings; revisions advance atomically');
  const direct=await context.newPage();await direct.goto(base+'/sysadmin/');await direct.getByRole('button',{name:'Home Hero Design',exact:true}).click();
  await direct.getByText('Copy, typography & buttons',{exact:true}).click();await direct.getByLabel('Headline override',{exact:true}).fill('Immediate committed snapshot');
  await direct.route('**/api/content',route=>route.fulfill({status:503,json:{error:'simulated_read_outage'}}));
  await direct.getByRole('button',{name:'Save hero design',exact:true}).first().click();await direct.getByText('Home hero design saved.',{exact:true}).waitFor();
  assert.equal(await direct.locator('.site-content').getAttribute('data-loading'),'false');
  const latest=await(await context.request.get(base+'/api/content')).json();assert.equal(latest.settings.hero_design.headline,'Immediate committed snapshot');
  console.log('PASS: hero save applies its committed snapshot without depending on a second content GET');
 }finally{await put(previous);await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
