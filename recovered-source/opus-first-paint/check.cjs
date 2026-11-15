const fs=require('fs'),assert=require('node:assert/strict'),{X509Certificate,createHash}=require('crypto');
const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{
 const {guardCSS}=await import('./worker.mjs');
 const ca=new X509Certificate(fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS));const pin=createHash('sha256').update(ca.publicKey.export({type:'spki',format:'der'})).digest('base64');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy:{server:process.env.HTTPS_PROXY},args:['--no-sandbox','--ignore-certificate-errors-spki-list='+pin]});
 try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const read=()=>p.evaluate(()=>({hero:document.querySelector('.home-hero-shell')?.getAttribute('data-position'),images:[...document.querySelectorAll('.home-hero-media img')].map(x=>x.getAttribute('src')),headings:[...document.querySelectorAll('h1,h2')].map(x=>x.textContent),sidebar:!!document.querySelector('aside')}));
 await p.goto('https://opuszim.co.zw',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('.site-content')?.getAttribute('aria-busy')==='false');
 const baseline=await read();await p.screenshot({path:'/workspace/scratch/opus-first-paint/before.png'});
 const live=process.env.LIVE_CHECK==='1';
 if(!live)await p.route('**/*',async route=>{const req=route.request();if(req.resourceType()==='document'&&req.url().startsWith('https://opuszim.co.zw/')){const response=await route.fetch();let body=await response.text();body=body.replace('</head>',`<style id="opus-first-paint-guard">${guardCSS}</style></head>`);return route.fulfill({response,body});}return route.continue();});
 let release,started,hold=true;const pending=new Promise(r=>started=r);
 await p.route('**/api/content',async route=>{if(hold){hold=false;await new Promise(r=>{release=r;started()});}await route.continue();});
 await p.reload({waitUntil:'domcontentloaded'});await pending;assert.equal(await p.locator('.site-content').isVisible(),false,'fallback must be hidden before current content arrives');
 release();await p.waitForFunction(()=>document.querySelector('.site-content')?.getAttribute('aria-busy')==='false');assert.equal(await p.locator('.site-content').isVisible(),true);assert.deepEqual(await read(),baseline,'loaded site layout, text and images must be unchanged');assert.equal(baseline.hero,'left');
 await p.screenshot({path:'/workspace/scratch/opus-first-paint/after.png'});
 await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));assert.equal(await p.locator('.site-content').isVisible(),false,'restored documents must hide stale content');
 await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-content-returning')&&document.querySelector('.site-content')?.getAttribute('aria-busy')==='false');assert.equal(await p.locator('.site-content').isVisible(),true);
 for(const path of ['/services/','/contact/','/projects/']){await p.goto('https://opuszim.co.zw'+path,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('.site-content')?.getAttribute('aria-busy')==='false');assert.equal(await p.locator('.site-content').isVisible(),true);if(live)assert.equal(await p.locator('#opus-first-paint-guard').count(),1);}
 await p.setViewportSize({width:390,height:844});await p.goto('https://opuszim.co.zw',{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.querySelector('.site-content')?.getAttribute('aria-busy')==='false');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:'/workspace/scratch/opus-first-paint/mobile.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({mode:live?'live':'intercepted candidate',delayedFirstLoad:'passed',savedPosition:baseline.hero,imageryUnchanged:true,historyRestore:'passed',otherPages:'services, contact, projects passed',mobile:'passed',browserErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
