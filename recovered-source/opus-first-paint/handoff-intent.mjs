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

export {opusHandoffIntent,opusHumanRequest};
