// Local integration test; production data is never mutated.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const assert=require('node:assert/strict');const {execFileSync}=require('node:child_process');const fs=require('node:fs');
const bundle=`/tmp/opus-rotating-config-${process.pid}.cjs`;
execFileSync('node_modules/.bin/esbuild',['lib/hero-design.ts','--bundle','--platform=node',`--outfile=${bundle}`]);const {heroPreset}=require(bundle);fs.unlinkSync(bundle);
const base='http://127.0.0.1:8788';const headers={'Cf-Access-Authenticated-User-Email':'info.opuszim@gmail.com','Cf-Access-Jwt-Assertion':'local-integration-test'};
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1440,height:1100}});const original=await(await context.request.get(base+'/api/content')).json();
const put=async data=>{const r=await context.request.put(base+'/api/admin/settings',{headers,data});assert.equal(r.status(),200,await r.text())};
try{
 const design=heroPreset('current');design.interval_ms=3000;design.pause_on_hover=false;await put({hero_design:design});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('.site-content[data-loading="false"]').waitFor();
 assert.match(await page.locator('h1').innerText(),/Work with Zimbabwe's Best/);assert.equal(await page.locator('.hero-description').count(),0);
 const media=await page.locator('.home-hero-media').boundingBox(), text=await page.locator('.home-hero-text').boundingBox();assert.ok(media.x<text.x);
 assert.equal(await page.locator('.hero-media-caption').first().evaluate(e=>getComputedStyle(e).marginTop),'10px');
 assert.equal(await page.locator('.hero-media-caption').first().evaluate(e=>getComputedStyle(e).fontWeight),'500');
 const count=await page.locator('[data-rotating-word]').count();assert.equal(count,6);
 for(let i=0;i<count;i++){
  await page.waitForFunction(i=>document.querySelectorAll('[data-rotating-word]')[i]?.dataset.current==='true',i,{timeout:5000});
  assert.equal(await page.locator('.hero-media-slide').nth(i).getAttribute('data-active'),'true');
  await page.waitForTimeout(650);assert.equal(await page.locator('[data-previous]').count(),0);
 }
 await page.getByRole('button',{name:'Pause hero rotation',exact:true}).click();
 for(const width of [375,768,1440]){await page.setViewportSize({width,height:1100});assert.ok(await page.locator('.home-hero-grid').evaluate(e=>e.scrollWidth<=e.clientWidth));const word=page.locator('[data-rotating-word][data-current]');const box=await word.boundingBox(),container=await page.locator('.hero-rotating-words').boundingBox();assert.ok(box.y+box.height<=container.y+container.height+1)}
 await page.setViewportSize({width:1440,height:1100});await page.screenshot({path:'/tmp/opus-new-hero-desktop.png'});
 const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(base);await reduced.locator('.site-content[data-loading="false"]').waitFor();const word=await reduced.locator('[data-current]').innerText();await reduced.waitForTimeout(3200);assert.equal(await reduced.locator('[data-current]').innerText(),word);await reduced.close();
 const admin=await context.newPage();await admin.goto(base+'/sysadmin/');await admin.getByRole('button',{name:'Home Hero Design',exact:true}).click();await admin.getByRole('button',{name:'Zimbabwe services — images left',exact:true}).click();await admin.getByText('Foreground image',{exact:true}).click();await admin.getByRole('slider',{name:/^Image-to-description gap/}).fill('6');await admin.getByRole('slider',{name:/^Image description size/}).fill('20');await admin.getByLabel('Poppins image description weight',{exact:true}).selectOption('600');await admin.getByRole('button',{name:'Save hero design',exact:true}).first().click();await admin.getByText('Home hero design saved.',{exact:true}).waitFor();
 const saved=(await(await context.request.get(base+'/api/content')).json()).settings.hero_design;assert.equal(saved.headline_mode,'service_words');assert.equal(saved.caption_gap,6);assert.equal(saved.caption_size,20);assert.equal(saved.caption_weight,600);
 await page.bringToFront();await page.goto(base+'/contact/');await page.locator('.site-content[data-loading="false"]').waitFor();
 for(const [label,value] of [['Your name or organisation','Example School'],['Email address','hello@example.com'],['WhatsApp or phone number','+263771234567'],['Tell us what you need','A website and a school management system.']]){
  const input=page.getByLabel(label,{exact:true});await input.fill(value);await input.blur();await page.waitForTimeout(250);const wrapper=input.locator('..');assert.equal(await wrapper.locator('label').evaluate(e=>getComputedStyle(e).top),'0px');assert.ok(await wrapper.locator('legend').evaluate(e=>e.getBoundingClientRect().width)>0);assert.equal(await input.getAttribute('textarea'),null);
 }
 assert.equal(await page.getByLabel('WhatsApp or phone number',{exact:true}).getAttribute('type'),'tel');
 await page.getByLabel('Tell us what you need',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'/tmp/opus-contact-fields.png'});
 await page.setViewportSize({width:375,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
 console.log('PASS: all six service words synchronize with images, exit attributes clear, desktop/mobile fit, reduced motion, admin caption controls persist, contact labels notch the outline.');
}finally{await put({hero_design:original.settings.hero_design});await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
