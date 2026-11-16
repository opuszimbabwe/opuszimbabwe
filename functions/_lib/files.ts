import {CheckoutError} from './http';
import type {R2ObjectBody} from './types';
export const MAX_ATTACHMENT=8*1024*1024;
export function fileName(value:string){return value.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,160)||'attachment';}
export function sniff(data:Uint8Array,name:string,imagesOnly=false){
 let mime='';const start=new TextDecoder().decode(data.slice(0,12));
 if(data[0]===137&&data[1]===80&&data[2]===78&&data[3]===71&&data[4]===13&&data[5]===10&&data[6]===26&&data[7]===10)mime='image/png';
 else if(data[0]===255&&data[1]===216&&data[2]===255)mime='image/jpeg';
 else if(start.startsWith('RIFF')&&start.slice(8,12)==='WEBP')mime='image/webp';
 else if(!imagesOnly&&start.startsWith('%PDF-'))mime='application/pdf';
 else if(!imagesOnly&&data[0]===80&&data[1]===75&&/\.(docx|xlsx|pptx)$/i.test(name)){const suffix=name.split('.').pop()!.toLowerCase();mime='application/vnd.openxmlformats-officedocument.'+({docx:'wordprocessingml.document',xlsx:'spreadsheetml.sheet',pptx:'presentationml.presentation'}[suffix]);}
 else if(!imagesOnly&&/\.txt$/i.test(name)&&!data.includes(0)){try{new TextDecoder('utf-8',{fatal:true}).decode(data);mime='text/plain';}catch{}}
 if(!mime)throw new CheckoutError(415,imagesOnly?'Use a JPG, PNG or WebP image.':'Use JPG, PNG, WebP, PDF, TXT, DOCX, XLSX or PPTX.');return mime;
}
export function download(object:R2ObjectBody,name:string,mime:string,inline=false){return new Response(object.body,{headers:{'content-type':mime,'content-disposition':(inline?'inline':'attachment')+"; filename*=UTF-8''"+encodeURIComponent(fileName(name)),'cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox"}});}
