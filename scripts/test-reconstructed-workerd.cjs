// Exercise the generated Pages router inside workerd with real local D1/R2.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {createHmac,createHash}=require('node:crypto');
const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
(async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,modulesRoot:'/tmp/opus-reconstructed-pages-runtime',scriptPath:'/tmp/opus-reconstructed-pages-runtime/entry.js',compatibilityDate:'2026-09-01',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],r2Buckets:['MEDIA'],bindings:{ALLOWED_ADMINS:'admin@example.test',WHATSAPP_APP_SECRET:'runtime-fixture-secret',WHATSAPP_PHONE_NUMBER_ID:'123456789012345',WHATSAPP_VERIFY_TOKEN:'runtime-verify',PAYNOW_INTEGRATION_KEY:'runtime-paynow'},serviceBindings:{ASSETS:()=>new Response('Fixture public asset',{headers:{'content-type':'text/html'}})},outboundService:()=>{throw Error('External requests are forbidden in this runtime test')}}));
 try{
  let seoResponse=await mf.dispatchFetch('https://opuszim.co.zw/services/web-design-development/?keep=1',{redirect:'manual'});assert.equal(seoResponse.status,308);assert.equal(seoResponse.headers.get('location'),'https://opuszim.co.zw/services/web-design/?keep=1');
  seoResponse=await mf.dispatchFetch('https://opuszim.co.zw/care/');assert.equal(seoResponse.headers.get('link'),'<https://opuszim.co.zw/care/>; rel="canonical"');
  seoResponse=await mf.dispatchFetch('https://opuszim.co.zw/404/');assert.equal(seoResponse.status,404);
  const db=await mf.getD1Database('DB');const schema=JSON.parse(fs.readFileSync('production/state/database-schema.json'));
  for(const row of [...schema.filter(x=>x.type==='table'),...schema.filter(x=>x.type!=='table')].filter(x=>!x.name.startsWith('_cf_')&&x.name!=='d1_migrations'))await db.prepare(row.sql).run();
  const migration=fs.readFileSync('migrations/0027_reconstructed_pages_features.sql','utf8').replace(/^--.*$/gm,'');
  for(const sql of migration.split(';').map(x=>x.trim()).filter(Boolean))await db.prepare(sql).run();
  for(const statement of fs.readFileSync('migrations/0028_direct_wallet_checkout.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
  for(const statement of fs.readFileSync('migrations/0029_whatsapp_diagnostics.sql','utf8').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
  const headers={origin:'http://localhost:8788','content-type':'application/json'};
  let r=await mf.dispatchFetch('http://localhost:8788/api/chat/session',{method:'POST',headers,body:JSON.stringify({name:'Runtime fixture'})});assert.equal(r.status,201,await r.clone().text());const session=(await r.json()).session;const cookie=r.headers.get('set-cookie').split(';')[0];
  r=await mf.dispatchFetch('http://localhost:8788/api/chat/messages',{method:'POST',headers:{...headers,cookie},body:JSON.stringify({id:crypto.randomUUID(),body:'Runtime Unicode — 👋'})});assert.equal(r.status,201,await r.clone().text());
  r=await mf.dispatchFetch('http://localhost:8788/api/chat/session',{headers:{cookie}});assert.equal((await r.json()).messages.length,1);
  const form=new FormData();form.set('file',new File([Uint8Array.from([137,80,78,71,13,10,26,10])],'test.png',{type:'image/png'}));
  const upload=new Request('http://localhost:8788/api/chat/attachment',{method:'POST',headers:{origin:headers.origin,cookie},body:form});
  r=await mf.dispatchFetch(upload.url,{method:'POST',headers:Object.fromEntries(upload.headers),body:await upload.arrayBuffer()});assert.equal(r.status,201,await r.clone().text());const attachment=(await r.json()).attachment;
  r=await mf.dispatchFetch('http://localhost:8788/api/chat/attachment?id='+attachment.id,{headers:{cookie}});assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,8);
  r=await mf.dispatchFetch('http://localhost:8788/api/admin/website-chat?session='+session.id,{headers:{'cf-access-authenticated-user-email':'admin@example.test','cf-access-jwt-assertion':'local-fixture'}});assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).messages.length,1);
  r=await mf.dispatchFetch('https://opuszim.co.zw/api/admin/website-chat',{headers:{'cf-access-authenticated-user-email':'admin@example.test','cf-access-jwt-assertion':'forged'}});assert.equal(r.status,401);
  r=await mf.dispatchFetch('http://localhost:8788/api/assistant',{method:'POST',headers,body:JSON.stringify({messages:[{role:'user',content:"What's my project ID?"}],mode:'edit'})});assert.equal(r.status,200);assert.equal((await r.json()).handoff,true);
  r=await mf.dispatchFetch('http://localhost:8788/api/whatsapp?hub.mode=subscribe&hub.verify_token=runtime-verify&hub.challenge=123');assert.equal(r.status,200);assert.equal(await r.text(),'123');
  const event=JSON.stringify({object:'whatsapp_business_account',entry:[{changes:[{value:{metadata:{phone_number_id:'123456789012345'},messages:[{id:'runtime-provider-id',from:'263770000001',type:'text',text:{body:'Runtime inbound fixture'},timestamp:String(Math.floor(Date.now()/1000))}]}}]}]});const signature='sha256='+createHmac('sha256','runtime-fixture-secret').update(event).digest('hex');
  for(let i=0;i<2;i++){r=await mf.dispatchFetch('http://localhost:8788/api/whatsapp',{method:'POST',headers:{'content-type':'application/json','x-hub-signature-256':signature},body:event});assert.equal(r.status,200,await r.clone().text());}assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM whatsapp_messages').first()).n,1);
  const notification={reference:crypto.randomUUID(),amount:'10.00',status:'paid'},signaturePaynow=createHash('sha512').update(Object.values(notification).join('')+'runtime-paynow').digest('hex').toUpperCase();r=await mf.dispatchFetch('http://localhost:8788/api/payments/paynow-webhook',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...notification,hash:signaturePaynow}).toString()});assert.equal(r.status,200);
  console.log('PASS: generated Pages router in workerd, local D1/R2, secure chat cookie, Unicode, multipart files, admin/AI privacy boundaries, Meta HMAC and deduplication, and Paynow signatures. External network disabled.');
 }finally{await mf.dispose();}
})().catch(error=>{console.error(error);process.exitCode=1});
