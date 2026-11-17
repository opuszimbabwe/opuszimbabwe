import type {Env} from './types';
import type {WalletCheckout} from '../../lib/payments';
import {CheckoutError} from './payments';
const PNG='iVBORw0KGgo';
type WalletRow={kind:WalletCheckout['kind'];instructions_json:string;otp_state:WalletCheckout['otpState']};
function text(value:unknown,max=2000){return typeof value==='string'?value.replace(/[\u0000-\u0008\u000b-\u001f]/g,'').slice(0,max):''}
export async function saveWallet(env:Env,id:string,kind:WalletCheckout['kind'],value:Record<string,unknown>={}){
 const code=typeof value.code==='number'?String(value.code):text(value.code,40);const safeCode=/^[A-Za-z0-9-]{3,40}$/.test(code)?code:undefined;
 const raw=text(value.qrCode,200000).replace(/^data:image\/png;base64,/,'');const qr=raw.startsWith(PNG)&&/^[A-Za-z0-9+/=]+$/.test(raw)?'data:image/png;base64,'+raw:undefined;
 const instructions=text(value.instructions)||({innbucks:'Scan the QR code with InnBucks, or enter the approval code in your InnBucks USSD menu.',omari:'Enter the six-digit code sent to your Omari phone. Submit it once to authorise payment.',onemoney:'Follow the OneMoney payment instructions on your phone. Approve only one request.'}[kind]);
 const json=JSON.stringify({instructions,...(safeCode?{code:safeCode}:{}),...(qr?{qr}:{})}),now=new Date().toISOString();
 await env.DB.prepare("INSERT INTO payment_wallet_state(payment_id,kind,instructions_json,otp_state,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(payment_id) DO UPDATE SET instructions_json=excluded.instructions_json,updated_at=excluded.updated_at").bind(id,kind,json,kind==='omari'?'AWAITING':'NOT_REQUIRED',now,now).run();
}
export async function walletInfo(env:Env,id:string):Promise<WalletCheckout|null>{
 const row=await env.DB.prepare('SELECT kind,instructions_json,otp_state FROM payment_wallet_state WHERE payment_id=?').bind(id).first<WalletRow>();if(!row)return null;
 let data:Record<string,string>={};try{data=JSON.parse(row.instructions_json)}catch{throw new CheckoutError(503,'Payment instructions are temporarily unavailable. Check the existing payment status.');}
 return {kind:row.kind,instructions:data.instructions||'',...(data.code?{code:data.code}:{}),...(data.qr?{qr:data.qr}:{}),...(row.kind==='omari'?{otpState:row.otp_state}:{})};
}
export function innbucksMetadata(value:unknown):Record<string,unknown>{const record=value as {transactionMetadata?:Record<string,unknown>;paymentMetadata?:Record<string,unknown>};return {...record?.paymentMetadata,...record?.transactionMetadata};}
