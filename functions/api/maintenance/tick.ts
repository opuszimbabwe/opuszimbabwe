import {json} from '../../_lib/auth';
import {hash} from '../../_lib/payments';
import {runCare} from '../../_lib/care';
import {monitorClients} from '../../_lib/client-care';
import {reconcileOrders,processDocumentJob} from '../../_lib/operations';
import type {PagesHandler} from '../../_lib/types';
export const onRequestPost:PagesHandler=async c=>{
 const supplied=c.request.headers.get('authorization')||'';
 const key=c.env.MAINTENANCE_CRON_SECRET;
 if(!key||await hash(supplied)!==await hash(`Bearer ${key}`))return json({error:'Unauthorized'},401,{'cache-control':'no-store'});
 try{const care=await runCare(c.env);await monitorClients(c.env);await reconcileOrders(c.env);const documents=await processDocumentJob(c.env);return json({care,documents},200,{'cache-control':'no-store'});}catch{return json({error:'Maintenance check did not complete.'},503,{'cache-control':'no-store'});}
};
