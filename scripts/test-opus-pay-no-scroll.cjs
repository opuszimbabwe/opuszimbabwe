const assert=require('node:assert/strict'),{chromium}=require('../ops/recovery/node_modules/playwright-core');
const methods=[{name:'Visa',code:'PZW204',minimumAmount:.1,maximumAmount:10000},{name:'EcoCash USD',code:'PZW211',minimumAmount:.01,maximumAmount:500},{name:'OneMoney',code:'PAYNOW_ONEMONEY',provider:'paynow',redirectRequired:true,minimumAmount:.01,maximumAmount:10000}];
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
for(const size of [{width:1536,height:1024},{width:1366,height:768},{width:1024,height:600},{width:892,height:530},{width:768,height:432},{width:640,height:480},{width:390,height:844},{width:320,height:568},{width:390,height:300}]){
 for(const method of ['Visa','EcoCash','OneMoney']){
 const p=await b.newPage({viewport:size.height<568?{width:size.width,height:844}:size,reducedMotion:'reduce'});await p.route('**/api/payments/config?*',r=>r.fulfill({json:{configured:true,currencies:[{code:'USD'}],methods}}));await p.goto((process.env.OPUS_PAY_TEST_URL||'http://127.0.0.1:8788')+'/payments/');await p.getByRole('button',{name:'Pay with '+method,exact:true}).waitFor();
 if(size.height>=568){for(const element of await p.locator('.opus-method-group,.opus-method-button,.opus-pay-footer').all()){const rect=await element.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=size.height,'Selector content must be visible, not clipped '+JSON.stringify({size,rect}));}}
 await p.getByRole('button',{name:'Pay with '+method,exact:true}).click();await p.setViewportSize(size);
 assert.equal(await p.getByRole('button',{name:'Continue',exact:true}).count(),0,'No intermediate steps');
 assert.equal(await p.locator('#payment-entry input:visible').count(),method==='EcoCash'?5:4,'All payment fields visible together');
 for(let step=0;step<1;step++){
  for(const input of await p.locator('#payment-entry input:visible').all()){const name=await input.getAttribute('name');await input.fill(name==='invoice'?'TEST-QUOTE':name==='amount'?'25':name==='phone'?'0791234567':name==='email'?'payer@example.test':'Test Payer');const rect=await input.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=size.height,'Input visible '+JSON.stringify({size,method,name,rect}));}
  const submit=p.getByRole('button',{name:method==='EcoCash'?'Request payment':method==='OneMoney'?'Continue to Paynow':'Continue to Pesepay',exact:true});const rect=await submit.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=size.height,'Final button visible '+JSON.stringify({size,method,rect}));break;
 }
 for(const el of await p.locator('#payment-entry,.opus-pay-footer:visible').all()){const rect=await el.boundingBox();assert.ok(rect.y>=0&&rect.y+rect.height<=size.height,'Entire form/footer must fit '+JSON.stringify({size,method,rect}));}
 if(method==='EcoCash'){await p.locator('input[name=phone]').fill('0711234567');assert.equal(await p.locator('.opus-validation-status').count(),0,'No disruptive advice during typing');await p.locator('input[name=phone]').blur();await p.locator('.opus-validation-status').waitFor();const r=await p.locator('#payment-entry').boundingBox();assert.ok(r.y+r.height<=size.height,'Validation must not clip form '+JSON.stringify({size,r}));await p.locator('input[name=phone]').fill('0791234567');}
 if(method==='EcoCash'&&size.width===892)await p.screenshot({path:'/workspace/scratch/opus-pay-compact-ecocash-short.png'});
 assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'No document overflow '+JSON.stringify({size,method}));await p.mouse.wheel(0,700);assert.equal(await p.evaluate(()=>scrollY),0);if(method==='Visa'&&size.width===390&&size.height===844)await p.screenshot({path:'/workspace/scratch/opus-pay-no-scroll-details.png'});await p.close();
 }
 console.log('PASS',size.width+'x'+size.height,'all payment details fit, controls visible and wheel cannot scroll');
}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
