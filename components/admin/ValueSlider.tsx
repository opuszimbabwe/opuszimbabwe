'use client';
import {useEffect,useId,useState} from 'react';
import {RotateCcw} from 'lucide-react';
export default function ValueSlider({label,value,min,max,step=1,defaultValue,onChange}:{label:string;value:number;min:number;max:number;step?:number;defaultValue:number;onChange:(value:number)=>void}){
 const id=useId(),[draft,setDraft]=useState(String(value));useEffect(()=>setDraft(String(value)),[value]);
 const bounded=(n:number)=>Number(Math.min(max,Math.max(min,Math.round(n/step)*step)).toFixed(5));
 const reset=()=>{const next=bounded(defaultValue);setDraft(String(next));onChange(next)};
 function commit(){const n=Number(draft);const next=draft.trim()&&Number.isFinite(n)?bounded(n):value;setDraft(String(next));onChange(next)}
 return <div className="value-slider"><div className="value-slider-heading"><label htmlFor={id}>{label}</label><div><input id={id} aria-label={label+' value'} type="number" min={min} max={max} step={step} value={draft} title={'Double-click to restore '+defaultValue} onDoubleClick={reset} onChange={e=>{setDraft(e.target.value);const n=Number(e.target.value);if(e.target.value.trim()&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n)}} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit()}}}/><button type="button" onClick={reset} aria-label={'Restore '+label+' default'} title={'Restore '+defaultValue}><RotateCcw size={14}/></button></div></div><input aria-label={label+' slider'} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/><span className="value-slider-hint">Drag or type · double-click the value to restore</span></div>;
}
