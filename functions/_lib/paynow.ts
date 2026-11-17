import {createHash,timingSafeEqual} from 'node:crypto';
import {CheckoutError,bytes} from './http';
import type {LocalMethod} from '../../lib/payments';
import type {Env} from './types';
export function paynowForm(encoded:string){
 const params=new URLSearchParams(encoded),values:Record<string,string>={};
 for(const [key,value] of params){const name=key.toLowerCase();if(!/^[a-z][a-z0-9_]{0,39}$/.test(name)||Object.hasOwn(values,name)||value.length>5000)throw new CheckoutError(400,'Invalid payment notification.');values[name]=value;}
 return values;
}
export function paynowSignature(values:Record<string,string>,key:string){return createHash('sha512').update(Object.entries(values).filter(([name])=>name!=='hash').map(([,value])=>value).join('')+key.toLowerCase(),'utf8').digest('hex').toUpperCase();}
export function verifyPaynow(values:Record<string,string>,key:string){const supplied=values.hash||'';if(!/^[a-f0-9]{128}$/i.test(supplied))return false;const a=Buffer.from(supplied.toUpperCase(),'ascii'),b=Buffer.from(paynowSignature(values,key),'ascii');return a.length===b.length&&timingSafeEqual(a,b);}
export function pollUrl(value:string){let u:URL;try{u=new URL(value);}catch{throw new CheckoutError(502,'Invalid payment status address.');}if(u.protocol!=='https:'||u.hostname!=='www.paynow.co.zw'||u.username||u.password||u.port||u.hash||!/^\/interface\/checkpayment\/?$/i.test(u.pathname))throw new CheckoutError(502,'Unexpected payment status address.');return u;}
export async function pollPaynow(env:Env,url:string){const r=await fetch(pollUrl(url),{headers:{accept:'application/x-www-form-urlencoded'},redirect:'manual',signal:AbortSignal.timeout(12000)});if(!r.ok){await r.body?.cancel();throw new CheckoutError(502,'Payment verification is temporarily unavailable.');}const raw=new TextDecoder().decode(await bytes(r,20000));const values=paynowForm(raw);if(!env.PAYNOW_INTEGRATION_KEY||!verifyPaynow(values,env.PAYNOW_INTEGRATION_KEY))throw new CheckoutError(502,'Payment status could not be authenticated.');return values;}
export function amountMinor(value:string){if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value))throw new CheckoutError(400,'Invalid payment amount.');const [whole,fraction='']=value.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));}

export const paynowConfigured=(env:Env)=>Boolean(env.PAYNOW_INTEGRATION_ID?.trim()&&env.PAYNOW_INTEGRATION_KEY?.trim());
export function paynowMethods(env:Env,currency:string):LocalMethod[]{
 if(!paynowConfigured(env)||currency!==(env.PAYNOW_CURRENCY||'USD')||currency!=='USD')return [];
 return ['OneMoney','POS2U','Telecash'].map(name=>({code:'PAYNOW_'+name.toUpperCase(),name,provider:'paynow' as const,minimumAmount:.01,maximumAmount:1000000,redirectRequired:name!=='OneMoney',flow:name==='OneMoney'?'mobile' as const:'hosted' as const,...(name==='OneMoney'?{requiresEmail:true,phoneField:'phone'}:{})}));
}
export function paynowRedirect(value:string){const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='www.paynow.co.zw'||u.username||u.password||u.port)throw new CheckoutError(502,'Unexpected Paynow checkout address.');return u.href}
export async function initiatePaynow(env:Env,input:{id:string;amount:string;invoice:string;email:string;method:string;phone?:string;returnUrl:string;resultUrl:string}){
 if(!paynowConfigured(env))throw new CheckoutError(503,'Paynow is not configured.');
 const remote=input.method==='OneMoney';if(remote&&(!input.phone||!input.email))throw new CheckoutError(400,'OneMoney requires your wallet number and payment email.');
 const fields:Record<string,string>={resulturl:input.resultUrl,returnurl:input.returnUrl,reference:input.id,amount:input.amount,id:env.PAYNOW_INTEGRATION_ID!,additionalinfo:'Opus Zimbabwe — '+input.invoice+' — '+input.method,authemail:input.email,...(remote?{phone:input.phone!,method:'onemoney'}:{}),status:'Message'};
 // Match Paynow's official SDK: encode each value before signing.
 for(const name of Object.keys(fields))fields[name]=encodeURI(fields[name]);
 fields.hash=paynowSignature(fields,env.PAYNOW_INTEGRATION_KEY!);
 // A timed-out initiation is ambiguous. Never retry a request that may charge.
 const response=await fetch('https://www.paynow.co.zw/interface/'+(remote?'remotetransaction':'initiatetransaction'),{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields).toString(),redirect:'manual',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new CheckoutError(502,'Paynow could not confirm the payment request.');
 const values=paynowForm(new TextDecoder().decode(await bytes(response,20000)));
 if(!verifyPaynow(values,env.PAYNOW_INTEGRATION_KEY!)||values.status?.toLowerCase()!=='ok'||!values.pollurl||(!remote&&!values.browserurl))throw new CheckoutError(502,'Paynow could not authenticate the checkout response.');
 const poll=pollUrl(values.pollurl).href,redirect=remote?null:paynowRedirect(values.browserurl);
 return {pollUrl:poll,redirectUrl:redirect,reference:values.paynowreference||null,instructions:remote?(values.instructions||'Confirm the OneMoney request on your phone.'):undefined};
}
