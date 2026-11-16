import {buildPushPayload} from '@block65/webcrypto-web-push';
import {hash,now,CheckoutError,text} from './http';
import type {Env} from './types';
export function validPushEndpoint(value:unknown):value is string {if(typeof value!=='string'||value.length>4096)return false;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&(/^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com)$/.test(u.hostname)||u.hostname.endsWith('.push.services.mozilla.com')||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com')||u.hostname.endsWith('.wns.windows.com'));}catch{return false;}}
function decoded(value:string){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export function vapid(env:Env){try{const key=JSON.parse(env.WEB_PUSH_PRIVATE_JWK||'null');if(typeof key?.d!=='string'||!env.WEB_PUSH_PUBLIC_KEY||decoded(key.d).length!==32||decoded(env.WEB_PUSH_PUBLIC_KEY).length!==65)return null;return {subject:'mailto:admin@opuszim.co.zw',publicKey:env.WEB_PUSH_PUBLIC_KEY,privateKey:key.d};}catch{return null;}}
export async function registration(data:unknown){
 const sub=data as {endpoint?:unknown;keys?:{p256dh?:unknown;auth?:unknown}};
 if(!validPushEndpoint(sub?.endpoint))throw new CheckoutError(400,'Invalid notification provider.');
 const p256dh=text(sub.keys?.p256dh,'device public key',100),auth=text(sub.keys?.auth,'device authentication',30);
 try{const key=decoded(p256dh);if(key.length!==65||decoded(auth).length!==16)throw Error();await crypto.subtle.importKey('raw',key,{name:'ECDH',namedCurve:'P-256'},false,[]);}catch{throw new CheckoutError(400,'Invalid device keys.');}
 return {id:await hash(sub.endpoint),endpoint:sub.endpoint,p256dh,auth};
}
export async function notifyLegacyPush(env:Env){
 const keys=vapid(env);if(!keys)return;
 const rows=(await env.DB.prepare('SELECT id,endpoint,p256dh,auth FROM admin_push_subscriptions WHERE disabled=0 ORDER BY created_at DESC LIMIT 50').all<{id:string;endpoint:string;p256dh:string;auth:string}>()).results;
 await Promise.allSettled(rows.map(async row=>{
  if(!validPushEndpoint(row.endpoint))return;
  try{const payload=await buildPushPayload({data:{title:'OpusChat',body:'A customer is waiting for your reply.',url:'/sysadmin/mobile/',icon:'/opus-inbox-assets/notify-logo-light-v19.png',tag:'opus-website-inbox'},options:{ttl:300,urgency:'high'}},{endpoint:row.endpoint,expirationTime:null,keys:{p256dh:row.p256dh,auth:row.auth}},keys);
   const r=await fetch(row.endpoint,{...payload,redirect:'manual',signal:AbortSignal.timeout(10000)});await r.body?.cancel();
   await env.DB.prepare('UPDATE admin_push_subscriptions SET disabled=?,last_error=? WHERE id=?').bind([404,410].includes(r.status)?1:0,r.ok?null:'HTTP '+r.status,row.id).run();
  }catch{await env.DB.prepare('UPDATE admin_push_subscriptions SET last_error=? WHERE id=?').bind('Delivery could not be confirmed.',row.id).run();}
 }));
}
