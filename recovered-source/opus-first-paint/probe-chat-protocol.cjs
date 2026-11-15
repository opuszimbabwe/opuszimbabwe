const fs=require('fs'),{X509Certificate,createHash}=require('crypto');const {chromium}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core');
(async()=>{
 const ca=new X509Certificate(fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS));const pin=createHash('sha256').update(ca.publicKey.export({type:'spki',format:'der'})).digest('base64');
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',proxy:{server:process.env.HTTPS_PROXY},args:['--no-sandbox','--ignore-certificate-errors-spki-list='+pin]});
 try{const p=await b.newPage();await p.goto('https://opuszim.co.zw',{waitUntil:'domcontentloaded'});
 console.log(await p.evaluate(async()=>{
 const out=[];
 for(const item of [
 {path:'/api/chat/session',config:{}},
 {path:'/api/chat/message',config:{}},
 {path:'/api/chat/message',config:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({})}},
 {path:'/api/chat/session',config:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:''})}}
 ]){const r=await fetch(item.path,item.config);const d=await r.json().catch(()=>({}));out.push({path:item.path,method:item.config.method||'GET',status:r.status,error:d.error,fields:Object.keys(d),session_fields:d.session?Object.keys(d.session):null});}
 return out;
 }));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
