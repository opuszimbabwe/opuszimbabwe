const fs=require('fs'),assert=require('node:assert/strict'),{X509Certificate,createHash}=require('crypto');const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{const ca=new X509Certificate(fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS));const pin=createHash('sha256').update(ca.publicKey.export({type:'spki',format:'der'})).digest('base64');const browser=await chromium.launch({executablePath:'/usr/bin/chromium',proxy:{server:process.env.HTTPS_PROXY},args:['--no-sandbox','--ignore-certificate-errors-spki-list='+pin]});try{
for(const prompt of ['search','Explore our services','Find a domain','Show verified projects','Contact the team']){
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),page=await ctx.newPage();await ctx.route('**/api/chat/session',route=>route.fulfill({json:{session:{id:'direct-send-test-session'},messages:[]}}));await ctx.route('**/api/chat/messages',route=>route.fulfill({status:201,json:{ok:true}}));const posts=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/assistant',async route=>{posts.push(route.request().postDataJSON());await route.fulfill({json:{answer:'Test response.'}})});
 await page.goto('https://opuszim.co.zw',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('.site-content')?.getAttribute('aria-busy')==='false');
 if(process.env.LIVE_CHECK!=='1')await page.addScriptTag({path:__dirname+'/assistant-direct-send.js'});
 const expected=prompt==='search'?'example-unknown-query-777':prompt;
 if(prompt==='search'){
  await page.getByRole('button',{name:'Search website',exact:true}).click();await page.getByRole('combobox').fill(expected);await page.locator('.search-ai-card').click();
 }else{await page.evaluate(()=>document.dispatchEvent(new Event('opus-open-assistant')));assert.equal(posts.length,0,'opening alone must not send');await page.locator('.assistant-suggestions').getByRole('button',{name:prompt,exact:true}).click();}
 await page.waitForFunction(()=>!!document.querySelector('.assistant-bubble[data-role="user"]'));
 await page.waitForFunction(()=>document.querySelector('.assistant-composer textarea')?.disabled===false);
 assert.equal(posts.length,1,'one POST per click');assert.equal(posts[0].messages.at(-1).content,expected);assert.equal(await page.getByRole('textbox',{name:'Assistant question'}).inputValue(),'');assert.deepEqual(errors,[]);
 console.log('PASS: '+prompt+' sends exactly once and clears the composer');await ctx.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
