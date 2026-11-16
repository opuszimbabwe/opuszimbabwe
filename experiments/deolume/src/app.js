(() => {
  'use strict';
  const root=document.documentElement;
  root.classList.add('js-enabled');
  const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
  const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused=false, paused=reduced.matches, scrollQueued=false;
  const running=new Set();
  try{userPaused=sessionStorage.getItem('deolume_motion')==='paused'}catch{}
  const motion=()=>{
    paused=userPaused||reduced.matches;
    root.classList.toggle('motion-paused',paused);
    $$('.motion-toggle').forEach(button=>{button.textContent=reduced.matches?'Reduced motion enabled':userPaused?'Resume motion  ▷':'Pause motion  Ⅱ';button.setAttribute('aria-pressed',String(paused));button.disabled=reduced.matches;});
    if(paused)for(const animation of running)animation.finish();
    updateScroll();
  };
  const animate=(element,frames,options={})=>{
    if(paused||!element.animate)return;
    const animation=element.animate(frames,{duration:850,easing:'cubic-bezier(.22,1,.36,1)',...options});
    running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));return animation;
  };
  $$('.motion-toggle').forEach(button=>button.addEventListener('click',()=>{userPaused=!userPaused;try{sessionStorage.setItem('deolume_motion',userPaused?'paused':'running')}catch{}motion()}));
  reduced.addEventListener('change',motion);
  function railDistance(track){const pin=track.parentElement,style=getComputedStyle(pin);return Math.max(0,track.scrollWidth-pin.clientWidth+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight));}
  function updateScroll(){
    scrollQueued=false;
    const y=scrollY,height=innerHeight,max=document.documentElement.scrollHeight-height;
    root.style.setProperty('--page-progress',String(max>0?clamp(y/max):0));
    if(paused)return;
    $$('[data-shift]').forEach(element=>element.style.transform=`translateX(${Math.min(y,height)*Number(element.dataset.shift)}px)`);
    const scene=$('.motion-scene');
    if(scene){const rect=scene.getBoundingClientRect(),p=clamp(-rect.top/Math.max(1,rect.height-height));scene.style.setProperty('--stage-progress',String(p));scene.style.setProperty('--stage-scale',String(.95+.05*clamp(p*3)));}
    const service=$('.service-scroll'),track=$('.service-track');
    if(service&&track&&innerWidth>800){const rect=service.getBoundingClientRect(),p=clamp(-rect.top/Math.max(1,rect.height-height)),distance=railDistance(track);service.style.setProperty('--rail-x',String(distance*p));service.style.setProperty('--rail-progress',String(.05+p*.95));}
    $$('[data-parallax]').forEach(image=>{const r=image.parentElement.getBoundingClientRect();if(r.bottom>0&&r.top<height)image.style.setProperty('--parallax',String(-clamp((height-r.top)/(height+r.height))*r.height*.12));});
  }
  const queueScroll=()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll)}};
  addEventListener('scroll',queueScroll,{passive:true});addEventListener('resize',queueScroll,{passive:true});
  document.fonts?.ready.then(queueScroll);
  $('.service-track')?.addEventListener('focusin',event=>{if(innerWidth<=800||paused)return;const link=event.target.closest('.service-card');if(!link)return;const rect=link.getBoundingClientRect();if(rect.left<0||rect.right>innerWidth){const track=$('.service-track'),section=$('.service-scroll'),distance=Math.max(1,railDistance(track)),p=clamp((link.offsetLeft-track.firstElementChild.offsetLeft)/distance);scrollTo({top:section.offsetTop+p*(section.offsetHeight-innerHeight),behavior:'instant'});}});
  motion();
  $$('.hero-line>span').forEach((line,index)=>animate(line,[{opacity:0,transform:'translateY(70px) rotate(2deg)'},{opacity:1,transform:'translateY(0) rotate(0)'}],{duration:1100,delay:index*110}));
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){animate(entry.target,[{opacity:0,transform:'translateY(35px)'},{opacity:1,transform:'translateY(0)'}]);observer.unobserve(entry.target)}}),{threshold:.08});$$('[data-reveal]').forEach(element=>observer.observe(element));}
  // Native modal semantics, focus restoration, Escape and background scroll lock.
  const previousFocus=new WeakMap();
  function openDialog(dialog){if(!dialog||dialog.open)return;previousFocus.set(dialog,document.activeElement);dialog.showModal();root.style.overflow='hidden';if(dialog.id==='menu')$('.menu-toggle').setAttribute('aria-expanded','true');}
  function closeDialog(dialog){if(dialog?.open)dialog.close();}
  $$('dialog').forEach(dialog=>{
    dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))root.style.overflow='';if(dialog.id==='menu')$('.menu-toggle').setAttribute('aria-expanded','false');previousFocus.get(dialog)?.focus({preventScroll:true});queueScroll();});
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);});
  });
  $('.menu-toggle')?.addEventListener('click',()=>openDialog($('#menu')));
  $$('#menu a').forEach(link=>link.addEventListener('click',()=>closeDialog($('#menu'))));
  $$('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog(document.getElementById(button.dataset.close))));
  $$('[data-open]').forEach(button=>button.addEventListener('click',()=>openDialog(document.getElementById(button.dataset.open))));
  // Only essential preference storage is installed. No third-party tracking.
  const consentExists=()=>document.cookie.split(';').some(c=>c.trim().startsWith('deolume_consent='));
  const cookieNotice=$('.cookie-notice');if(cookieNotice&&!consentExists())cookieNotice.hidden=false;
  $$('[data-consent]').forEach(button=>button.addEventListener('click',()=>{document.cookie='deolume_consent=essential; Path=/; Max-Age=15552000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');cookieNotice.hidden=true;closeDialog($('#cookie-dialog'));}));
  $$('[data-cookie-settings]').forEach(button=>button.addEventListener('click',()=>openDialog($('#cookie-dialog'))));
  // Track galleries use native scrolling and remain touch/keyboard operable.
  const behavior=()=>paused?'instant':'smooth';
  function slideStep(track){const first=[...track.children].find(e=>!e.hidden);return first?first.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||'0'):track.clientWidth*.8;}
  function scrollRail(id,direction){const track=document.getElementById(id);if(track)track.scrollBy({left:direction*slideStep(track),behavior:behavior()});}
  $$('[data-rail-prev]').forEach(button=>button.addEventListener('click',()=>scrollRail(button.dataset.railPrev,-1)));
  $$('[data-rail-next]').forEach(button=>button.addEventListener('click',()=>scrollRail(button.dataset.railNext,1)));
  function updateRail(track){
    const prev=$(`[data-rail-prev="${track.id}"]`),next=$(`[data-rail-next="${track.id}"]`);
    if(prev)prev.disabled=track.scrollLeft<5;
    if(next)next.disabled=track.scrollLeft>=track.scrollWidth-track.clientWidth-5;
    if(track.id==='property-slides'){const box=track.getBoundingClientRect(),center=box.left+box.width/2;let index=0,distance=Infinity;[...track.children].forEach((slide,i)=>{const r=slide.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-center);if(d<distance){distance=d;index=i}});$$('[data-slide]').forEach(button=>{const active=Number(button.dataset.slide)===index;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});}
  }
  $$('.poster-rail,.property-slides').forEach(track=>{let queued=false;track.addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(()=>{updateRail(track);queued=false})}},{passive:true});addEventListener('resize',()=>updateRail(track),{passive:true});updateRail(track);});
  $$('[data-slide]').forEach(button=>button.addEventListener('click',()=>{const track=$('#property-slides'),children=[...track.children],index=Number(button.dataset.slide);track.scrollTo({left:children[index].offsetLeft-children[0].offsetLeft,behavior:behavior()});}));
  $$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const category=button.dataset.filter;$$('[data-filter]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});$$('[data-category]').forEach(item=>{item.hidden=category!=='all'&&item.dataset.category!==category;if(!item.hidden)animate(item,[{opacity:0,translate:'0 15px'},{opacity:1,translate:'0 0'}],{duration:450});});const track=$('#poster-rail');track.scrollLeft=0;requestAnimationFrame(()=>updateRail(track));}));
  // Full-size work and original concept presentations, with clear provenance.
  const arrow='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';
  const projects={prime:{title:'Prime Property.',category:'Opus Zimbabwe portfolio / Web experience',description:'A corporate website for Prime Property Investment & Development Group, a Zimbabwean property investment and development business. The project brings the company’s story, portfolio and enquiry journey into one considered web presence.',image:'prime.webp',alt:'Prime Property corporate website',href:'/property-construction/',cta:'Explore property & construction'},forge:{title:'Forgepoint.',category:'Opus Zimbabwe portfolio / Web experience',description:'A website project that brings a clear business presentation and a confident visual identity together. This existing Opus Zimbabwe portfolio piece shows how design and development can work as one.',image:'forgepoint.webp',alt:'Forgepoint website design',href:'/digital/',cta:'Explore digital experiences'}};
  const projectContent=$('#project-content');
  $$('[data-project]').forEach(button=>button.addEventListener('click',()=>{const item=projects[button.dataset.project];if(!item)return;projectContent.innerHTML=`<p class="eyebrow">${item.category}</p><h2>${item.title}</h2><p>${item.description}</p><img src="/assets/${item.image}" alt="${item.alt}" width="1200" height="780"><a class="underlink" href="${item.href}">${item.cta} ${arrow}</a>`;openDialog($('#project-dialog'));}));
  const concepts={mark:{title:'Make your mark.',category:'Identity exploration',poster:'poster-type',art:'MAKE<br>YOUR<br>MARK.',description:'A bold typographic identity study. A warm signal colour, strong hierarchy and a simple graphic shape create a visual language that can scale across a brand.'},signal:{title:'Signal over noise.',category:'Campaign direction',poster:'poster-signal',art:'SIGNAL<br>OVER<br>NOISE.',description:'A campaign concept built around an uncomplicated message and a high-contrast visual system. Clear typography and a distinctive graphic symbol do the heavy lifting.',symbol:'✱'},form:{title:'In good form.',category:'Editorial design',poster:'poster-form',art:'F<br>O<br>R<br>M.',description:'An editorial study in rhythm, space and proportion. Restrained colour and vertical typography give an ordinary word a different way to be seen.'},bloom:{title:'Room to bloom.',category:'Identity exploration',poster:'poster-bloom',art:'BLOOM',description:'A playful identity direction with a warm palette, expressive scale and a graphic flourish. The system explores how a brand can feel optimistic without losing clarity.',symbol:'✱'},less:{title:'Less, but louder.',category:'Campaign direction',poster:'poster-less',art:'LESS.<br>BUT<br>LOUDER.',description:'A campaign study about saying one thing well. An edited palette and oversized type focus attention on the message rather than the decoration.'}};
  $$('[data-concept]').forEach(button=>button.addEventListener('click',()=>{const item=concepts[button.dataset.concept];if(!item)return;projectContent.innerHTML=`<div class="concept-dialog-grid"><div class="poster ${item.poster}" aria-hidden="true"><b>${item.art}</b>${item.symbol?`<i>${item.symbol}</i>`:''}<span>Deolume / Original concept study</span></div><div><p class="eyebrow">${item.category} / Concept study</p><h2>${item.title}</h2><p>${item.description}</p><p class="caption">An original Deolume exploration, not a commissioned client project.</p><a class="underlink" href="/contact/?service=Brand%20%26%20graphic%20design">Explore a direction for your brand ${arrow}</a></div></div>`;openDialog($('#project-dialog'));}));
  // Digital service tabs support automatic selection with arrow/Home/End keys.
  const tabs=$$('[data-tab]');
  function selectTab(button){tabs.forEach(other=>{const selected=other===button;other.setAttribute('aria-selected',String(selected));other.tabIndex=selected?0:-1;const panel=document.getElementById('panel-'+other.dataset.tab);panel.hidden=!selected;panel.tabIndex=0;});}
  tabs.forEach((button,index)=>{button.addEventListener('click',()=>selectTab(button));button.addEventListener('keydown',event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();selectTab(tabs[next]);tabs[next].focus();});});
  // The form prepares a real email/WhatsApp draft; it never claims server delivery.
  const form=$('#enquiry-form');
  if(form){
    const service=new URLSearchParams(location.search).get('service');if(service&&[...form.elements.service.options].some(o=>o.value===service))form.elements.service.value=service;
    function prepare(channel){
      for(const key of ['name','email','message'])form.elements[key].value=form.elements[key].value.trim();
      if(!form.reportValidity())return;
      const values=new FormData(form),name=String(values.get('name')).trim(),email=String(values.get('email')).trim(),service=String(values.get('service')),message=String(values.get('message')).trim();
      const text=`Hello Opus Zimbabwe / Deolume team,\n\nMy name is ${name}.\nEmail: ${email}\nInterested in: ${service}\n\n${message}`;
      const href=channel==='whatsapp'?'https://wa.me/263776396530?text='+encodeURIComponent(text):'mailto:admin@opuszim.co.zw?subject='+encodeURIComponent('Project enquiry — '+service)+'&body='+encodeURIComponent(text);
      const status=$('.form-status',form);status.hidden=false;status.replaceChildren(document.createTextNode('Your enquiry is prepared. Review and send it in your '+(channel==='whatsapp'?'WhatsApp':'email')+' app. '));const link=document.createElement('a');link.href=href;link.textContent=channel==='whatsapp'?'Open WhatsApp draft ↗':'Open email draft ↗';if(channel==='whatsapp'){link.target='_blank';link.rel='noopener noreferrer'}status.append(link);
      if(channel==='whatsapp')window.open(href,'_blank','noopener,noreferrer');else location.href=href;
    }
    form.addEventListener('submit',event=>{event.preventDefault();prepare('email')});$('#enquiry-whatsapp').addEventListener('click',()=>prepare('whatsapp'));
  }
  // Optional desktop cursor is decorative. Touch and keyboard keep native controls.
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){const cursor=$('.cursor-label');let x=0,y=0,queued=false;document.addEventListener('pointermove',event=>{x=event.clientX;y=event.clientY;if(!queued){queued=true;requestAnimationFrame(()=>{cursor.style.transform=`translate(${x-48}px,${y-48}px)`;queued=false})}});document.addEventListener('pointerover',event=>{const target=event.target.closest?.('[data-cursor]');cursor.classList.toggle('visible',!!target&&!paused);if(target)cursor.firstChild.textContent=target.dataset.cursor+' ';});document.addEventListener('pointerleave',()=>cursor.classList.remove('visible'));}
  document.addEventListener('visibilitychange',()=>{root.classList.toggle('page-hidden',document.hidden);for(const animation of running)document.hidden?animation.pause():animation.play();});
  addEventListener('pageshow',()=>{root.style.overflow='';queueScroll()});
})();
