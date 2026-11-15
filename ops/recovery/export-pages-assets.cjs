// Public, read-only asset recovery. No Access bypass or customer APIs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright-core');
const blake3=require(process.env.BLAKE3_MODULE_PATH||'blake3-wasm');
const root=path.resolve(__dirname,'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'production/state/pages-asset-manifest.json')));
const output=path.join(root,'production/pages-assets');
const records=[];
(async()=>{
 const args=['--no-sandbox'];
 if(process.env.NODE_EXTRA_CA_CERTS){const ca=new crypto.X509Certificate(fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS));args.push('--ignore-certificate-errors-spki-list='+crypto.createHash('sha256').update(ca.publicKey.export({type:'spki',format:'der'})).digest('base64'));}
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{})});
 try{
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  await page.goto('https://opuszimbabwe.pages.dev/payments/',{waitUntil:'domcontentloaded'});
  if(page.url().includes('cloudflareaccess.com'))throw Error('Production public host unexpectedly requires Access authentication');
  const entries=Object.entries(manifest);
  for(let index=0;index<entries.length;index+=6){
   const batch=entries.slice(index,index+6),publicBatch=[];
   for(const [file,expectedHash] of batch){
    if(/^\/(?:sysadmin|admin)(?:\/|$)/.test(file)){records.push({file,expectedHash,status:'protected_asset_not_exported'});continue;}
    if(file.split('/').includes('..'))throw Error('Unsafe asset path');
    publicBatch.push([file,expectedHash]);
   }
   const downloaded=await page.evaluate(async batch=>Promise.all(batch.map(async([file,expectedHash])=>{
    for(let attempt=0;attempt<2;attempt++)try{
     const response=await fetch(file,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(25000)});
     if([408,429,500,502,503,504].includes(response.status)&&attempt===0){await response.body?.cancel();continue;}
     if(![200,404].includes(response.status)||response.url.includes('cloudflareaccess.com'))return {file,expectedHash,status:'unavailable',httpStatus:response.status};
     const bytes=new Uint8Array(await response.arrayBuffer());let binary='';
     for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
     return {file,expectedHash,status:'downloaded',httpStatus:response.status,contentType:response.headers.get('content-type'),data:btoa(binary)};
    }catch(error){if(attempt===1)return {file,expectedHash,status:'fetch_failed',error:error.name};}
   })),publicBatch);
   for(const item of downloaded){
    if(item.data!==undefined){
     const content=Buffer.from(item.data,'base64');delete item.data;
     const extension=path.extname(item.file).slice(1);
     item.recoveredHash=blake3.hash(content.toString('base64')+extension).toString('hex').slice(0,32);
     item.sha256=crypto.createHash('sha256').update(content).digest('hex');item.bytes=content.length;
     if(item.recoveredHash===item.expectedHash){
      const target=path.join(output,item.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);item.status='verified_exact';
     }else item.status='hash_mismatch_not_stored';
    }
    records.push(item);
   }
   if(index%42===0)console.log(JSON.stringify({processed:Math.min(index+6,entries.length),total:entries.length,exact:records.filter(x=>x.status==='verified_exact').length}));
  }
  records.sort((a,b)=>a.file.localeCompare(b.file));
  const summary={manifest_assets:entries.length,recovered_exact_assets:records.filter(x=>x.status==='verified_exact').length,bytes:records.filter(x=>x.status==='verified_exact').reduce((n,x)=>n+x.bytes,0),excluded_or_unavailable:records.filter(x=>x.status!=='verified_exact')};
  fs.writeFileSync(path.join(root,'production/state/pages-asset-recovery.json'),JSON.stringify({summary,files:records},null,2)+'\n');
  console.log(JSON.stringify(summary));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
