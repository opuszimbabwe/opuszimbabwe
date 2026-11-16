import {createHash,timingSafeEqual} from 'node:crypto';
import {CheckoutError,bytes} from './http';
import type {Env} from './types';
export function paynowForm(encoded:string){
 const params=new URLSearchParams(encoded),values:Record<string,string>={};
 for(const [key,value] of params){const name=key.toLowerCase();if(!/^[a-z][a-z0-9_]{0,39}$/.test(name)||Object.hasOwn(values,name)||value.length>5000)throw new CheckoutError(400,'Invalid payment notification.');values[name]=value;}
 return values;
}
export function paynowSignature(values:Record<string,string>,key:string){return createHash('sha512').update(Object.entries(values).filter(([name])=>name!=='hash').map(([,value])=>value).join('')+key,'utf8').digest('hex').toUpperCase();}
export function verifyPaynow(values:Record<string,string>,key:string){const supplied=values.hash||'';if(!/^[a-f0-9]{128}$/i.test(supplied))return false;const a=Buffer.from(supplied.toUpperCase(),'ascii'),b=Buffer.from(paynowSignature(values,key),'ascii');return a.length===b.length&&timingSafeEqual(a,b);}
export function pollUrl(value:string){let u:URL;try{u=new URL(value);}catch{throw new CheckoutError(502,'Invalid payment status address.');}if(u.protocol!=='https:'||u.hostname!=='www.paynow.co.zw'||u.username||u.password||u.port||u.hash||!/^\/interface\/checkpayment\/?$/i.test(u.pathname))throw new CheckoutError(502,'Unexpected payment status address.');return u;}
export async function pollPaynow(env:Env,url:string){const r=await fetch(pollUrl(url),{headers:{accept:'application/x-www-form-urlencoded'},redirect:'manual',signal:AbortSignal.timeout(12000)});if(!r.ok){await r.body?.cancel();throw new CheckoutError(502,'Payment verification is temporarily unavailable.');}const raw=new TextDecoder().decode(await bytes(r,20000));const values=paynowForm(raw);if(!env.PAYNOW_INTEGRATION_KEY||!verifyPaynow(values,env.PAYNOW_INTEGRATION_KEY))throw new CheckoutError(502,'Payment status could not be authenticated.');return values;}
export function amountMinor(value:string){if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))throw new CheckoutError(400,'Invalid payment amount.');const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));}
