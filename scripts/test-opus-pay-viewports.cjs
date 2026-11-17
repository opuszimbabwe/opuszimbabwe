const assert=require('node:assert/strict'),{chromium}=require('../ops/recovery/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),p=await b.newPage({reducedMotion:'reduce'});try{
 await p.route('**/api/payments/config?*',r=>r.fulfill({json:{configured:true,currencies:[{code:'USD'}],methods:['Visa','MasterCard','ZimSwitch','EcoCash','InnBucks','Omari','OneMoney','POS2U','Telecash'].map((name,i)=>({name,code:'TEST'+i,minimumAmount:.1,maximumAmount:20000}))}}));
 await p.goto((process.env.OPUS_PAY_TEST_URL||'http://127.0.0.1:8788')+'/payments/');await p.getByRole('button',{name:'Pay with Visa',exact:true}).waitFor();await p.evaluate(()=>document.fonts.ready);
 for(const [width,height] of [[1920,1080],[1536,864],[1440,900],[1366,768],[1280,640],[1024,768],[800,600],[768,1024],[430,932],[390,844],[375,667],[360,640],[320,568]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(70);
  const size=await p.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,card:document.querySelector('.opus-card-group').getBoundingClientRect().width,logo:document.querySelector('.opus-official-logo').getAttribute('src'),transform:getComputedStyle(document.querySelector('.opus-official-logo')).transform}));
  assert.ok(size.scrollWidth<=width,JSON.stringify(size));assert.ok(size.scrollHeight<=height,JSON.stringify(size));assert.ok(size.card<=820);assert.ok(size.logo.startsWith('data:image/webp;base64,'));assert.equal(size.transform,'none');console.log(width+'x'+height+' fits, card width '+size.card);
  if(width===1920)await p.screenshot({path:'/workspace/scratch/opus-pay-compact-desktop-1920.png'});
  if(width===1280)await p.screenshot({path:'/workspace/scratch/opus-pay-compact-short-desktop.png'});
  if(width===390)await p.screenshot({path:'/workspace/scratch/opus-pay-compact-mobile.png'});
 }
 console.log('PASS: 13 viewport sizes fit without scrolling, compact card widths and upright brand lettering.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
