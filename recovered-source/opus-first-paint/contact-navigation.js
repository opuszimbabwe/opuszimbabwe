(() => {
 if(window.__opusContactNavigation)return;window.__opusContactNavigation=true;
 let landingPending=false;
 function land(){
  if(!landingPending||location.pathname.replace(/\/$/,'')!=='/contact')return;
  const target=document.getElementById('enquiry-form');
  if(!target||document.querySelector('.site-content')?.getAttribute('aria-busy')!=='false')return;
  landingPending=false;setTimeout(()=>requestAnimationFrame(()=>{if(target.isConnected)target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}),180);
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target instanceof Element?event.target.closest('a[href]'):null;if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
  let url;try{url=new URL(link.href)}catch{return}
  if(url.origin!==location.origin||url.pathname.replace(/\/$/,'')!=='/contact'||url.search)return;
  if(url.hash&&url.hash!=='#enquiry-form')return;
  landingPending=true;
  if(location.pathname.replace(/\/$/,'')==='/contact'){event.preventDefault();land();}
 },true);
 document.addEventListener('DOMContentLoaded',()=>{if(location.pathname.replace(/\/$/,'')==='/contact'&&location.hash==='#enquiry-form')landingPending=true;land();});
 const observe=()=>new MutationObserver(land).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-busy']});
 if(document.documentElement)observe();else document.addEventListener('DOMContentLoaded',observe,{once:true});
})();
