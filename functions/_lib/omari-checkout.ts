import type {PagesContext} from './types';
import {CheckoutError,accessToken,hash,limitAttempts,receipt,reconcile,findPayment,type PaymentRow} from './payments';
import {walletInfo} from './wallet-checkout';
import {json} from './auth';
import {bytes} from './http';
export async function submitOmariCode(context:PagesContext,raw:Record<string,unknown>){
 const token=accessToken(raw.token),id=typeof raw.id==='string'?raw.id:'';
 if(!/^[a-zA-Z0-9-]{1,80}$/.test(id)||typeof raw.otp!=='string'||!/^\d{6}$/.test(raw.otp))throw new CheckoutError(400,'Enter the six-digit Omari code.');
 const row=await context.env.DB.prepare('SELECT * FROM customer_payments WHERE id=? AND token_hash=?').bind(id,await hash(token)).first<PaymentRow>();
 if(!row)throw new CheckoutError(404,'Payment not found. Use your original payment link.');
 if(row.method_code!=='PZW216'||row.currency!=='USD'||row.gateway_provider==='paynow'||!row.gateway_reference||!['PENDING','PROCESSING'].includes(row.status))throw new CheckoutError(409,'This payment is not waiting for an Omari code. Check its status.');
 const verified=await reconcile(context.env,{...row,checked_at:0},false);if(!['PENDING','PROCESSING'].includes(verified.status))throw new CheckoutError(409,'Check the current payment status before submitting a code.');
 await limitAttempts(context,'omari-code',12);
 const claim=await context.env.DB.prepare("UPDATE payment_wallet_state SET otp_state='SUBMITTING',updated_at=? WHERE payment_id=? AND kind='omari' AND otp_state='AWAITING' RETURNING payment_id").bind(new Date().toISOString(),row.id).first();
 if(!claim)throw new CheckoutError(409,'The code has already been submitted. Check payment status before doing anything else.');
 try{
  const response=await fetch('https://api.pesepay.com/api/omari/v1/payments/charge',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({otp:raw.otp,referenceNumber:row.gateway_reference}),redirect:'manual',signal:AbortSignal.timeout(20000)});
  const content=new TextDecoder().decode(await bytes(response,24000));let body:Record<string,unknown>;try{body=JSON.parse(content)}catch{throw new Error('Unconfirmed response')}
  if(!response.ok||body.referenceNumber!==row.gateway_reference||typeof body.transactionStatus!=='string')throw new Error('Unconfirmed response');
  await context.env.DB.prepare("UPDATE payment_wallet_state SET otp_state='SUBMITTED',updated_at=? WHERE payment_id=?").bind(new Date().toISOString(),row.id).run();
  await context.env.DB.prepare('UPDATE customer_payments SET checked_at=0 WHERE id=?').bind(row.id).run();
 }catch{
  // Never store/log the OTP, never replay an ambiguous debit request.
  await context.env.DB.prepare("UPDATE payment_wallet_state SET otp_state='UNCERTAIN',updated_at=? WHERE payment_id=?").bind(new Date().toISOString(),row.id).run();
  await context.env.DB.prepare("UPDATE customer_payments SET status='UNCONFIRMED',updated_at=? WHERE id=? AND status IN ('PENDING','PROCESSING')").bind(new Date().toISOString(),row.id).run();
 }
 let current=(await findPayment(context.env,row.id))!;
 try{current=await reconcile(context.env,{...current,checked_at:0})}catch{/* A later authenticated status check resolves the outcome; no OTP retry. */}
 return json({receipt:receipt(current),wallet:await walletInfo(context.env,row.id)},202,{'cache-control':'no-store'});
}
