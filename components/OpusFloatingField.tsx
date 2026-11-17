'use client';
import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';
import {Check} from 'lucide-react';
type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'onChange'|'onBlur'> & {label:string;value:string;valid?:boolean;invalid?:boolean;onChange:(value:string)=>void;onBlur?:()=>void};
export default function OpusFloatingField({label,value,valid=false,invalid=false,onChange,onBlur,id,name,...input}:Props){
 const [completed,setCompleted]=useState(false),[shake,setShake]=useState(false),[blurVersion,setBlurVersion]=useState(0);const timer=useRef<ReturnType<typeof setTimeout>>();
 useEffect(()=>{if(invalid){setShake(true);timer.current=setTimeout(()=>setShake(false),460)}return()=>clearTimeout(timer.current)},[invalid,blurVersion]);
 const confirmed=completed&&valid&&!invalid;const fieldId=id||`opus-field-${name}`;
 return <label className="opus-float-field" htmlFor={fieldId} data-filled={Boolean(value)} data-confirmed={confirmed} data-invalid={invalid} data-shake={shake}>
  <input {...input} id={fieldId} name={name} value={value} placeholder=" " aria-invalid={invalid} onChange={e=>{setCompleted(false);onChange(e.target.value)}} onBlur={()=>{setCompleted(true);setBlurVersion(v=>v+1);onBlur?.()}}/>
  <span className="opus-float-caption">{label}</span><i className="opus-field-orbit" aria-hidden="true"/>{confirmed&&<Check className="opus-field-check" size={15} strokeWidth={2.5} aria-hidden="true"/>}
 </label>
}
export function OpusFloatingCurrency({disabled=false}:{disabled?:boolean}){return <label className="opus-float-field opus-float-currency" htmlFor="opus-currency" data-filled="true"><select id="opus-currency" aria-label="Payment currency" value="USD" disabled={disabled} onChange={()=>{}}><option value="USD">USD</option><option value="ZiG" disabled>ZiG — temporarily unavailable</option></select><span className="opus-float-caption">Currency</span><i className="opus-field-orbit" aria-hidden="true"/></label>}
