(()=>{
 'use strict';
 if(window.__opusCookiePreferences||window.top!==window.self)return;
 const hosts=['opuszim.co.zw','www.opuszim.co.zw','payments.opuszim.co.zw'];
 if(!hosts.includes(location.hostname))return;
 window.__opusCookiePreferences=true;
 const name='__Secure-opus_cookie_choice',value='v1.essential',maxAge=15552000;
 const saved=()=>document.cookie.split(';').some(p=>p.trim()===name+'='+value);
 let expanded=false,closed=false,host,root;
 function save(){
  try{document.cookie=name+'='+value+'; Domain=opuszim.co.zw; Path=/; Max-Age='+maxAge+'; Secure; SameSite=Lax';if(!saved())throw Error('not saved');closed=true;expanded=false;render()}catch{render('Your browser could not save this preference. You can still use the website.');}
 }
 function centre(){if(!host)return;const v=window.visualViewport;host.style.left=((v?.offsetLeft||0)+(v?.width||innerWidth)/2)+'px';host.style.top=((v?.offsetTop||0)+(v?.height||innerHeight)/2)+'px';host.style.setProperty('--opus-cookie-visible-height',(v?.height||innerHeight)+'px');}
 function ensureFooterLink(){const footer=document.querySelector('.opus-pay-footer')||document.querySelector('footer#footer')||document.querySelector('body > footer');if(!footer||footer.querySelector('[data-opus-cookie-settings]'))return;const button=document.createElement('button');button.type='button';button.dataset.opusCookieSettings='true';button.textContent=footer.matches('.opus-pay-footer')?'Cookies':'Cookie preferences';button.setAttribute('aria-label','Open cookie preferences');button.style.cssText='font:inherit;color:inherit;background:none;border:0;padding:0 3px;text-decoration:underline;cursor:pointer';button.addEventListener('click',()=>{expanded=true;render();root.querySelector('.primary')?.focus({preventScroll:true})});const target=footer.matches('.opus-pay-footer')?(footer.querySelector('small')||footer):footer;if(target!==footer){const separator=document.createElement('span');separator.textContent=' · ';separator.setAttribute('aria-hidden','true');target.append(separator)}target.append(button);}
 function render(message=''){
  if(!root)return;
  const show=expanded||(!saved()&&!closed);
  host.hidden=!show;centre();
  if(!show){root.replaceChildren();return;}
  root.innerHTML=`<style>
:host{position:fixed;z-index:210;left:50%;top:50%;transform:translate(-50%,-50%);width:min(390px,calc(100vw - 32px));font-family:Poppins,Arial,sans-serif;color:#20242d;font-size:12px;line-height:1.6}*{box-sizing:border-box}button,a{-webkit-tap-highlight-color:transparent}button{font:600 12px Poppins,Arial,sans-serif;cursor:pointer}button:focus-visible,a:focus-visible{outline:2px solid #c33d31;outline-offset:3px}.panel{position:relative;width:100%;max-height:calc(var(--opus-cookie-visible-height,100dvh) - 32px);overflow:auto;padding:23px;background:#fff;border:1px solid #e4e6eb;border-radius:18px;box-shadow:0 12px 38px #25304426}.panel h2{font-size:17px;line-height:1.4;margin:0 28px 12px 0;font-weight:700}.panel p{font-size:12px;color:#5f6774;margin:0 0 12px}.close{position:absolute;right:14px;top:10px;padding:6px;border:0;background:none;color:#6d7581;font-size:23px;line-height:1}.actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.primary{padding:11px 15px;background:#151617;color:#fff;border:0;border-radius:9px}.secondary{padding:8px 4px;border:0;background:none;color:#535c69;text-decoration:underline}.category{display:flex;justify-content:space-between;align-items:center;gap:14px;border-top:1px solid #edf0f3;padding:10px 0}.category span{font-size:11px;color:#6b7380}.category strong{font-size:12px}.links{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0 0}a{color:#535c69;font-size:11px;text-decoration:underline}.status{font-size:11px;color:#435348;margin:10px 0 0}.shared{font-size:10px!important;color:#7b8390!important;margin:12px 0!important}@media(max-width:600px){:host{width:min(360px,calc(100vw - 28px))}.panel{padding:19px}.panel h2{font-size:16px}}
</style>${show?`<section class="panel" role="dialog" aria-label="Cookie preferences"><button class="close" type="button" aria-label="Close cookie preferences">×</button><h2>${expanded?'Cookie preferences':'Your cookie choice'}</h2><p>We use essential cookies and browser storage for security, chat and checkout. No advertising cookies are enabled.</p><p>Cloudflare also provides cookieless website performance and usage measurements.</p>${expanded?'<div class="category"><strong>Essential cookies</strong><span>Required for these functions</span></div><div class="category"><strong>Optional tracking cookies</strong><span>Not in use</span></div>':''}<p class="shared">One preference for the Opus Zimbabwe website and Opus Pay. Saved for 180 days; no payment details are stored in this shared cookie.</p><div class="actions"><button type="button" class="primary">${expanded?'Save essential-only preference':'Use essential only'}</button>${expanded?'':'<button type="button" class="secondary">Cookie details</button>'}</div><div class="links"><a href="/cookie-policy/">Cookie notice</a><a href="/privacy/">Privacy policy</a></div>${message?'<p class="status" role="status"></p>':''}</section>`:''}`;

  const status=root.querySelector('.status');if(status)status.textContent=message;
  root.querySelector('.primary')?.addEventListener('click',save);
  root.querySelector('.secondary')?.addEventListener('click',()=>{expanded=true;render()});
  root.querySelector('.close')?.addEventListener('click',()=>{closed=true;expanded=false;render()});

 }
 function mount(){
  if(document.getElementById('opus-cookie-preferences'))return;
  host=document.createElement('div');host.id='opus-cookie-preferences';root=host.attachShadow({mode:'open'});document.body.append(host);ensureFooterLink();render();
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){closed=true;expanded=false;render();document.querySelector('[data-opus-cookie-settings]')?.focus({preventScroll:true})}});
  new MutationObserver(ensureFooterLink).observe(document.body,{subtree:true,childList:true});
  window.addEventListener('resize',centre);window.visualViewport?.addEventListener('resize',centre);window.visualViewport?.addEventListener('scroll',centre);
  window.addEventListener('pageshow',()=>render());
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render()});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,250),{once:true});else setTimeout(mount,250);
})();
