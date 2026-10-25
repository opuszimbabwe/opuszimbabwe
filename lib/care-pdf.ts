import {CARE_TARGETS,careDate,type CareSnapshot} from './care';

// Browser-side rendering keeps branded PDFs off the Workers CPU budget.
async function reportLogo(){
 let source='/images/logo-full.png';
 try{const r=await fetch('/api/content',{cache:'no-store'});if(r.ok){const b=await r.json();if(typeof b.settings?.navbar_logo==='string'&&b.settings.navbar_logo)source=b.settings.navbar_logo;}}catch{}
 async function raster(url:string){
  const response=await fetch(url);if(!response.ok)throw Error('Report logo unavailable.');
  const objectURL=URL.createObjectURL(await response.blob());
  try{
   const img=new Image();img.src=objectURL;await img.decode();
   if(!img.naturalWidth||!img.naturalHeight)throw Error('Report logo is invalid.');
   const scale=Math.min(1,720/img.naturalWidth,240/img.naturalHeight);
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Report image rendering is unavailable.');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',.9));
   if(!blob)throw Error('Report logo could not be rendered.');
   return new Uint8Array(await blob.arrayBuffer());
  }finally{URL.revokeObjectURL(objectURL);}
 }
 try{return await raster(source);}catch{if(source==='/images/logo-full.png')throw Error('The Opus logo could not be loaded. Please retry.');return raster('/images/logo-full.png');}
}
export async function carePDF(data:CareSnapshot):Promise<Uint8Array>{
 const [{PDFDocument,rgb},fontkit,regular,bold,logoBytes]=await Promise.all([
  import('pdf-lib'),import('@pdf-lib/fontkit'),
  fetch('/fonts/Poppins-Regular.ttf').then(r=>{if(!r.ok)throw Error('Report font unavailable.');return r.arrayBuffer();}),
  fetch('/fonts/Poppins-Bold.ttf').then(r=>{if(!r.ok)throw Error('Report font unavailable.');return r.arrayBuffer();}),reportLogo(),
 ]);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit.default);
 const [font,strong,logo]=await Promise.all([pdf.embedFont(regular,{subset:true}),pdf.embedFont(bold,{subset:true}),pdf.embedJpg(logoBytes)]);
 pdf.setTitle(`${data.project} — ${data.month} care report`);pdf.setAuthor('Opus Zimbabwe');
 const navy=rgb(15/255,9/255,40/255),muted=rgb(.4,.42,.48),orange=rgb(.91,.36,.16),grey=rgb(.9,.9,.92);
 let page=pdf.addPage([595.28,841.89]),y=710;
 const clean=(s:string)=>s.replace(/[\u0000-\u001f]/g,' ');
 const txt=(text:string,x:number,at:number,size=10,weight=false,color=navy)=>page.drawText(clean(text),{x,y:at,size,font:weight?strong:font,color});
 function header(){
  page.drawRectangle({x:0,y:833,width:595.28,height:9,color:orange});
  const scale=Math.min(155/logo.width,57/logo.height);page.drawImage(logo,{x:42,y:760,width:logo.width*scale,height:logo.height*scale});
  txt('PROJECT CARE REPORT',404,792,8,true,muted);txt(data.month,503,774,9,false,muted);
 }
 function lines(text:string,width:number,size=9.5){
  const out:string[]=[];let line='';
  for(let word of clean(text).split(/\s+/)){
   if(line&&font.widthOfTextAtSize(`${line} ${word}`,size)>width){out.push(line);line='';}
   while(font.widthOfTextAtSize(word,size)>width){let end=1;while(end<word.length&&font.widthOfTextAtSize(word.slice(0,end+1),size)<=width)end++;if(line){out.push(line);line='';}out.push(word.slice(0,end));word=word.slice(end);}
   if(word)line=line?`${line} ${word}`:word;
  }
  if(line)out.push(line);return out;
 }
 const fixedPara=(text:string,x:number,at:number,width:number,size=9.5)=>{const rows=lines(text,width,size);rows.forEach((s,i)=>txt(s,x,at-i*(size+5),size,false,muted));return at-rows.length*(size+5);};
 function nextPage(){page=pdf.addPage([595.28,841.89]);header();txt('Service detail',42,720,23,true);y=687;}
 function ensure(height:number){if(y-height<80)nextPage();}
 function paragraph(text:string,size=9.5){for(const row of lines(text,511,size)){ensure(size+5);txt(row,42,y,size,false,muted);y-=size+5;}y-=7;}
 function section(title:string){ensure(48);y-=12;txt(title.toUpperCase(),42,y,10,true);page.drawLine({start:{x:42,y:y-10},end:{x:553,y:y-10},thickness:.6,color:grey});y-=31;}
 function label(text:string){const rows=lines(text,511,10);ensure(rows.length*15+20);for(const row of rows){txt(row,42,y,10,true);y-=15;}y-=3;}
 const percentage=(n:number)=>n>0&&n<.1?'<0.1%':`${n.toFixed(1)}%`;
 header();
 txt(data.project,42,711,26,true);txt('Monthly performance & maintenance',42,686,12,false,muted);
 txt(`${careDate(data.period_start)} — ${careDate(data.period_end)}`,42,660,8.5,false,muted);
 txt(`Prepared ${careDate(data.generated_at)} · Zimbabwe time`,42,643,8.5,false,muted);
 const cards=[['Checks passed',data.sample_availability===null?'No data':`${data.sample_availability.toFixed(2)}%`],['Month coverage',percentage(data.coverage)],['Incidents',String(data.incidents)]];
 cards.forEach(([name,value],i)=>{const x=42+i*174;page.drawRectangle({x,y:535,width:162,height:80,color:rgb(.97,.97,.98)});txt(name,x+13,592,9,false,muted);txt(value,x+13,559,23,true);});
 txt('SERVICE RESULTS',42,505,10,true);y=479;
 txt('Service',42,y,8,true,muted);txt('Passed',272,y,8,true,muted);txt('Failed',371,y,8,true,muted);txt('Avg. response',449,y,8,true,muted);y-=25;
 for(const t of data.targets){txt(t.name,42,y,9.5,true);txt(`${t.successful}/${t.checks}`,272,y,9);txt(String(t.checks-t.successful),371,y,9);txt(t.average_ms===null?'No data':`${t.average_ms} ms`,449,y,9,false,muted);page.drawLine({start:{x:42,y:y-10},end:{x:553,y:y-10},thickness:.5,color:grey});y-=31;}
 txt('INCIDENT SUMMARY',42,310,10,true);
 fixedPara(`${data.incidents} incident${data.incidents===1?'':'s'} recorded during this period. ${data.open_incidents} unresolved at the end of the reporting period.`,42,287,511);
 txt('NEXT ACTIONS',42,239,10,true);y=216;
 for(const [i,action]of data.actions.slice(0,3).entries()){txt(`${i+1}.`,42,y,9,true,orange);y=fixedPara(action,59,y,490,9.3)-5;}
 fixedPara('Pass rate measures recorded checks only. Month coverage shows how much of the expected monitoring period was observed, including gaps before monitoring began. Detailed evidence and care notes follow.',42,108,511,8);

 nextPage();
 section('Reporting period & monitoring evidence');
 paragraph(`Period: ${careDate(data.period_start)} to ${careDate(data.period_end)} (Africa/Harare). Prepared: ${careDate(data.generated_at)}.`);
 paragraph(`${data.checks.toLocaleString()} recorded checks; ${data.successful.toLocaleString()} passed; ${(data.checks-data.successful).toLocaleString()} failed. ${data.expected.toLocaleString()} checks were expected across the full reporting period. ${Math.max(0,data.expected-data.checks).toLocaleString()} expected checks were not recorded.`);
 paragraph('Checks run every five minutes. Three adjacent failed checks open an incident; two adjacent successful checks close it. Unrecorded checks are monitoring gaps, not proof that a service was down. Response times measure the HTTP request, not the full browser page load.');
 section('Services checked');
 for(const target of data.targets){const endpoint=CARE_TARGETS.find(t=>t.name===target.name);label(target.name);if(endpoint)paragraph(endpoint.url,8.5);paragraph(`${target.successful} of ${target.checks} checks passed · ${target.checks-target.successful} failed · Average response: ${target.average_ms===null?'not available':`${target.average_ms} ms`}.`);}
 section('Maintenance & deployment record');
 if(!data.maintenance.length)paragraph('No maintenance work or deployments were recorded in this report snapshot.');
 for(const item of data.maintenance){label(`${careDate(item.created_at)} · ${item.category} · ${item.title}`);if(item.note)paragraph(item.note);}
 paragraph('This report includes the most recent eight maintenance, deployment, backup or note entries in its snapshot. The admin history remains the source for the wider record.',8);
 section('Incident record');
 if(!data.incidents)paragraph('No incidents were recorded during this reporting period.');
 else if(!data.incident_details?.length)paragraph(`${data.incidents} incidents were recorded. This older snapshot contains summary counts only; refresh an unapproved draft to include incident-level evidence.`);
 else{
  for(const incident of data.incident_details){label(`${CARE_TARGETS.find(t=>t.id===incident.target)?.name||incident.target} · ${incident.resolved_at&&Date.parse(incident.resolved_at)<Date.parse(data.period_end)?'Recovered':'Open at period end'}`);paragraph(`First failed check: ${careDate(incident.opened_at)}. ${incident.resolved_at&&Date.parse(incident.resolved_at)<Date.parse(data.period_end)?`Recovery confirmed: ${careDate(incident.resolved_at)}.`:'No recovery was confirmed within this reporting period.'}`);paragraph(incident.detail);}
  if(data.incidents>data.incident_details.length)paragraph(`Showing ${data.incident_details.length} of ${data.incidents} incidents. Review the admin history for the remaining records.`);
 }
 section('Protection & scope');
 paragraph(`Backups: ${data.backup_status}`);
 paragraph('HTTPS requests validate the certificate chain. Certificate expiry dates, independent backup recovery tests and browser journey checks are not currently collected. A backup note records human activity; it does not establish automated backup verification.');
 paragraph('Monitoring shares Cloudflare infrastructure with the website. A provider outage can interrupt both checks and notifications. Recorded results are evidence of sampled checks, not a continuous uptime or repair guarantee.');
 const pages=pdf.getPages();for(const [index,p]of pages.entries()){page=p;page.drawLine({start:{x:42,y:48},end:{x:553,y:48},thickness:.7,color:orange});txt('support@opuszim.co.zw',42,31,8,false,muted);txt(`${index+1} / ${pages.length}`,283,31,8,false,muted);txt('opuszim.co.zw',465,31,8,false,muted);}
 return pdf.save();
}
export function pdfBase64(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
export function downloadCarePDF(bytes:Uint8Array,month:string){const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`Opus-care-${month}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
