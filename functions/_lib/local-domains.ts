import {form,text,TOKEN,UUID,hash,now,rate,CheckoutError,response} from './http';
import {normaliseDomain} from '../../lib/domains';
import {fileName} from './files';
import type {PagesContext} from './types';
export async function localApplication(c:PagesContext){
 const input=await form(c.request,2*1024*1024+65536);if(input.get('website'))return response({reference:'Received'});
 const id=text(input.get('id'),'application reference',36),token=text(input.get('token'),'application link',64);
 if(!UUID.test(id)||!TOKEN.test(token))throw new CheckoutError(400,'Invalid application reference.');
 if(input.get('consent')!=='yes')throw new CheckoutError(400,'Please consent to submitting your application.');
 const extension=text(input.get('extension'),'extension',10);if(!['.co.zw','.org.zw','.ac.zw'].includes(extension))throw new CheckoutError(400,'Choose a supported Zimbabwean extension.');
 let domain=text(input.get('domain_name')??input.get('domain'),'domain name',253).toLowerCase();if(!domain.includes('.'))domain+=extension;domain=normaliseDomain(domain);
 if(!domain.endsWith(extension)||!domain.slice(0,-extension.length)||domain.slice(0,-extension.length).includes('.'))throw new CheckoutError(400,'Enter a domain matching the selected extension.');
 const details={domain,extension,full_name:text(input.get('full_name'),'full name',120),company_name:text(input.get('company_name')??'','company name',200,false),physical_address:text(input.get('physical_address'),'physical address',1000),phone:text(input.get('phone'),'phone number',30),email:text(input.get('email'),'email',254).toLowerCase(),core_business:text(input.get('core_business'),'core business',2000),nameservers:text(input.get('nameservers')??'','nameservers',1000,false),message:text(input.get('message')??'','message',2000,false)};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)||!/^\+?[0-9 ()-]{7,30}$/.test(details.phone))throw new CheckoutError(400,'Enter a valid email and phone number.');
 if(details.nameservers.split(/[\s,;]+/).filter(Boolean).some(ns=>!normaliseDomain(ns)))throw new CheckoutError(400,'Use nameserver hostnames.');
 const upload=input.get('letter');let file:File|null=null,content:Uint8Array|null=null;
 if(upload instanceof File&&upload.size){file=upload;if(file.size>2*1024*1024)throw new CheckoutError(413,'The supporting letter must be at most 2 MB.');content=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(content.slice(0,5))!=='%PDF-')throw new CheckoutError(415,'Upload the supporting letter as a PDF.');}
 if(extension!=='.co.zw'&&!file)throw new CheckoutError(400,'A supporting PDF letter is required for this extension.');
 const tokenHash=await hash(token),fingerprint=await hash(JSON.stringify(details)+(content?await crypto.subtle.digest('SHA-256',new Uint8Array(content).buffer).then(b=>[...new Uint8Array(b)].join(',')):''));
 const prior=await c.env.DB.prepare('SELECT token_hash,fingerprint FROM local_domain_applications WHERE id=?').bind(id).first<{token_hash:string;fingerprint:string}>();
 const reference='ZW-'+id.toUpperCase();if(prior){if(prior.token_hash!==tokenHash||prior.fingerprint!==fingerprint)throw new CheckoutError(409,'This application reference is already in use.');return response({reference});}
 await rate(c,'local-domain-application',5);const key=file?'private/domain-applications/'+id+'/'+crypto.randomUUID():null;
 if(key&&content)await c.env.MEDIA.put(key,content.buffer as ArrayBuffer,{httpMetadata:{contentType:'application/pdf'}});
 try{await c.env.DB.prepare('INSERT INTO local_domain_applications(id,token_hash,fingerprint,request_hash,extension,domain_name,full_name,company_name,physical_address,phone,email,core_business,nameservers,message,letter_key,letter_filename,letter_type,letter_size,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,tokenHash,fingerprint,await hash(c.request.headers.get('cf-connecting-ip')||'local'),extension,domain,details.full_name,details.company_name,details.physical_address,details.phone,details.email,details.core_business,details.nameservers,details.message,key,file?fileName(file.name):null,file?'application/pdf':null,file?.size||null,now(),now()).run();}
 catch(e){if(key)await c.env.MEDIA.delete(key);const concurrent=await c.env.DB.prepare('SELECT token_hash,fingerprint FROM local_domain_applications WHERE id=?').bind(id).first<{token_hash:string;fingerprint:string}>();if(concurrent?.token_hash===tokenHash&&concurrent.fingerprint===fingerprint)return response({reference});if(concurrent)throw new CheckoutError(409,'This application reference is already in use.');throw e;}
 return response({reference},201);
}
