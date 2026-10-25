import {isCssColor,cleanGradient,parseColor,gradientCss} from './colors';
import {parseSectionDesign} from './section-design';
import type {ServiceRecord,ServiceExtras,ProjectRecord} from './content';
export const PRESENTATION_SCOPES=['home','services','detail_hero','detail_showcase','detail_visual'] as const;
export type PresentationScope=typeof PRESENTATION_SCOPES[number];
export type ServicePresentation={image:string;slides:string[];background_kind:'solid'|'gradient';background_color:string;background_gradient:string;overlay_kind:'solid'|'gradient';overlay_color:string;overlay_gradient:string;overlay_opacity:number;text_color:string;title_color:string;text_align:'left'|'center'|'right';image_fit:'cover'|'contain';image_layout:'split'|'background'};
export type ServicePresentations=Record<PresentationScope,Record<string,ServicePresentation>>;
export const DEFAULT_PRESENTATION:ServicePresentation={image:'',slides:[],background_kind:'solid',background_color:'#ffffff',background_gradient:'135deg,#0f0928,#E85D2A',overlay_kind:'solid',overlay_color:'rgba(0, 0, 0, 0)',overlay_gradient:'180deg,rgba(0, 0, 0, 0),rgba(15, 9, 40, 0.85)',overlay_opacity:0,text_color:'#0f0928',title_color:'#0f0928',text_align:'left',image_fit:'cover',image_layout:'split'};
const tones=['#9b4236','#58415d','#a13f65','#274e48','#a05c14','#252943'];
export const presentationBackground=(d:ServicePresentation)=>d.background_kind==='gradient'?gradientCss(d.background_gradient):d.background_color;
export const presentationOverlay=(d:ServicePresentation)=>d.overlay_kind==='gradient'?gradientCss(d.overlay_gradient):d.overlay_color;
export function parsePresentation(raw:unknown):ServicePresentation|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;const d={...DEFAULT_PRESENTATION,...raw} as ServicePresentation;
 const overlay=parseSectionDesign({background_color:d.background_color,background_image:d.image,overlay_kind:d.overlay_kind,overlay_color:d.overlay_color,overlay_gradient:d.overlay_gradient,overlay_opacity:d.overlay_opacity});const gradient=cleanGradient(d.background_gradient);
 if(!overlay||!gradient||!isCssColor(d.text_color)||!isCssColor(d.title_color)||!['left','center','right'].includes(d.text_align)||!['solid','gradient'].includes(d.background_kind)||!['cover','contain'].includes(d.image_fit)||!['split','background'].includes(d.image_layout)||!Array.isArray(d.slides)||d.slides.length>20||d.slides.some(image=>typeof image!=='string'||!image||image.length>500||! /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(image)))return null;
 return{...d,image:overlay.background_image,background_gradient:gradient,overlay_color:overlay.overlay_color,overlay_gradient:overlay.overlay_gradient};
}
export function parsePresentations(raw:unknown):ServicePresentations|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;const result=Object.fromEntries(PRESENTATION_SCOPES.map(scope=>[scope,{}])) as ServicePresentations;
 for(const [scope,entries] of Object.entries(raw)){if(!PRESENTATION_SCOPES.includes(scope as PresentationScope)||!entries||typeof entries!=='object'||Array.isArray(entries)||Object.keys(entries).length>30)return null;for(const [id,value] of Object.entries(entries)){if(!/^[a-z0-9-]{1,80}$/.test(id)||['constructor','prototype','__proto__'].includes(id))return null;const d=parsePresentation(value);if(!d)return null;result[scope as PresentationScope][id]=d;}}
 return result;
}
export function defaultPresentations(services:ServiceRecord[],extras:Record<string,ServiceExtras>,projects:ProjectRecord[]=[]):ServicePresentations{
 const out=Object.fromEntries(PRESENTATION_SCOPES.map(scope=>[scope,{}])) as ServicePresentations;
 services.forEach((service,i)=>{const extra=extras[service.id];const tone=service.card_bg_color&&service.card_bg_color.toLowerCase()!=='#ffffff'?service.card_bg_color:tones[i%tones.length];const base=()=>structuredClone(DEFAULT_PRESENTATION);
 out.home[service.id]={...base(),image:service.image,background_color:tone,title_color:'#ffffff',text_color:'#ffffff',image_layout:'background',overlay_kind:'gradient',overlay_opacity:1,overlay_gradient:'180deg,rgba(0, 0, 0, 0.3),rgba(0, 0, 0, 0.15) 40%,rgba(13, 13, 13, 0.91)'};
 const c=parseColor(tone)||{r:0,g:0,b:0,a:1};const ink=(c.r*299+c.g*587+c.b*114)/1000<145?'#ffffff':'#0f0928';
 const full=i===2||i===4;out.services[service.id]={...base(),image:service.image,background_color:tone,text_color:full?'#ffffff':ink,title_color:full?'#ffffff':ink,image_layout:full?'background':'split',overlay_kind:'gradient',overlay_gradient:'180deg,rgba(13, 13, 13, 0.1),rgba(13, 13, 13, 0.85)',overlay_opacity:full?1:0};
 out.detail_hero[service.id]={...base(),image:extra?.hero_background_kind==='gradient'?'':extra?.hero_background||'',background_kind:extra?.hero_background_kind==='gradient'?'gradient':'solid',background_color:'#0d0d0d',background_gradient:cleanGradient(extra?.hero_gradient)||base().background_gradient,overlay_kind:'gradient',overlay_gradient:'180deg,rgba(0, 0, 0, 0.7),rgba(0, 0, 0, 0.85)',overlay_opacity:1,text_color:'#ffffff',title_color:'#ffffff',text_align:'center',image_layout:'background'};
 const visual=extra?.visual_background||service.image;out.detail_visual[service.id]={...base(),image:visual};
 const baseline=({'web-design':'/images/service-web-design.png','software-development':'/images/service-software.jpg','ai-automation':'/images/service-ai.jpg','graphic-design':'/images/service-graphic.png','domains-hosting':'/images/service-hosting.png','api-integrations':'/images/service-api.jpg'} as Record<string,string>)[service.id];
 out.detail_showcase[service.id]={...base(),image:extra?.visual_background&&extra.visual_background!==baseline?extra.visual_background:service.image,background_color:'#0f0928',slides:service.id==='web-design'?projects.filter(p=>p.visible&&p.status==='active'&&p.screenshot).map(p=>p.screenshot):[]};
 });return out;
}
export function normalizePresentations(raw:unknown,services:ServiceRecord[],extras:Record<string,ServiceExtras>,projects:ProjectRecord[]){const defaults=defaultPresentations(services,extras,projects),parsed=parsePresentations(raw);if(!parsed)return defaults;for(const scope of PRESENTATION_SCOPES)defaults[scope]={...defaults[scope],...parsed[scope]};return defaults;}
