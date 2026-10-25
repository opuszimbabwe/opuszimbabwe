'use client';
import {useState} from 'react';
import {Download,Share2} from 'lucide-react';
import type {PaymentReceipt} from '@/lib/payments';
export default function PaymentReceiptActions({id,token,onVerified}:{id:string;token:string;onVerified:(receipt:PaymentReceipt)=>void}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 function download(file:File){const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),15000)}
 async function exportReceipt(share:boolean){if(busy)return;setBusy(true);setMessage('Verifying your receipt…');try{
 const response=await fetch('/api/payments/status?id='+encodeURIComponent(id),{headers:{authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(30000)});const body=await response.json();if(!response.ok)throw Error(body.error||'Payment verification is temporarily unavailable.');onVerified(body.receipt);if(!body.receipt.paid||body.receipt.status!=='SUCCESS')throw Error('This payment is not currently verified as successful. Please check its status or contact support.');
 const {receiptImage}=await import('@/lib/receipt-image');const file=await receiptImage(body.receipt);
 if(share&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'Opus Zimbabwe payment receipt'});setMessage('Receipt shared.');return;}catch(error){if(error instanceof Error&&error.name==='AbortError'){setMessage('Sharing cancelled.');return;} }}
 download(file);setMessage(share?'Receipt downloaded. Attach the image in WhatsApp, Messenger or your preferred app.':'Your verified receipt image has been downloaded.');
 }catch(error){setMessage(error instanceof Error?error.message:'Receipt could not be generated. Please try again.')}finally{setBusy(false)}}
 return <div className="receipt-export"><div><button disabled={busy} type="button" onClick={()=>void exportReceipt(false)}><Download size={17}/>Download receipt</button><button disabled={busy} type="button" onClick={()=>void exportReceipt(true)}><Share2 size={17}/>Share receipt</button></div>{message&&<p role="status">{message}</p>}</div>;
}
