(() => {
 if(window.__opusRailOpen)return;window.__opusRailOpen=true;
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0)return;
  const tab=event.target instanceof Element?event.target.closest('.contact-rail[data-collapsed="true"] .rail-brand-tab'):null;
  if(!tab)return;
  // Leave the existing click handler in place: it expands the rail. Opening
  // the assistant here adds the requested single-click action without a query.
  document.dispatchEvent(new Event('opus-open-assistant'));
  requestAnimationFrame(()=>document.querySelector('.assistant-panel textarea:not(:disabled)')?.focus({preventScroll:true}));
 },true);
})();
