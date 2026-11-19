import {body,origin,rate,response,failure,text} from '../_lib/http';
import {audit} from '../_lib/whatsapp-audit';
import {conversation,answer} from '../_lib/assistant';
import type {PagesHandler} from '../_lib/types';
export const onRequestPost:PagesHandler=async c=>{try{origin(c.request);const data=await body(c.request,5*1024*1024);if(data.mode!==undefined)text(data.mode,'assistant mode',40);const messages=conversation(data.messages);await rate(c,'assistant',40);const diagnosticId=crypto.randomUUID();const result=await answer(c.env,messages,'website',async event=>{await audit(c.env,'ai_provider_diagnostic',{phone_number_id:null,details:{...event,diagnostic_id:diagnosticId,channel:'website',whatsapp_delivery:false}});});return response({answer:result.answer,...(result.handoff?{handoff:true}:{})});}catch(e){return failure(e)}};
