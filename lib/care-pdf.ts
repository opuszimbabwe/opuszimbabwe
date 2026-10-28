import {clientCareText,clientActivity} from './care-report-language';
import {CARE_TARGETS,CARE_PDF_VERSION,careOutcome,careDate,type CareSnapshot} from './care';

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
export async function carePDF(data:CareSnapshot,edition=1):Promise<Uint8Array>{
 const [{PDFDocument,rgb},fontkit,regular,bold,logoBytes]=await Promise.all([
  import('pdf-lib'),import('@pdf-lib/fontkit'),
  fetch('/fonts/Poppins-Regular.ttf').then(r=>{if(!r.ok)throw Error('Report font unavailable.');return r.arrayBuffer();}),
  fetch('/fonts/Poppins-Bold.ttf').then(r=>{if(!r.ok)throw Error('Report font unavailable.');return r.arrayBuffer();}),reportLogo(),
 ]);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit.default);
 const [font,strong,logo]=await Promise.all([pdf.embedFont(regular,{subset:true}),pdf.embedFont(bold,{subset:true}),pdf.embedJpg(logoBytes)]);
 pdf.setTitle(`${data.project} — ${data.month} care report`);pdf.setAuthor('Opus Zimbabwe');pdf.setSubject(`Opus care design ${CARE_PDF_VERSION}`);
 const navy=rgb(15/255,9/255,40/255),muted=rgb(.4,.42,.48),orange=rgb(.91,.36,.16),grey=rgb(.9,.9,.92),green=rgb(.09,.44,.29),red=rgb(.72,.15,.2),amber=rgb(.6,.36,.07),pale=rgb(.96,.965,.975);
 const tones={passed:{ink:green,fill:rgb(.91,.97,.94)},failed:{ink:red,fill:rgb(1,.93,.93)},review:{ink:amber,fill:rgb(1,.97,.9)},neutral:{ink:muted,fill:pale}};
 let page=pdf.addPage([595.28,841.89]),y=710;
 const clean=(s:string)=>clientCareText(s).replace(/[\u0000-\u001f]/g,' ');
 const txt=(text:string,x:number,at:number,size=10,weight=false,color=navy)=>page.drawText(clean(text),{x,y:at,size,font:weight?strong:font,color});
 function rounded(x:number,at:number,w:number,h:number,r:number,color:ReturnType<typeof rgb>){
  r=Math.min(r,w/2,h/2);page.drawRectangle({x:x+r,y:at,width:w-2*r,height:h,color});page.drawRectangle({x,y:at+r,width:w,height:h-2*r,color});
  for(const [cx,cy] of [[x+r,at+r],[x+w-r,at+r],[x+r,at+h-r],[x+w-r,at+h-r]])page.drawCircle({x:cx,y:cy,size:r,color});
 }
 function header(){
  const scale=Math.min(174/logo.width,60/logo.height);page.drawImage(logo,{x:42,y:761,width:logo.width*scale,height:logo.height*scale});
  rounded(414,776,139,30,10,pale);txt('PROJECT CARE',432,787,9,true,navy);txt(`${data.month} / EDITION ${edition}`,440,762,8,false,muted);
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
 function section(title:string){ensure(112);y-=12;rounded(42,y-12,511,30,8,pale);txt(title.toUpperCase(),54,y,9.5,true);y-=36;}
 function label(text:string){const rows=lines(text,511,10);ensure(rows.length*15+45);for(const row of rows){txt(row,42,y,10,true);y-=15;}y-=3;}
 const percentage=(n:number)=>n>0&&n<.1?'<0.1%':`${n.toFixed(1)}%`;
 header();
 txt('Monthly care report',42,710,28,true);txt(data.project,42,685,12,false,muted);
 rounded(42,634,511,32,10,pale);txt(`${careDate(data.period_start)} — ${careDate(data.period_end)}`,54,646,8.5,false,muted);
 const cards=[['Checks passed',data.sample_availability===null?'No data':`${data.sample_availability.toFixed(2)}%`],['Month coverage',percentage(data.coverage)],['Incidents / open',`${data.incidents} / ${data.open_incidents}`]];
 cards.forEach(([name,value],i)=>{const x=42+i*174;rounded(x,528,163,87,15,pale);txt(name,x+15,590,9,false,muted);txt(value,x+15,552,25,true,i===0&&data.checks?data.successful===data.checks?green:red:i===2&&data.open_incidents?red:navy);});
 const result=careOutcome(data),tone=tones[result.kind];
 rounded(42,429,511,79,14,tone.fill);txt('FINAL CHECK RESULT',58,488,8,true,tone.ink);txt(result.title,58,465,15,true,tone.ink);fixedPara(result.detail,58,447,475,8.3);
 txt('SERVICE RESULTS',42,402,10,true);rounded(42,362,511,25,8,pale);
 for(const [name,x]of [['Service',54],['Final status',226],['Passed',351],['Failed',414],['Avg. ms',478]] as const)txt(name,x,371,8,true,muted);
 y=339;
 for(const t of data.targets){
  const target=CARE_TARGETS.find(x=>x.name===t.name),last=data.latest_checks?.find(c=>c.target===target?.id);
  const status=!t.checks?'neutral':last?last.ok?'passed':'failed':t.checks===t.successful?'passed':'review';
  const title=!t.checks?'No data':last?last.ok?t.successful<t.checks?'Recovered':'Passed':'Failed':t.successful===t.checks?'Passed':'Review';
  const color=tones[status];
  txt(t.name,54,y,9.3,true);rounded(224,y-7,92,20,9,color.fill);txt(title,236,y,8,true,color.ink);
  txt(`${t.successful}/${t.checks}`,351,y,9,false,t.successful?green:muted);txt(String(t.checks-t.successful),414,y,9,t.checks!==t.successful,t.checks!==t.successful?red:muted);txt(t.average_ms===null?'—':String(t.average_ms),478,y,9,false,muted);
  page.drawLine({start:{x:54,y:y-16},end:{x:541,y:y-16},thickness:.5,color:grey});y-=40;
 }
 rounded(42,91,511,74,12,pale);txt('READING THIS REPORT',57,144,8,true,navy);
 fixedPara('Green records passed or recovered checks; red records failures. The final result reflects recorded evidence, while historical failures stay visible. Low month coverage can include time before monitoring began.',57,126,479,8);
 txt(`Prepared ${careDate(data.generated_at)} · Africa/Harare`,42,72,8,false,muted);

 nextPage();
 section('Reporting period & monitoring evidence');
 paragraph(`Period: ${careDate(data.period_start)} to ${careDate(data.period_end)} (Africa/Harare). Prepared: ${careDate(data.generated_at)}.`);
 paragraph(`${data.checks.toLocaleString()} recorded checks; ${data.successful.toLocaleString()} passed; ${(data.checks-data.successful).toLocaleString()} failed. ${data.expected.toLocaleString()} checks were expected across the full reporting period. ${Math.max(0,data.expected-data.checks).toLocaleString()} expected checks were not recorded.`);
 paragraph('Checks run every five minutes. Three adjacent failed checks open an incident; two adjacent successful checks close it. Unrecorded checks are monitoring gaps, not proof that a service was down. Response times measure the HTTP request, not the full browser page load.');
 section('Final recorded service checks');
 for(const target of data.targets){
  const endpoint=CARE_TARGETS.find(t=>t.name===target.name),last=data.latest_checks?.find(c=>c.target===endpoint?.id);
  label(target.name);if(endpoint)paragraph(endpoint.url,8.5);
  const status=last?(last.ok?'PASSED':'FAILED'):target.checks===0?'NO DATA':target.checks===target.successful?'ALL RECORDED CHECKS PASSED':'REVIEW HISTORICAL FAILURES';
  ensure(45);const color=last?!last.ok?red:green:target.checks===target.successful&&target.checks?green:amber;txt(status,42,y,8.5,true,color);y-=17;
  paragraph(last?`${careDate(last.checked_at)} · HTTP ${last.status??'unavailable'} · ${last.latency_ms} ms. ${last.detail}`:`${target.successful} of ${target.checks} checks passed. Final check details were not captured in this older snapshot.`);
 }
 if(data.repository_events?.length){
  section('Website updates & release checks');
  for(const event of data.repository_events){const activity=clientActivity(event);label(`${careDate(event.occurred_at)} / ${activity.label}`);ensure(30);txt(activity.result,42,y,9,true,event.status==='success'?green:['failure','error'].includes(event.status)?red:muted);y-=20;paragraph(`Record ${event.commit_sha.slice(0,7)}`,8);}
  paragraph('Software updates and publication results are separate from website availability. Detailed technical records are retained by Opus.',8);
 }
 if(data.release_issue_totals?.total){
  section('Issues & verified resolutions');
  for(const issue of data.release_issues||[]){
   ensure(80);txt('FAILURE RECORDED',42,y,9,true,red);y-=19;paragraph(careDate(issue.opened_at));paragraph(issue.detail);
   if(issue.resolved_at){ensure(55);txt('RESOLVED',42,y,9,true,green);y-=19;paragraph(`${careDate(issue.resolved_at)} / ${issue.resolution_detail||'A successful publication check was verified.'}`);paragraph(`Verified update ${issue.resolution_commit?.slice(0,7)||''}`,8);}
   else {ensure(30);txt('NEEDS ATTENTION',42,y,9,true,red);y-=19;paragraph('Successful publication has not yet been verified.');}
  }
  paragraph(`Showing ${data.release_issues?.length||0} of ${data.release_issue_totals.total} recorded issues relevant to this period.`,8);
  label(data.release_issue_totals.open?`${data.release_issue_totals.open} publication issue(s) need attention.`:'All recorded publication issues resolved.');
  paragraph('Original failures remain in the record. A saved software update alone does not establish successful publication.',8);
 }
 section('Maintenance & deployment record');
 if(!data.maintenance.length)paragraph('No maintenance work or deployments were recorded in this report snapshot.');
 for(const item of data.maintenance){ensure(90);txt(`${careDate(item.created_at)} / ${item.category.toUpperCase()}`,42,y,8,true,muted);y-=19;label(item.title);if(item.note)paragraph(item.note);}
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
 paragraph('Monitoring uses shared service infrastructure. A provider outage can interrupt both checks and notifications. Recorded results are evidence of sampled checks, not a continuous uptime or repair guarantee.');
 section('Next actions');for(const [i,action]of data.actions.entries()){label(`0${i+1}`);paragraph(action);}
 const pages=pdf.getPages();for(const [index,p]of pages.entries()){page=p;rounded(32,19,531,33,10,pale);rounded(42,27,3,17,1.5,orange);txt('support@opuszim.co.zw',55,31,8,false,muted);txt(`${index+1} / ${pages.length}`,285,31,8,false,muted);txt('opuszim.co.zw',465,31,8,false,muted);}
 return pdf.save();
}
export function pdfBase64(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
export function downloadCarePDF(bytes:Uint8Array,month:string,edition=1){const url=URL.createObjectURL(new Blob([bytes as BlobPart],{type:'application/pdf'}));const a=document.createElement('a');a.href=url;a.download=`Opus-care-${month}-edition-${edition}.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
