'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, Coins, CreditCard, Heart, LoaderCircle, LockKeyhole, ShieldCheck, UserRound, Wallet, X, CircleAlert } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_PHONE, mobileNetwork, mobileNumberError, type PaymentConfig, type PaymentReceipt } from '@/lib/payments';

import PaymentReceiptActions from '@/components/PaymentReceiptActions';
import type {PublicCareOrder} from '@/lib/client-care';
import type { DomainPublicOrder } from '@/lib/domains';
type Session = { id: string; token: string };
type Form = { name: string; email: string; phone: string; invoice: string; amount: string; currency: string; method: string };
const emptyForm: Form = { name: '', email: '', phone: '', invoice: '', amount: '', currency: 'USD', method: '' };
const attemptKey = 'opus-payment-attempt';
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, '0')).join('');
const support = <>Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call <a href={`tel:${SUPPORT_PHONE}`}>0773 979 162</a> for payment support.</>;
function remember(session: Session) {
 try { sessionStorage.setItem('opus-payment-' + session.id, session.token); sessionStorage.setItem('opus-last-payment', session.id); return true; } catch { return false; }
}
function MethodLogo({ name, decorative = false }: { name: string; decorative?: boolean }) {
 const brands: [RegExp, string, number, number, number, number, number, number][] = [
  [/ecocash/i, '/images/ecocash-logo.png', 1471, 420, 0, 0, 1471, 420],
  [/innbucks/i, '/images/payments/innbucks.png', 776, 312, 73, 82, 631, 134],
  [/one\s?money/i, '/images/payments/onemoney.png', 797, 567, 0, 0, 797, 567],
  [/zimswitch/i, '/images/payments/zimswitch.png', 500, 500, 25, 132, 450, 235],
  [/omari/i, '/images/payments/omari.webp', 1553, 825, 246, 241, 1147, 464],
 ];
 const brand = brands.find(([pattern]) => pattern.test(name));
 if (!brand) return <span className="payment-provider-fallback"><Wallet size={22} aria-hidden="true" /><span>{name}</span></span>;
 const [, source, width, height, left, top, cropWidth, cropHeight] = brand;
 return <span className="payment-brand-artwork" style={{ width: `min(180px, calc(var(--brand-height, 42px) * ${cropWidth / cropHeight}))`, aspectRatio: `${cropWidth}/${cropHeight}` }}><img src={source} alt={decorative ? '' : name} style={{ position: 'absolute', maxWidth: 'none', width: `${width / cropWidth * 100}%`, height: `${height / cropHeight * 100}%`, left: `${-left / cropWidth * 100}%`, top: `${-top / cropHeight * 100}%` }} /></span>;
}
function PaymentLogo() { return <a href="https://opuszim.co.zw/" aria-label="Opus Zimbabwe home" className="payment-logo"><img src="/images/logo-full.png" alt="Opus Zimbabwe" /></a>; }
function dateLabel(value: string | null) {
 return value ? new Intl.DateTimeFormat('en-ZW', { timeZone: 'Africa/Harare', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) + ' CAT' : 'Awaiting confirmation';
}
export default function PaymentCheckout() {
 const [careOrder,setCareOrder]=useState<PublicCareOrder|null>(null);
 const [careAccess,setCareAccess]=useState<Session|null>(null);
 const [careLoading,setCareLoading]=useState(false),[careBlocked,setCareBlocked]=useState(false);
 const [domainOrder,setDomainOrder]=useState<DomainPublicOrder|null>(null);
 const [domainAccess,setDomainAccess]=useState<Session|null>(null);
 const [domainLoading,setDomainLoading]=useState(false);
 const [domainBlocked,setDomainBlocked]=useState(false);
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
 const [pollExpired, setPollExpired] = useState(false);
 const [resumable, setResumable] = useState(false);
 const [phoneTouched, setPhoneTouched] = useState(false);
 const [configRetry, setConfigRetry] = useState(0);
 const modal = useRef<HTMLDialogElement>(null);
 const inFlight = useRef(false);
 const attempt = useRef<{ token: string; form: Form;care?:Session;domain?:Session } | null>(null);
 const [ready, setReady] = useState(false);
 useEffect(() => {
  const url = new URL(location.href), id = url.searchParams.get('payment');
  const careId=url.searchParams.get('care_order');
  if(careId){
   setCareLoading(true);setCareBlocked(true);let cap=url.searchParams.get('care_token');try{cap ||=sessionStorage.getItem('opus-care-'+careId);}catch{}
   if(!cap||!/^[a-f0-9]{64}$/.test(cap)){setError('Your private maintenance link is incomplete. Contact support before paying.');setCareLoading(false);setReady(true);return;}
   const access={id:careId,token:cap};setCareAccess(access);try{sessionStorage.setItem('opus-care-'+careId,cap);url.searchParams.delete('care_token');history.replaceState(null,'',url.pathname+url.search);}catch{}
   fetch('/api/care/orders?id='+encodeURIComponent(careId),{headers:{authorization:'Bearer '+cap},cache:'no-store'}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error);return b.order as PublicCareOrder;}).then(order=>{setCareOrder(order);setForm({...emptyForm,amount:'10.00',invoice:'CARE '+order.project+' '+order.period,name:order.project});if(order.payment_id){const paymentSession={id:order.payment_id,token:access.token};remember(paymentSession);setSession(paymentSession);}else if(order.state!=='OPEN'||order.expires_at<Date.now())setError('This maintenance link is unavailable or expired. Contact support before paying.');else setCareBlocked(false);}).catch(e=>setError(e.message||'Maintenance order unavailable.')).finally(()=>setCareLoading(false));setReady(true);return;
  }
  const orderId=url.searchParams.get('domain_order');
  if(orderId){
   setDomainLoading(true);setDomainBlocked(true);
   let cap=url.searchParams.get('domain_token');try{cap ||=sessionStorage.getItem('opus-domain-'+orderId);}catch{}
   if(!cap||! /^[a-f0-9]{64}$/.test(cap)){setError('Your domain order link is incomplete. Contact support before paying.');setDomainLoading(false);setReady(true);return;}
   const access={id:orderId,token:cap};setDomainAccess(access);
   try{sessionStorage.setItem('opus-domain-'+orderId,cap);url.searchParams.delete('domain_token');history.replaceState(null,'',url.pathname+url.search);}catch{}
   fetch('/api/domains/orders?id='+encodeURIComponent(orderId),{headers:{authorization:'Bearer '+cap},cache:'no-store',signal:AbortSignal.timeout(45000)}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error);return b.order as DomainPublicOrder;}).then(order=>{
    setDomainOrder(order);setForm({...emptyForm,amount:(order.retail_minor/100).toFixed(2),invoice:'DOMAIN '+order.domain,name:order.payer_name,email:order.payer_email});
    if(order.payment_id){const paymentSession={id:order.payment_id,token:access.token};remember(paymentSession);setSession(paymentSession);}
    else if(order.state!=='QUOTED'||order.expires<Date.now())setError('This domain quote has expired or is unavailable. Check your domain again before paying.');
    else setDomainBlocked(false);
   }).catch(e=>setError(e.message||'Could not load your domain order.')).finally(()=>setDomainLoading(false));
   setReady(true);return;
  }

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
    if (saved?.form && saved?.token) { attempt.current = saved; setForm(saved.form); setResumable(true);if(saved.care?.id&&/^[a-f0-9]{64}$/.test(saved.care.token)){setCareAccess(saved.care);setCareLoading(true);setCareBlocked(true);fetch('/api/care/orders?id='+encodeURIComponent(saved.care.id),{headers:{authorization:'Bearer '+saved.care.token},cache:'no-store'}).then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error);return b.order as PublicCareOrder;}).then(o=>{setCareOrder(o);if(o.payment_id){const v={id:o.payment_id,token:saved.care.token};remember(v);setSession(v);}else setCareBlocked(o.state!=='OPEN'||o.expires_at<Date.now());}).catch(e=>setError(e.message)).finally(()=>setCareLoading(false));}if(saved.domain?.id&&/^[a-f0-9]{64}$/.test(saved.domain.token)){setDomainAccess(saved.domain);setDomainBlocked(true);setError('Reopen your private domain order link to resume this payment safely.');} }
   } catch { /* No saved attempt. */ }
  }
  setReady(true);
 }, []);
 useEffect(() => {
  if (session || !ready) return;
  const controller = new AbortController(); setConfigBusy(true); setConfigError('');
  fetch('/api/payments/config?currency=' + encodeURIComponent(form.currency), { cache: 'no-store', signal: controller.signal })
   .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Payment methods could not be loaded.'); return body as PaymentConfig; })
   .then(body => { if (controller.signal.aborted) return; setConfig(body); setForm(value => ({ ...value, method: body.methods.some(method => method.code === value.method) ? value.method : '' })); })
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
   setReceipt(body.receipt);if(body.careOrder){setCareOrder(body.careOrder);setCareAccess({id:body.careOrder.id,token:session.token});} if(body.domainOrder)setDomainOrder(body.domainOrder); setCheckError('');
   if (body.continueUrl) setContinueUrl(body.continueUrl);
   return Boolean(body.receipt.terminal && (!body.domainOrder || body.domainOrder.terminal));
  } catch (reason) {
   if (!signal?.aborted) setCheckError(reason instanceof Error ? reason.message : 'We could not confirm your payment yet.'); return false;
  } finally { inFlight.current = false; if (!signal?.aborted) setChecking(false); }
 }, [session]);
 const [continueUrl, setContinueUrl] = useState('');
 useEffect(() => {
  if (!session) return;
  setPollExpired(false);
  let stopped = false, attempts = 0, timer: ReturnType<typeof setTimeout>;
  const controller = new AbortController();
  const poll = async () => {
   if (stopped) return;
   if (document.visibilityState === 'visible') {
    const terminal = await checkStatus(controller.signal); attempts++;
    if (terminal) return;
    if (attempts >= 24) { setPollExpired(true); return; }
   }
   if (!stopped) timer = setTimeout(poll, 5000);
  };
  void poll();
  return () => { stopped = true; controller.abort(); clearTimeout(timer); };
 }, [session, checkStatus]);
 function change(key: keyof Form, value: string) { setForm(previous => ({ ...previous, [key]: value, ...(key === 'currency' ? { method: '' } : {}) })); if (key === 'method' || key === 'currency') setPhoneTouched(false); setError(''); }
 async function pay(event: React.FormEvent) {
  event.preventDefault(); if (busy || !config?.configured || configBusy || domainLoading || domainBlocked || careLoading || careBlocked) return;
  if (!selectedMethod) return;
  if (network) { const problem = mobileNumberError(form.phone, network); if (problem) { setPhoneTouched(true); setError(problem); return; } }
  if (amountError) { setError(amountError); return; }
  setBusy(true); setError('');
  try {
   let token = careAccess?.token || domainAccess?.token || newToken();
   if (attempt.current) {
    if (JSON.stringify(attempt.current.form) !== JSON.stringify(form)) throw new Error('An earlier payment attempt needs checking. Restore its original details or contact support@opuszim.co.zw before starting another payment.');
    token = attempt.current.token;
   }
   attempt.current = { token, form: { ...form },...(careAccess?{care:careAccess}:{}),...(domainAccess?{domain:domainAccess}:{}) };
   try { sessionStorage.setItem(attemptKey, JSON.stringify(attempt.current)); } catch { /* The in-memory token still prevents duplicate retries. */ }
   const response = await fetch('/api/payments/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, token,...(careAccess?{care_order_id:careAccess.id,care_order_token:careAccess.token}:{}), ...(domainAccess?{domain_order_id:domainAccess.id,domain_order_token:domainAccess.token}:{}) }), signal: AbortSignal.timeout(30000) });
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
  history.replaceState(null, '', '/payments/'); setSession(null); setReceipt(null); setContinueUrl(''); setCheckError(''); setError(''); setForm(emptyForm); setResumable(false);setDomainOrder(null);setDomainAccess(null);setDomainBlocked(false);setCareOrder(null);setCareAccess(null);setCareBlocked(false);
 }
 const selectedMethod = config?.methods.find(method => method.code === form.method);
 const network = selectedMethod ? mobileNetwork(selectedMethod.name) : null;
 const directMobile = Boolean(network && !selectedMethod?.redirectRequired);
 const phoneError = network ? mobileNumberError(form.phone, network, phoneTouched) : '';
 const phoneValid = !network || !mobileNumberError(form.phone, network);
 const amountValue = Number(form.amount);
 const amountError = !form.amount ? '' : !/^\d+(\.\d{1,2})?$/.test(form.amount) ? 'Enter an amount with no more than two decimal places.' : selectedMethod && (amountValue < selectedMethod.minimumAmount || amountValue > selectedMethod.maximumAmount) ? `This method accepts ${form.currency} ${selectedMethod.minimumAmount.toFixed(2)}–${selectedMethod.maximumAmount.toFixed(2)}. Check your amount or choose another method.` : '';
 const paid = receipt?.paid === true && !checkError;
 const pending = !receipt || !receipt.terminal;
 return <main className="payment-page">
  <article className={`payment-sheet ${session ? 'payment-receipt' : ''} ${session && pending && !checkError ? 'payment-pending' : ''}`} aria-busy={busy || checking}>
   {paid&&<div className="receipt-verified-watermark" aria-hidden="true">OPUS<span>VERIFIED</span></div>}
   <header className="payment-header"><PaymentLogo /><p><LockKeyhole size={14} aria-hidden="true" /> Secure <span>•</span> Fast <span>•</span> Reliable</p></header>
   {!session ? <>
    <div className="payment-heading"><h1>{careOrder?'Monthly maintenance':domainOrder?'Pay for your domain':'Make a payment'}</h1><p>{careOrder?`${careOrder.project} · ${careOrder.period} · US$10.00`:domainOrder?`${domainOrder.domain} · one year · US$${(domainOrder.retail_minor/100).toFixed(2)}`:'Pay your Opus Zimbabwe invoice or project securely with Pesepay.'}</p></div>
    {error && <div className="payment-notice" role="alert">{error}<p>{support}</p></div>}
    {resumable && <p className="payment-notice">Your previous payment details have been kept. Continue with the same details to check that attempt safely. <button type="button" className="payment-text-button" onClick={() => { if (attempt.current) setForm(attempt.current.form); }}>Restore previous details</button></p>}
    {careLoading&&<p role="status">Loading your private maintenance order…</p>}{domainLoading&&<p role="status">Loading your verified domain quote…</p>}
    <form onSubmit={pay} className="payment-form">
     <div className="payment-currency-row"><label htmlFor="payment-currency">Payment currency<select id="payment-currency" aria-label="Payment currency" value={form.currency} onChange={event => change('currency', event.target.value)} disabled={busy || configBusy || (Boolean(domainAccess)||Boolean(careAccess))}>{(config?.currencies.length ? config.currencies : [{ code: 'USD', name: 'US Dollar' }, { code: 'ZiG', name: 'Zimbabwe Gold' }]).map(currency => <option key={currency.code} value={currency.code}>{currency.code}</option>)}</select></label></div>
     <fieldset className="payment-methods payment-methods-first" disabled={busy}><legend><span className="payment-step-number">1</span> Choose your payment method</legend>
      {configBusy ? <p role="status">Loading payment methods…</p> : configError ? <div role="alert"><p>{configError}</p><button type="button" className="payment-text-button" onClick={() => setConfigRetry(value => value + 1)}>Try loading methods again</button></div> : config?.methods.length ? <div className="payment-method-grid">{config.methods.map(method => <label key={method.code} className="payment-method" data-selected={form.method === method.code}><input type="radio" name="method" aria-label={method.name} aria-controls="payment-entry" checked={form.method === method.code} onChange={() => change('method', method.code)} /><MethodLogo name={method.name} decorative /></label>)}</div> : <p>No local methods are currently available for this currency. {support}</p>}
     </fieldset>
     <div className="payment-international"><p>International payments</p><div>{['PayPal', 'Visa', 'Mastercard'].map(method => <button key={method} type="button" onClick={() => modal.current?.showModal()}><CreditCard size={18} aria-hidden="true" />{method}</button>)}</div></div>
     {!configBusy && config && !config.configured && <div className="payment-notice" role="status">Online payments are being set up. {support}</div>}
     {selectedMethod && <section id="payment-entry" className="payment-entry" aria-labelledby="payment-entry-title"><h2 id="payment-entry-title"><span className="payment-step-number">2</span> Payment details</h2>
      {network && <div className="payment-mobile-field"><label htmlFor="payment-mobile">{network === 'onemoney' ? 'OneMoney' : 'EcoCash'} mobile number<input id="payment-mobile" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} value={form.phone} onChange={event => change('phone', event.target.value)} onBlur={() => setPhoneTouched(true)} aria-invalid={Boolean(phoneError)} aria-describedby="payment-mobile-feedback" placeholder={network === 'onemoney' ? '0710 000 000' : '0770 000 000'} disabled={busy} /></label><p id="payment-mobile-feedback" className={`payment-field-feedback ${phoneError ? 'is-error' : ''}`} role={phoneError ? 'alert' : undefined}>{phoneError || (network === 'onemoney' ? 'OneMoney: 071. You can also use +263.' : 'EcoCash: 077, 078 or 079. You can also use +263.')}</p></div>}
      <div className="payment-fields"><label>Amount to pay<input name="amount" type="number" min={selectedMethod.minimumAmount} max={selectedMethod.maximumAmount} step="0.01" inputMode="decimal" required value={form.amount} onChange={event => change('amount', event.target.value)} aria-invalid={Boolean(amountError)} aria-describedby="payment-amount-feedback" placeholder="0.00" disabled={busy || (Boolean(domainAccess)||Boolean(careAccess))} /></label><label>Invoice or project reference<input name="invoice" required maxLength={120} value={form.invoice} onChange={event => change('invoice', event.target.value)} placeholder="Reference from your quote or invoice" disabled={busy || (Boolean(domainAccess)||Boolean(careAccess))} /></label></div>
      <p id="payment-amount-feedback" className={`payment-field-feedback ${amountError ? 'is-error' : ''}`} role={amountError ? 'alert' : undefined}>{amountError || `Use the ${form.currency} amount agreed on your quote or invoice.`}</p>
      {!domainAccess&&<details className="payment-optional"><summary>Add receipt contact details (optional)</summary><div className="payment-fields"><label>Payer name<input name="name" autoComplete="name" maxLength={100} value={form.name} onChange={event => change('name', event.target.value)} disabled={busy} /></label><label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={event => change('email', event.target.value)} disabled={busy} /></label></div></details>}
      <button type="submit" className="payment-submit" disabled={busy || configBusy || domainLoading || domainBlocked || careLoading || careBlocked || !config?.configured || !phoneValid || !form.amount || !form.invoice.trim() || Boolean(amountError)}>{busy ? <><LoaderCircle size={20} className="payment-spinner" />Starting secure payment…</> : <><ShieldCheck size={20} />{directMobile ? 'Request payment' : 'Continue to Pesepay'}</>}</button>
      <p className="payment-small text-center">{directMobile ? 'Confirm the payment request on your phone. Enter your PIN only in your provider’s trusted prompt.' : 'Enter your payment-authorisation details securely on Pesepay. We will confirm the result when you return.'}</p>
     </section>}
        </form>
   </> : <>
    <div className="payment-outcome" role="status">
     <div className={`payment-state-icon ${paid ? 'is-paid' : pending && !checkError && !pollExpired ? 'is-pending' : 'is-unconfirmed'}`}>{paid ? <Check size={54} strokeWidth={4} /> : pending && !checkError && !pollExpired ? <LoaderCircle size={54} className="payment-spinner" /> : <CircleAlert size={54} />}</div>
     <h1>{paid ? 'Payment Successful' : checkError ? 'Confirmation unavailable' : pending ? (pollExpired ? 'Payment awaiting confirmation' : 'Processing Your Payment') : receipt?.status === 'REVERSED' ? 'Payment Reversed' : receipt?.status === 'UNCONFIRMED' || receipt?.status === 'VERIFICATION_FAILED' ? 'Payment needs confirmation' : 'Payment not completed'}</h1>
     <p>{paid ? 'Your payment has been processed successfully. Thank you for your trust and support.' : checkError || (pending ? (pollExpired ? 'This is taking longer than expected. Check your payment status again or contact support before making another payment.' : receipt?.status === 'UNCONFIRMED' ? 'We are checking whether the payment request reached your provider. Please do not start another payment; use Check payment status or contact support.' : 'Please wait while we securely confirm your transaction with Pesepay.') : 'Please contact our support team with your reference before making another payment.')}</p>
     {!paid && <div className="payment-small">{support}</div>}
    </div>
    {receipt && (!pending || checkError) && <section className="payment-details" aria-labelledby="payment-details-title"><h2 id="payment-details-title">Payment details</h2>{receipt.name && <div className="payment-payer"><div><span>Payer Name</span><strong>{receipt.name}</strong></div><UserRound size={58} aria-hidden="true" /></div>}<div className="payment-detail-row"><CalendarDays aria-hidden="true" /><div><span>Payment Date &amp; Time</span><strong>{dateLabel(receipt.date)}</strong></div></div><div className="payment-detail-row"><CreditCard aria-hidden="true" /><div><span>Payment Method</span><strong className="payment-method-value"><MethodLogo name={receipt.method} /></strong></div></div><div className="payment-detail-row"><ShieldCheck aria-hidden="true" /><div><span>Transaction Reference / Approval Code</span><strong>{receipt.reference || receipt.id}</strong></div></div><div className="payment-detail-row"><Wallet aria-hidden="true" /><div><span>Invoice / Project Reference</span><strong>{receipt.invoice}</strong></div></div><div className={`payment-amount-panel ${paid ? 'is-paid' : ''}`}><Coins size={48} aria-hidden="true" /><div><span>{paid ? 'Amount Paid' : 'Payment Amount'}</span><strong>{receipt.currency} {receipt.amount.toFixed(2)}</strong>{paid && receipt.invoiceAmount !== undefined && receipt.invoiceAmount !== receipt.amount && <span className="payment-small">Invoice amount: {receipt.currency} {receipt.invoiceAmount.toFixed(2)}</span>}</div></div></section>}
    {error&&<p role="alert" className="payment-notice">{error}</p>}{careOrder&&<section className="payment-notice"><h2 className="text-xl font-bold">{careOrder.project} · {careOrder.period}</h2><p>{careOrder.state==='PAID'?'Your receipt and care documents are queued for the authorised project email. A current-month payment includes a progress report now and a final report after month-end.':'Maintenance documents are issued only after independent payment verification.'}</p>{careOrder.documents.map(d=><p key={d.kind}>{d.kind==='PROGRESS'?'Progress report':'Final report'} · {d.email_status==='NOT_SENT'?d.status:d.email_status}{d.available&&careAccess&&<button type="button" className="payment-text-button" onClick={async()=>{try{const r=await fetch(`/api/care/documents?id=${careAccess.id}&kind=${d.kind}`,{headers:{authorization:'Bearer '+careAccess.token},cache:'no-store'});if(!r.ok)throw Error((await r.json()).error);const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=`Opus-care-${careOrder.period}-${d.kind.toLowerCase()}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){setError(e instanceof Error?e.message:'Document unavailable.');}}}>Download PDF</button>}</p>)}<button type="button" className="payment-text-button" disabled={checking} onClick={()=>void checkStatus()}>Refresh document status</button></section>}
    {domainOrder&&<section className="payment-notice" aria-live="polite"><h2 className="text-xl font-bold">{domainOrder.state==='REGISTERED'?'Domain registered':domainOrder.state==='QUOTED'?'Domain order':'Domain registration: '+domainOrder.state.toLowerCase().replace(/_/g,' ')}</h2><p><strong>{domainOrder.domain}</strong></p><p>{domainOrder.state==='REGISTERED'?'The registrar has confirmed your registration. Check your registrant email for verification instructions.':domainOrder.message||'Registration is submitted after verified payment. Do not make another payment while this order is being confirmed.'}</p>{!domainOrder.terminal&&<button type="button" className="payment-text-button" onClick={()=>void checkStatus()} disabled={checking}>{checking?'Checking…':'Check registration status'}</button>}</section>}
    <div className="payment-receipt-actions">{!paid && <button type="button" onClick={() => void checkStatus()} disabled={checking}>{checking ? 'Checking…' : 'Check payment status'}</button>}{!paid && continueUrl && receipt?.status === 'INITIATED' && <a href={continueUrl}>Continue payment on Pesepay</a>}{paid && <><button type="button" onClick={() => window.print()}>Print receipt</button>{!domainOrder&&!careOrder&&<button type="button" onClick={anotherPayment}>Make another payment</button>}</>}</div>
    {paid&&session&&<PaymentReceiptActions id={session.id} token={session.token} onVerified={setReceipt}/>}
    {paid && <div className="payment-thanks"><Heart size={30} fill="currentColor" /><h2>Thank You!</h2><p>We appreciate your continued support.</p></div>}
   </>}
   <footer className="payment-support">{support}<a href="https://opuszim.co.zw/">Back to Opus Zimbabwe</a></footer>
  </article>
  <dialog ref={modal} className="payment-modal" aria-labelledby="international-title" onClick={event => { if (event.target === modal.current) modal.current.close(); }}><div><button type="button" className="payment-modal-close" onClick={() => modal.current?.close()} aria-label="Close international payments message"><X size={24} /></button><CreditCard size={38} className="text-[#E85D2A]" /><h2 id="international-title">Use a local payment method</h2><p>International payments are currently unavailable. Please use a local payment method.</p><p>If you need help, contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p><button type="button" className="payment-submit" onClick={() => modal.current?.close()} autoFocus>Choose local payments</button></div></dialog>
 </main>;
}
