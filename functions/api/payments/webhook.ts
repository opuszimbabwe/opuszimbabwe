import { gateway, readPaymentJson, reconcile, findPayment, fail, CheckoutError, type PaymentRow } from '../../_lib/payments';
import type { PagesHandler } from '../../_lib/types';
export const onRequestPost: PagesHandler = async context => {
 try {
  const client = gateway(context.env);
  const notification = client.parseCallback(await readPaymentJson(context.request), Object.fromEntries(context.request.headers));
  if (!notification.keyVerified) throw new CheckoutError(401, 'Notification authentication failed.');
  const work = (async () => {
   let row = await context.env.DB.prepare('SELECT * FROM customer_payments WHERE gateway_reference = ?').bind(notification.result.referenceNumber).first<PaymentRow>();
   // A mobile request may reach the provider even if initiation times out.
   // Recover its reference only from an independently verified gateway result
   // carrying our original opaque payment ID and the exact amount/currency.
   const paymentId = notification.result.transactionMetadata?.paymentId;
   if (!row && typeof paymentId === 'string' && /^[a-f0-9-]{36}$/.test(paymentId)) {
    const candidate = await findPayment(context.env, paymentId);
    if (candidate && !candidate.gateway_reference) {
     const result = await client.checkPayment(notification.result.referenceNumber);
     if (result.referenceNumber === notification.result.referenceNumber && result.transactionMetadata?.paymentId === candidate.id && result.amountDetails?.currencyCode === candidate.currency && Math.round(result.amountDetails.amount * 100) === candidate.amount_minor) {
      await context.env.DB.prepare('UPDATE customer_payments SET gateway_reference = ? WHERE id = ? AND gateway_reference IS NULL').bind(result.referenceNumber, candidate.id).run();
      row = await findPayment(context.env, candidate.id);
     }
    }
   }
   // Callback state is never proof of payment. Repeated callbacks and delayed
   // success cannot duplicate a payment or overwrite a reversal.
   if (row) await reconcile(context.env, { ...row, checked_at: 0 });
  })();
  if (context.waitUntil) context.waitUntil(work.catch(() => { /* Polling, later notifications and admin verification provide recovery. */ }));
  else await work;
  return new Response('Accepted', { status: 200 });
 } catch (error) { return fail(error); }
};
