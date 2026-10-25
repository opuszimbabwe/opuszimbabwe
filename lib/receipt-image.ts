import type {PaymentReceipt} from './payments';
/** A local, shareable receipt image. Call only after fresh gateway verification. */
export async function receiptImage(receipt:PaymentReceipt):Promise<File>{
 if(!receipt.paid||receipt.status!=='SUCCESS'||!Number.isFinite(receipt.amount))throw new Error('Only a verified successful payment can have a verified receipt.');
 // Load the actual bundled Poppins face. Next's optional system fallback can
 // be unavailable on a device even when Poppins itself loaded successfully.
 const family=getComputedStyle(document.body).fontFamily.split(',')[0].trim();
 await Promise.all([400,600,700].map(w=>document.fonts.load(`${w} 24px ${family}`)));
 const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=2200;const c=canvas.getContext('2d')!;if(!c)throw new Error('Receipt images are unavailable in this browser.');
 const font=(weight:number,size:number)=>{c.font=`${weight} ${size}px ${family}`};
 const text=(value:string,x:number,y:number,size=26,weight=400,colour='#0f0928')=>{font(weight,size);c.fillStyle=colour;c.fillText(value,x,y)};
 const line=(y:number)=>{c.strokeStyle='#e8e9ee';c.lineWidth=2;c.beginPath();c.moveTo(90,y);c.lineTo(990,y);c.stroke()};
 function wrap(value:string,x:number,y:number,width:number,size=25,weight=400){font(weight,size);let row='',yy=y;for(const word of value.split(/\s+/)){const next=row?row+' '+word:word;if(c.measureText(next).width>width&&row){text(row,x,yy,size,weight);row=word;yy+=size*1.5;}else row=next;}while(c.measureText(row).width>width&&row.length>1){let cut=row.length;while(c.measureText(row.slice(0,cut)).width>width&&cut>1)cut--;text(row.slice(0,cut),x,yy,size,weight);row=row.slice(cut);yy+=size*1.5;}text(row,x,yy,size,weight);return yy;}
 c.fillStyle='#f0f2f6';c.fillRect(0,0,1080,2200);c.fillStyle='#ffffff';c.beginPath();c.roundRect(40,36,1000,2128,40);c.fill();
 const logo=new Image();logo.src='/images/logo-full.png';await logo.decode();const ratio=logo.naturalWidth/logo.naturalHeight;const width=Math.min(340,110*ratio);c.drawImage(logo,540-width/2,88,width,width/ratio);
 c.fillStyle='#f1f8f3';c.beginPath();c.arc(540,290,54,0,Math.PI*2);c.fill();c.strokeStyle='#20964c';c.lineWidth=9;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(517,290);c.lineTo(533,306);c.lineTo(566,273);c.stroke();
 c.textAlign='center';text('Payment successful',540,401,47,700);text('Thank you for choosing Opus Zimbabwe.',540,450,23,400,'#717786');
 // Grey stamped watermark remains part of the exported image.
 c.save();c.translate(550,840);c.rotate(-Math.PI/10);c.globalAlpha=.07;c.strokeStyle='#5e6671';c.lineWidth=9;c.beginPath();c.arc(0,0,255,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,235,0,Math.PI*2);c.stroke();text('OPUS',0,-12,96,700,'#5e6671');text('VERIFIED',0,58,48,600,'#5e6671');c.restore();
 c.textAlign='left';line(498);text('PAYMENT RECEIPT',90,550,19,600,'#717786');
 let y=610;
 const rows:[string,string][]=[...(receipt.name?[['Payer',receipt.name] as [string,string]]:[]),['Date & time',receipt.date?new Intl.DateTimeFormat('en-ZW',{timeZone:'Africa/Harare',dateStyle:'medium',timeStyle:'short'}).format(new Date(receipt.date))+' CAT':'Verified by Pesepay'],['Payment method',receipt.method],['Reference',receipt.reference||receipt.id],['Invoice / project',receipt.invoice]];
 for(const [label,value] of rows){text(label,90,y,19,400,'#717786');y=wrap(value,90,y+37,900,25,600)+55;}
 const panelY=Math.max(1080,y-10);c.fillStyle='#f3f7f4';c.beginPath();c.roundRect(90,panelY,900,116,18);c.fill();text('Amount paid',116,panelY+38,19,400,'#717786');text(`${receipt.currency} ${receipt.amount.toFixed(2)}`,116,panelY+89,42,700);
 c.textAlign='center';text('OPUS VERIFIED  ·  Confirmed through Pesepay',540,panelY+186,19,600,'#7c828a');text('support@opuszim.co.zw  ·  +263 773 979 162',540,panelY+225,18,400,'#717786');
 const gradient=c.createLinearGradient(40,0,1040,0);gradient.addColorStop(0,'#e52c2c');gradient.addColorStop(1,'#ff9500');c.fillStyle=gradient;c.fillRect(90,panelY+274,900,6);
 const final=document.createElement('canvas');final.width=1080;final.height=panelY+320;const output=final.getContext('2d')!;output.fillStyle='#f0f2f6';output.fillRect(0,0,1080,final.height);output.beginPath();output.roundRect(40,36,1000,final.height-72,40);output.clip();output.drawImage(canvas,0,0);
 const blob=await new Promise<Blob>((resolve,reject)=>final.toBlob(b=>b?resolve(b):reject(new Error('Receipt could not be generated.')),'image/png'));
 return new File([blob],`Opus-receipt-${(receipt.reference||receipt.id).replace(/[^a-z0-9-]/gi,'').slice(0,70)}.png`,{type:'image/png'});
}
