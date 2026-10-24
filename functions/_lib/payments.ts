import { Pesepay, type Transport, type PaymentResult } from 'pesepay';
import type { Env, PagesContext } from './types';
import type { LocalMethod, PaymentReceipt } from '../../lib/payments';
import { json } from './auth';

const API = 'https://api.pesepay.com/api/payments-engine';
const TOKEN = /^[a-f0-9]{64}$/;
const ORIGINS = new Set(['https://opuszim.co.zw', 'https://www.opuszim.co.zw', 'https://payments.opuszim.co.zw', 'http://127.0.0.1:8788', 'http://localhost:8788']);
const LOCAL = /ecocash|one\s?money|innbucks|zimswitch|zipit|omari|telecash|paygo|bank\s?transfer|rtgs/i;
export const INTERNATIONAL = /paypal|visa|master\s?card|american\s?express|amex/i;
export interface PaymentRow {
 id: string; token_hash: string; fingerprint: string; payer_name: string; payer_email: string; payer_phone: string;
 invoice: string; amount_minor: number; amount_paid_minor: number | null; currency: string; method_code: string; method_name: string;
 gateway_reference: string | null; redirect_url: string | null; status: string; transaction_date: string | null;
 checked_at: number; created_at: string; updated_at: string;
}
export class CheckoutError extends Error { constructor(public status: number, message: string) { super(message); } }
export const fail = (error: unknown) => json({ error: error instanceof CheckoutError ? error.message : 'Payments are temporarily unavailable. Please contact support@opuszim.co.zw.' }, error instanceof CheckoutError ? error.status : 503, { 'cache-control': 'no-store' });
export const configured = (env: Env) => Boolean(env.PESEPAY_INTEGRATION_KEY?.trim() && /^[\x20-\x7E]{32}$/.test(env.PESEPAY_ENCRYPTION_KEY || ''));
export function trustedOrigin(request: Request) {
 const origin = new URL(request.url).origin;
 if (!ORIGINS.has(origin)) throw new CheckoutError(403, 'Checkout is only available on the Opus Zimbabwe website.');
 const supplied = request.headers.get('origin');
 if (supplied && supplied !== origin) throw new CheckoutError(403, 'Please start your payment from this website.');
 return origin;
}
export async function readPaymentJson(request: Request) {
 if (!request.headers.get('content-type')?.includes('application/json')) throw new CheckoutError(415, 'Please send a valid payment request.');
 const reader = request.body?.getReader(); if (!reader) throw new CheckoutError(400, 'Payment details are required.');
 const chunks: Uint8Array[] = []; let length = 0;
 while (true) { const next = await reader.read(); if (next.done) break; length += next.value.length; if (length > 16384) { await reader.cancel(); throw new CheckoutError(413, 'Payment details are too long.'); } chunks.push(next.value); }
 const bytes = new Uint8Array(length); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
 try { const value = JSON.parse(new TextDecoder().decode(bytes)); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value as Record<string, unknown>; }
 catch { throw new CheckoutError(400, 'Payment details are invalid.'); }
}
export async function hash(value: string) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join(''); }
export function accessToken(value: unknown) { if (typeof value !== 'string' || !TOKEN.test(value)) throw new CheckoutError(400, 'Your payment link is invalid. Please contact support@opuszim.co.zw.'); return value; }
function text(value: unknown, name: string, max: number, required = true) {
 if (typeof value !== 'string' || value.trim().length > max || /[\u0000-\u001f]/.test(value) || (required && !value.trim())) throw new CheckoutError(400, `Please enter a valid ${name}.`);
 return value.trim();
}
export function paymentInput(raw: Record<string, unknown>) {
 const token = accessToken(raw.token);
 const name = text(raw.name, 'payer name', 100), email = text(raw.email, 'email address', 254).toLowerCase();
 if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new CheckoutError(400, 'Please enter a valid email address.');
 const phone = text(raw.phone ?? '', 'phone number', 24, false);
 if (phone && !/^\+?[\d\s()-]{7,24}$/.test(phone)) throw new CheckoutError(400, 'Please enter a valid phone number.');
 const invoice = text(raw.invoice, 'invoice or project reference', 120);
 const amount = text(raw.amount, 'amount', 12);
 if (!/^\d{1,7}(\.\d{1,2})?$/.test(amount)) throw new CheckoutError(400, 'Enter a positive amount with no more than two decimal places.');
 const [whole, fraction = ''] = amount.split('.'); const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
 if (minor <= 0 || minor > 100000000) throw new CheckoutError(400, 'Please check the payment amount.');
 const currency = text(raw.currency, 'currency', 10), method = text(raw.method, 'local payment method', 30);
 if (!['USD', 'ZiG'].includes(currency)) throw new CheckoutError(400, 'Please select a supported currency.');
 return { token, name, email, phone, invoice, minor, currency, method };
}
// The SDK's fetch transport preserves TLS verification, never retries charges,
// and prevents sending integration keys to an arbitrary poll URL.
const transport: Transport = async request => {
 const url = new URL(request.url);
 if (url.origin !== new URL(API).origin || !url.pathname.startsWith('/api/payments-engine/')) throw new CheckoutError(502, 'Unexpected payment gateway address.');
 const response = await fetch(url, { method: request.method, headers: request.headers, body: request.body, redirect: 'error', signal: AbortSignal.timeout(request.timeoutMs) });
 return { status: response.status, headers: Object.fromEntries(response.headers), body: await response.text(), usedInsecureHttpParser: false };
};
export function gateway(env: Env, callbacks?: { resultUrl: string; returnUrl: string }) {
 if (!configured(env)) throw new CheckoutError(503, 'Online payments are being set up. Please contact support@opuszim.co.zw for help paying.');
 return new Pesepay({ integrationKey: env.PESEPAY_INTEGRATION_KEY!, encryptionKey: env.PESEPAY_ENCRYPTION_KEY!, transport, timeoutMs: 20000, ...callbacks });
}
async function publicGateway(path: string) {
 let response: Response;
 try { response = await fetch(API + path, { headers: { accept: 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(8000) }); }
 catch (error) {
  // Public unauthenticated lookup only: no key, payer data or payment payload
  // is involved. Keep a bounded network diagnostic for operational support.
  console.error('Public Pesepay lookup failed', error instanceof Error ? { kind: error.name, message: error.message.slice(0, 180) } : { kind: 'unknown' });
  throw error;
 }
 if (!response.ok) throw new CheckoutError(503, 'Payment methods could not be loaded. Please try again or contact support@opuszim.co.zw.');
 const body: unknown = await response.json(); if (!Array.isArray(body)) throw new CheckoutError(503, 'Payment methods are temporarily unavailable.'); return body as Record<string, unknown>[];
}
export async function currencies() {
 return (await publicGateway('/v1/currencies/active')).filter(item => item.active !== false && ['USD', 'ZiG'].includes(String(item.code))).map(item => ({ code: String(item.code), name: String(item.name) }));
}
export async function localMethods(currency: string): Promise<LocalMethod[]> {
 if (!['USD', 'ZiG'].includes(currency)) throw new CheckoutError(400, 'Please select a supported currency.');
 return (await publicGateway('/v1/payment-methods/for-currency?currencyCode=' + encodeURIComponent(currency)))
 .filter(item => item.active === true && typeof item.name === 'string' && LOCAL.test(item.name) && !INTERNATIONAL.test(item.name) && typeof item.code === 'string')
 .map(item => ({ code: String(item.code), name: String(item.name), minimumAmount: Number(item.minimumAmount) || 0.01, maximumAmount: Number(item.maximumAmount) || 1000000 }));
}
export function safeRedirect(value: string) {
 const url = new URL(value);
 if (url.protocol !== 'https:' || url.username || url.password || url.port || !(url.hostname === 'pesepay.com' || url.hostname.endsWith('.pesepay.com'))) throw new CheckoutError(502, 'The payment gateway returned an invalid address. Please contact support@opuszim.co.zw.');
 return url.href;
}
export function receipt(row: PaymentRow): PaymentReceipt {
 return { id: row.id, name: row.payer_name, invoice: row.invoice, amount: (row.status === 'SUCCESS' && row.amount_paid_minor != null ? row.amount_paid_minor : row.amount_minor) / 100, invoiceAmount: row.amount_minor / 100, currency: row.currency, method: row.method_name, reference: row.gateway_reference, status: row.status, paid: row.status === 'SUCCESS', terminal: !['CREATING', 'INITIATED', 'PROCESSING', 'PENDING', 'PARTIALLY_PAID'].includes(row.status), date: row.transaction_date };
}
export async function findPayment(env: Env, id: string) { return env.DB.prepare('SELECT * FROM customer_payments WHERE id = ?').bind(id).first<PaymentRow>(); }
export async function authorisedPayment(context: PagesContext) {
 const id = new URL(context.request.url).searchParams.get('id') || '';
 const token = accessToken(context.request.headers.get('authorization')?.replace(/^Bearer /, ''));
 const row = await context.env.DB.prepare('SELECT * FROM customer_payments WHERE id = ? AND token_hash = ?').bind(id, await hash(token)).first<PaymentRow>();
 if (!row) throw new CheckoutError(404, 'Payment not found. Please use your original payment link or contact support@opuszim.co.zw.');
 return row;
}
export async function reconcile(env: Env, row: PaymentRow) {
 if (!row.gateway_reference || Date.now() - row.checked_at < 5000) return row;
 const started = Date.now();
 const result: PaymentResult = await gateway(env).checkPayment(row.gateway_reference);
 if (result.referenceNumber !== row.gateway_reference) throw new CheckoutError(502, 'Payment confirmation could not be verified. Please contact support@opuszim.co.zw.');
 let status = result.transactionStatus;
 if (status === 'SUCCESS' && (!result.amountDetails || Math.round(result.amountDetails.amount * 100) !== row.amount_minor || result.amountDetails.currencyCode !== row.currency)) status = 'VERIFICATION_FAILED';
 const payable = status === 'SUCCESS' ? Number(result.amountDetails?.customerPayableAmount ?? result.amountDetails?.totalTransactionAmount ?? result.amountDetails?.amount) : null;
 if (payable !== null && (!Number.isFinite(payable) || Math.round(payable * 100) < row.amount_minor)) status = 'VERIFICATION_FAILED';
 const paidMinor = status === 'SUCCESS' && payable !== null ? Math.round(payable * 100) : null;
 const date = result.dateOfTransaction && Number.isFinite(Date.parse(result.dateOfTransaction)) ? new Date(result.dateOfTransaction).toISOString() : null;
 await env.DB.prepare("UPDATE customer_payments SET status = ?, transaction_date = COALESCE(?, transaction_date), amount_paid_minor = COALESCE(?, amount_paid_minor), checked_at = ?, updated_at = ? WHERE id = ? AND checked_at <= ? AND status <> 'REVERSED' AND (status <> 'SUCCESS' OR ? IN ('REVERSED', 'SUCCESS'))")
 .bind(status, date, paidMinor, started, new Date().toISOString(), row.id, started, status).run();
 return (await findPayment(env, row.id))!;
}
export async function limitAttempts(context: PagesContext) {
 const now = Date.now(), bucket = await hash((context.request.headers.get('cf-connecting-ip') || 'local') + ':' + Math.floor(now / 600000));
 const row = await context.env.DB.prepare('INSERT INTO payment_rate_limits (bucket, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(bucket) DO UPDATE SET attempts = attempts + 1 RETURNING attempts').bind(bucket, now + 600000).first<{ attempts: number }>();
 await context.env.DB.prepare('DELETE FROM payment_rate_limits WHERE expires_at < ?').bind(now).run();
 if (!row || row.attempts > 6) throw new CheckoutError(429, 'Too many payment attempts. Please wait a few minutes or contact support@opuszim.co.zw.');
}
