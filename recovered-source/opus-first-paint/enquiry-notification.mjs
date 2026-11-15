import {notifyMessage} from '../opus-notifications/alerts.mjs';
export async function handleEnquiryNotification(request,env={},upstream=fetch,context){
 const url=new URL(request.url);
 if(request.headers.get('origin')!==url.origin)return upstream(request);
 let data;try{data=await request.clone().json()}catch{return upstream(request)}
 const response=await upstream(request);
 if(!response.ok||typeof data?.body!=='string'||!data.body.trim()||typeof data.id!=='string'||!/^[a-zA-Z0-9_-]{16,100}$/.test(data.id))return response;
 notifyMessage(env,data.id,context);let state='not_configured';const notify=async()=>{
 if(env.RESEND_API_KEY&&env.ENQUIRY_ALERT_EMAIL){
  let alertText=data.body;try{if(data.body.startsWith('[OPUS_MESSAGE_V1]')){const rich=JSON.parse(data.body.slice('[OPUS_MESSAGE_V1]'.length));alertText=[rich.text||'',...(Array.isArray(rich.files)?rich.files.map(file=>'Attachment: '+String(file.name||'File')):[]),rich.footer||''].filter(Boolean).join('\n');}}catch{}
  const email=data.body.match(/^Email:\s*([^\r\n]+)$/m)?.[1]?.trim();
  const payload={from:env.RECEIPT_FROM_EMAIL||'Opus Zimbabwe <support@opuszim.co.zw>',to:[env.ENQUIRY_ALERT_EMAIL],subject:data.body.startsWith('Opus AI handoff\n')?'Visitor needs your team — Opus Zimbabwe':'New website enquiry — Opus Zimbabwe',text:alertText+'\n\nReply in Opus Inbox: https://opuszim.co.zw/sysadmin/mobile/'};
  if(email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))payload.reply_to=email;
  try{
   const mail=await upstream(new Request('https://api.resend.com/emails',{method:'POST',headers:{authorization:'Bearer '+env.RESEND_API_KEY,'content-type':'application/json','Idempotency-Key':'opus-enquiry-'+data.id},body:JSON.stringify(payload),redirect:'manual',signal:AbortSignal.timeout(10000)}));
   const result=await mail.json().catch(()=>null);state=mail.ok&&typeof result?.id==='string'?'accepted':mail.status>=500?'unconfirmed':'failed';
  }catch{state='unconfirmed'}
 }
 };if(context?.waitUntil&&env.RESEND_API_KEY&&env.ENQUIRY_ALERT_EMAIL){state='queued';context.waitUntil(notify());}else await notify();
 const headers=new Headers(response.headers);headers.set('x-opus-enquiry-email',state);headers.set('cache-control','no-store');
 return new Response(response.body,{status:response.status,headers});
}
