'use client';
import {useEffect,useRef,useState} from 'react';
import type {LocalMethod} from '@/lib/payments';
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
export function OpusPayBrand(){return <a href="https://opuszim.co.zw/" className="opus-pay-brand" aria-label="Opus Pay by Opus Zimbabwe"><svg className="opus-official-logo" viewBox="90 190 2000 350" role="img" aria-label="Opus Pay" preserveAspectRatio="xMidYMid meet"><image href="/images/opus-pay/official-logo-transparent.png" width="2172" height="724"/></svg><span className="opus-pay-attribution">By Opus Zimbabwe</span></a>}

export function PaymentBrand({name}:{name:string}){
 const brand=paymentBrands.find(b=>b.pattern.test(name));
 const [failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{let live=true,probe:HTMLImageElement|undefined;const retry=()=>{if(!live)return;setFailed(false);setLoaded(false);if(brand){if(probe){probe.onerror=null;probe.onload=null}probe=new Image();probe.onload=()=>{if(live){setLoaded(true);setFailed(false)}};probe.onerror=()=>{if(live){setLoaded(false);setFailed(true)}};probe.src=brand.src}};retry();window.addEventListener('online',retry);return()=>{live=false;if(probe){probe.onerror=null;probe.onload=null}window.removeEventListener('online',retry)}},[name,brand]);
 if(!brand||failed)return <span className="opus-logo-fallback">{brand?.name||name}</span>;
 if(brand.key==='zimswitch')return <span className="opus-provider-art opus-art-zimswitch"><svg viewBox="15 122 470 255" role="img" aria-label="ZimSwitch" preserveAspectRatio="xMidYMid meet"><image opacity={loaded?1:0} onError={()=>setFailed(true)} href={brand.src} width="500" height="500"/></svg></span>;
 if(brand.key==='omari')return <span className="opus-provider-art opus-art-omari"><svg viewBox="240 234 1145 356" role="img" aria-label="Omari" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="opus-omari-symbol-crop"><path d="M240 234H1385V548H605V590H240Z"/></clipPath></defs><image opacity={loaded?1:0} onError={()=>setFailed(true)} href={brand.src} width="1553" height="825" clipPath="url(#opus-omari-symbol-crop)"/></svg></span>;
 return <span className={`opus-provider-art opus-art-${brand.key}`}><img style={{opacity:loaded?1:0}} onError={()=>setFailed(true)} src={brand.src} alt={brand.name} draggable={false}/></span>;
}
export function motionAllowed(){
 if(typeof window==='undefined')return false;
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string;downlink?:number}}).connection;
 return !window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!connection?.saveData;
}
function Notch({wide=false}:{wide?:boolean}){
 const ref=useRef<SVGSVGElement>(null),[size,setSize]=useState({width:1084,height:wide?336:240});
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({width:r.width,height:r.height})});observer.observe(el);return()=>observer.disconnect()},[]);
 const {width:w,height:h}=size,depth=w<600?33:36,n=Math.min(w-80,wide?440:205),left=(w-n)/2,right=(w+n)/2,r=w<600?19:20;
 return <svg className="opus-notch" ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><path d={`M ${r} 0 H ${left-16} Q ${left-4} 0 ${left} 8 L ${left+(depth-16)/2} ${depth-8} Q ${left+(depth-8)/2} ${depth} ${left+(depth-8)/2+14} ${depth} H ${right-(depth-8)/2-14} Q ${right-(depth-8)/2} ${depth} ${right-(depth-16)/2} ${depth-8} L ${right} 8 Q ${right+4} 0 ${right+16} 0 H ${w-r} Q ${w} 0 ${w} ${r} V ${h-r} Q ${w} ${h} ${w-r} ${h} H ${r} Q 0 ${h} 0 ${h-r} V ${r} Q 0 0 ${r} 0 Z`} fill="white"/></svg>;
}
export default function PaymentMethodPicker({methods,loading,error,onRetry,onSelect,disabled=false}:{methods:LocalMethod[];loading:boolean;error:string;onRetry:()=>void;onSelect:(method:LocalMethod)=>void;disabled?:boolean}){
 const [cue,setCue]=useState(-1),[message,setMessage]=useState(''),[activeGroup,setActiveGroup]=useState<number|null>(null),[phase,setPhase]=useState('intro'),[round,setRound]=useState(0);
 const pickerRef=useRef<HTMLDivElement>(null),interrupt=useRef<()=>void>(()=>{});const id='opus-payment';
 function stop(){interrupt.current()}
 useEffect(()=>{if(loading||error){setActiveGroup(null);setMessage('')}},[loading,error]);
 useEffect(()=>{const node=pickerRef.current,card=node?.querySelector('.opus-card-group');if(!node||!card)return;const observer=new ResizeObserver(()=>{node.style.setProperty('--opus-card-height',(card as HTMLElement).offsetHeight+'px')});observer.observe(card);return()=>observer.disconnect()},[]);
 useEffect(()=>{
  if(loading||error||!methods.length){setCue(-1);setPhase('paused');return;}
  let timer:ReturnType<typeof setTimeout>,index=0,cycle=0,disposed=false,continuous=false;
  const clear=()=>{clearTimeout(timer);setCue(-1)};
  const tick=()=>{if(disposed||!motionAllowed()||document.hidden){clear();setPhase('paused');return}if(index===0){cycle++;setRound(cycle)}setPhase(continuous?'idle-loop':'intro');setCue(index++);timer=setTimeout(()=>{if(index===9){index=0;if(!continuous&&cycle===2){clear();setPhase('waiting');timer=setTimeout(()=>{continuous=true;tick()},15000);return}}tick()},500)};
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
 function choose(index:number){stop();const brand=paymentBrands[index],method=methods.find(m=>brand.pattern.test(m.name));if(loading)return;if(!method){setMessage(`${brand.name} is temporarily unavailable. Please choose another method or contact payment support.`);return}setMessage('');onSelect(method)}
 return <div ref={pickerRef} className="opus-method-picker" aria-busy={loading} data-active-group={activeGroup===null?'both':activeGroup} data-cue-phase={phase} data-cue-round={round} onKeyDown={event=>{if(event.key==='Escape'){stop();setActiveGroup(null)}}} onPointerLeave={event=>{if(event.pointerType==='mouse'&&innerWidth>700)setActiveGroup(null)}}>
  <h1 className="opus-sr-only">Choose your payment method</h1>
  <nav className="opus-group-controls" aria-label="Payment groups">{[{title:'Cards',value:0},{title:'Mobile wallets',value:1},{title:'Show both',value:null}].map(item=><button key={item.title} type="button" disabled={loading||Boolean(error)} aria-pressed={activeGroup===item.value} onClick={()=>{stop();setActiveGroup(item.value)}}>{item.title}</button>)}</nav>
  {[{title:'Cards',indexes:[0,1,2]},{title:'Mobile wallet & other payments',indexes:[3,4,5,6,7,8]}].map((group,g)=><div key={group.title} className={`opus-group-hover-zone ${g?'opus-mobile-zone':''}`} onPointerEnter={event=>hoverGroup(g,event)} onPointerMove={event=>hoverGroup(g,event)} onPointerLeave={event=>{if(event.pointerType==='mouse'&&innerWidth>700)setActiveGroup(current=>current===g?null:current)}}><section className={`opus-method-group ${g?'opus-mobile-group':'opus-card-group'}`} aria-labelledby={`${id}-${g}`} onFocusCapture={event=>{if(!loading&&!error&&(event.target as HTMLElement).matches(':focus-visible'))setActiveGroup(g)}}><Notch wide={Boolean(g)}/><h2 id={`${id}-${g}`} className="opus-group-title">{group.title}</h2><div className="opus-logo-grid">{group.indexes.map(index=>{const b=paymentBrands[index],available=methods.some(m=>b.pattern.test(m.name));return <button key={b.key} type="button" className="opus-method-button" data-cue={cue===index||undefined} data-brand={b.key} data-unavailable={!loading&&!available||undefined} aria-label={`Pay with ${b.name}`} aria-disabled={disabled||loading||!available} onClick={()=>{if(!disabled)choose(index)}} onPointerEnter={stop}><PaymentBrand name={b.name}/></button>})}</div></section></div>)}
  <div className="opus-picker-feedback" aria-live="polite">{loading?'Loading available payment methods…':message||error||(!methods.length?'Payment methods are temporarily unavailable.':'')}{(error||(!loading&&!methods.length))&&<button type="button" onClick={onRetry}>Try again</button>}</div>
 </div>;
}
