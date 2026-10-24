import { CheckoutError, configured, fail, gateway, hash, limitAttempts, localMethods, paymentInput, readPaymentJson, receipt, safeRedirect, trustedOrigin, type PaymentRow } from '../../_lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestPost: PagesHandler = async context => {
 try {
  const origin = trustedOrigin(context.request);
  if (!configured(context.env)) throw new CheckoutError(503, 'Online payments are being set up. Please contact support@opuszim.co.zw for help paying.');
  const input = paymentInput(await readPaymentJson(context.request));
  const tokenHash = await hash(input.token);
  const fingerprint = await hash(JSON.stringify({ ...input, token: undefined }));
  const existing = () => context.env.DB.prepare('SELECT * FROM customer_payments WHERE token_hash = ?').bind(tokenHash).first<PaymentRow>();
  const respond = (row: PaymentRow) => {
   if (row.fingerprint !== fingerprint) throw new CheckoutError(409, 'This payment attempt already exists with different details. Please check its status before starting another.');
   return json({ id: row.id, redirectUrl: row.redirect_url, receipt: receipt(row) }, row.redirect_url ? 200 : 202, { 'cache-control': 'no-store' });
  };
  const previous = await existing(); if (previous) return respond(previous);
  await limitAttempts(context);
  const method = (await localMethods(input.currency)).find(item => item.code === input.method);
  if (!method) throw new CheckoutError(400, 'Please choose an available local payment method. International payments are currently unavailable.');
  const amount = input.minor / 100;
  if (amount < method.minimumAmount || amount > method.maximumAmount) throw new CheckoutError(400, `This method accepts ${input.currency} ${method.minimumAmount.toFixed(2)}–${method.maximumAmount.toFixed(2)}. Please choose another method or contact support@opuszim.co.zw.`);
  const id = crypto.randomUUID(), now = new Date().toISOString();
  try {
   await context.env.DB.prepare('INSERT INTO customer_payments (id, token_hash, fingerprint, payer_name, payer_email, payer_phone, invoice, amount_minor, currency, method_code, method_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
   .bind(id, tokenHash, fingerprint, input.name, input.email, input.phone, input.invoice, input.minor, input.currency, method.code, method.name, now, now).run();
  } catch (error) { const concurrent = await existing(); if (concurrent) return respond(concurrent); throw error; }
  try {
   const result = await gateway(context.env, { resultUrl: origin + '/api/payments/webhook', returnUrl: origin + '/payments/?payment=' + id + '&token=' + input.token }).initiateTransaction({ amount, currencyCode: input.currency, reasonForPayment: 'Opus Zimbabwe — ' + input.invoice, merchantReference: id, paymentMethodCode: method.code, paymentMetadata: { paymentId: id } });
   if (!result.referenceNumber || result.referenceNumber.length > 200) throw new Error('Invalid reference');
   // Keep a known reference even if the redirect URL fails validation, so a
   // later authoritative status check can still recover this transaction.
   await context.env.DB.prepare('UPDATE customer_payments SET gateway_reference = ?, updated_at = ? WHERE id = ?').bind(result.referenceNumber, new Date().toISOString(), id).run();
   const redirect = safeRedirect(result.redirectUrl);
   await context.env.DB.prepare("UPDATE customer_payments SET redirect_url = ?, status = 'INITIATED', updated_at = ? WHERE id = ? AND status = 'CREATING'").bind(redirect, new Date().toISOString(), id).run();
  } catch {
   // Never retry an ambiguous initiation: the gateway may have received it.
   await context.env.DB.prepare("UPDATE customer_payments SET status = 'UNCONFIRMED', updated_at = ? WHERE id = ? AND status = 'CREATING'").bind(new Date().toISOString(), id).run();
  }
  return respond((await existing())!);
 } catch (error) { return fail(error); }
};
