// Isolated signed-webhook tests; no GitHub/Vercel writes or provider calls.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {DatabaseSync}=require('node:sqlite');const {generateKeyPairSync,sign}=require('node:crypto');
const handler=require('/tmp/opus-payments-test/api/maintenance/project-events.js').onRequestPost;
const sql=new DatabaseSync(':memory:');sql.exec("CREATE TABLE care_projects(id TEXT PRIMARY KEY,enabled INTEGER);INSERT INTO care_projects VALUES('great-couples',1)");sql.exec(fs.readFileSync('migrations/0025_project_repository_events.sql','utf8'));
class Statement{constructor(query){this.query=query}bind(...values){this.values=values;return this}async first(){return sql.prepare(this.query).get(...this.values)||null}async run(){return sql.prepare(this.query).run(...this.values)}}
const DB={prepare:q=>new Statement(q),batch:async statements=>Promise.all(statements.map(s=>s.run()))};
const keys=generateKeyPairSync('rsa',{modulusLength:2048});const jwk={...keys.publicKey.export({format:'jwk'}),kid:'test-only',alg:'RS256'};
global.fetch=async url=>{assert.equal(url,'https://token.actions.githubusercontent.com/.well-known/jwks');return Response.json({keys:[jwk]})};
const event={repository_id:1312317100,repository:'Opus-Zimbabwe/great-couples-international-trust-23941f01',sha:'a'.repeat(40),branch:'main',event:'deployment',status:'failure',context:'Vercel',url:'https://vercel.com/example/project/deployment',occurred_at:new Date().toISOString()};
async function send(payload=event,options={}){
 const body=JSON.stringify(payload),now=Math.floor(Date.now()/1000);
 const claims={iss:'https://token.actions.githubusercontent.com',aud:'https://opuszim.co.zw/api/maintenance/project-events',iat:now,nbf:now-1,exp:options.stale?now-600:now+300,repository:event.repository,repository_id:'1312317100',ref:'refs/heads/main',sha:payload.sha,event_name:payload.event==='push'?'push':'status',workflow_ref:event.repository+'/.github/workflows/opus-care-record.yml@refs/heads/main',...options.claims};
 const unsigned=Buffer.from(JSON.stringify({alg:'RS256',kid:'test-only'})).toString('base64url')+'.'+Buffer.from(JSON.stringify(claims)).toString('base64url');
 const signature=sign('RSA-SHA256',Buffer.from(unsigned),keys.privateKey).toString('base64url');
 return handler({env:{DB},request:new Request('https://opuszim.co.zw/api/maintenance/project-events',{method:'POST',headers:{authorization:'Bearer '+unsigned+'.'+(options.forged?'a'.repeat(signature.length):signature),'content-type':'application/json'},body})});
}
(async()=>{
 assert.equal((await send(event,{forged:true})).status,401);assert.equal((await send(event,{stale:true})).status,401);assert.equal(sql.prepare('SELECT COUNT(*) n FROM care_repository_events').get().n,0);
 assert.equal((await send(event,{claims:{workflow_ref:'other/workflow'}})).status,401);assert.equal((await send(event,{claims:{repository_id:'999'}})).status,401);assert.equal((await send(event,{claims:{aud:'wrong'}})).status,401);
 assert.equal((await send({...event,repository_id:123})).status,403);assert.equal((await send({...event,branch:'other'})).status,400);assert.equal((await send({...event,sha:'bad'})).status,400);
 assert.equal((await send()).status,200);assert.equal((await send()).status,200);assert.equal(sql.prepare('SELECT COUNT(*) n FROM care_repository_events').get().n,1,'Webhook retries are deduplicated');assert.equal(sql.prepare('SELECT status FROM care_repository_events').get().status,'failure');
 const second={...event,sha:'b'.repeat(40),status:'success',url:'https://evil.example/'};assert.equal((await send(second)).status,200);assert.match(sql.prepare("SELECT url FROM care_repository_events WHERE status='success'").get().url,/^https:\/\/github.com\//);
 sql.exec("UPDATE care_projects SET enabled=0");assert.equal((await send({...event,sha:'c'.repeat(40)})).status,403);sql.exec("UPDATE care_projects SET enabled=1");assert.equal((await send({...event,context:'x'.repeat(17000)})).status,413);
 console.log('PASS: GitHub OIDC signature/audience/repository/workflow verification, expiry, configured-repository/branch validation, replay deduplication, failure/success recording, link restrictions, paused-project protection and bounded body. No external requests.');
})().catch(e=>{console.error(e);process.exit(1)});
