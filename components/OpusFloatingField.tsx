'use client';
import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'onChange'|'onBlur'> & {label:string;value:string;example?:string;valid?:boolean;invalid?:boolean;onChange:(value:string)=>void;onBlur?:()=>void};
export default function OpusFloatingField({label,value,example,valid=false,invalid=false,onChange,onBlur,id,name,...input}:Props){
 const [completed,setCompleted]=useState(false),[shake,setShake]=useState(false),[blurVersion,setBlurVersion]=useState(0),[trace,setTrace]=useState(0);const timer=useRef<ReturnType<typeof setTimeout>>();
 useEffect(()=>{if(invalid){setShake(true);timer.current=setTimeout(()=>setShake(false),460)}return()=>clearTimeout(timer.current)},[invalid,blurVersion]);
 const confirmed=completed&&valid&&!invalid;const fieldId=id||`opus-field-${name}`;
 return <label className="opus-float-field" htmlFor={fieldId} data-filled={Boolean(value)} data-confirmed={confirmed} data-invalid={invalid} data-shake={shake}>
  <input {...input} id={fieldId} name={name} value={value} placeholder={example||' '} onFocus={()=>setTrace(v=>v+1)} onPointerDown={()=>setTrace(v=>v+1)} aria-invalid={invalid} onChange={e=>{setCompleted(false);onChange(e.target.value)}} onBlur={()=>{setCompleted(true);setBlurVersion(v=>v+1);onBlur?.()}}/>
  <span className="opus-float-caption">{label}</span><FieldOutline key={trace} label={label} id={fieldId}/>
 </label>
}
function FieldOutline({label,id}:{label:string;id:string}){
 const [rotating,setRotating]=useState(false);
 const ref=useRef<SVGSVGElement>(null),[shape,setShape]=useState({width:280,height:56,end:120,start:13});
 useEffect(()=>{const svg=ref.current,field=svg?.parentElement;if(!svg||!field)return;let live=true;
  const update=()=>{if(!live)return;const style=getComputedStyle(field),width=field.clientWidth,height=field.clientHeight,start=parseFloat(style.getPropertyValue('--opus-caption-x'))||13,size=parseFloat(style.getPropertyValue('--opus-caption-size'))||10,padding=parseFloat(style.getPropertyValue('--opus-caption-padding'))||5;
   const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(ctx)ctx.font=`700 ${size}px ${style.fontFamily}`;
   const end=Math.min(width-14,start+(ctx?.measureText(label).width||90)+padding*2);setShape({width,height,start,end});
  };update();const observer=new ResizeObserver(update);observer.observe(field);void document.fonts.ready.then(update);return()=>{live=false;observer.disconnect()};
 },[label]);
 const {width:w,height:h,start,end}=shape,r=11;
 const path=`M ${start} 1 H ${r} Q 1 1 1 ${r} V ${h-r} Q 1 ${h-1} ${r} ${h-1} H ${w-r} Q ${w-1} ${h-1} ${w-1} ${h-r} V ${r} Q ${w-1} 1 ${w-r} 1 H ${end}`;
 const fullPath=`M ${r} 1 H ${w-r} Q ${w-1} 1 ${w-1} ${r} V ${h-r} Q ${w-1} ${h-1} ${w-r} ${h-1} H ${r} Q 1 ${h-1} 1 ${h-r} V ${r} Q 1 1 ${r} 1 Z`;
 const gradient='opus-outline-'+id,mask='opus-outline-mask-'+id;
 return <svg ref={ref} className="opus-field-orbit" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" data-start={start} data-end={end} data-outline-phase={rotating?'rotating':'trace'}><defs><linearGradient id={gradient} x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stopColor="#d7253c"/><stop offset=".45" stopColor="#f45127"/><stop offset="1" stopColor="#ff9828"/></linearGradient><mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}><path className="opus-outline-mask" d={path} fill="none" stroke="white" strokeWidth="1.5"/></mask></defs><path className="opus-outline-base opus-outline-closed" d={fullPath} fill="none"/><path className="opus-outline-base opus-outline-open" d={path} fill="none"/><path className="opus-outline-stroke" d={path} pathLength="100" fill="none" stroke={`url(#${gradient})`} onAnimationEnd={event=>{if(event.animationName==='opus-outline-trace')setRotating(true)}}/><foreignObject className="opus-outline-rotating-layer" x="0" y="0" width={w} height={h} mask={`url(#${mask})`}><div className="opus-outline-rotating-gradient"/></foreignObject></svg>
}
export function OpusFloatingCurrency({disabled=false}:{disabled?:boolean}){const [trace,setTrace]=useState(0);return <label className="opus-float-field opus-float-currency" htmlFor="opus-currency" data-filled="true"><select id="opus-currency" aria-label="Payment currency" value="USD" disabled={disabled} onFocus={()=>setTrace(v=>v+1)} onPointerDown={()=>setTrace(v=>v+1)} onChange={()=>{}}><option value="USD">USD</option><option value="ZiG" disabled>ZiG — temporarily unavailable</option></select><svg className="opus-currency-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span className="opus-float-caption">Currency</span><FieldOutline key={trace} label="Currency" id="opus-currency"/></label>}
