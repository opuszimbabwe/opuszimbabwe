import {body,origin,rate,response,failure,text} from '../_lib/http';
import {conversation,answer} from '../_lib/assistant';
import type {PagesHandler} from '../_lib/types';
export const onRequestPost:PagesHandler=async c=>{try{origin(c.request);const data=await body(c.request,5*1024*1024);if(data.mode!==undefined)text(data.mode,'assistant mode',40);const messages=conversation(data.messages);await rate(c,'assistant',40);const result=await answer(c.env,messages);return response({answer:result.answer,...(result.handoff?{handoff:true}:{})});}catch(e){return failure(e)}};
