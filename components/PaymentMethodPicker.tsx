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
export function OpusPayBrand(){return <a href="https://opuszim.co.zw/" className="opus-pay-brand" aria-label="Opus Pay by Opus Zimbabwe"><svg className="opus-official-logo" viewBox="138 878 1772 293" role="img" aria-label="Opus Pay" preserveAspectRatio="xMidYMid meet"><image href="/images/opus-pay/official-logo.jpg" width="2048" height="2048"/></svg><span className="opus-pay-attribution">By Opus Zimbabwe</span></a>}

export function PaymentBrand({name}:{name:string}){
 const brand=paymentBrands.find(b=>b.pattern.test(name));
 if(!brand)return <span>{name}</span>;
 if(brand.key==='zimswitch')return <span className="opus-provider-art opus-art-zimswitch"><svg viewBox="15 122 470 255" role="img" aria-label="ZimSwitch" preserveAspectRatio="xMidYMid meet"><image href={brand.src} width="500" height="500"/></svg></span>;
 if(brand.key==='omari')return <span className="opus-provider-art opus-art-omari"><svg viewBox="240 234 1145 356" role="img" aria-label="Omari" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="opus-omari-symbol-crop"><path d="M240 234H1385V548H605V590H240Z"/></clipPath></defs><image href={brand.src} width="1553" height="825" clipPath="url(#opus-omari-symbol-crop)"/></svg></span>;
 return <span className={`opus-provider-art opus-art-${brand.key}`}><img src={brand.src} alt={brand.name} draggable={false}/></span>;
}
export function motionAllowed(){
 if(typeof window==='undefined'||document.documentElement.dataset.opusMotion==='off')return false;
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string;downlink?:number}}).connection;
 return !window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!connection?.saveData&&!/^(slow-2g|2g|3g)$/.test(connection?.effectiveType||'')&&!(connection?.downlink!==undefined&&connection.downlink<1.5);
}
function Notch({wide=false}:{wide?:boolean}){
 const ref=useRef<SVGSVGElement>(null),[size,setSize]=useState({width:1084,height:wide?336:240});
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(entries=>{const r=entries[0].contentRect;setSize({width:r.width,height:r.height})});observer.observe(el);return()=>observer.disconnect()},[]);
 const {width:w,height:h}=size,depth=w<600?33:36,n=Math.min(w-80,wide?440:205),left=(w-n)/2,right=(w+n)/2,r=w<600?19:20;
 return <svg className="opus-notch" ref={ref} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><path d={`M ${r} 0 H ${left-16} Q ${left-4} 0 ${left} 8 L ${left+(depth-16)/2} ${depth-8} Q ${left+(depth-8)/2} ${depth} ${left+(depth-8)/2+14} ${depth} H ${right-(depth-8)/2-14} Q ${right-(depth-8)/2} ${depth} ${right-(depth-16)/2} ${depth-8} L ${right} 8 Q ${right+4} 0 ${right+16} 0 H ${w-r} Q ${w} 0 ${w} ${r} V ${h-r} Q ${w} ${h} ${w-r} ${h} H ${r} Q 0 ${h} 0 ${h-r} V ${r} Q 0 0 ${r} 0 Z`} fill="white"/></svg>;
}
export default function PaymentMethodPicker({methods,loading,error,onRetry,onSelect,disabled=false}:{methods:LocalMethod[];loading:boolean;error:string;onRetry:()=>void;onSelect:(method:LocalMethod)=>void;disabled?:boolean}){
 const [cue,setCue]=useState(-1),[message,setMessage]=useState('');const cancelled=useRef(false),frames=useRef(0),firstFrame=useRef(0);const id='opus-payment';
 function stop(){cancelled.current=true;setCue(-1);try{sessionStorage.setItem('opus-pay-intro-seen','1')}catch{}}
 useEffect(()=>{
  if(loading||cancelled.current)return;
  try{if(sessionStorage.getItem('opus-pay-intro-seen'))return}catch{}
  let raf=0,timer:ReturnType<typeof setTimeout>,index=0,disposed=false;
  const stopForUser=()=>{cancelled.current=true;setCue(-1);try{sessionStorage.setItem('opus-pay-intro-seen','1')}catch{}};
  const connection=(navigator as Navigator&{connection?:EventTarget}).connection;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const preferenceChanged=()=>{if(!motionAllowed())stopForUser()};
  window.addEventListener('pointermove',stopForUser,{once:true});window.addEventListener('pointerdown',stopForUser,{once:true});window.addEventListener('keydown',stopForUser,{once:true});media.addEventListener('change',preferenceChanged);connection?.addEventListener('change',preferenceChanged);
  const advance=()=>{if(disposed||cancelled.current||!motionAllowed()||document.hidden){setCue(-1);return}try{sessionStorage.setItem('opus-pay-intro-seen','1')}catch{}setCue(index++);if(index<9)timer=setTimeout(advance,210);else timer=setTimeout(()=>{setCue(-1);cancelled.current=true},210)};
  // Sample actual frame delivery before allowing cosmetic motion.
  const sample=(time:number)=>{if(!firstFrame.current)firstFrame.current=time;frames.current++;if(time-firstFrame.current<180){raf=requestAnimationFrame(sample);return}if(frames.current>=7&&motionAllowed())timer=setTimeout(advance,220);else document.documentElement.dataset.opusMotion='off'};
  let previous=0,slowFrames=0,monitor=0;
  const measure=(time:number)=>{if(previous&&time-previous>48)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);previous=time;if(slowFrames>=3){document.documentElement.dataset.opusMotion='off';stopForUser();return}if(!cancelled.current&&!disposed)monitor=requestAnimationFrame(measure)};
  if(motionAllowed()){raf=requestAnimationFrame(sample);monitor=requestAnimationFrame(measure)}
  return()=>{disposed=true;cancelAnimationFrame(raf);cancelAnimationFrame(monitor);clearTimeout(timer);window.removeEventListener('pointermove',stopForUser);window.removeEventListener('pointerdown',stopForUser);window.removeEventListener('keydown',stopForUser);media.removeEventListener('change',preferenceChanged);connection?.removeEventListener('change',preferenceChanged)};
 },[loading]);
 function choose(index:number){stop();const brand=paymentBrands[index],method=methods.find(m=>brand.pattern.test(m.name));if(loading)return;if(!method){setMessage(`${brand.name} is temporarily unavailable. Please choose another method or contact payment support.`);return}setMessage('');onSelect(method)}
 return <div className="opus-method-picker" aria-busy={loading} onPointerEnter={stop} onFocusCapture={stop} onTouchStart={stop}>
  <h1 className="opus-sr-only">Choose your payment method</h1>
  {[{title:'Cards',indexes:[0,1,2]},{title:'Mobile wallet & other payments',indexes:[3,4,5,6,7,8]}].map((group,g)=><section key={group.title} className={`opus-method-group ${g?'opus-mobile-group':'opus-card-group'}`} aria-labelledby={`${id}-${g}`}><Notch wide={Boolean(g)}/><h2 id={`${id}-${g}`} className="opus-group-title">{group.title}</h2><div className="opus-logo-grid">{group.indexes.map(index=>{const b=paymentBrands[index],available=methods.some(m=>b.pattern.test(m.name));return <button key={b.key} type="button" className="opus-method-button" data-cue={cue===index||undefined} data-brand={b.key} data-unavailable={!loading&&!available||undefined} aria-label={`Pay with ${b.name}`} aria-disabled={disabled||loading||!available} onClick={()=>{if(!disabled)choose(index)}} onPointerEnter={stop}><PaymentBrand name={b.name}/></button>})}</div></section>)}
  <div className="opus-picker-feedback" aria-live="polite">{loading?'Loading available payment methods…':message||error}{error&&<button type="button" onClick={onRetry}>Try again</button>}</div>
 </div>;
}
