(() => {
 if(window.__opusAITeamHandoff)return;window.__opusAITeamHandoff=true;

function opusHumanRequest(input){
 const text=String(input||'').normalize('NFKC').toLowerCase().replace(/[’‘]/g,"'").replace(/\b(?:tema|teem|taem)\b/g,'team').replace(/\b(?:admn|adimn|admim)\b/g,'admin').replace(/\b(?:tlk|speek)\b/g,'talk').replace(/\bdon'?t mind\b/g,'would like').replace(/\bcant\b/g,"can't").replace(/\bdont\b/g,"don't").replace(/\s+/g,' ').trim();
 const target='(?:your |the |opus |support |customer )?(?:team|admin(?:istrator)?|human|real person|person|staff(?: member)?|agent|owner|manager|representative|support|sales|customer service|customer care|someone|somebody)';
 const clauses=text.split(/(?:[.!;\n]|\b(?:but|however|instead|actually)\b|,\s*(?:please|can|could|let|i want|i need))/).map(s=>s.trim()).filter(Boolean);
 for(const clause of [...clauses].reverse()){
  if(/\b(?:do not|don't|never|not now|no need to)\b.{0,45}\b(?:speak|talk|chat|connect|transfer|contact|message|notify|alert|human|team|admin|agent|person)\b/.test(clause)||/\b(?:no|without|not)\s+(?:a |the |any )?(?:human|person|team|admin|agent|staff)\b/.test(clause)){if(/\b(?:team|human|person|admin|agent|staff|support|owner|manager)\b/.test(clause)&&! /\b(?:my|our) team\b/.test(clause))return null;continue;}
  if(/^(?:what (?:is|does|did)|define|explain|tell me about|as (?:a |the )?(?:team|company)|(?:our|my|the) team (?:decided|needs?|wants?|uses?|is building|are building))\b/.test(clause))continue;
  if(/\b(?:if i|if we|for example|an example|a phrase|a sentence)\b/.test(clause)&&/^(?:what|how|explain|would|show)/.test(clause))continue;
  if(/\bteam\s+(?:page|section|photo|picture|biograph|bio|profile|size|names|directory)\b/.test(clause))continue;
  const ownTeam=/\b(?:my|our)\s+(?:own\s+)?team\b/.test(clause)&&! /\b(?:your|opus|support)\s+(?:team|staff|agent|admin)\b/.test(clause);
  if(ownTeam)continue;
  if(new RegExp('^(?:please |hi |hello )?'+target+'(?: please| now| available| here| online| help)*[? ,]*$').test(clause))return 'Human assistance requested';
  if(new RegExp('\\b(?:speak|talk|chat|connect|transfer|refer|reach|contact|message|handover|hand (?:me |us )?over|put me through|pass me|let me deal)\\b.{0,65}\\b'+target+'\\b').test(clause))return 'Human assistance requested';
  if(new RegExp('\\b(?:need|want|like|prefer|looking for|get me|find me|bring|fetch|summon)\\b.{0,28}\\b'+target+'\\b').test(clause)&&! /\b(?:need|want|like)\b.{0,15}\b(?:website|site|app|logo|software|system|design|hosting)\b/.test(clause))return 'Human assistance requested';
  if(new RegExp('\\b'+target+'\\b.{0,55}\\b(?:help me|help us|assist me|assist us|speak|talk|chat|contact me|contact us|available|there|around|online)\\b').test(clause))return 'Human assistance requested';
  if(/\b(?:is|any|can)\s+(?:anyone|anybody|someone|somebody)\s+(?:there|available|around|help|assist)|\b(?:not a bot|stop the bot|stop answering|need human help|live chat|live support|direct chat|human support|real support|customer service please)\b/.test(clause))return 'Human assistance requested';
  if(/\b(?:let me|can i|could i|i want to|i need to|please)\b.{0,20}\b(?:speak|talk|chat|connect)\b.{0,25}\b(?:opus|a real human|an actual person|a member of staff)\b/.test(clause))return 'Human assistance requested';
 }
 return null;
}
function opusHandoffIntent(input){
 const text=String(input||'').toLowerCase().replace(/[’]/g,"'");
 const human=opusHumanRequest(input);if(human)return human;
 if(/\b(?:do not|don't|dont|never)\s+(?:contact|notify|alert|message|call|tell|send|forward|connect|escalate)\b/.test(text)||/\b(?:don't need|do not need|without|no)\s+(?:a\s+)?(?:human|person|staff|agent|team|admin(?:istrator)?|owner|manager)\b/.test(text))return null;
 if(/\b(?:do not|don't|dont)\s+(?:want|need|require)\b.{0,35}\b(?:human|person|staff|team|admin(?:istrator)?|owner|manager|quote|quotation|proposal|contact)\b/.test(text)||/\bnot\s+ready\s+to\s+(?:proceed|book|buy|start|order)\b/.test(text))return null;
 const own=/\b(?:my|our)\b/.test(text),self=/\b(?:my|our|i|we|i've|we've)\b/.test(text);
 if(self&&/\bproject(?:'s)?[\s_-]*(?:id|identifier|reference|number|code|status|progress|deadline)\b|\b(?:id|reference|status|progress)\b.{0,25}\bproject\b/.test(text)&&/[?]|\b(?:what|where|find|lost|forgot|need|show|check|tell|update)\b/.test(text))return 'Private project assistance';
 if(self&&!/\b(?:refund|payment)\s+(?:policy|policies|rules|terms)\b/.test(text)&&/\b(?:payment|refund|invoice|transaction|charged|paid)\b/.test(text)&&/\b(?:failed|missing|wrong|twice|charged|not received|where|status|can't|cannot|dispute|refund|help)\b/.test(text))return 'Payment or billing assistance';
 if(own&&/(?:\b(?:website|site|email|system|hosting|app)\b.{0,55}\b(?:down|not working|broken|offline|hacked|error|locked)|\b(?:can't|cannot)\s+(?:access|open|use)\b.{0,35}\b(?:website|email|account|system)\b)/.test(text))return 'Service support';
 if(/^(?:how (?:can|do|does|to)|what (?:is|are)|explain|define|tell me about)\b/.test(text))return null;
 if(/\b(?:call|phone|ring|contact)\s+(?:me|us)\b/.test(text))return 'Contact requested';
 if(/\b(?:send|prepare|provide|give|create|issue|request|need|want|like)\b.{0,30}\b(?:formal\s+)?(?:quote|quotation|proposal)\b/.test(text))return 'Quotation requested';
 if(/\b(?:ready to proceed|go ahead with|want to book|like to book|want to hire|like to hire|want to order|like to order|please book|please register)\b/.test(text)||/\b(?:want|like|ready) to start (?:my|the|a) (?:website|project|service)\b/.test(text))return 'Ready to proceed';
 return null;
}

 const classify=opusHandoffIntent;
 let pending=false;
 const cooling=()=>{try{return Number(sessionStorage.getItem('opus-team-handoff-until')||0)>Date.now()}catch{return false}};
 function panelNote(){const panel=document.querySelector('.assistant-panel'),form=panel?.querySelector('.assistant-composer');if(form&&!panel.querySelector('.opus-team-review-note')){const p=document.createElement('p');p.className='opus-team-review-note';p.textContent=cooling()?'The Opus team has been notified. Keep this chat open to see a staff reply.':'When you need human help, relevant details can be shared with the Opus team.';form.before(p);}}
 function record(form){
  const input=form?.querySelector('textarea');recordText(input?.value.trim());}
 function recordText(text){if(!text||!window.__opusWebsiteSend)return;
  const reason=classify(text);if(!reason)return;document.dispatchEvent(new Event('opus-team-chat-requested'));if(cooling()||pending)return;
  pending=true;const context=[...document.querySelectorAll('.assistant-bubble[data-role="user"]')].slice(-2).map(e=>e.textContent).filter(Boolean);
  const body=['Opus AI handoff','',`Reason: ${reason}`,'','Visitor request:',text,...(context.length?['','Relevant recent visitor messages:',...context]:[])].join('\n').slice(0,2900);
  window.__opusWebsiteSend({name:'Visitor requesting Opus support',id:crypto.randomUUID(),body}).then(()=>{try{sessionStorage.setItem('opus-team-handoff-until',String(Date.now()+15*60*1000))}catch{}document.dispatchEvent(new Event('opus-team-handoff-ready'));const p=document.querySelector('.opus-team-review-note');if(p)p.textContent='The Opus team has been notified. Keep this chat open to see a staff reply.';}).catch(()=>{document.dispatchEvent(new Event('opus-team-handoff-failed'));const p=document.querySelector('.opus-team-review-note');if(p){p.textContent='The team has not been notified yet. Your request is kept here; check your connection and try again.';p.dataset.error='true';}}).finally(()=>{pending=false;});
 }
 const originalFetch=window.fetch;window.fetch=function(input,options){try{const url=new URL(typeof input==='string'?input:input.url,location.href),method=options?.method||input?.method||'GET';if(url.origin===location.origin&&url.pathname==='/api/assistant'&&method.toUpperCase()==='POST'){if(typeof options?.body==='string'){const body=JSON.parse(options.body);recordText(body.messages?.filter(row=>row.role==='user').at(-1)?.content?.trim());}else if(input instanceof Request)input.clone().json().then(body=>recordText(body.messages?.filter(row=>row.role==='user').at(-1)?.content?.trim())).catch(()=>{});}}catch{}return originalFetch.apply(this,arguments);};
 document.addEventListener('submit',event=>{if(event.target.matches?.('.assistant-composer'))record(event.target);},true);
 document.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&event.target.matches?.('.assistant-composer textarea'))record(event.target.closest('form'));},true);
 let scheduled=false;new MutationObserver(()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;panelNote();});}}).observe(document.documentElement,{subtree:true,childList:true});panelNote();
})();
