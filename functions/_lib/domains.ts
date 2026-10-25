import {receiptEmail,receiptWhatsApp} from '../../lib/receipt-contact';
import type { Env, PagesContext } from './types';
import { CheckoutError, accessToken, hash, trustedOrigin, readPaymentJson, type PaymentRow } from './payments';
import { DEFAULT_DOMAIN_PRICING, retailMinor, normaliseDomain, type DomainPricing, type DomainQuote, type RegistryField, type DomainPublicOrder } from '../../lib/domains';
const CF = 'https://api.cloudflare.com/client/v4';
export type DomainOrder = { receipt_email:string|null; receipt_whatsapp:string|null; id: string; token_hash: string; domain_name: string; extension: string; supplier_cost_minor: number; renewal_cost_minor: number | null; retail_minor: number; markup_percent: number; minimum_markup_minor: number; contact_json: string; registration_json: string; terms_accepted_at: string; quote_expires_at: number; state: string; payment_id: string | null; supplier_status_json: string | null; supplier_started_at: string | null; last_error: string | null; created_at: string; updated_at: string };
export async function registrar(env: Env, path: string, body?: unknown, asynchronous = false) {
 if (!env.CLOUDFLARE_REGISTRAR_TOKEN || !env.CLOUDFLARE_REGISTRAR_ACCOUNT_ID) throw new CheckoutError(503, 'Domain registration is temporarily unavailable. Please contact support@opuszim.co.zw.');
 const headers: Record<string,string> = { authorization: 'Bearer ' + env.CLOUDFLARE_REGISTRAR_TOKEN, 'content-type': 'application/json' };
 if (asynchronous) headers.prefer = 'respond-async';
 const response = await fetch(`${CF}/accounts/${env.CLOUDFLARE_REGISTRAR_ACCOUNT_ID}/registrar${path}`, { method: body === undefined ? 'GET' : 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual', signal: AbortSignal.timeout(20000) });
 const result = await response.json() as { success?: boolean; result?: any; errors?: { code?: number; message?: string }[] };
 if (!response.ok || !result.success) throw new CheckoutError(response.status === 404 ? 404 : 503, response.status === 404 ? 'Domain registration has not been confirmed yet.' : 'The registrar could not confirm this request. Please contact support@opuszim.co.zw.');
 return result.result;
}
export function validPricing(value: unknown): value is DomainPricing {
 const p = value as DomainPricing;
 return Boolean(p && Number.isFinite(p.markup_percent) && p.markup_percent >= 0 && p.markup_percent <= 300 && Number.isInteger(p.minimum_markup_minor) && p.minimum_markup_minor >= 0 && p.minimum_markup_minor <= 100000 && Number.isInteger(p.rounding_minor) && p.rounding_minor >= 1 && p.rounding_minor <= 10000);
}
export async function pricing(env: Env): Promise<DomainPricing> {
 const row = await env.DB.prepare("SELECT value FROM settings WHERE key='domain_pricing'").first<{ value: string }>();
 try { const value = JSON.parse(row?.value || '{}'); if (validPricing(value)) return value; } catch {}
 return DEFAULT_DOMAIN_PRICING;
}
export function moneyMinor(value: unknown): number | null {
 if (typeof value !== 'string' && typeof value !== 'number') return null;
 if (!/^\d+(?:\.\d{1,6})?$/.test(String(value))) return null;
 const number = Math.ceil(Number(value) * 100 - 1e-7); return Number.isSafeInteger(number) && number > 0 && number <= 100000000 ? number : null;
}
async function extensionFor(env: Env, domain: string) {
 const rows = await env.DB.prepare('SELECT extension FROM domain_catalogue').all<{ extension: string }>();
 const extension = rows.results.map(row=>row.extension).sort((a,b)=>b.length-a.length).find(name=>domain.endsWith('.'+name));
 if (!extension) return '';
 if (domain.slice(0,-extension.length-1).includes('.')) throw new CheckoutError(400, 'Enter the domain without extra subdomains, for example yourbusiness.com.');
 return extension;
}
function resolve(schema: any, root: any): any {
 if (!schema?.$ref) return schema;
 if (typeof schema.$ref !== 'string' || !schema.$ref.startsWith('#/')) throw new Error('Unsupported registration requirements');
 return schema.$ref.slice(2).split('/').reduce((node: any, key: string)=>node?.[key.replace(/~1/g,'/').replace(/~0/g,'~')],root);
}
export function validateSchema(schema: any, value: any, root=schema, depth=0): boolean {
 if (depth>20) return false; schema=resolve(schema,root); if (schema===true) return true; if (!schema||schema===false) return false;
 if (schema.const !== undefined && value!==schema.const) return false;
 if (schema.enum && !schema.enum.includes(value)) return false;
 if (schema.allOf && !schema.allOf.every((s:any)=>validateSchema(s,value,root,depth+1))) return false;
 if (schema.anyOf && !schema.anyOf.some((s:any)=>validateSchema(s,value,root,depth+1))) return false;
 if (schema.oneOf && schema.oneOf.filter((s:any)=>validateSchema(s,value,root,depth+1)).length!==1) return false;
 if (schema.not && validateSchema(schema.not,value,root,depth+1)) return false;
 if (schema.if && !validateSchema(validateSchema(schema.if,value,root,depth+1)?schema.then||{}:schema.else||{},value,root,depth+1)) return false;
 const type=Array.isArray(value)?'array':value===null?'null':typeof value;
 if (schema.type && !(Array.isArray(schema.type)?schema.type:[schema.type]).some((t:string)=>t===type||(t==='integer'&&type==='number'&&Number.isInteger(value)))) return false;
 if (type==='object') {
  if ((schema.required||[]).some((key:string)=>!Object.prototype.hasOwnProperty.call(value,key))) return false;
  for (const [key,child] of Object.entries(value)) { if (['__proto__','constructor','prototype'].includes(key)) return false; const childSchema=schema.properties?.[key]; if (childSchema&&!validateSchema(childSchema,child,root,depth+1)) return false; if(!childSchema&&schema.additionalProperties===false)return false; }
 }
 if (type==='array' && (value.length<(schema.minItems||0)||value.length>(schema.maxItems??50)||value.some((x:any)=>schema.items&&!validateSchema(schema.items,x,root,depth+1)))) return false;
 if (type==='string') { if(value.length<(schema.minLength||0)||value.length>(schema.maxLength??2000))return false; if(schema.pattern){try{if(!new RegExp(schema.pattern).test(value))return false}catch{return false}} }
 if (type==='number' && (!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity))) return false;
 return true;
}
function fieldLabel(key:string) { return key.replace(/_/g,' ').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase()); }
export function registryFields(schema:any, body:any, root=schema, path:string[]=[], depth=0): RegistryField[] {
 if(depth>12)throw new Error('Assisted registration required');schema=resolve(schema,root);
 if (!schema || schema.oneOf || schema.anyOf || schema.allOf || schema.if || schema.patternProperties) throw new Error('Assisted registration required');
 const fields:RegistryField[]=[];
 for(const key of new Set<string>([...(schema.required||[]),...Object.keys(body||{})])) {
  if(['__proto__','prototype','constructor'].includes(key))throw new Error('Invalid requirements');
  const node=resolve(schema.properties?.[key],root);if(!node)throw new Error('Missing requirements');
  if(body?.[key]!==undefined){if(node.type==='object')fields.push(...registryFields(node,body[key],root,[...path,key],depth+1));continue;}
  if(node.type==='object'){fields.push(...registryFields(node,{},root,[...path,key],depth+1));continue;}
  if(!['string','number','integer','boolean'].includes(node.type))throw new Error('Assisted registration required');
  fields.push({path:[...path,key],label:node.title||fieldLabel(key),description:typeof node.description==='string'?node.description.slice(0,700):'',type:node.type,values:node.enum,required:true});
 }
 return fields;
}
function baseRegistration(domain:string,contact:any,privacy:boolean) {
 return {domain_name:domain,years:1,auto_renew:false,privacy_mode:privacy?'redaction':'off',contacts:{registrant:contact}};
}
const emptyContact={email:'',phone:'',postal_info:{name:'',organization:'',address:{street:'',city:'',state:'',postal_code:'',country_code:''}}};
export async function checkDomain(env:Env, raw:unknown):Promise<DomainQuote & { schema?:any; supplier_minor?:number }> {
 const domain=normaliseDomain(raw);if(!domain)throw new CheckoutError(400,'Enter a full domain name, for example yourbusiness.com.');
 const extension=await extensionFor(env,domain);if(!extension)return{domain,extension:domain.split('.').slice(1).join('.'),registrable:false,assisted:true,reason:'extension_not_supported'};
 const [checked,definition,policy]=await Promise.all([registrar(env,'/domain-check',{domains:[domain]}),registrar(env,'/extensions/'+encodeURIComponent(extension)),pricing(env)]);
 const result=checked.domains?.find((x:any)=>x.name===domain);if(!result)throw new CheckoutError(503,'The registrar did not return a result for this name.');
 const cost=moneyMinor(result.pricing?.registration_cost),renewal=moneyMinor(result.pricing?.renewal_cost);
 if(!result.registrable||result.tier==='premium'||result.pricing?.currency!=='USD'||cost===null)return{domain,extension,registrable:false,assisted:result.tier==='premium'||/supported|eligib|frozen/.test(result.reason||''),reason:result.reason||'quote_required'};
 const schema=definition.registration_schema;const privacy=Boolean(schema?.properties?.privacy_mode?.enum?.includes('redaction'));
 let fields:RegistryField[]=[];try{fields=registryFields(schema,baseRegistration(domain,emptyContact,privacy));}catch{return{domain,extension,registrable:false,assisted:true,reason:'additional_registry_review'};}
 return{domain,extension,registrable:true,assisted:false,registration_minor:retailMinor(cost,policy),renewal_minor:renewal===null?undefined:retailMinor(renewal,policy),fields,privacy,schema,supplier_minor:cost};
}
export function publicQuote(quote:Awaited<ReturnType<typeof checkDomain>>) {const {schema,supplier_minor,...publicResult}=quote;return publicResult;}
export function publicOrder(row:DomainOrder):DomainPublicOrder {
 const contact=JSON.parse(row.contact_json);
 return{id:row.id,domain:row.domain_name,state:row.state,retail_minor:row.retail_minor,renewal_minor:row.renewal_cost_minor,expires:row.quote_expires_at,payment_id:row.payment_id,payer_name:contact.postal_info.name,payer_email:contact.email,terminal:['REGISTERED','REGISTRATION_FAILED','PRICE_CHANGED','ACTION_REQUIRED','PAYMENT_FAILED','REVERSED'].includes(row.state),message:row.last_error||undefined};
}
export async function findOrder(env:Env,id:string){return env.DB.prepare('SELECT * FROM domain_orders WHERE id=?').bind(id).first<DomainOrder>();}
export async function authorisedOrder(env:Env,id:unknown,rawToken:unknown){
 if(typeof id!=='string'||id.length>100)throw new CheckoutError(400,'Invalid domain order.');const token=accessToken(rawToken);
 const row=await env.DB.prepare('SELECT * FROM domain_orders WHERE id=? AND token_hash=?').bind(id,await hash(token)).first<DomainOrder>();if(!row)throw new CheckoutError(404,'Domain order not found.');return row;
}
function clean(value:any,label:string,max=200){if(typeof value!=='string'||!value.trim()||value.length>max||/[^\x20-\x7e]/.test(value))throw new CheckoutError(400,`Enter a valid ${label} using English/ASCII characters required by the registrar.`);return value.trim();}
export async function createDomainOrder(context:PagesContext,raw:Record<string,unknown>){
 trustedOrigin(context.request);const token=accessToken(raw.token);if(raw.accept_terms!==true)throw new CheckoutError(400,'Please accept the registration terms and confirm the ownership details.');
 const quote=await checkDomain(context.env,raw.domain);if(!quote.registrable||!quote.schema||quote.supplier_minor===undefined||quote.registration_minor===undefined)throw new CheckoutError(409,'This name needs an availability or eligibility review. Please contact support@opuszim.co.zw.');
 if(raw.quoted_minor!==quote.registration_minor)throw new CheckoutError(409,'The price has changed. Check the domain again and review the new total before paying.');
 const input=raw.contact as any;if(!input||typeof input!=='object')throw new CheckoutError(400,'Registrant contact details are required.');
 const email=clean(input.email,'registrant email',254);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new CheckoutError(400,'Enter a valid registrant email address.');
 const phone=clean(input.phone,'contact phone',24);if(!/^\+[1-9]\d{0,2}\.\d{4,14}$/.test(phone))throw new CheckoutError(400,'Include the calling code, for example +263.710740387.');
 const address=input.postal_info?.address||{};const country=clean(address.country_code,'country code',2).toUpperCase();if(!/^[A-Z]{2}$/.test(country))throw new CheckoutError(400,'Choose a valid country.');
 const contact={email,phone,postal_info:{name:clean(input.postal_info?.name,'legal registrant name',100),...(input.postal_info?.organization?{organization:clean(input.postal_info.organization,'organisation name',100)}:{}),address:{street:clean(address.street,'street address'),city:clean(address.city,'city'),state:clean(address.state,'state or province'),postal_code:clean(address.postal_code,'postal code',30),country_code:country}}};
 const registration:any=baseRegistration(quote.domain,contact,Boolean(quote.privacy));const extras=raw.registry_fields as Record<string,unknown>||{};
 for(const field of quote.fields||[]){let parent=registration;for(const key of field.path.slice(0,-1)){parent[key]??={};parent=parent[key];}const value=extras[field.path.join('.')];if(value===undefined)throw new CheckoutError(400,`Please complete ${field.label}.`);parent[field.path[field.path.length-1]]=value;}
 if(!validateSchema(quote.schema,registration))throw new CheckoutError(400,'The registrant or eligibility details do not meet this extension’s requirements. Check your information or contact support.');
 const deliveryEmail=receiptEmail(raw.receipt_email===undefined?email:raw.receipt_email),whatsapp=receiptWhatsApp(raw.receipt_whatsapp);if(!deliveryEmail)throw new CheckoutError(400,'Enter a valid receipt email.');if(whatsapp===null)throw new CheckoutError(400,'Enter a WhatsApp number with its country code, for example +263771234567.');
 const id=crypto.randomUUID(),now=new Date().toISOString(),policy=await pricing(context.env),tokenHash=await hash(token);
 const existing=await context.env.DB.prepare('SELECT * FROM domain_orders WHERE token_hash=?').bind(tokenHash).first<DomainOrder>();if(existing){if(existing.domain_name!==quote.domain||existing.registration_json!==JSON.stringify(registration)||existing.retail_minor!==quote.registration_minor||(existing.receipt_email||email)!==deliveryEmail||(existing.receipt_whatsapp||'')!==whatsapp)throw new CheckoutError(409,'This order link already belongs to another set of registration details. Start a new order.');return publicOrder(existing);}
 await context.env.DB.prepare('INSERT INTO domain_orders (id,token_hash,domain_name,extension,supplier_cost_minor,renewal_cost_minor,retail_minor,markup_percent,minimum_markup_minor,contact_json,registration_json,terms_accepted_at,quote_expires_at,created_at,updated_at,receipt_email,receipt_whatsapp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tokenHash,quote.domain,quote.extension,quote.supplier_minor,quote.renewal_minor??null,quote.registration_minor,policy.markup_percent,policy.minimum_markup_minor,JSON.stringify(contact),JSON.stringify(registration),now,Date.now()+900000,now,now,deliveryEmail,whatsapp).run();
 return publicOrder((await findOrder(context.env,id))!);
}
export async function prepareDomainPayment(env:Env,id:unknown,token:unknown){
 const order=await authorisedOrder(env,id,token);
 if(order.payment_id)throw new CheckoutError(409,'This domain order already has a payment attempt. Check its status before making another payment.');
 if(order.state!=='QUOTED'||order.quote_expires_at<Date.now())throw new CheckoutError(409,'This domain quote has expired. Check the name again for a current quote.');
 const checked=await checkDomain(env,order.domain_name);
 if(!checked.registrable||checked.supplier_minor!==order.supplier_cost_minor||checked.registration_minor!==order.retail_minor)throw new CheckoutError(409,'Availability or pricing changed. Check the name again before paying.');
 return order;
}
export async function claimDomainPayment(env:Env,order:DomainOrder,paymentId:string){
 try{const row=await env.DB.prepare("UPDATE domain_orders SET payment_id=?,state='PAYMENT_PENDING',updated_at=? WHERE id=? AND payment_id IS NULL AND state='QUOTED' AND quote_expires_at>? RETURNING id").bind(paymentId,new Date().toISOString(),order.id,Date.now()).first();if(!row)throw new Error();}
 catch{throw new CheckoutError(409,'A payment for this domain is already being processed. Check the existing order before trying again.');}
}
async function updateState(env:Env,id:string,state:string,message:string|null=null,status?:any){await env.DB.prepare('UPDATE domain_orders SET state=?,last_error=?,supplier_status_json=COALESCE(?,supplier_status_json),updated_at=? WHERE id=?').bind(state,message,status?JSON.stringify(status):null,new Date().toISOString(),id).run();}
async function confirmRegistration(env:Env,row:DomainOrder){
 try{
  let record:any=null;try{record=await registrar(env,'/registrations/'+encodeURIComponent(row.domain_name));}catch(error){if(!(error instanceof CheckoutError)||error.status!==404)throw error;}const value=record?.registration||record||{};
  if(value.domain_name===row.domain_name&&value.status==='active'&&value.created_at&&Number.isFinite(Date.parse(value.created_at))&&Date.parse(value.created_at)>=Date.parse(row.supplier_started_at||row.created_at)-300000){await updateState(env,row.id,'REGISTERED',null,record);return;}
  const result=await registrar(env,'/registrations/'+encodeURIComponent(row.domain_name)+'/registration-status');const workflow=result.workflow_status||result;
  if(workflow.state==='action_required')await updateState(env,row.id,'ACTION_REQUIRED','The registry needs an additional eligibility check. Contact support; do not pay again.',result);
  else if(workflow.state==='failed')await updateState(env,row.id,'REGISTRATION_FAILED','The registrar could not complete this registration. Contact support for resolution; do not pay again.',result);
  else await updateState(env,row.id,'REGISTERING',null,result);
 }catch{await updateState(env,row.id,'UNCONFIRMED','Registration is awaiting confirmation. Contact support before making another payment.');}
}
export async function fulfilDomainPayment(env:Env,payment:PaymentRow){
 let order=await env.DB.prepare('SELECT * FROM domain_orders WHERE payment_id=?').bind(payment.id).first<DomainOrder>();if(!order)return null;
 if(payment.status==='REVERSED'){await updateState(env,order.id,'REVERSED','Payment was reversed. Contact support about the domain order.');return publicOrder((await findOrder(env,order.id))!);}
 if(['FAILED','CANCELLED','EXPIRED'].includes(payment.status)&&order.state==='PAYMENT_PENDING'){await updateState(env,order.id,'PAYMENT_FAILED','Payment was not completed. No registration was submitted.');return publicOrder((await findOrder(env,order.id))!);}
 if(payment.status!=='SUCCESS')return publicOrder(order);
 if(payment.currency!=='USD'||payment.amount_minor!==order.retail_minor)throw new CheckoutError(409,'The domain payment amount could not be verified.');
 let newlyPaid=false;
 if(order.state==='PAYMENT_PENDING'){
  const claimed=await env.DB.prepare("UPDATE domain_orders SET state='PAID',updated_at=? WHERE id=? AND state='PAYMENT_PENDING' RETURNING id").bind(new Date().toISOString(),order.id).first();if(claimed){order=(await findOrder(env,order.id))!;newlyPaid=true;}
 }
 if(order.state==='PAID' && (newlyPaid||Date.now()-Date.parse(order.updated_at)>5000)){
  // Preflight failures are safe to retry: no supplier purchase has been sent.
  // Claim the irreversible step only after fresh availability and schema checks.
  let checked:Awaited<ReturnType<typeof checkDomain>>;
  try{checked=await checkDomain(env,order.domain_name);}catch{await updateState(env,order.id,'PAID','Payment is verified. The registrar availability check is temporarily unavailable; we will check again before submitting registration.');return publicOrder((await findOrder(env,order.id))!);}
  if(!checked.registrable||checked.supplier_minor===undefined||checked.supplier_minor>order.supplier_cost_minor){await updateState(env,order.id,'PRICE_CHANGED','Availability or supplier pricing changed after payment. Contact support for resolution; do not pay again.');return publicOrder((await findOrder(env,order.id))!);}
  const registration=JSON.parse(order.registration_json);
  if(!validateSchema(checked.schema,registration)){await updateState(env,order.id,'ACTION_REQUIRED','Registry requirements changed after payment. Contact support to resolve eligibility; do not pay again.');return publicOrder((await findOrder(env,order.id))!);}
  const lock=await env.DB.prepare("UPDATE domain_orders SET state='REGISTERING',supplier_started_at=?,updated_at=? WHERE id=? AND state='PAID' RETURNING id").bind(new Date().toISOString(),new Date().toISOString(),order.id).first();if(!lock)return publicOrder((await findOrder(env,order.id))!);
  try{
   const result=await registrar(env,'/registrations',registration,true);await updateState(env,order.id,'REGISTERING',null,result);
   await confirmRegistration(env,(await findOrder(env,order.id))!);
  }catch{await updateState(env,order.id,'UNCONFIRMED','The registrar request needs confirmation. We will check it without submitting another purchase. Contact support if it remains pending.');}
 }else if(['REGISTERING','UNCONFIRMED'].includes(order.state)&&Date.now()-Date.parse(order.updated_at)>5000)await confirmRegistration(env,order);
 return publicOrder((await findOrder(env,order.id))!);
}
export { readPaymentJson };
