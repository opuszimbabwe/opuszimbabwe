// Reconstructed from the live cookie/response contract and deployed D1 schema.
import {session,publicSession,messages,createSession} from '../../_lib/chat';
import {response,failure} from '../../_lib/http';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{const row=await session(c,false);return response({session:row?publicSession(row):null,messages:row?await messages(c,row.id):[]});}catch(e){return failure(e)}};
export const onRequestPost:PagesHandler=async c=>{try{return await createSession(c)}catch(e){return failure(e)}};
