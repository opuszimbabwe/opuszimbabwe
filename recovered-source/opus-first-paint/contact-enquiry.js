(() => {
 if(window.__opusContactEnquiry)return;window.__opusContactEnquiry=true;
 const busy=new WeakSet(),attempts=new Map();
 const request=async(url,options={})=>{const r=await fetch(url,{...options,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)});const data=await r.json().catch(()=>null);if(!r.ok||!data)throw Error(data?.error||'Your enquiry could not be confirmed. Your details are still here; please retry.');return data;};
 document.addEventListener('opus-submit-enquiry',async event=>{
  const d=event.detail||{},button=d.button;if(!(button instanceof HTMLButtonElement)||busy.has(button))return;
  const root=button.closest('#enquiry-form,.contact-details-body');if(!root)return;
  const status=root.querySelector('.opus-enquiry-status');
  const notice=(text,error=false)=>{if(status){status.textContent=text;status.dataset.error=String(error);}};
  const name=String(d.name||'').trim(),email=String(d.email||'').trim(),phone=String(d.phone||'').trim(),message=String(d.message||'').trim(),service=String(d.service||'').trim(),domain=String(d.domain||'').trim();
  if(!name){notice('Please enter your name or organisation.',true);root.querySelector('input[name="name"]')?.focus();return;}
  const emailInput=root.querySelector('input[name="email"]');if(!email||!emailInput?.checkValidity()){notice('Please enter a valid email address so our team can reply.',true);emailInput?.focus();return;}
  if(!message){notice('Please tell us what you need.',true);root.querySelector('textarea[name="message"]')?.focus();return;}
  if(name.length>120||email.length>254||phone.length>30||message.length>2000||service.length>180||domain.length>253){notice('Some details are too long. Please shorten them and retry.',true);return;}
  busy.add(button);button.disabled=true;button.textContent='Sending enquiry…';notice('Sending securely to the Opus team…');
  try{
   const body=['Website enquiry','',`Name: ${name}`,`Email: ${email}`,phone?`Phone: ${phone}`:'',service?`Service: ${service}`:'',domain?`Domain: ${domain}`:'','',message].filter((v,i,a)=>v!==''||i===1||a[i-1]!=='').join('\n');
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body)))].map(x=>x.toString(16).padStart(2,'0')).join('');
   let id=attempts.get(hash);if(!id){try{const prior=JSON.parse(sessionStorage.getItem('opus-contact-attempt')||'null');if(prior?.hash===hash&&Date.now()-prior.time<86400000)id=prior.id;}catch{}}
   if(!id)id=crypto.randomUUID();attempts.set(hash,id);try{sessionStorage.setItem('opus-contact-attempt',JSON.stringify({hash,id,time:Date.now()}));}catch{}
   if(window.__opusWebsiteSend)await window.__opusWebsiteSend({name,id,body});else{const session=await request('/api/chat/session');if(!session.session)await request('/api/chat/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name})});await request('/api/chat/messages',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,body})});}
   button.textContent='Enquiry sent';notice('Your enquiry has been sent to the Opus Website Inbox. Our team will respond using the contact details you supplied.');
  }catch(error){button.textContent='Retry sending enquiry';notice(error.message,true);}finally{busy.delete(button);button.disabled=false;}
 });
 document.addEventListener('input',event=>{const root=event.target instanceof Element?event.target.closest('#enquiry-form,.contact-details-body'):null;const button=root?.querySelector('.opus-send-enquiry');if(button&&!busy.has(button))button.textContent='Send enquiry';});
})();
