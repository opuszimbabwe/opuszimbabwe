import type {CareSnapshot} from './care';
// Runs only when the admin previews/approves a PDF. No paid rendering API or server CPU is required.
export async function carePDF(data:CareSnapshot):Promise<Uint8Array>{
 const [{PDFDocument,rgb},fontkit,regular,bold]=await Promise.all([
  import('pdf-lib'),import('@pdf-lib/fontkit'),
  fetch('/fonts/Poppins-Regular.ttf').then(r=>{if(!r.ok)throw Error('Report font unavailable.');return r.arrayBuffer();}),
  fetch('/fonts/Poppins-Bold.ttf').then(r=>{if(!r.ok)throw Error('Report font unavailable.');return r.arrayBuffer();}),
 ]);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit.default);
 const [font,strong]=await Promise.all([pdf.embedFont(regular,{subset:true}),pdf.embedFont(bold,{subset:true})]);
 pdf.setTitle(`${data.project} — ${data.month} care report`);pdf.setAuthor('Opus Zimbabwe');
 const page=pdf.addPage([595.28,841.89]),navy=rgb(15/255,9/255,40/255),muted=rgb(.4,.42,.48),orange=rgb(.91,.36,.16);
 const txt=(text:string,x:number,y:number,size=10,weight=false,color=navy)=>page.drawText(text.replace(/[\u0000-\u001f]/g,' '),{x,y,size,font:weight?strong:font,color});
 function lines(text:string,maxWidth:number,size=9.5){
  const words=text.split(/\s+/),out:string[]=[];let line='';
  for(const word of words){const next=line?`${line} ${word}`:word;if(font.widthOfTextAtSize(next,size)>maxWidth&&line){out.push(line);line=word;}else line=next;}if(line)out.push(line);return out;
 }
 const para=(text:string,x:number,y:number,width:number,size=9.5,max=3)=>{const list=lines(text,width,size);list.slice(0,max).forEach((s,i)=>txt(s,x,y-i*(size+5),size,false,muted));return y-Math.min(max,list.length)*(size+5);};
 page.drawRectangle({x:0,y:830,width:595.28,height:12,color:orange});
 txt('OPUS ZIMBABWE',42,790,13,true);txt('MONTHLY CARE',420,792,9,true,muted);
 txt(data.project,42,742,27,true);txt(`${data.month} / Service report`,42,716,11,false,muted);
 const generated=new Intl.DateTimeFormat('en-ZW',{timeZone:'Africa/Harare',dateStyle:'medium'}).format(new Date(data.generated_at));
 txt(`Prepared ${generated} · Zimbabwe time`,42,694,9,false,muted);
 const cards=[['Checks passed',data.sample_availability===null?'No data':`${data.sample_availability.toFixed(2)}%`],['Monitoring coverage',`${data.coverage.toFixed(1)}%`],['Incidents',String(data.incidents)]];
 cards.forEach(([label,value],i)=>{const x=42+i*174;page.drawRectangle({x,y:584,width:162,height:80,color:rgb(.97,.97,.98)});txt(label,x+13,641,9,false,muted);txt(value,x+13,608,23,true);});
 txt('SERVICE CHECKS',42,555,10,true);let y=530;
 for(const t of data.targets){txt(t.name,42,y,10,true);txt(t.checks?`${t.successful}/${t.checks} passed`:'No checks',274,y,9);txt(t.average_ms===null?'—':`${t.average_ms} ms avg.`,439,y,9,false,muted);page.drawLine({start:{x:42,y:y-10},end:{x:553,y:y-10},thickness:.5,color:rgb(.9,.9,.92)});y-=31;}
 txt('CARE RECORD',42,384,10,true);
 y=362;
 if(!data.maintenance.length)y=para('No maintenance work was recorded for this period.',42,y,511);
 else for(const item of data.maintenance.slice(0,3)){y=para(`${item.created_at.slice(0,10)} · ${item.title}`,42,y,511,9.5,2)-7;}
 y=Math.min(253,y-18);txt('NEXT ACTIONS',42,y,10,true);y-=22;
 for(const [i,action]of data.actions.slice(0,3).entries()){txt(`${i+1}.`,42,y,9,true,orange);y=para(action,59,y,490,9.3,2)-4;}
 para('Based on recorded checks, not a continuous uptime guarantee. Gaps are shown in coverage. HTTPS requests use certificate validation; certificate expiry dates are not collected. Backup verification is not connected.',42,112,511,8,3);
 page.drawLine({start:{x:42,y:48},end:{x:553,y:48},thickness:.7,color:orange});
 txt('support@opuszim.co.zw',42,31,8,false,muted);txt('opuszim.co.zw',465,31,8,false,muted);
 return pdf.save();
}
export function pdfBase64(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
export function downloadCarePDF(bytes:Uint8Array,month:string){const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`Opus-care-${month}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
