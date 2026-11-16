import {chatAttachment,uploadChatAttachment} from '../../_lib/chat-attachments';
import {origin,failure} from '../../_lib/http';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{return await chatAttachment(c,new URL(c.request.url).searchParams.get('id')||'')}catch(e){return failure(e)}};
export const onRequestPost:PagesHandler=async c=>{try{origin(c.request);return await uploadChatAttachment(c)}catch(e){return failure(e)}};
