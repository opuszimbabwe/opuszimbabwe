import { json, requireAdmin } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestGet: PagesHandler = async context => {
 const auth = await requireAdmin(context); if (auth instanceof Response) return auth;
 try {
  const rows = await context.env.DB.prepare('SELECT id, payer_name, payer_email, invoice, amount_minor, currency, method_name, gateway_reference, status, transaction_date, created_at FROM customer_payments ORDER BY created_at DESC LIMIT 100').all();
  return json({ payments: rows.results }, 200, { 'cache-control': 'no-store' });
 } catch { return json({ error: 'Payment records could not be loaded.' }, 503, { 'cache-control': 'no-store' }); }
};

export const onRequestPost: PagesHandler = async context => {
 const auth = await requireAdmin(context); if (auth instanceof Response) return auth;
 try {
  const { trustedOrigin, readPaymentJson, findPayment, reconcile, fail, CheckoutError } = await import('../../_lib/payments');
  try {
   trustedOrigin(context.request);
   const body = await readPaymentJson(context.request);
   if (typeof body.id !== 'string' || body.id.length > 100) throw new CheckoutError(400, 'A valid payment ID is required.');
   const row = await findPayment(context.env, body.id); if (!row) throw new CheckoutError(404, 'Payment not found.');
   const verified = await reconcile(context.env, { ...row, checked_at: 0 });
   return json({ id: verified.id, status: verified.status }, 200, { 'cache-control': 'no-store' });
  } catch (error) { return fail(error); }
 } catch { return json({ error: 'Payment verification is temporarily unavailable.' }, 503); }
};
