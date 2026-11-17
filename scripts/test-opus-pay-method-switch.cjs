const assert=require('node:assert/strict'),{chromium}=require('../ops/recovery/node_modules/playwright-core');
const base=process.env.OPUS_PAY_TEST_URL||'http://127.0.0.1:8788',oldToken='a'.repeat(64);
const config={configured:true,currencies:[{code:'USD',name:'US Dollar'}],methods:[{name:'Visa',code:'PZW204',minimumAmount:.1,maximumAmount:10000},{name:'MasterCard',code:'PZW205',minimumAmount:.1,maximumAmount:20000}]};
const form={name:'',email:'',phone:'',invoice:'SITE-123',amount:'25.00',currency:'USD',method:'PZW204'};
const oldReceipt={id:'old-payment',invoice:form.invoice,amount:25,currency:'USD',method:'Visa',name:'',reference:'OLD-REFERENCE',date:null,status:'INITIATED',paid:false,terminal:false};
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const scenario of ['return-pending','browser-back','already-paid','invalid-previous-status','unconfirmed-without-id']){
  const p=await b.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});let creates=0,submitted,paid=false,invalidStatus=false;
  await p.addInitScript(({oldToken,form,unknown,legacy})=>{sessionStorage.setItem('opus-payment-attempt',JSON.stringify({token:oldToken,form,...(!unknown&&!legacy?{id:'old-payment'}:{})}));if(!unknown){sessionStorage.setItem('opus-last-payment','old-payment');sessionStorage.setItem('opus-payment-old-payment',oldToken)}},{oldToken,form,unknown:scenario==='unconfirmed-without-id',legacy:scenario==='browser-back'});
  await p.route('**/api/payments/config?*',r=>r.fulfill({json:config}));await p.route('**/api/payments/status?*',r=>{assert.equal(r.request().headers().authorization,'Bearer '+oldToken);return r.fulfill({json:{receipt:invalidStatus?{paid:false}:paid?{...oldReceipt,status:'SUCCESS',paid:true,terminal:true}:oldReceipt,continueUrl:'https://pay.pesepay.com/test-old'}})});
  await p.route('**/api/payments/create',r=>{creates++;submitted=r.request().postDataJSON();return r.fulfill({json:{id:'new-payment',redirectUrl:'https://pay.pesepay.com/test-switch'}})});await p.route('https://pay.pesepay.com/test-switch',r=>r.fulfill({contentType:'text/html',body:'<h1>Mocked checkout</h1>'}));
  await p.goto(base+'/payments/'+(['return-pending','already-paid'].includes(scenario)?'?payment=old-payment&token='+oldToken:''));
  if(scenario==='return-pending'||scenario==='already-paid')await p.getByRole('heading',{name:'Processing Your Payment',exact:true}).waitFor();
  const change=p.getByRole('button',{name:'Change method',exact:true});await change.waitFor();assert.equal(await change.isDisabled(),false);await change.click();await p.getByRole('button',{name:'Pay with Mastercard',exact:true}).click();assert.equal(await p.getByLabel('Invoice or project reference',{exact:true}).inputValue(),form.invoice);assert.equal(await p.getByLabel('Amount to pay',{exact:true}).inputValue(),form.amount);
  if(scenario!=='unconfirmed-without-id'){assert.equal(await p.locator('.opus-previous-attempts').count(),1);await p.locator('.opus-previous-attempts summary').click();assert.ok((await p.locator('.opus-previous-attempts a').getAttribute('href')).includes('payment=old-payment'));}
  if(scenario==='already-paid')paid=true;if(scenario==='invalid-previous-status')invalidStatus=true;await p.getByRole('button',{name:'Continue to Pesepay',exact:true}).click();
  if(scenario==='already-paid'){await p.getByRole('heading',{name:'Payment Successful',exact:true}).waitFor();assert.equal(creates,0,'Already-paid attempts must not create replacement charge')}
  else if(scenario==='invalid-previous-status'){await p.getByText('Check your earlier payment status before starting another payment.',{exact:false}).waitFor();assert.equal(creates,0,'Malformed prior status cannot authorise a replacement request')}
  else if(scenario==='unconfirmed-without-id'){await p.getByText('An earlier payment attempt needs checking.',{exact:false}).waitFor();assert.equal(creates,0,'Unknown attempt must remain protected')}
  else{await p.waitForURL('https://pay.pesepay.com/test-switch');assert.equal(creates,1);assert.equal(submitted.method,'PZW205');assert.notEqual(submitted.token,oldToken,'Explicit method switch creates separate attempt, never changes the old fingerprint')}
  await p.close();console.log('PASS method switching:',scenario);
 }
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
