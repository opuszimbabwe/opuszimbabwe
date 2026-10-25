import { authorisedOrder, prepareDomainPayment, claimDomainPayment } from '../../_lib/domains';
import { CheckoutError, configured, fail, gateway, hash, limitAttempts, localMethods, paymentInput, readPaymentJson, receipt, safeRedirect, trustedOrigin, type PaymentRow } from '../../_lib/payments';
import { mobileNetwork, mobileNumberError } from '../../../lib/payments';
import { json } from '../../_lib/auth';
import type { PagesHandler } from '../../_lib/types';
export const onRequestPost: PagesHandler = async context => {
 try {
  const origin = trustedOrigin(context.request);
  if (!configured(context.env)) throw new CheckoutError(503, 'Online payments are being set up. Please contact support@opuszim.co.zw for help paying.');
  const raw = await readPaymentJson(context.request);
  const domainOrder = raw.domain_order_id !== undefined ? await authorisedOrder(context.env,raw.domain_order_id,raw.domain_order_token) : null;
  if(domainOrder){
   if(raw.currency!=='USD'||raw.amount!==(domainOrder.retail_minor/100).toFixed(2)) throw new CheckoutError(400,'Domain payments must match the verified USD quote.');
   raw.name=JSON.parse(domainOrder.contact_json).postal_info.name;raw.email=JSON.parse(domainOrder.contact_json).email;raw.invoice='DOMAIN '+domainOrder.domain_name;
  }
  const input = paymentInput(raw);
  const tokenHash = await hash(input.token);
  const fingerprint = await hash(JSON.stringify({ ...input, token: undefined, ...(domainOrder ? {domain_order_id:domainOrder.id} : {}) }));
  const existing = () => context.env.DB.prepare('SELECT * FROM customer_payments WHERE token_hash = ?').bind(tokenHash).first<PaymentRow>();
  const respond = (row: PaymentRow) => {
   if (row.fingerprint !== fingerprint) throw new CheckoutError(409, 'This payment attempt already exists with different details. Please check its status before starting another.');
   return json({ id: row.id, redirectUrl: row.redirect_url, receipt: receipt(row) }, row.redirect_url ? 200 : 202, { 'cache-control': 'no-store' });
  };
  const previous = await existing(); if (previous) return respond(previous);
  if(domainOrder)await prepareDomainPayment(context.env,domainOrder.id,raw.domain_order_token);
  const method = (await localMethods(input.currency)).find(item => item.code === input.method);
  if (!method) throw new CheckoutError(400, 'Please choose an available local payment method. International payments are currently unavailable.');
  const amount = input.minor / 100;
  if (amount < method.minimumAmount || amount > method.maximumAmount) throw new CheckoutError(400, `This method accepts ${input.currency} ${method.minimumAmount.toFixed(2)}–${method.maximumAmount.toFixed(2)}. Please choose another method or contact support@opuszim.co.zw.`);
  const network = mobileNetwork(method.name);
  if (network) { const error = mobileNumberError(input.phone, network); if (error) throw new CheckoutError(400, error); }
  await limitAttempts(context);
  const id = crypto.randomUUID(), now = new Date().toISOString();
  if(domainOrder)await claimDomainPayment(context.env,domainOrder,id);
  try {
   await context.env.DB.prepare('INSERT INTO customer_payments (id, token_hash, fingerprint, payer_name, payer_email, payer_phone, invoice, amount_minor, currency, method_code, method_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
   .bind(id, tokenHash, fingerprint, input.name, input.email, network ? input.phone : '', input.invoice, input.minor, input.currency, method.code, method.name, now, now).run();
  } catch (error) { const concurrent = await existing(); if (concurrent) return respond(concurrent); if(domainOrder)await context.env.DB.prepare("UPDATE domain_orders SET state='QUOTED',payment_id=NULL WHERE id=? AND payment_id=? AND NOT EXISTS(SELECT 1 FROM customer_payments WHERE id=?)").bind(domainOrder.id,id,id).run();throw error; }
  try {
   const client = gateway(context.env, { resultUrl: origin + '/api/payments/webhook', returnUrl: origin + '/payments/?payment=' + id + '&token=' + input.token });
   const request = { amount, currencyCode: input.currency, reasonForPayment: 'Opus Zimbabwe — ' + input.invoice, merchantReference: id, paymentMethodCode: method.code, paymentMetadata: { paymentId: id } };
   const directMobile = Boolean(network && !method.redirectRequired);
   const result = directMobile
    ? await client.makeSeamlessPayment({ ...request, customer: { phoneNumber: input.phone, ...(input.email ? { email: input.email } : {}) }, requiredFields: { [method.phoneField || 'customerPhoneNumber']: input.phone } })
    : await client.initiateTransaction(request);
   if (!result.referenceNumber || result.referenceNumber.length > 200) throw new Error('Invalid reference');
   await context.env.DB.prepare('UPDATE customer_payments SET gateway_reference = ?, updated_at = ? WHERE id = ?').bind(result.referenceNumber, new Date().toISOString(), id).run();
   if (directMobile) {
    // Even an immediate gateway SUCCESS must pass the independent status and
    // amount verification before our receipt is marked paid.
    await context.env.DB.prepare("UPDATE customer_payments SET status = 'PENDING', updated_at = ? WHERE id = ? AND status = 'CREATING'").bind(new Date().toISOString(), id).run();
   } else {
    const redirect = safeRedirect('redirectUrl' in result ? String(result.redirectUrl) : '');
    await context.env.DB.prepare("UPDATE customer_payments SET redirect_url = ?, status = 'INITIATED', updated_at = ? WHERE id = ? AND status = 'CREATING'").bind(redirect, new Date().toISOString(), id).run();
   }
  } catch (error) {
   const diagnostic = error as { code?: string; status?: number; message?: string; isEncryptionKeyMismatch?: () => boolean };
   const code = typeof diagnostic.code === 'string' && /^ERR_PESEPAY_[A-Z_]+$/.test(diagnostic.code) ? diagnostic.code : 'GATEWAY_UNCONFIRMED';
   let message = typeof diagnostic.message === 'string' ? diagnostic.message : 'Gateway request could not be confirmed.';
   for (const secret of [context.env.PESEPAY_INTEGRATION_KEY, context.env.PESEPAY_ENCRYPTION_KEY]) if (secret) message = message.split(secret).join('[redacted]');
   message = message.replace(/[\u0000-\u001f]/g, ' ').slice(0, 700);
   await context.env.DB.prepare('UPDATE customer_payments SET gateway_error_code = ?, gateway_error_message = ? WHERE id = ?').bind(code, message, id).run();
   // Never retry an ambiguous initiation: the gateway may have received it.
   await context.env.DB.prepare("UPDATE customer_payments SET status = 'UNCONFIRMED', updated_at = ? WHERE id = ? AND status = 'CREATING'").bind(new Date().toISOString(), id).run();
  }
  return respond((await existing())!);
 } catch (error) { return fail(error); }
};
