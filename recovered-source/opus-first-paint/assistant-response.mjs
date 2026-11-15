import {opusHandoffIntent} from './handoff-intent.mjs';
import {publicContactText} from './public-contact.mjs';
export function projectQuestion(messages) {
  const users=messages.filter(m=>m?.role==='user'&&typeof m.content==='string');
  const text=users.at(-1)?.content||'';
  const identifier=/\bproject(?:['’]s)?[\s_-]*(?:id|identifier|number|reference|ref|code)\b|\b(?:id|identifier|reference|ref|number|code)\b.{0,35}\bproject\b/i;
  const personal=/\b(?:my|our|mine|assigned|find|retrieve|lost|forgot|need|client|customer)\b/i;
  const related=/\bproject\b/i.test(users.slice(-3,-1).map(m=>m.content).join(' '));
  if(identifier.test(text)||(related&&/\b(?:my|our)\s+(?:id|reference|number|code)\b/i.test(text)))return personal.test(text)?'private-id':'definition';
  if(/\b(?:my|our)\s+project\b/i.test(text)&&/\b(?:status|progress|update|details|information|deadline|due|ready|finished|complete)\b/i.test(text))return 'private-status';
  return null;
}
const ID_REPLY='I can help you find your project ID, but I cannot identify your account or retrieve private project records from this public chat.\n\nIf Opus has already issued you a reference, please check your project confirmation email or message. If you cannot find it, our support team can verify your identity and confirm the correct ID. Please do not share passwords, payment credentials or identity documents here.\n\n[Ask support for my project ID](https://wa.me/263776396530)';
const STATUS_REPLY='Your project status needs to be checked against your private project record. I do not have a verified connection to that record in this public chat, so I cannot confirm its progress or completion date.\n\nPlease contact Opus support with your existing project reference, if you have one, so the team can verify your identity and check the latest update.\n\n[Ask about my project](https://wa.me/263776396530)';
function reply(answer){return Response.json({answer},{headers:{'cache-control':'no-store','x-opus-assistant-guard':'v1'}})}
export async function handleAssistantRequest(request,upstream=fetch){
  const url=new URL(request.url);
  const origin=request.headers.get('origin');
  // Keep the original origin checks for requests that did not come from this site.
  if(origin!==url.origin)return upstream(request);
  let body;try{body=await request.clone().json()}catch{return upstream(request)}
  if(!Array.isArray(body?.messages))return upstream(request);
  const question=body.messages.filter(m=>m?.role==='user'&&typeof m.content==='string').at(-1)?.content?.trim();
  if(!question)return upstream(request);
  if(opusHandoffIntent(question)==='Human assistance requested')return reply('You can speak with the Opus team through the website chat below. I am opening it so you can send your message directly. A team member will reply when available.');
  const intent=projectQuestion(body.messages);
  if(intent==='private-id')return reply(ID_REPLY);
  if(intent==='private-status')return reply(STATUS_REPLY);
  if(intent==='definition')return reply('A project ID is the reference used to identify a specific client project. It is different from the public portfolio listings.\n\nIf you are asking for your own ID, I cannot retrieve it without verified access to your project record. Our support team can help you locate it.\n\n[Get help with my project reference](https://wa.me/263776396530)');
  const response=await upstream(request);
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))return response;
  let data;try{data=await response.clone().json()}catch{return response}
  if(typeof data.answer!=='string')return response;
  let normalized=publicContactText(data.answer).replace(/\[OPEN:(https:\/\/(?:wa\.me\/|api\.whatsapp\.com\/)[^\s|\]]+)\|([^\]]+)\]/g,'[$2]($1)');
  if(typeof data.contactLink==='string'&&/^https:\/\/wa\.me\/\d{8,15}(?:\?[^\s]*)?$/.test(data.contactLink)){
    normalized+='\n\n[Contact Opus on WhatsApp]('+publicContactText(data.contactLink)+')';delete data.contactLink;
  }
  const finish=()=>normalized===data.answer?response:reply(normalized);
  const answerText=normalized.replace(/\[OPEN:[^\]]*\]|\[CHOICES:[^\]]*\]/g,'').replace(/\[[^\]]+\]\([^)]+\)/g,'').trim();
  const websiteTopic=/^(?:web(?:site)?[\s-]*(?:design|development)(?:\s*(?:and|&)\s*(?:design|development))?)[.!?]*$/i.test(question);
  if(!websiteTopic&&answerText)return finish();
  // A service enquiry needs an explanation before any optional page action.
  try{
    const contentResponse=await upstream(new Request(new URL('/api/content',url),{headers:{accept:'application/json'},cache:'no-store'}));
    if(!contentResponse.ok)return response;
    const content=await contentResponse.json();
    const service=websiteTopic?content.services?.find(s=>s.id==='web-design'):content.services?.find(s=>s.name&&question.toLowerCase().includes(s.name.toLowerCase()));
    if(service?.description){
      const text=service.description.trim();
      const answer=text+'\n\n'+(websiteTopic?'What type of business is the website for, and what should visitors be able to do—for example, send enquiries, book services or buy online?':'What would you like to achieve with this service?')+'\n\n[OPEN:/services/'+(service.slug||service.id)+'/|Explore '+service.name+']';
      return reply(answer);
    }
  }catch{/* Preserve the original assistant response if public content is unavailable. */}
  if(!answerText)return reply('I do not have enough verified information to answer that fully yet. Could you clarify what you would like to know? I can then explain the relevant options and suggest a useful next step.');
  return finish();
}
export function patchAssistantLayout(source){
  const marker='function ee(e){return';
  if(source.split(marker).length!==2)return source;
  return source.replace(marker,'function ee(e){if(/\\bproject(?:[\'’]s)?[\\s_-]*(?:id|identifier|number|reference|ref|code)\\b|\\b(?:id|identifier|reference|number|code)\\b.{0,35}\\bproject\\b|\\b(?:my|our)\\s+project\\b/i.test(e))return!1;return');
}
