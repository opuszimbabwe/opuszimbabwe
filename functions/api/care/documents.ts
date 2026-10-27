import {authorisedCareOrder} from '../../_lib/client-care';
import {findPayment,reconcile,CheckoutError,fail,limitAttempts} from '../../_lib/payments';
import type {PagesHandler} from '../../_lib/types';
export const onRequestGet:PagesHandler=async c=>{try{
 const u=new URL(c.request.url),order=await authorisedCareOrder(c.env,u.searchParams.get('id'),c.request.headers.get('authorization')?.replace(/^Bearer /,''));await limitAttempts(c,'care-document-view',30);
 const kind=u.searchParams.get('kind');if(!['PROGRESS','FINAL'].includes(kind||'')||order.state!=='PAID'||!order.payment_id)throw new CheckoutError(409,'A verified paid maintenance order is required.');
 const payment=await findPayment(c.env,order.payment_id);if(!payment)throw new CheckoutError(404,'Payment not found.');await reconcile(c.env,{...payment,checked_at:0},false,true);
 const job=await c.env.DB.prepare('SELECT pdf_key FROM ops_jobs WHERE order_id=? AND kind=?').bind(order.id,kind).first<{pdf_key:string|null}>();const object=job?.pdf_key?await c.env.MEDIA.get(job.pdf_key):null;if(!object)throw new CheckoutError(404,'This document is still being prepared.');
 return new Response(object.body,{headers:{'content-type':'application/pdf','content-disposition':`attachment; filename="Opus-care-${order.period}-${kind!.toLowerCase()}.pdf"`,'cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
 }catch(e){return fail(e);}};
