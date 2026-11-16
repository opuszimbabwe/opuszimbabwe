import {session,writeMessage} from '../../_lib/chat';
import {body,origin,response,failure} from '../../_lib/http';
import {notifyLegacyPush} from '../../_lib/push';
import type {PagesHandler} from '../../_lib/types';
export const onRequestPost:PagesHandler=async c=>{try{origin(c.request);const who=(await session(c))!,data=await body(c.request);const result=await writeMessage(c,who.id,'IN',data);if(!result.duplicate){const work=notifyLegacyPush(c.env).catch(()=>{});if(c.waitUntil)c.waitUntil(work);else await work;}return response(result,201);}catch(e){return failure(e)}};
