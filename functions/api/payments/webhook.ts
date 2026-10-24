import { gateway, readPaymentJson, reconcile, fail, CheckoutError, type PaymentRow } from '../../_lib/payments';
import type { PagesHandler } from '../../_lib/types';
export const onRequestPost: PagesHandler = async context => {
 try {
  const client = gateway(context.env);
  const notification = client.parseCallback(await readPaymentJson(context.request), Object.fromEntries(context.request.headers));
  if (!notification.keyVerified) throw new CheckoutError(401, 'Notification authentication failed.');
  const row = await context.env.DB.prepare('SELECT * FROM customer_payments WHERE gateway_reference = ?').bind(notification.result.referenceNumber).first<PaymentRow>();
  if (!row) return new Response('Accepted', { status: 200 });
  // Callback state is never trusted. Re-fetch the authoritative transaction,
  // including amounts. Repeated notifications cannot create another payment.
  const work = reconcile(context.env, { ...row, checked_at: 0 });
  if (context.waitUntil) context.waitUntil(work.catch(() => { /* Customer polling and admin reconciliation recover a temporary gateway outage. */ }));
  else await work;
  return new Response('Accepted', { status: 200 });
 } catch (error) { return fail(error); }
};
