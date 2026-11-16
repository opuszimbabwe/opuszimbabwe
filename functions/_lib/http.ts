// Reconstructed shared boundary; never expose provider errors or credentials.
import {json, requireAdmin} from './auth';
import {CheckoutError, hash, limitAttempts} from './payments';
import type {PagesContext} from './types';
export {CheckoutError, hash};
export const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const TOKEN=/^[a-f0-9]{64}$/;
export const now=()=>new Date().toISOString();
export const response=(data:unknown,status=200,headers:Record<string,string>={})=>json(data,status,{'cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff',...headers});
export function failure(error:unknown){return response({error:error instanceof CheckoutError?error.message:'The request could not be completed. Please retry.'},error instanceof CheckoutError?error.status:503);}
export function origin(request:Request){
 const url=new URL(request.url);
 const allowed=['https://opuszim.co.zw','https://www.opuszim.co.zw','https://payments.opuszim.co.zw','http://localhost:8788','http://127.0.0.1:8788'];
 if(!allowed.includes(url.origin)||request.headers.get('origin')!==url.origin)throw new CheckoutError(403,'Please send this request from the Opus website.');
}
export async function admin(c:PagesContext,mutation=false){const identity=await requireAdmin(c);if(identity instanceof Response)throw new CheckoutError(401,'Administrator sign-in is required.');if(mutation)origin(c.request);return identity;}
export function text(value:unknown,label:string,max:number,required=true){if(typeof value!=='string'||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)||(required&&!value.trim()))throw new CheckoutError(400,'Please enter a valid '+label+'.');return value.trim();}
export function identifier(value:unknown,label='reference'){const result=text(value,label,100);if(!/^[A-Za-z0-9_-]{1,100}$/.test(result))throw new CheckoutError(400,'Invalid '+label+'.');return result;}
export function integer(value:unknown,fallback:number,min=0,max=Number.MAX_SAFE_INTEGER){const n=value===null||value===undefined?fallback:Number(value);if(!Number.isSafeInteger(n)||n<min||n>max)throw new CheckoutError(400,'Invalid number.');return n;}
export async function bytes(request:Request|Response,max:number){
 if(Number(request.headers.get('content-length'))>max)throw new CheckoutError(413,'The request is too large.');
 const reader=request.body?.getReader();if(!reader)throw new CheckoutError(400,'Request details are required.');
 const parts:Uint8Array[]=[];let size=0;
 for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw new CheckoutError(413,'The request is too large.');}parts.push(part.value);}
 const data=new Uint8Array(size);let offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}return data;
}
export async function body(request:Request,max=20000):Promise<Record<string,unknown>>{
 if(!request.headers.get('content-type')?.toLowerCase().includes('application/json'))throw new CheckoutError(415,'JSON request details are required.');
 const data=await bytes(request,max);try{const parsed=JSON.parse(new TextDecoder().decode(data));if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error();return parsed;}catch{throw new CheckoutError(400,'Invalid JSON request.');}
}
export async function form(request:Request,max:number){if(!request.headers.get('content-type')?.startsWith('multipart/form-data;'))throw new CheckoutError(415,'Use a file upload form.');const data=await bytes(request,max);try{return await new Response(data,{headers:{'content-type':request.headers.get('content-type')!}}).formData();}catch{throw new CheckoutError(400,'Invalid upload form.');}}
export async function rate(c:PagesContext,scope:string,max:number){await limitAttempts(c,'reconstructed:'+scope,max);}
export async function equal(a:string,b:string){return await hash(a)===await hash(b);}
