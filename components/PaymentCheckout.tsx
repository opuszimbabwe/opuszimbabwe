'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, Coins, CreditCard, Heart, LoaderCircle, ShieldCheck, UserRound, Wallet, CircleAlert } from 'lucide-react';
import { isPaymentReceipt, SUPPORT_EMAIL, SUPPORT_PHONE, mobileNetwork, mobileNumberError, type PaymentConfig, type PaymentReceipt, type WalletCheckout } from '@/lib/payments';

import WalletPaymentPanel from '@/components/WalletPaymentPanel';
import OpusFloatingField,{OpusFloatingCurrency} from '@/components/OpusFloatingField';
import PaymentMethodPicker,{OpusPayBrand,PaymentBrand,motionAllowed} from '@/components/PaymentMethodPicker';
import {receiptDate} from '@/lib/receipt-date';
import PaymentReceiptActions from '@/components/PaymentReceiptActions';
import type {PublicCareOrder} from '@/lib/client-care';
import type { DomainPublicOrder } from '@/lib/domains';
type Session = { id: string; token: string };
type PreviousAttempt=Session&{method:string};
type CheckoutAttempt={token:string;form:Form;id?:string;care?:Session;domain?:Session};
type Form = { name: string; email: string; phone: string; invoice: string; amount: string; currency: string; method: string };
const emptyForm: Form = { name: '', email: '', phone: '', invoice: '', amount: '', currency: 'USD', method: '' };
const attemptKey = 'opus-payment-attempt';
const previousKey='opus-previous-payment-attempts';
const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map(value => value.toString(16).padStart(2, '0')).join('');
const support = <>Contact <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call <a href={`tel:${SUPPORT_PHONE}`}>0773 979 162</a> for payment support.</>;
function remember(session: Session) {
 try { sessionStorage.setItem('opus-payment-' + session.id, session.token); sessionStorage.setItem('opus-last-payment', session.id); return true; } catch { return false; }
}
function MethodLogo({name}:{name:string;decorative?:boolean}) {return <PaymentBrand name={name}/>;}
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
 const [wallet,setWallet]=useState<WalletCheckout|null>(null),[otpBusy,setOtpBusy]=useState(false),[otpError,setOtpError]=useState('');
 const [checking, setChecking] = useState(false);
 const [checkError, setCheckError] = useState('');
 const [pollExpired, setPollExpired] = useState(false);
 const [resumable, setResumable] = useState(false);
 const [previousAttempts,setPreviousAttempts]=useState<PreviousAttempt[]>([]);
 const liveSession=useRef<Session|null>(null);liveSession.current=session;
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(previousKey)||'[]');if(Array.isArray(saved))setPreviousAttempts(saved.filter(p=>p&&typeof p.id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(p.id)&&typeof p.token==='string'&&/^[a-f0-9]{64}$/.test(p.token)&&typeof p.method==='string'))}catch{}},[]);
 const [phoneTouched, setPhoneTouched] = useState(false);
 const [amountTouched,setAmountTouched]=useState(false);
 const [referenceTouched,setReferenceTouched]=useState(false);
 const [notice,setNotice]=useState('');
 const [validationPulse,setValidationPulse]=useState(0);

 const [configRetry, setConfigRetry] = useState(0);
 const inFlight = useRef(false);
 const attempt = useRef<CheckoutAttempt|null>(null);
 const [ready, setReady] = useState(false);
 const [motion,setMotion]=useState(false);
 const [viewport,setViewport]=useState({width:1200,height:1000});
 useEffect(()=>{const update=()=>{const v=window.visualViewport;const height=Math.round(v?.height||innerHeight);setViewport({width:innerWidth,height});document.documentElement.style.setProperty('--opus-viewport-height',height+'px')};update();window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);const bodyOverflow=document.body.style.overflow,htmlOverflow=document.documentElement.style.overflow;if(!session||(wallet&&!receipt?.terminal)){document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}return()=>{window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=htmlOverflow;document.documentElement.style.removeProperty('--opus-viewport-height')}},[session,wallet?.kind,receipt?.terminal]);
 const entryRef=useRef<HTMLElement>(null);
 useEffect(()=>{setMotion(motionAllowed())},[]);
 useEffect(()=>{if(form.method)requestAnimationFrame(()=>entryRef.current?.focus({preventScroll:true}))},[form.method]);
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
  const timeout=setTimeout(()=>{setConfig(null);setConfigBusy(false);setConfigError('Payment methods are taking too long to load. Please try again.');controller.abort()},15000);
  fetch('/api/payments/config?currency=' + encodeURIComponent(form.currency), { cache: 'no-store', signal: controller.signal })
   .then(async response => { const body = await response.json().catch(()=>{throw new Error('Payment methods could not be loaded. Please try again.')}); if (!response.ok) throw new Error(typeof body?.error==='string'?body.error:'Payment methods could not be loaded.');
    if(!body||typeof body.configured!=='boolean'||!Array.isArray(body.currencies)||!body.currencies.every((c:PaymentConfig['currencies'][number])=>c&&typeof c.code==='string')||!Array.isArray(body.methods)||!body.methods.every((m:PaymentConfig['methods'][number])=>m&&typeof m.code==='string'&&Boolean(m.code.trim())&&typeof m.name==='string'&&Boolean(m.name.trim())&&Number.isFinite(m.minimumAmount)&&Number.isFinite(m.maximumAmount)&&m.minimumAmount>=0&&m.maximumAmount>=m.minimumAmount))throw new Error('Payment methods could not be verified. Please try again.');
    return body as PaymentConfig; })
   .then(body => { if (controller.signal.aborted) return; setConfig(body); setForm(value => ({ ...value, method: body.methods.some(method => method.code === value.method) ? value.method : '' })); })
   .catch(reason => { if (!controller.signal.aborted) { setConfig(null); setConfigError(reason.message || 'Payment methods could not be loaded.'); } })
   .finally(() => {clearTimeout(timeout); if (!controller.signal.aborted) setConfigBusy(false); });
  return () => {clearTimeout(timeout);controller.abort()};
 }, [form.currency, session, ready, configRetry]);
 const checkStatus = useCallback(async (signal?: AbortSignal) => {
  if (!session || inFlight.current) return false;
  inFlight.current = true; setChecking(true);
  try {
   const response = await fetch('/api/payments/status?id=' + encodeURIComponent(session.id), { headers: { authorization: 'Bearer ' + session.token }, cache: 'no-store', signal: signal || AbortSignal.timeout(25000) });
   const body = await response.json().catch(()=>{throw new Error('We could not confirm your payment yet.')}); if (!response.ok) throw new Error(body.error || 'We could not confirm your payment yet.');
   if(!isPaymentReceipt(body.receipt))throw new Error('Payment status could not be verified. Please check again.');
   if (signal?.aborted||liveSession.current?.id!==session.id) return false;
   setReceipt(body.receipt);setWallet(body.wallet||null);if(body.careOrder){setCareOrder(body.careOrder);setCareAccess({id:body.careOrder.id,token:session.token});} if(body.domainOrder)setDomainOrder(body.domainOrder); setCheckError('');
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
 function change(key: keyof Form, value: string) { setForm(previous => ({ ...previous, [key]: value, ...(key === 'currency' ? { method: '' } : {}) })); if (key === 'method' || key === 'currency' || key==='phone') setPhoneTouched(false); if(key==='amount'||key==='method')setAmountTouched(false); if(key==='method')setReferenceTouched(false); setError(''); }
 function attemptLink(value:Session){try{if(sessionStorage.getItem('opus-payment-'+value.id)===value.token)return '/payments/?payment='+encodeURIComponent(value.id)}catch{}return '/payments/?payment='+encodeURIComponent(value.id)+'&token='+encodeURIComponent(value.token)}
 function changePaymentMethod(){
  if(busy)return;
  let saved=attempt.current;try{const stored=JSON.parse(sessionStorage.getItem(attemptKey)||'null');if(!saved&&stored?.form&&typeof stored.token==='string'&&(!session||stored.token===session.token))saved=stored}catch{}
  let old:Session|null=session;if(!old&&saved?.id)old={id:saved.id,token:saved.token};
  if(!old&&saved){try{const id=sessionStorage.getItem('opus-last-payment');if(id&&sessionStorage.getItem('opus-payment-'+id)===saved.token)old={id,token:saved.token}}catch{}}
  if((domainOrder&&!domainAccess&&!saved?.domain)||(careOrder&&!careAccess&&!saved?.care)){setError('Reopen your private order link to change its payment method safely.');return;}
  const restored=saved?.form||(receipt?{...emptyForm,invoice:receipt.invoice,amount:(receipt.invoiceAmount??receipt.amount).toFixed(2),currency:receipt.currency}:form);
  if(old){remember(old);const history=[...previousAttempts.filter(p=>p.id!==old!.id),{...old,method:receipt?.method||config?.methods.find(m=>m.code===restored.method)?.name||'Earlier payment'}];setPreviousAttempts(history);try{sessionStorage.setItem(previousKey,JSON.stringify(history));sessionStorage.removeItem(attemptKey)}catch{}attempt.current=null;setResumable(false)}
  else if(saved){attempt.current=saved;setResumable(true)}
  if(saved?.care){setCareAccess(saved.care);setCareBlocked(false)}if(saved?.domain){setDomainAccess(saved.domain);setDomainBlocked(false)}
  setForm({...restored,method:''});liveSession.current=null;setSession(null);setReceipt(null);setWallet(null);setOtpError('');setContinueUrl('');setCheckError('');setChecking(false);setError('');setNotice('');setPhoneTouched(false);setAmountTouched(false);setReferenceTouched(false);
  const params=new URLSearchParams();const domain=saved?.domain||domainAccess,care=saved?.care||careAccess;if(domain){params.set('domain_order',domain.id);try{sessionStorage.setItem('opus-domain-'+domain.id,domain.token)}catch{params.set('domain_token',domain.token)}}else if(care){params.set('care_order',care.id);try{sessionStorage.setItem('opus-care-'+care.id,care.token)}catch{params.set('care_token',care.token)}}history.replaceState(null,'','/payments/'+(params.size?'?'+params:''));
 }
 async function pay(event: React.FormEvent) {
  event.preventDefault(); if (busy || !config?.configured || configBusy || domainLoading || domainBlocked || careLoading || careBlocked) return;
  if (!selectedMethod) return;
  if (network) { const problem = mobileNumberError(form.phone, network); if (problem) { setPhoneTouched(true); setError(problem); return; } }
  if (amountError) { setError(amountError); return; }
  setBusy(true); setError('');
  try {
   for(const previous of previousAttempts){const response=await fetch('/api/payments/status?id='+encodeURIComponent(previous.id),{headers:{authorization:'Bearer '+previous.token},cache:'no-store',signal:AbortSignal.timeout(20000)});const body=await response.json();if(!response.ok||!body.receipt||typeof body.receipt.paid!=='boolean'||typeof body.receipt.status!=='string'||typeof body.receipt.terminal!=='boolean')throw new Error('Check your earlier payment status before starting another payment.');if(body.receipt.paid){remember(previous);setReceipt(body.receipt);setSession(previous);history.replaceState(null,'',attemptLink(previous));return}if(['UNCONFIRMED','VERIFICATION_FAILED'].includes(body.receipt.status))throw new Error('Your earlier request is still unconfirmed. Review its status before starting another payment.');}
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
   if(typeof body.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(body.id)||(!body.redirectUrl&&!isPaymentReceipt(body.receipt)))throw new Error('Payment response could not be verified. Check your existing attempt before trying again.');
   const value = { id: body.id, token }; const persisted = remember(value);
   if(attempt.current){attempt.current.id=body.id;try{sessionStorage.setItem(attemptKey,JSON.stringify(attempt.current))}catch{}}
   if (body.redirectUrl) { location.assign(body.redirectUrl); return; }
   setReceipt(body.receipt);setWallet(body.wallet||null); setSession(value);
   history.replaceState(null, '', '/payments/?payment=' + body.id + (persisted ? '' : '&token=' + token));
  } catch (reason) { setError(reason instanceof Error ? reason.message : 'Connection interrupted. Please check your existing payment before trying again.'); setResumable(Boolean(attempt.current)); }
  finally { setBusy(false); }
 }
 async function submitOmariCode(code:string){
  if(!session||otpBusy||!/^\d{6}$/.test(code))return;setOtpBusy(true);setOtpError('');
  try{const response=await fetch('/api/payments/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'omari-otp',id:session.id,token:session.token,otp:code}),signal:AbortSignal.timeout(25000)});const body=await response.json();if(!response.ok)throw new Error(body.error||'The code outcome could not be confirmed. Check payment status.');if(!isPaymentReceipt(body.receipt)||!body.wallet)throw new Error('Check payment status before submitting anything else.');setReceipt(body.receipt);setWallet(body.wallet)}catch(reason){setOtpError(reason instanceof Error?reason.message:'Code submission could not be confirmed.');setWallet(value=>value?{...value,otpState:'UNCERTAIN'}:value);void checkStatus()}finally{setOtpBusy(false)}
 }
 function anotherPayment() {
  try { sessionStorage.removeItem(attemptKey); sessionStorage.removeItem('opus-last-payment'); } catch {}
  attempt.current = null;setPreviousAttempts([]);try{sessionStorage.removeItem(previousKey)}catch{}
  history.replaceState(null, '', '/payments/'); setSession(null); setReceipt(null);setWallet(null);setOtpError(''); setContinueUrl(''); setCheckError(''); setError(''); setForm(emptyForm); setResumable(false);setDomainOrder(null);setDomainAccess(null);setDomainBlocked(false);setCareOrder(null);setCareAccess(null);setCareBlocked(false);
 }
 const selectedMethod = config?.methods.find(method => method.code === form.method);
 const network = selectedMethod&&selectedMethod.flow!=='omari'&&(selectedMethod.provider!=='paynow'||selectedMethod.redirectRequired===false) ? mobileNetwork(selectedMethod.name) : null;
 const omariMethod=selectedMethod?.flow==='omari';
 const emailRequired=Boolean(selectedMethod?.requiresEmail);
 const emailValid=!emailRequired||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
 const directMobile = Boolean(network && !selectedMethod?.redirectRequired);
 const phoneError = network&&phoneTouched ? mobileNumberError(form.phone, network) : omariMethod&&phoneTouched&&!/^07\d{8}$/.test(form.phone.replace(/^(?:\+263|00263|263)/,'0').replace(/[\s()-]/g,''))?'Enter your full Omari mobile number.':'';
 const phoneValid = omariMethod?/^07\d{8}$/.test(form.phone.replace(/^(?:\+263|00263|263)/,'0').replace(/[\s()-]/g,'')):!network || !mobileNumberError(form.phone, network);
 const amountValue = Number(form.amount);
 const amountError = !form.amount ? '' : !/^\d+(\.\d{1,2})?$/.test(form.amount) ? 'Enter an amount with no more than two decimal places.' : selectedMethod && (amountValue < selectedMethod.minimumAmount || amountValue > selectedMethod.maximumAmount) ? `This method accepts ${form.currency} ${selectedMethod.minimumAmount.toFixed(2)}–${selectedMethod.maximumAmount.toFixed(2)}. Check your amount or choose another method.` : '';
 const amountFeedback=amountTouched&&amountError?(!/^\d+(\.\d{1,2})?$/.test(form.amount)?'Amount: use up to 2 decimal places.':`Amount: ${form.currency} ${selectedMethod?.minimumAmount.toFixed(2)}–${selectedMethod?.maximumAmount.toFixed(2)}.`):'';
 const phoneFeedback=phoneError?(network==='ecocash'&&!/^07[789]/.test(form.phone.replace(/^\+263/,'0'))?'Mobile: use an EcoCash number (077, 078 or 079).':'Mobile: check the full number, including 0 or +263.') :'';
 const fieldFeedback=referenceTouched&&!form.invoice.trim()?'Add your invoice or project reference.':amountFeedback||phoneFeedback;
 useEffect(()=>{if(!fieldFeedback){setNotice('');return}setNotice(fieldFeedback);const timer=setTimeout(()=>setNotice(''),5500);return()=>clearTimeout(timer)},[fieldFeedback,validationPulse]);
 const walletPending=Boolean(session&&wallet&&!receipt?.terminal);
 const paid = receipt?.paid === true && !checkError;
 const pending = !receipt || !receipt.terminal;
 return <main className="payment-page opus-pay-page" data-motion={motion} data-keyboard={viewport.height<430}>
  {notice&&!session&&<div id="opus-field-notice" className="opus-field-notice" role="alert"><span className="opus-notice-icon" aria-hidden="true"><CircleAlert size={20} strokeWidth={2.8}/></span><div><strong>Please check this detail</strong><p>{notice}</p></div><button type="button" aria-label="Dismiss notification" onClick={()=>setNotice('')}>×</button></div>}
  {!session&&previousAttempts.length>0&&<details className="opus-previous-attempts"><summary>Earlier payment may still complete · review</summary><p>Changing method does not cancel an earlier request. Only complete one payment.</p>{previousAttempts.map((previous,index)=><a key={previous.id} href={attemptLink(previous)}>{previous.method} · attempt {index+1} <ArrowUpRight size={12}/></a>)}</details>}
  <article className={`payment-sheet ${session ? (walletPending?'payment-wallet-session':'payment-receipt') : ''} ${session && pending && !checkError ? 'payment-pending' : ''} opus-pay-sheet`} aria-busy={busy || checking}>
   {paid&&<div className="receipt-verified-watermark" aria-hidden="true">OPUS<span>VERIFIED</span></div>}
   <header className="opus-pay-header"><OpusPayBrand/></header>
   {!session ? <>
    {error && <div className="payment-notice" role="alert">{error}<p>{support}</p></div>}
    {form.currency!=='USD'&&!session&&<p className="payment-notice" role="alert">ZiG payments are temporarily unavailable. Contact payment support about your saved attempt before starting a USD payment.</p>}
    {resumable && <p className="payment-notice">Your previous payment details have been kept. Continue with the same details to check that attempt safely. <button type="button" className="payment-text-button" onClick={() => { if (attempt.current) setForm(attempt.current.form); }}>Restore previous details</button></p>}
    {careLoading&&<p role="status">Loading your private maintenance order…</p>}{domainLoading&&<p role="status">Loading your verified domain quote…</p>}
    <form onSubmit={pay} className="payment-form">
     {!selectedMethod&&<PaymentMethodPicker methods={config?.methods||[]} loading={configBusy} error={configError} onRetry={()=>setConfigRetry(v=>v+1)} disabled={busy||domainLoading||domainBlocked||careLoading||careBlocked} onSelect={method=>{setMotion(motionAllowed());change('method',method.code)}}/>}
     {!configBusy && config && !config.configured && <div className="payment-notice" role="status">Online payments are being set up. {support}</div>}
     {selectedMethod && <section id="payment-entry" ref={entryRef} tabIndex={-1} className="payment-entry opus-detail-card" data-payment-email={emailRequired} aria-labelledby="payment-entry-title"><div className="opus-selected-method"><MethodLogo name={selectedMethod.name}/><button type="button" disabled={busy} onClick={changePaymentMethod}>Change method</button></div><h1 id="payment-entry-title">Payment details</h1>
      <div className="opus-reference-field"><OpusFloatingField label="Invoice or project reference" name="invoice" required maxLength={120} autoComplete="off" value={form.invoice} valid={Boolean(form.invoice.trim())} invalid={referenceTouched&&!form.invoice.trim()} onChange={value=>{setReferenceTouched(false);change('invoice',value)}} onBlur={()=>{setReferenceTouched(true);setValidationPulse(v=>v+1)}} disabled={busy||Boolean(domainAccess)||Boolean(careAccess)}/></div>
      <div className="opus-amount-currency"><OpusFloatingField label="Amount to pay" example="e.g. 25.00" name="amount" type="text" inputMode="decimal" required maxLength={12} value={form.amount} valid={Boolean(form.amount)&&!amountError} invalid={Boolean(amountTouched&&amountError)} onChange={value=>change('amount',value)} onBlur={()=>{setAmountTouched(true);setValidationPulse(v=>v+1)}} aria-describedby={amountFeedback?'opus-field-notice':undefined} disabled={busy||Boolean(domainAccess)||Boolean(careAccess)}/><OpusFloatingCurrency disabled={busy}/></div>
      {(network||omariMethod)&&<div className="payment-mobile-field"><OpusFloatingField label={omariMethod?'Omari mobile number':network==='onemoney'?'OneMoney number':'EcoCash mobile number'} example={network==='onemoney'?'e.g. 0710 000 000':'e.g. 0770 000 000'} id="payment-mobile" name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={24} value={form.phone} valid={phoneValid} invalid={Boolean(phoneError)} onChange={value=>change('phone',value)} onBlur={()=>{setPhoneTouched(true);setValidationPulse(v=>v+1)}} aria-describedby={phoneFeedback?'opus-field-notice':undefined} disabled={busy}/></div>}
      {emailRequired&&<div className="opus-payment-email"><OpusFloatingField label="Payment email" example="e.g. name@example.com" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={form.email} onChange={value=>change('email',value)} valid={emailValid} disabled={busy||Boolean(domainAccess)||Boolean(careAccess)}/></div>}
      {<><div className="opus-total" role="group" aria-label="Total to pay"><span>Total to pay</span><strong>{form.currency} {Number.isFinite(amountValue)?amountValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'0.00'}</strong></div>
      <button type="submit" className="payment-submit" disabled={form.currency!=='USD' || busy || configBusy || domainLoading || domainBlocked || careLoading || careBlocked || !config?.configured || !phoneValid || !emailValid || !form.amount || !form.invoice.trim() || Boolean(amountError)}>{busy ? <><LoaderCircle size={20} className="payment-spinner" />Starting secure payment…</> : <><ShieldCheck size={20} />{omariMethod?'Send Omari code':selectedMethod?.flow==='innbucks'?'Get InnBucks code':directMobile ? 'Request payment' : (selectedMethod?.provider==='paynow'?'Continue to Paynow':'Continue to Pesepay')}</>}</button>
      <p className="payment-small text-center">{omariMethod?'Omari will send a six-digit code to authorise this payment.':selectedMethod?.flow==='innbucks'?'Approve with your InnBucks app or USSD approval code.':directMobile ? 'Confirm the payment request on your phone. Enter your PIN only in your provider’s trusted prompt.' : `Authorise securely on ${selectedMethod?.provider==='paynow'?'Paynow':'Pesepay'}. We will confirm the result when you return.`}</p></>}

     </section>}
        </form>
   </> : walletPending&&wallet ? <WalletPaymentPanel wallet={wallet} amount={receipt?.invoiceAmount??receipt?.amount??Number(form.amount)} currency={receipt?.currency||form.currency} busy={otpBusy} checking={checking} error={otpError||checkError||(pollExpired?'Approval is taking longer than expected. Check status before starting another payment.':'')} onSubmitCode={submitOmariCode} onCheck={()=>void checkStatus()} onChangeMethod={changePaymentMethod}/> : <>
    <div className="payment-outcome" role="status">
     <div className={`payment-state-icon ${paid ? 'is-paid' : pending && !checkError && !pollExpired ? 'is-pending' : 'is-unconfirmed'}`}>{paid ? <Check size={54} strokeWidth={4} /> : pending && !checkError && !pollExpired ? <LoaderCircle size={54} className="payment-spinner" /> : <CircleAlert size={54} />}</div>
     <h1>{paid ? 'Payment Successful' : checkError ? 'Confirmation unavailable' : pending ? (pollExpired ? 'Payment awaiting confirmation' : 'Processing Your Payment') : receipt?.status === 'CANCELLED' ? 'Payment cancelled' : ['EXPIRED','TIME_OUT','CLOSED_PERIOD_ELAPSED'].includes(receipt?.status||'') ? 'Payment request expired' : receipt?.status==='INSUFFICIENT_FUNDS'?'Insufficient funds':receipt?.status==='DECLINED'?'Payment declined':receipt?.status==='SERVICE_UNAVAILABLE'?'Payment service unavailable' : receipt?.status === 'AUTHORIZATION_FAILED' ? 'Payment authorisation failed' : receipt?.status === 'FAILED' ? 'Payment failed' : receipt?.status === 'REVERSED' ? 'Payment Reversed' : receipt?.status === 'UNCONFIRMED' || receipt?.status === 'VERIFICATION_FAILED' ? 'Payment needs confirmation' : 'Payment not completed'}</h1>
     <p>{paid ? 'Your payment has been processed successfully. Thank you for your trust and support.' : checkError || (pending ? (pollExpired ? 'This is taking longer than expected. Check your payment status again or contact support before making another payment.' : receipt?.status === 'UNCONFIRMED' ? 'We are checking whether the payment request reached your provider. Please do not start another payment; use Check payment status or contact support.' : 'We are checking the payment result with your provider. Approve only one request.') : receipt?.status==='CANCELLED'?'Your provider confirmed this payment was cancelled. You can choose another payment method.':['EXPIRED','TIME_OUT','CLOSED_PERIOD_ELAPSED'].includes(receipt?.status||'')?'Your provider confirmed the payment request expired. You can start a new payment.':receipt?.status==='AUTHORIZATION_FAILED'?'Your provider could not authorise this payment. Check your details before trying again.':'Please contact our support team with your reference before making another payment.')}</p>
     {!paid && <div className="payment-small">{support}</div>}
    </div>
    {receipt && (!pending || checkError) && <section className="payment-details" aria-labelledby="payment-details-title"><h2 id="payment-details-title">Payment details</h2>{receipt.name && <div className="payment-payer"><div><span>Payer Name</span><strong>{receipt.name}</strong></div><UserRound size={58} aria-hidden="true" /></div>}<div className="payment-detail-row"><CalendarDays aria-hidden="true" /><div><span>{receiptDate(receipt).label}</span><strong>{receiptDate(receipt).text}</strong></div></div><div className="payment-detail-row"><CreditCard aria-hidden="true" /><div><span>Payment Method</span><strong className="payment-method-value"><MethodLogo name={receipt.method} /></strong></div></div><div className="payment-detail-row"><ShieldCheck aria-hidden="true" /><div><span>Transaction Reference / Approval Code</span><strong>{receipt.reference || receipt.id}</strong></div></div><div className="payment-detail-row"><Wallet aria-hidden="true" /><div><span>Invoice / Project Reference</span><strong>{receipt.invoice}</strong></div></div><div className={`payment-amount-panel ${paid ? 'is-paid' : ''}`}><Coins size={48} aria-hidden="true" /><div><span>{paid ? 'Amount Paid' : 'Payment Amount'}</span><strong>{receipt.currency} {receipt.amount.toFixed(2)}</strong>{paid && receipt.invoiceAmount !== undefined && receipt.invoiceAmount !== receipt.amount && <span className="payment-small">Invoice amount: {receipt.currency} {receipt.invoiceAmount.toFixed(2)}</span>}</div></div></section>}
    {error&&<p role="alert" className="payment-notice">{error}</p>}{careOrder&&<section className="payment-notice"><h2 className="text-xl font-bold">{careOrder.project} · {careOrder.period}</h2><p>{careOrder.state==='PAID'?'Your receipt and care documents are queued for the authorised project email. A current-month payment includes a progress report now and a final report after month-end.':'Maintenance documents are issued only after independent payment verification.'}</p>{careOrder.documents.map(d=><p key={d.kind}>{d.kind==='PROGRESS'?'Progress report':'Final report'} · {d.email_status==='NOT_SENT'?d.status:d.email_status}{d.available&&careAccess&&<button type="button" className="payment-text-button" onClick={async()=>{try{const r=await fetch(`/api/care/documents?id=${careAccess.id}&kind=${d.kind}`,{headers:{authorization:'Bearer '+careAccess.token},cache:'no-store'});if(!r.ok)throw Error((await r.json()).error);const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=`Opus-care-${careOrder.period}-${d.kind.toLowerCase()}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){setError(e instanceof Error?e.message:'Document unavailable.');}}}>Download PDF</button>}</p>)}<button type="button" className="payment-text-button" disabled={checking} onClick={()=>void checkStatus()}>Refresh document status</button></section>}
    {domainOrder&&<section className="payment-notice" aria-live="polite"><h2 className="text-xl font-bold">{domainOrder.state==='REGISTERED'?'Domain registered':domainOrder.state==='QUOTED'?'Domain order':'Domain registration: '+domainOrder.state.toLowerCase().replace(/_/g,' ')}</h2><p><strong>{domainOrder.domain}</strong></p><p>{domainOrder.state==='REGISTERED'?'The registrar has confirmed your registration. Check your registrant email for verification instructions.':domainOrder.message||'Registration is submitted after verified payment. Do not make another payment while this order is being confirmed.'}</p>{!domainOrder.terminal&&<button type="button" className="payment-text-button" onClick={()=>void checkStatus()} disabled={checking}>{checking?'Checking…':'Check registration status'}</button>}</section>}
    <div className="payment-receipt-actions">{!paid&&<button type="button" disabled={busy} onClick={changePaymentMethod}>Change method</button>}{!paid && <button type="button" onClick={() => void checkStatus()} disabled={checking}>{checking ? 'Checking…' : 'Check payment status'}</button>}{!paid && continueUrl && receipt?.status === 'INITIATED' && <a href={continueUrl}>Continue payment on {/(onemoney|pos2u|telecash)/i.test(receipt?.method||'')?'Paynow':'Pesepay'}</a>}{paid && <><button type="button" onClick={() => window.print()}>Print receipt</button>{!domainOrder&&!careOrder&&<button type="button" onClick={anotherPayment}>Make another payment</button>}</>}</div>
    {paid&&session&&<PaymentReceiptActions id={session.id} token={session.token} onVerified={setReceipt}/>}
    {paid && <div className="payment-thanks"><Heart size={30} fill="currentColor" /><h2>Thank You!</h2><p>We appreciate your continued support.</p></div>}
   </>}

  </article>
  <footer className="opus-pay-footer"><span className="opus-footer-rule" aria-hidden="true"/><p><a href="https://payments.opuszim.co.zw/">payments.opuszim.co.zw</a><span aria-hidden="true">•</span><a href={`mailto:${SUPPORT_EMAIL}`}>Payment support <ArrowUpRight size={16} aria-hidden="true"/></a></p><small>© {new Date().getFullYear()} Opus Zimbabwe. All rights reserved.</small></footer>

 </main>;
}
