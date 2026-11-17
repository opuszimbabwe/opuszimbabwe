'use client';
import {useState,type FormEvent} from 'react';
import {LoaderCircle,Copy} from 'lucide-react';
import type {WalletCheckout} from '@/lib/payments';
import {PaymentBrand} from './PaymentMethodPicker';
import OpusFloatingField from './OpusFloatingField';
export default function WalletPaymentPanel({wallet,amount,currency,busy,checking,error,onSubmitCode,onCheck,onChangeMethod}:{wallet:WalletCheckout;amount:number;currency:string;busy:boolean;checking:boolean;error:string;onSubmitCode:(code:string)=>Promise<void>;onCheck:()=>void;onChangeMethod:()=>void}){
 const [code,setCode]=useState(''),[copied,setCopied]=useState(false);
 const name=wallet.kind==='innbucks'?'InnBucks':wallet.kind==='omari'?'Omari':'OneMoney';
 async function submit(e:FormEvent){e.preventDefault();if(!/^\d{6}$/.test(code)||busy)return;const value=code;setCode('');await onSubmitCode(value)}
 return <section className="opus-wallet-panel" aria-labelledby="wallet-title"><div className="opus-selected-method"><PaymentBrand name={name}/><button type="button" onClick={onChangeMethod} disabled={busy}>Change method</button></div><h1 id="wallet-title">{wallet.kind==='innbucks'?'Approve with InnBucks':wallet.kind==='omari'&&wallet.otpState==='AWAITING'?'Enter your Omari code':'Waiting for approval'}</h1>
  <p className="opus-wallet-instructions">{wallet.instructions}</p>
  {wallet.kind==='innbucks'&&<div className="opus-innbucks-authorisation">{wallet.qr&&<img className="opus-wallet-qr" src={wallet.qr} alt="Scan this payment QR with the InnBucks app"/>}{wallet.code&&<div><span>Approval code</span><strong>{wallet.code}</strong><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(wallet.code!);setCopied(true)}catch{setCopied(false)}}}><Copy size={13}/>{copied?'Copied':'Copy code'}</button></div>}{!wallet.code&&!wallet.qr&&<p role="status">Your approval code is being prepared. Check status below.</p>}</div>}
  {wallet.kind==='omari'&&wallet.otpState==='AWAITING'&&<form className="opus-otp-form opus-detail-card" onSubmit={submit}><OpusFloatingField label="6-digit Omari code" name="omari-otp" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} value={code} onChange={value=>setCode(value.replace(/\D/g,'').slice(0,6))} valid={/^\d{6}$/.test(code)} disabled={busy}/><button className="payment-submit" type="submit" disabled={busy||!/^\d{6}$/.test(code)}>{busy?<><LoaderCircle className="payment-spinner" size={16}/>Authorising…</>:'Authorise payment'}</button></form>}
  {wallet.kind==='omari'&&wallet.otpState!=='AWAITING'&&<p className="opus-wallet-waiting" role="status">{wallet.otpState==='UNCERTAIN'?'Your code submission is being verified. Do not submit it again.':'Your code was submitted. We are verifying the result.'}</p>}
  {wallet.kind==='onemoney'&&<p className="opus-wallet-waiting">Enter your wallet PIN only in OneMoney’s trusted phone prompt.</p>}
  {error&&<p className="opus-wallet-error" role="alert">{error}</p>}
  <div className="opus-wallet-total"><span>Payment amount</span><strong>{currency} {amount.toFixed(2)}</strong></div>
  <button type="button" className="opus-wallet-check" disabled={busy||checking} onClick={onCheck}>{checking?<><LoaderCircle size={15} className="payment-spinner"/>Checking…</>:'Check payment status'}</button><small>Payment is confirmed only after verification by your provider.</small>
 </section>
}
