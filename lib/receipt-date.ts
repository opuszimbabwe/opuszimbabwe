import type {PaymentReceipt} from './payments';
const format=(date:Date,timeZone:string)=>new Intl.DateTimeFormat('en-GB',{timeZone,dateStyle:'medium'}).format(date)+' · '+new Intl.DateTimeFormat('en-GB',{timeZone,timeStyle:'medium',hourCycle:'h23'}).format(date);
/** Reference timestamps describe the reference, never confirmed settlement time.
 * Keep their wall-clock digits as supplied; the reference has no timezone. */
export function receiptDate(receipt:Pick<PaymentReceipt,'date'|'reference'>){
 if(receipt.date&&Number.isFinite(Date.parse(receipt.date)))return {label:'Payment date & time',text:format(new Date(receipt.date),'Africa/Harare')+' CAT'};
 const match=/^(20\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{3})(?:\D.*)?$/.exec(receipt.reference||'');
 if(match){
  const [year,month,day,hour,minute,second,millisecond]=match.slice(1,8).map(Number);
  const date=new Date(Date.UTC(year,month-1,day,hour,minute,second,millisecond));
  if(date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day&&date.getUTCHours()===hour&&date.getUTCMinutes()===minute&&date.getUTCSeconds()===second)return {label:'Reference date & time',text:format(date,'UTC')};
 }
 return {label:'Payment date & time',text:'Not supplied by Pesepay'};
}
