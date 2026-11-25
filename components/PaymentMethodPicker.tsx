'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {paymentArtwork} from './payment-artwork';
import {groupCardMethods,HOSTED_CARDS_CODE,HOSTED_CARDS_NAME,type LocalMethod} from '@/lib/payments';
export const paymentBrands = [
 {key:'visa',name:'Visa',pattern:/^visa$/i,src:'/images/opus-pay/visa.svg'},
 {key:'mastercard',name:'Mastercard',pattern:/master\s?card/i,src:'/images/opus-pay/mastercard.svg'},
 {key:'zimswitch',name:'ZimSwitch',pattern:/zimswitch/i,src:'/images/payments/zimswitch.png'},
 {key:'ecocash',name:'EcoCash',pattern:/ecocash/i,src:'/images/ecocash-logo.png'},
 {key:'innbucks',name:'InnBucks',pattern:/innbucks/i,src:'/images/payments/innbucks.png'},
 {key:'omari',name:'Omari',pattern:/omari/i,src:'/images/payments/omari.webp'},
 {key:'onemoney',name:'OneMoney',pattern:/one\s?money/i,src:'/images/payments/onemoney.png'},
 {key:'pos2u',name:'POS2U',pattern:/pos2u/i,src:'/images/opus-pay/pos2u.svg'},
 {key:'telecash',name:'Telecash',pattern:/telecash/i,src:'/images/payments/telecash.png'},
];
export function OpusPayBrand(){return <a href="https://opuszim.co.zw/" className="opus-pay-brand" aria-label="Opus Pay by Opus Zimbabwe"><img className="opus-official-logo" src={paymentArtwork.opus} width="600" height="105" alt="Opus Pay"/><span className="opus-pay-attribution">By Opus Zimbabwe</span></a>}
export function PaymentBrand({name}:{name:string}){
 const [failed,setFailed]=useState(false);
 if(name===HOSTED_CARDS_NAME)return <span className="opus-card-logos" aria-label="Visa, Mastercard and Zimswitch">{['Visa','Mastercard','ZimSwitch'].map(card=><PaymentBrand key={card} name={card}/>)}</span>;
 const brand=paymentBrands.find(b=>b.pattern.test(name));
 if(!brand||failed)return <span className="opus-logo-fallback">{brand?.name||name}</span>;
 return <span className={`opus-provider-art opus-art-${brand.key} opus-embedded-art`}><img src={paymentArtwork[brand.key]} alt={brand.name} draggable={false} onError={()=>setFailed(true)}/></span>;
}
export function motionAllowed(){
 if(typeof window==='undefined')return false;
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string;downlink?:number}}).connection;
 return !window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!connection?.saveData;
}
function Notch({wide=false}:{wide?:boolean}){return <span className={`opus-notch${wide?' opus-notch-wide':''}`} aria-hidden="true"><span className="opus-notch-surface"/></span>}
export default function PaymentMethodPicker({methods,loading,error,onRetry,onSelect,onNotice,disabled=false}:{methods:LocalMethod[];loading:boolean;error:string;onRetry:()=>void;onSelect:(method:LocalMethod)=>void;onNotice?:(message:string)=>void;disabled?:boolean}){
 methods=groupCardMethods(methods);
 const hostedCards=methods.find(m=>m.code===HOSTED_CARDS_CODE);
 const [cue,setCue]=useState(-1),[activeGroup,setActiveGroup]=useState<number|null>(null),[phase,setPhase]=useState('intro'),[round,setRound]=useState(0);
 const pickerRef=useRef<HTMLDivElement>(null),interrupt=useRef<()=>void>(()=>{});const id='opus-payment';
 function stop(){interrupt.current()}
 useEffect(()=>{if(loading||error){setActiveGroup(null);onNotice?.('')}},[loading,error]);
 useEffect(()=>{const node=pickerRef.current,card=node?.querySelector('.opus-card-group');if(!node||!card)return;const observer=new ResizeObserver(()=>{node.style.setProperty('--opus-card-height',(card as HTMLElement).offsetHeight+'px')});observer.observe(card);return()=>observer.disconnect()},[]);
 useEffect(()=>{
  if(loading||error||!methods.length){setCue(-1);setPhase('paused');return;}
  let timer:ReturnType<typeof setTimeout>,index=0,cycle=0,disposed=false,continuous=false;
  const clear=()=>{clearTimeout(timer);setCue(-1)};
  const tick=()=>{if(disposed||!motionAllowed()||document.hidden){clear();setPhase('paused');return}if(index===0){cycle++;setRound(cycle)}setPhase(continuous?'idle-loop':'intro');setCue(index++);timer=setTimeout(()=>{if(index===7){index=0;if(!continuous&&cycle===2){clear();setPhase('waiting');timer=setTimeout(()=>{continuous=true;tick()},15000);return}}tick()},500)};
  const activity=()=>{clear();setPhase('waiting');if(motionAllowed()&&!document.hidden)timer=setTimeout(()=>{index=0;continuous=true;tick()},15000)};
  interrupt.current=activity;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)'),connection=(navigator as Navigator&{connection?:EventTarget}).connection;
  const visibility=()=>{activity();if(document.hidden)setPhase('paused')};
  for(const name of ['pointermove','pointerdown','keydown','touchstart','wheel'])window.addEventListener(name,activity,{passive:true});
  document.addEventListener('visibilitychange',visibility);media.addEventListener('change',activity);connection?.addEventListener('change',activity);
  if(motionAllowed()&&!document.hidden)timer=setTimeout(tick,400);else setPhase('paused');
  return()=>{disposed=true;clearTimeout(timer);interrupt.current=()=>{};for(const name of ['pointermove','pointerdown','keydown','touchstart','wheel'])window.removeEventListener(name,activity);document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',activity);connection?.removeEventListener('change',activity)};
 },[loading,error,methods.length]);
 function hoverGroup(group:number,event:{pointerType:string;clientX:number;clientY:number;currentTarget:HTMLElement}){if(event.pointerType!=='mouse'||innerWidth<=700||loading||Boolean(error))return;const box=event.currentTarget.getBoundingClientRect();if(event.clientX>=box.left&&event.clientX<=box.right&&event.clientY>=box.top&&event.clientY<=box.bottom)setActiveGroup(group)}
 function choose(index:number){stop();const brand=paymentBrands[index],method=methods.find(m=>brand.pattern.test(m.name));if(loading)return;if(!method){onNotice?.(`${brand.name} is temporarily unavailable. Please choose another method or contact payment support.`);return}onNotice?.('');onSelect(method)}
 return <div ref={pickerRef} className="opus-method-picker" aria-busy={loading} data-active-group={activeGroup===null?'both':activeGroup} data-cue-phase={phase} data-cue-round={round} onKeyDown={event=>{if(event.key==='Escape'){stop();setActiveGroup(null)}}} onPointerLeave={event=>{if(event.pointerType==='mouse'&&innerWidth>700)setActiveGroup(null)}}>
  <h1 className="opus-sr-only">Choose your payment method</h1>
  <nav className="opus-group-controls" aria-label="Payment groups">{[{title:'Cards',value:0},{title:'Mobile wallets',value:1},{title:'Show both',value:null}].map(item=><button key={item.title} type="button" disabled={loading||Boolean(error)} aria-pressed={activeGroup===item.value} onClick={()=>{stop();setActiveGroup(item.value)}}>{item.title}</button>)}</nav>
  {[{title:'Cards',indexes:[0,1,2]},{title:'Mobile wallet & other payments',indexes:[3,4,5,6,7,8]}].map((group,g)=><div key={group.title} className={`opus-group-hover-zone ${g?'opus-mobile-zone':''}`} onPointerEnter={event=>hoverGroup(g,event)} onPointerMove={event=>hoverGroup(g,event)} onPointerLeave={event=>{if(event.pointerType==='mouse'&&innerWidth>700)setActiveGroup(current=>current===g?null:current)}}><section className={`opus-method-group ${g?'opus-mobile-group':'opus-card-group'}`} aria-labelledby={`${id}-${g}`} onFocusCapture={event=>{if(!loading&&!error&&(event.target as HTMLElement).matches(':focus-visible'))setActiveGroup(g)}}><Notch wide={Boolean(g)}/><h2 id={`${id}-${g}`} className="opus-group-title">{group.title}</h2><div className="opus-logo-grid">{g===0?<button type="button" className="opus-method-button opus-card-choice" data-brand="cards" data-cue={cue===0||undefined} aria-label="International cards and Zimswitch" aria-disabled={disabled||loading||!hostedCards} onPointerEnter={stop} onClick={()=>{stop();if(disabled||loading)return;if(!hostedCards){onNotice?.('Card payments are temporarily unavailable. Please choose another method.');return}onNotice?.('');onSelect(hostedCards)}}><span className="opus-card-choice-title">International cards &amp; Zimswitch</span><PaymentBrand name={HOSTED_CARDS_NAME}/><span className="opus-card-choice-continue">Continue <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true"/></span></button>:group.indexes.map(index=>{const b=paymentBrands[index],available=methods.some(m=>b.pattern.test(m.name));return <button key={b.key} type="button" className="opus-method-button" data-cue={cue===index-2||undefined} data-brand={b.key} data-unavailable={!loading&&!available||undefined} aria-label={`Pay with ${b.name}`} aria-disabled={disabled||loading||!available} onClick={()=>{if(!disabled)choose(index)}} onPointerEnter={stop}><PaymentBrand name={b.name}/></button>})}</div></section></div>)}

 </div>;
}
