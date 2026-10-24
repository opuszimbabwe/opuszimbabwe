'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, Coins, CreditCard, Heart, LoaderCircle, LockKeyhole, ShieldCheck, UserRound, Wallet, X, CircleAlert } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_PHONE, type PaymentConfig, type PaymentReceipt } from '@/lib/payments';

type Session = { id: string; token: string };
type Form = { name: string; email: string; phone: string; invoice: string; amount: string; currency: string; method: string };
const emptyForm: Form = { name: '', email: '', phone: '', invoice: '', amount: '', currency: 'USD', method: '' };
const attemptKey = 'opus-payment-attempt';
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, '0')).join('');
const support = <>Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call <a href={`tel:${SUPPORT_PHONE}`}>0773 979 162</a> for payment support.</>;
function remember(session: Session) {
 try { sessionStorage.setItem('opus-payment-' + session.id, session.token); sessionStorage.setItem('opus-last-payment', session.id); return true; } catch { return false; }
}
function MethodLogo({ name }: { name: string }) {
 const source = /ecocash/i.test(name) ? '/images/ecocash-logo.png' : /innbucks/i.test(name) ? '/images/innbucks-logo.svg' : /one.?money/i.test(name) ? '/images/onemoney-logo.svg' : '';
 return source ? <img className="payment-provider-logo" src={source} alt="" /> : <Wallet size={22} aria-hidden="true" />;
}
function PaymentLogo() { return <a href="https://opuszim.co.zw/" aria-label="Opus Zimbabwe home" className="payment-logo"><img src="/images/logo-full.png" alt="Opus Zimbabwe" /></a>; }
function dateLabel(value: string | null) {
 return value ? new Intl.DateTimeFormat('en-ZW', { timeZone: 'Africa/Harare', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' CAT' : 'Awaiting confirmation';
}
export default function PaymentCheckout() {
 const [form, setForm] = useState<Form>(emptyForm);
 const [config, setConfig] = useState<PaymentConfig | null>(null);
 const [configBusy, setConfigBusy] = useState(true);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [configError, setConfigError] = useState('');
 const [session, setSession] = useState<Session | null>(null);
 const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
 const [checking, setChecking] = useState(false);
 const [checkError, setCheckError] = useState('');
 const [resumable, setResumable] = useState(false);
 const [configRetry, setConfigRetry] = useState(0);
 const modal = useRef<HTMLDialogElement>(null);
 const inFlight = useRef(false);
 const attempt = useRef<{ token: string; form: Form } | null>(null);
 const [ready, setReady] = useState(false);
 useEffect(() => {
  const url = new URL(location.href), id = url.searchParams.get('payment');
  if (id) {
   let token = url.searchParams.get('token');
   try { token ||= sessionStorage.getItem('opus-payment-' + id); } catch { /* Use the return link when storage is unavailable. */ }
   if (token && /^[a-f0-9]{64}$/.test(token)) {
    const value = { id, token }; setSession(value);
    if (remember(value)) { url.searchParams.delete('token'); history.replaceState(null, '', url.pathname + url.search); }
   } else setError('Your payment access link is missing. Please contact support@opuszim.co.zw with your transaction reference.');
  } else {
   try {
    const saved = JSON.parse(sessionStorage.getItem(attemptKey) || 'null');
    if (saved?.form && saved?.token) { attempt.current = saved; setForm(saved.form); setResumable(true); }
   } catch { /* No saved attempt. */ }
  }
  setReady(true);
 }, []);
 useEffect(() => {
  if (session || !ready) return;
  const controller = new AbortController(); setConfigBusy(true); setConfigError('');
  fetch('/api/payments/config?currency=' + encodeURIComponent(form.currency), { cache: 'no-store', signal: controller.signal })
   .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Payment methods could not be loaded.'); return body as PaymentConfig; })
   .then(body => { if (controller.signal.aborted) return; setConfig(body); setForm(value => ({ ...value, method: body.methods.some(method => method.code === value.method) ? value.method : body.methods[0]?.code || '' })); })
   .catch(reason => { if (!controller.signal.aborted) { setConfig(null); setConfigError(reason.message || 'Payment methods could not be loaded.'); } })
   .finally(() => { if (!controller.signal.aborted) setConfigBusy(false); });
  return () => controller.abort();
 }, [form.currency, session, ready, configRetry]);
 const checkStatus = useCallback(async (signal?: AbortSignal) => {
  if (!session || inFlight.current) return false;
  inFlight.current = true; setChecking(true);
  try {
   const response = await fetch('/api/payments/status?id=' + encodeURIComponent(session.id), { headers: { authorization: 'Bearer ' + session.token }, cache: 'no-store', signal: signal || AbortSignal.timeout(25000) });
   const body = await response.json(); if (!response.ok) throw new Error(body.error || 'We could not confirm your payment yet.');
   if (signal?.aborted) return false;
   setReceipt(body.receipt); setCheckError('');
   if (body.continueUrl) setContinueUrl(body.continueUrl);
   return Boolean(body.receipt.terminal);
  } catch (reason) {
   if (!signal?.aborted) setCheckError(reason instanceof Error ? reason.message : 'We could not confirm your payment yet.'); return false;
  } finally { inFlight.current = false; if (!signal?.aborted) setChecking(false); }
 }, [session]);
 const [continueUrl, setContinueUrl] = useState('');
 useEffect(() => {
  if (!session) return;
  let stopped = false, attempts = 0, timer: ReturnType<typeof setTimeout>;
  const controller = new AbortController();
  const poll = async () => {
   if (stopped) return;
   if (document.visibilityState === 'visible') {
    const terminal = await checkStatus(controller.signal); attempts++;
    if (terminal || attempts >= 24) return;
   }
   if (!stopped) timer = setTimeout(poll, 5000);
  };
  void poll();
  return () => { stopped = true; controller.abort(); clearTimeout(timer); };
 }, [session, checkStatus]);
 function change(key: keyof Form, value: string) { setForm(previous => ({ ...previous, [key]: value })); setError(''); }
 async function pay(event: React.FormEvent) {
  event.preventDefault(); if (busy || !config?.configured || configBusy) return;
  setBusy(true); setError('');
  try {
   let token = newToken();
   if (attempt.current) {
    if (JSON.stringify(attempt.current.form) !== JSON.stringify(form)) throw new Error('An earlier payment attempt needs checking. Restore its original details or contact support@opuszim.co.zw before starting another payment.');
    token = attempt.current.token;
   }
   attempt.current = { token, form: { ...form } };
   try { sessionStorage.setItem(attemptKey, JSON.stringify(attempt.current)); } catch { /* The in-memory token still prevents duplicate retries. */ }
   const response = await fetch('/api/payments/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, token }), signal: AbortSignal.timeout(30000) });
   const body = await response.json();
   if (!response.ok) {
    // Validation/configuration errors occur before any gateway charge. Allow a
    // corrected form to create a fresh attempt; ambiguous network errors do not.
    if ([400, 403, 415, 429].includes(response.status)) { attempt.current = null; try { sessionStorage.removeItem(attemptKey); } catch {} }
    throw new Error(body.error || 'We could not start this payment. Please contact support@opuszim.co.zw.');
   }
   const value = { id: body.id, token }; const persisted = remember(value);
   if (body.redirectUrl) { location.assign(body.redirectUrl); return; }
   setReceipt(body.receipt); setSession(value);
   history.replaceState(null, '', '/payments/?payment=' + body.id + (persisted ? '' : '&token=' + token));
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Connection interrupted. Please check your existing payment before trying again.'); setResumable(Boolean(attempt.current)); }
  finally { setBusy(false); }
 }
 function anotherPayment() {
  try { sessionStorage.removeItem(attemptKey); sessionStorage.removeItem('opus-last-payment'); } catch {}
  attempt.current = null;
  history.replaceState(null, '', '/payments/'); setSession(null); setReceipt(null); setContinueUrl(''); setCheckError(''); setError(''); setForm(emptyForm); setResumable(false);
 }
 const paid = receipt?.paid === true && !checkError;
 const pending = !receipt || !receipt.terminal;
 return <main className="payment-page">
  <article className={`payment-sheet ${session ? 'payment-receipt' : ''} ${session && pending && !checkError ? 'payment-pending' : ''}`} aria-busy={busy || checking}>
   <header className="payment-header"><PaymentLogo /><p><LockKeyhole size={14} aria-hidden="true" /> Secure <span>•</span> Fast <span>•</span> Reliable</p></header>
   {!session ? <>
    <div className="payment-heading"><h1>Make a payment</h1><p>Pay your Opus Zimbabwe invoice or project securely with Pesepay.</p></div>
    {error && <div className="payment-notice" role="alert">{error}<p>{support}</p></div>}
    {resumable && <p className="payment-notice">Your previous payment details have been kept. Continue with the same details to check that attempt safely. <button type="button" className="payment-text-button" onClick={() => { if (attempt.current) setForm(attempt.current.form); }}>Restore previous details</button></p>}
    <form onSubmit={pay} className="payment-form">
     <div className="payment-fields"><label>Payer name<input name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={event => change('name', event.target.value)} /></label><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={event => change('email', event.target.value)} /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={24} value={form.phone} onChange={event => change('phone', event.target.value)} placeholder="0710 000 000" /></label><label>Invoice or project reference<input name="invoice" required maxLength={120} value={form.invoice} onChange={event => change('invoice', event.target.value)} placeholder="Reference from your quote or invoice" /></label></div>
     <div className="payment-amount-fields"><label>Currency<select value={form.currency} onChange={event => change('currency', event.target.value)} disabled={busy}>{(config?.currencies.length ? config.currencies : [{ code: 'USD', name: 'US Dollar' }, { code: 'ZiG', name: 'Zimbabwe Gold' }]).map(currency => <option key={currency.code} value={currency.code}>{currency.code}</option>)}</select></label><label>Amount to pay<input name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" required value={form.amount} onChange={event => change('amount', event.target.value)} placeholder="0.00" /></label></div>
     <p className="payment-small">Use the amount and currency agreed on your quote or invoice.</p>
     <fieldset className="payment-methods"><legend>Choose a local payment method</legend>
      {configBusy ? <p role="status">Loading payment methods…</p> : configError ? <div role="alert"><p>{configError}</p><button type="button" className="payment-text-button" onClick={() => setConfigRetry(value => value + 1)}>Try loading methods again</button></div> : config?.methods.length ? <div className="payment-method-grid">{config.methods.map(method => <label key={method.code} className="payment-method" data-selected={form.method === method.code}><input type="radio" name="method" checked={form.method === method.code} onChange={() => change('method', method.code)} /><MethodLogo name={method.name} /><span>{method.name}</span></label>)}</div> : <p>No local methods are currently available for this currency. {support}</p>}
     </fieldset>
     <div className="payment-international"><p>International payments</p><div>{['PayPal', 'Visa', 'Mastercard'].map(method => <button key={method} type="button" onClick={() => modal.current?.showModal()}><CreditCard size={18} aria-hidden="true" />{method}</button>)}</div></div>
     {!configBusy && config && !config.configured && <div className="payment-notice" role="status">Online payments are being set up. {support}</div>}
     <button type="submit" className="payment-submit" disabled={busy || configBusy || !config?.configured || !form.method}>{busy ? <><LoaderCircle size={20} className="payment-spinner" />Starting secure payment…</> : <><ShieldCheck size={20} />Continue to Pesepay</>}</button>
     <p className="payment-small text-center">Complete your payment on Pesepay, then return here for confirmation.</p>
    </form>
   </> : <>
    <div className="payment-outcome" role="status">
     <div className={`payment-state-icon ${paid ? 'is-paid' : pending && !checkError ? 'is-pending' : 'is-unconfirmed'}`}>{paid ? <Check size={54} strokeWidth={4} /> : pending && !checkError ? <LoaderCircle size={54} className="payment-spinner" /> : <CircleAlert size={54} />}</div>
     <h1>{paid ? 'Payment Successful' : checkError ? 'Confirmation unavailable' : pending ? 'Processing Your Payment' : receipt?.status === 'REVERSED' ? 'Payment Reversed' : receipt?.status === 'UNCONFIRMED' || receipt?.status === 'VERIFICATION_FAILED' ? 'Payment needs confirmation' : 'Payment not completed'}</h1>
     <p>{paid ? 'Your payment has been processed successfully. Thank you for your trust and support.' : checkError || (pending ? 'Please wait while we securely confirm your transaction with Pesepay.' : 'Please contact our support team with your reference before making another payment.')}</p>
     {!paid && <div className="payment-small">{support}</div>}
    </div>
    {receipt && (!pending || checkError) && <section className="payment-details" aria-labelledby="payment-details-title"><h2 id="payment-details-title">Payment details</h2><div className="payment-payer"><div><span>Payer Name</span><strong>{receipt.name}</strong></div><UserRound size={58} aria-hidden="true" /></div><div className="payment-detail-row"><CalendarDays aria-hidden="true" /><div><span>Payment Date &amp; Time</span><strong>{dateLabel(receipt.date)}</strong></div></div><div className="payment-detail-row"><CreditCard aria-hidden="true" /><div><span>Payment Method</span><strong className="payment-method-value">{receipt.method}<MethodLogo name={receipt.method} /></strong></div></div><div className="payment-detail-row"><ShieldCheck aria-hidden="true" /><div><span>Transaction Reference / Approval Code</span><strong>{receipt.reference || receipt.id}</strong></div></div><div className="payment-detail-row"><Wallet aria-hidden="true" /><div><span>Invoice / Project Reference</span><strong>{receipt.invoice}</strong></div></div><div className={`payment-amount-panel ${paid ? 'is-paid' : ''}`}><Coins size={48} aria-hidden="true" /><div><span>{paid ? 'Amount Paid' : 'Payment Amount'}</span><strong>{receipt.currency} {receipt.amount.toFixed(2)}</strong>{paid && receipt.invoiceAmount !== undefined && receipt.invoiceAmount !== receipt.amount && <span className="payment-small">Invoice amount: {receipt.currency} {receipt.invoiceAmount.toFixed(2)}</span>}</div></div></section>}
    <div className="payment-receipt-actions">{!paid && <button type="button" onClick={() => void checkStatus()} disabled={checking}>{checking ? 'Checking…' : 'Check payment status'}</button>}{!paid && continueUrl && receipt?.status === 'INITIATED' && <a href={continueUrl}>Continue payment on Pesepay</a>}{paid && <><button type="button" onClick={() => window.print()}>Print receipt</button><button type="button" onClick={anotherPayment}>Make another payment</button></>}</div>
    {paid && <div className="payment-thanks"><Heart size={30} fill="currentColor" /><h2>Thank You!</h2><p>We appreciate your continued support.</p></div>}
   </>}
   <footer className="payment-support">{support}<a href="https://opuszim.co.zw/">Back to Opus Zimbabwe</a></footer>
  </article>
  <dialog ref={modal} className="payment-modal" aria-labelledby="international-title" onClick={event => { if (event.target === modal.current) modal.current.close(); }}><div><button type="button" className="payment-modal-close" onClick={() => modal.current?.close()} aria-label="Close international payments message"><X size={24} /></button><CreditCard size={38} className="text-[#E85D2A]" /><h2 id="international-title">Use a local payment method</h2><p>International payments are currently unavailable. Please use a local payment method.</p><p>If you need help, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p><button type="button" className="payment-submit" onClick={() => modal.current?.close()} autoFocus>Choose local payments</button></div></dialog>
 </main>;
}
