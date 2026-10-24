// Public API fixtures only. Verify navigation stays visible during slow refreshes.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.OPUS_TEST_URL || 'http://127.0.0.1:8788';
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const context = await browser.newContext({viewport:{width:1440,height:1100}});
  const fixture = await (await context.request.get(base+'/api/content')).json();
  fixture.projects[0].screenshot ||= '/images/web-design-card.jpg';
  fixture.projects[1].screenshot ||= '/images/service-web-design.png';
  let delayed = false, requests = 0;
  const page = await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/content',async route=>{requests++;if(delayed) await new Promise(resolve=>setTimeout(resolve,1800));await route.fulfill({json:fixture});});
  await page.goto(base+'/services/');await page.locator('.site-content[data-loading="false"]').waitFor();
  assert.equal(requests,1,'Initial content read is deduplicated');
  assert.equal(await page.locator('.services-index-card-full-image').count(),2);
  const surfaces=await page.locator('.services-index-card').evaluateAll(cards=>cards.map(card=>getComputedStyle(card).backgroundColor));
  assert.ok(new Set(surfaces).size>=5,'Cards have varied colours');
  assert.equal(await page.locator('.services-index-eyebrow').count(),0);
  await page.locator('.services-index-card').first().scrollIntoViewIfNeeded();await page.screenshot({path:'/workspace/scratch/services-colours-refresh.png'});
  delayed=true;
  // Record whether the existing page is ever masked while routing with fresh in-memory content.
  await page.evaluate(()=>{window.__maskedDuringRoute=false;new MutationObserver(()=>{if(document.querySelector('.site-content')?.getAttribute('data-loading')==='true')window.__maskedDuringRoute=true;}).observe(document.querySelector('.site-content'),{attributes:true});});
  await page.locator('.services-index-card').first().click();await page.waitForURL(/\/services\/web-design\//);
  await page.locator('.service-hero').waitFor();
  assert.equal(await page.evaluate(()=>window.__maskedDuringRoute),false,'Route refresh never masks the current session');
  assert.equal(await page.locator('.site-content').getAttribute('data-loading'),'false');
  assert.ok(await page.locator('.service-editorial-slide').count()>=2,'Own project screenshots rotate');
  await page.mouse.move(0,0);
  await page.waitForFunction(()=>document.querySelectorAll('.service-editorial-dot')[1]?.getAttribute('aria-pressed')==='true',{},{timeout:7000});
  await page.getByRole('button',{name:'Show image 2',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Show image 2',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Pause showcase',exact:true}).click();await page.getByRole('button',{name:'Play showcase',exact:true}).waitFor();
  assert.match(await page.locator('.service-conversion-heading').innerText(),/Trust, branding, UX/);
  await page.locator('.service-offering summary').first().click();assert.equal(await page.locator('.service-offering').first().getAttribute('open'),'');
  assert.ok(await page.locator('.service-offering p').first().isVisible());
  assert.equal(await page.locator('.service-delivery h2').innerText(),'Process');
  assert.equal(await page.locator('#pricing').count(),1);
  assert.match(await page.locator('h1').evaluate(e=>getComputedStyle(e).fontFamily),/poppins/i);
  for(const path of ['/services/web-design/','/services/software-development/','/services/ai-automation/','/services/graphic-design/','/services/domains-hosting/','/services/api-integrations/','/domains/']) {
   delayed=false;await page.goto(base+path);await page.locator('.site-content[data-loading="false"]').waitFor();
   for(const width of [375,768,1440]) {await page.setViewportSize({width,height:1100});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow ${path} ${width}`);}
   assert.equal(await page.locator('main p.uppercase').count(),0,`No decorative labels ${path}`);
   if(path !== '/domains/') {
    assert.equal(await page.locator('.service-hero').count(),1);
    assert.equal(await page.locator('.approach-horizontal').count(),1);
    const positions=await page.locator('.approach-horizontal .approach-icon').evaluateAll(items=>items.map(item=>item.getBoundingClientRect().top));
    assert.ok(positions.every(top=>Math.abs(top-positions[0])<1),'All process circles stay on one horizontal row');
    const stage=await page.locator('.service-editorial-stage').boundingBox(), frame=await page.locator('.service-editorial-slides').boundingBox();
    assert.ok(Math.abs(stage.width-frame.width)<1 && Math.abs(stage.height-frame.height)<1,'Showcase has no inner padding or frame gap');
    assert.equal(await page.locator('.service-editorial-slide').first().evaluate(e=>getComputedStyle(e).objectFit),'cover');
    for(const note of await page.locator('.service-tools-note').all()) assert.equal(await note.evaluate(e=>getComputedStyle(e).textAlign),'center');
   }
  }
  await page.goto(base+'/services/web-design/');await page.locator('.site-content[data-loading="false"]').waitFor();await page.screenshot({path:'/workspace/scratch/web-design-refresh.png'});
  // Existing admin controls still supply hero text, action, gradient and showcase image.
  const extra=fixture.extras['web-design'];
  extra.hero_headline='A campaign selected by the admin';extra.hero_intro='Managed introduction';extra.hero_cta='Contact our team';extra.visual_background='/images/web-design-card.jpg';extra.hero_background_kind='gradient';extra.hero_gradient='90deg,#274e48,#a05c14';
  fixture.services.find(item=>item.id==='web-design').extras=extra;
  await page.reload();await page.locator('.site-content[data-loading="false"]').waitFor();
  assert.equal(await page.locator('h1').textContent(),extra.hero_headline);
  assert.equal(await page.locator('.service-hero p').textContent(),extra.hero_intro);
  assert.match(await page.getByRole('link',{name:'Contact our team'}).getAttribute('href'),/^\/contact/);
  assert.equal(await page.locator('.service-editorial-slide').first().getAttribute('src'),extra.visual_background);
  assert.match(await page.locator('.service-hero-background').evaluate(e=>getComputedStyle(e).backgroundImage),/rgb\(39, 78, 72\)/);
  await page.locator('.approach-horizontal').scrollIntoViewIfNeeded();await page.screenshot({path:'/workspace/scratch/service-process-restored.png'});
  await page.goto(base+'/domains/');await page.locator('.site-content[data-loading="false"]').waitFor();
  const domain=page.getByRole('textbox',{name:'Domain name'});
  await domain.fill('bbb');await page.getByRole('button',{name:'Check domain',exact:true}).click();
  await page.locator('#domain-search-error').waitFor();assert.match(await page.locator('#domain-search-error').textContent(),/full domain/);
  assert.equal(await page.getByRole('link',{name:'Ask us about this domain →'}).count(),0);
  await domain.fill('EXAMPLE.CO.ZW');await page.getByRole('button',{name:'Check domain',exact:true}).click();
  const enquiry=page.getByRole('link',{name:'Ask us about this domain →'});await enquiry.waitFor();
  assert.equal(new URL(await enquiry.getAttribute('href'),base).searchParams.get('domain'),'example.co.zw');
  assert.doesNotMatch(await page.locator('main').innerText(),/available in this demo|Register it/);
  await domain.fill('other.com');assert.equal(await enquiry.count(),0,'Editing clears the previous enquiry');
  assert.deepEqual(errors,[]);
  console.log('PASS: varied service colours/full images; own showcase rotation; restored admin hero controls; horizontal service processes; truthful domain enquiries; centered tools; white cards; label removal; mobile/tablet/desktop; one initial API read; no route masking during delayed fetch.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
