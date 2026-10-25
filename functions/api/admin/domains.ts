import { requireAdmin, json } from '../../_lib/auth';
import { pricing, validPricing, fulfilDomainPayment } from '../../_lib/domains';
import { trustedOrigin, readPaymentJson, CheckoutError, fail, findPayment, reconcile } from '../../_lib/payments';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 const auth=await requireAdmin(context);if(auth instanceof Response)return auth;
 try {return json({pricing:await pricing(context.env),orders:(await context.env.DB.prepare('SELECT id,domain_name,retail_minor,supplier_cost_minor,state,payment_id,last_error,created_at,updated_at FROM domain_orders ORDER BY created_at DESC LIMIT 100').all()).results},200,{'cache-control':'no-store'});}catch(error){return fail(error);}
};
export const onRequestPut: PagesHandler = async context => {
 const auth=await requireAdmin(context);if(auth instanceof Response)return auth;
 try{trustedOrigin(context.request);const body=await readPaymentJson(context.request);if(!validPricing(body))throw new CheckoutError(400,'Enter a markup from 0–300%, a minimum markup from $0–$1,000, and rounding from $0.01–$100.');await context.env.DB.prepare("INSERT INTO settings(key,value) VALUES('domain_pricing',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(body)).run();return json({ok:true},200,{'cache-control':'no-store'});}catch(error){return fail(error);}
};
export const onRequestPost: PagesHandler = async context => {
 const auth=await requireAdmin(context);if(auth instanceof Response)return auth;
 try{trustedOrigin(context.request);const body=await readPaymentJson(context.request);if(typeof body.payment_id!=='string')throw new CheckoutError(400,'A linked payment is required.');const payment=await findPayment(context.env,body.payment_id);if(!payment)throw new CheckoutError(404,'Payment not found.');const row=await reconcile(context.env,{...payment,checked_at:0});return json({order:await fulfilDomainPayment(context.env,row)},200,{'cache-control':'no-store'});}catch(error){return fail(error);}
};
