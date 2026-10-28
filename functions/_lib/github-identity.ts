const ISSUER='https://token.actions.githubusercontent.com';
const AUDIENCE='https://opuszim.co.zw/api/maintenance/project-events';
const REPOSITORY='Opus-Zimbabwe/great-couples-international-trust-23941f01';
type Identity={repository:string;repository_id:string;sha:string;event_name:string;ref:string};
let cache:{keys:(JsonWebKey&{kid?:string})[];expires:number}|undefined;
function decode(value:string){if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid encoding');return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')),c=>c.charCodeAt(0))}
export async function githubIdentity(header:string|null):Promise<Identity|null>{
 try{
  if(!header?.startsWith('Bearer ')||header.length>14000)return null;
  const parts=header.slice(7).split('.');if(parts.length!==3)return null;
  const [head,body,signature]=parts as [string,string,string];
  const h=JSON.parse(new TextDecoder().decode(decode(head))),p=JSON.parse(new TextDecoder().decode(decode(body))),now=Date.now()/1000;
  if(h.alg!=='RS256'||typeof h.kid!=='string'||p.iss!==ISSUER||p.aud!==AUDIENCE||typeof p.exp!=='number'||p.exp<=now||typeof p.nbf!=='number'||p.nbf>now+30||typeof p.iat!=='number'||p.iat>now+30||p.exp-p.iat>600||p.repository!==REPOSITORY||p.repository_id!=='1312317100'||p.ref!=='refs/heads/main'||!['push','status'].includes(p.event_name)||p.workflow_ref!==REPOSITORY+'/.github/workflows/opus-care-record.yml@refs/heads/main')return null;
  if(!cache||cache.expires<Date.now()){
   const r=await fetch(ISSUER+'/.well-known/jwks',{redirect:'manual',signal:AbortSignal.timeout(8000)});if(!r.ok)return null;
   const data=await r.json() as {keys:(JsonWebKey&{kid?:string})[]};if(!Array.isArray(data.keys)||data.keys.length>30)return null;
   cache={keys:data.keys,expires:Date.now()+300000};
  }
  const jwk=cache.keys.find(k=>k.kid===h.kid&&k.kty==='RSA'&&(!k.alg||k.alg==='RS256'));if(!jwk){cache=undefined;return null}
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(signature),new TextEncoder().encode(head+'.'+body))?p as Identity:null;
 }catch{return null}
}
