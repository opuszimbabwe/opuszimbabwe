// Signed fake-provider integration checks. No real gateway requests or payments.
const assert=require('node:assert/strict'),fs=require('node:fs'),{DatabaseSync}=require('node:sqlite'),{createHash}=require('node:crypto');
const create=require('/tmp/opus-payments-test/api/payments/create.js').onRequestPost,status=require('/tmp/opus-payments-test/api/payments/status.js').onRequestGet;
const sql=new DatabaseSync(':memory:');
for(const object of JSON.parse(fs.readFileSync('production/state/database-schema.json')).filter(o=>!o.name.startsWith('_cf_')&&o.name!=='d1_migrations').sort((a,b)=>(a.type==='table'?-1:1)-(b.type==='table'?-1:1)))sql.exec(object.sql);
sql.exec(fs.readFileSync('migrations/0027_reconstructed_pages_features.sql','utf8'));
class Statement{constructor(q){this.q=q;this.values=[]}bind(...v){this.values=v;return this}async first(c){const r=sql.prepare(this.q).get(...this.values);return r?(c?r[c]:r):null}async all(){return{results:sql.prepare(this.q).all(...this.values)}}async run(){return sql.prepare(this.q).run(...this.values)}}
const DB={prepare:q=>new Statement(q),batch:s=>Promise.all(s.map(v=>v.run()))},key='mock-paynow-signing-key',env={DB,PAYNOW_INTEGRATION_ID:'12345',PAYNOW_INTEGRATION_KEY:key,PAYNOW_CURRENCY:'USD'};
const signature=f=>createHash('sha512').update(Object.entries(f).filter(([k])=>k!=='hash').map(([,v])=>v).join('')+key).digest('hex').toUpperCase();
let count=0,reference,providerReference,paid=false,wrongAmount=false,badHash=false,badRedirect=false,timeout=false;
global.fetch=async(url,options={})=>{
 const u=new URL(url);
 assert.equal(u.hostname,'www.paynow.co.zw','Credentials may only reach the provider');
 if(u.pathname==='/interface/initiatetransaction'){
  count++;const values=Object.fromEntries(new URLSearchParams(options.body));assert.equal(values.hash,signature(values));assert.equal(values.amount,'25.00');assert.match(values.additionalinfo,/%E2%80%94/,'Unicode description is encoded before signing, as in the official SDK');assert.ok(values.resulturl.endsWith('/api/payments/paynow-webhook'));reference=values.reference;providerReference='MOCK-'+count;
  if(timeout)throw Error('Provider accepted but response timed out');
  const fields={status:'Ok',browserurl:badRedirect?'https://evil.example/steal':'https://www.paynow.co.zw/Payment/Confirm/'+count,pollurl:'https://www.paynow.co.zw/interface/checkpayment?guid='+count,paynowreference:providerReference};fields.hash=badHash?'0'.repeat(128):signature(fields);return new Response(new URLSearchParams(fields).toString());
 }
 assert.equal(u.pathname,'/interface/checkpayment');const fields={reference,paynowreference:providerReference,amount:wrongAmount?'24.00':'25.00',currency:'USD',status:paid?'Paid':'Created'};fields.hash=badHash?'0'.repeat(128):signature(fields);return new Response(new URLSearchParams(fields).toString());
};
const ctx=(body,token,id)=>({request:new Request('http://localhost:8788/api/payments/'+(id?'status?id='+id:'create'),body?{method:'POST',headers:{'cf-connecting-ip':body.token.slice(0,8),'content-type':'application/json',origin:'http://localhost:8788'},body:JSON.stringify(body)}:{headers:{authorization:'Bearer '+token}}),env,waitUntil:p=>p});
const details={invoice:'TEST-PAYNOW',amount:'25.00',currency:'USD',phone:'',name:'',email:'',token:'a'.repeat(64),method:'PAYNOW_ONEMONEY'};
(async()=>{
 for(const [index,method] of ['PAYNOW_ONEMONEY','PAYNOW_POS2U','PAYNOW_TELECASH'].entries()){
  const input={...details,method,token:String(index+1).repeat(64)};let r=await create(ctx(input));assert.equal(r.status,200,await r.clone().text());const data=await r.json();assert.match(data.redirectUrl,/^https:\/\/www.paynow.co.zw\//);assert.equal(data.receipt.paid,false);const before=count;
  r=await create(ctx(input));assert.equal((await r.json()).id,data.id);assert.equal(count,before,'Duplicate initiation must not be replayed');
  paid=true;r=await status(ctx(null,input.token,data.id));assert.equal((await r.json()).receipt.paid,true,'Only signed independent poll can confirm payment');paid=false;
 }
 for(const [index,kind] of ['badHash','badRedirect','timeout'].entries()){
  badHash=kind==='badHash';badRedirect=kind==='badRedirect';timeout=kind==='timeout';const input={...details,token:(index+4).toString().repeat(64)};const r=await create(ctx(input)),data=await r.json();assert.equal(r.status,202);assert.equal(data.receipt.status,'UNCONFIRMED');assert.equal(data.redirectUrl,null);const before=count;await create(ctx(input));assert.equal(count,before,'Ambiguous failures cannot create another transaction');
 }
 badHash=badRedirect=timeout=false;const input={...details,token:'7'.repeat(64)};let data=await(await create(ctx(input))).json();wrongAmount=true;paid=true;let r=await status(ctx(null,input.token,data.id));assert.notEqual(r.status,200,'A mismatched paid amount must not issue a receipt');assert.notEqual(sql.prepare('SELECT status FROM customer_payments WHERE id=?').get(data.id).status,'SUCCESS');wrongAmount=false;
 r=await create(ctx({...details,token:'8'.repeat(64),currency:'ZiG'}));assert.equal(r.status,400);
 console.log('PASS: OneMoney/POS2U/Telecash route through signed Paynow initiation and independently verified status; duplicates, forged responses, unsafe redirects, ambiguous timeouts, amount mismatch and disabled ZiG fail safely. No live provider requests.');
})().catch(e=>{console.error(e);process.exitCode=1});
