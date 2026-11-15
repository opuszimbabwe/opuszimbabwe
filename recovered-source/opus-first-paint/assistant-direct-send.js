(() => {
  if (window.__opusDirectSend) return;
  window.__opusDirectSend = true;
  let pending = null;
  let timer = null;
  function queue(message) {
    const text = typeof message === 'string' ? message.trim() : '';
    if (!text) return;
    pending = {text, deadline:performance.now()+4000};
    clearTimeout(timer);
    timer = setTimeout(attempt, 0);
  }
  function attempt() {
    timer = null;
    const intent = pending;
    if (!intent) return;
    if (performance.now() > intent.deadline) { pending=null; return; }
    const form = document.querySelector('.assistant-panel .assistant-composer');
    const input = form?.querySelector('textarea');
    if (input && !input.disabled && input.value.trim() === intent.text) {
      pending = null;
      form.requestSubmit();
      return;
    }
    timer=setTimeout(attempt,25);
  }
  document.addEventListener('opus-open-assistant', event => queue(event.detail?.query));
  document.addEventListener('click', event => {
    const target=event.target instanceof Element ? event.target.closest('.assistant-suggestions button') : null;
    if (target) queue(target.textContent);
  },true);
  document.addEventListener('submit', event => {
    if(event.target.matches?.('.assistant-composer')){ pending=null;clearTimeout(timer); }
  },true);
})();
