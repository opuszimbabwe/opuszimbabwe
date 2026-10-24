// Local read-only checks: no controls before authentication or after logout.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const raw=await context.request.get('http://127.0.0.1:8788/sysadmin/');assert.doesNotMatch(await raw.text(),/Save hero design|Homepage Sections/);
 const alias=await context.request.get('http://127.0.0.1:8788/admin/index.txt',{maxRedirects:0});assert.equal(alias.status(),308);assert.match(alias.headers().location,/\/sysadmin\/$/);
 const page=await context.newPage();let allow=false;let release,begin;const started=new Promise(r=>begin=r);let first=true;
 await page.route('**/api/admin/session',async route=>{if(first){first=false;await new Promise(r=>{release=r;begin()})}await route.fulfill({status:allow?200:401,json:allow?{email:'info.opuszim@gmail.com'}:{error:'unauthorized'}})});
 await page.goto('http://127.0.0.1:8788/sysadmin/',{waitUntil:'domcontentloaded'});await started;assert.equal(await page.getByRole('button',{name:'Home Hero Design',exact:true}).count(),0);release();await page.getByRole('heading',{name:'Administrator sign-in required',exact:true}).waitFor();
 allow=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('button',{name:'Home Hero Design',exact:true}).waitFor();
 allow=false;await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));await page.getByRole('heading',{name:'Administrator sign-in required',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Home Hero Design',exact:true}).count(),0);
 console.log('PASS: no admin controls in static HTML, before auth, after denial or after cached logout restoration; authenticated local access still works.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
