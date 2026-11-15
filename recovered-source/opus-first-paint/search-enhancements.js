(() => {
  if (window.__opusSearchEnhancements) return;
  window.__opusSearchEnhancements = true;
  const signatures = new WeakMap();
  let scheduled = false;
  function markText(node, query) {
    const text = node.textContent || '';
    const signature = query + '\u0000' + text;
    if (signatures.get(node) === signature) return;
    signatures.set(node, signature);
    const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))].sort((a,b) => b.length-a.length);
    if (!terms.length) { if (node.querySelector('mark')) node.textContent = text; return; }
    const pattern = new RegExp(terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
    const fragment = document.createDocumentFragment();
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      fragment.append(text.slice(last, match.index));
      const mark = document.createElement('mark'); mark.className = 'opus-search-match'; mark.textContent = match[0]; fragment.append(mark);
      last = match.index + match[0].length;
    }
    fragment.append(text.slice(last)); node.replaceChildren(fragment);
  }
  function update() {
    scheduled = false;
    if (document.querySelector('.site-content')?.getAttribute('aria-busy') !== 'false') return;
    const brand = document.querySelector('.rail-brand-tab');
    if (brand && brand.getAttribute('data-tip') !== 'Talk to AI') brand.setAttribute('data-tip','Talk to AI');
    const dialog = document.querySelector('.site-search-dialog');
    if (!dialog || !dialog.open) return;
    const input = dialog.querySelector('input[role="combobox"]');
    const query = (input?.value || '').trim();
    const results = dialog.querySelectorAll('#site-search-results [role="option"]');
    for (const result of results) for (const node of result.querySelectorAll('strong, a > div > span')) markText(node, query);
    const card = dialog.querySelector('.search-ai-card');
    if (!card) return;
    const unknown = !!query && !results.length;
    card.classList.toggle('opus-ai-unknown',unknown);
    const title = card.querySelector('.search-ai-copy strong');
    const desired = unknown ? `Search “${query}” with Opus AI` : 'Ask Opus AI';
    if (title && title.textContent !== desired) title.textContent = desired;
  }
  function schedule() { if (!scheduled) { scheduled=true; requestAnimationFrame(update); } }
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['open','aria-selected','data-collapsed','aria-busy']});
  document.addEventListener('input',schedule);
  document.addEventListener('opus-open-search',schedule);
  update();
})();
