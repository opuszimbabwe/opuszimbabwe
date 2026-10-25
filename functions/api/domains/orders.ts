import { authorisedOrder, createDomainOrder, publicOrder, fulfilDomainPayment } from '../../_lib/domains';
import { trustedOrigin, readPaymentJson, limitAttempts, findPayment, reconcile, fail } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestPost: PagesHandler = async context => {
 try { trustedOrigin(context.request);await limitAttempts(context,'domain-order',10);return json(await createDomainOrder(context,await readPaymentJson(context.request)),201,{'cache-control':'no-store'}); }catch(error){return fail(error);}
};
export const onRequestGet: PagesHandler = async context => {
 try { let order=await authorisedOrder(context.env,new URL(context.request.url).searchParams.get('id'),context.request.headers.get('authorization')?.replace(/^Bearer /,''));
 if(order.payment_id){const payment=await findPayment(context.env,order.payment_id);if(payment)await reconcile(context.env,payment);order=await authorisedOrder(context.env,order.id,context.request.headers.get('authorization')?.replace(/^Bearer /,''));}
 return json({order:publicOrder(order)},200,{'cache-control':'no-store'}); }catch(error){return fail(error);}
};
