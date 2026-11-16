import {bytes,UUID,CheckoutError,failure,now} from '../../_lib/http';
import {paynowForm,verifyPaynow,pollPaynow,amountMinor} from '../../_lib/paynow';
import {fulfilDomainPayment} from '../../_lib/domains';
import {fulfilCarePayment} from '../../_lib/client-care';
import type {PaymentRow} from '../../_lib/payments';
import type {PagesHandler} from '../../_lib/types';
type PaynowRow=PaymentRow&{gateway_provider:string;gateway_poll_url:string|null};
export const onRequestPost:PagesHandler=async c=>{try{
 if(!c.env.PAYNOW_INTEGRATION_KEY)throw new CheckoutError(503,'Paynow is not configured.');
 if(!c.request.headers.get('content-type')?.includes('application/x-www-form-urlencoded'))throw new CheckoutError(415,'Use a payment form notification.');
 const values=paynowForm(new TextDecoder().decode(await bytes(c.request,20000)));
 if(!verifyPaynow(values,c.env.PAYNOW_INTEGRATION_KEY))throw new CheckoutError(401,'Notification authentication failed.');
 if(!UUID.test(values.reference||''))throw new CheckoutError(400,'Invalid payment reference.');
 const row=await c.env.DB.prepare("SELECT * FROM customer_payments WHERE id=? AND gateway_provider='paynow'").bind(values.reference).first<PaynowRow>();
 if(!row)return new Response('Accepted',{headers:{'cache-control':'no-store'}});
 // Only the previously stored poll URL is contacted. Callback URLs and status
 // are not accepted as evidence, even with a valid notification hash.
 if(!row.gateway_poll_url)throw new CheckoutError(409,'This payment needs merchant reconciliation.');
 const verified=await pollPaynow(c.env,row.gateway_poll_url);
 if(verified.reference!==row.id||!verified.paynowreference||verified.paynowreference!==row.gateway_reference||amountMinor(verified.amount||'')!==row.amount_minor||(verified.currency&&verified.currency!==row.currency)||(!verified.currency&&row.currency!==(c.env.PAYNOW_CURRENCY||'USD')))throw new CheckoutError(409,'The verified payment details do not match.');
 const states:Record<string,string>={paid:'SUCCESS',awaitingdelivery:'PENDING',delivered:'SUCCESS',created:'PENDING',sent:'PENDING',cancelled:'CANCELLED',refunded:'REVERSED',disputed:'REVERSED'};
 const stateKey=String(verified.status).toLowerCase().replace(/\s+/g,'');const status=Object.hasOwn(states,stateKey)?states[stateKey]:'PENDING';
 await c.env.DB.prepare("UPDATE customer_payments SET status=?,amount_paid_minor=CASE WHEN ?='SUCCESS' THEN amount_minor ELSE amount_paid_minor END,transaction_date=CASE WHEN ?='SUCCESS' THEN COALESCE(transaction_date,?) ELSE transaction_date END,checked_at=?,updated_at=? WHERE id=? AND status<>'REVERSED' AND (status<>'SUCCESS' OR ? IN('SUCCESS','REVERSED'))").bind(status,status,status,now(),Date.now(),now(),row.id,status).run();
 const saved=(await c.env.DB.prepare('SELECT * FROM customer_payments WHERE id=?').bind(row.id).first<PaynowRow>())!;await fulfilDomainPayment(c.env,saved);if(saved.care_order_id)await fulfilCarePayment(c.env,saved);
 return new Response('Accepted',{headers:{'cache-control':'no-store'}});
 }catch(e){return failure(e)}};
