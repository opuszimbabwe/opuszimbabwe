'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {CircleAlert,Info,LoaderCircle,Bell} from 'lucide-react';
export type PaymentNotification={id:string;title:string;body:ReactNode;actions?:ReactNode;warning?:boolean;loading?:boolean;field?:boolean;quiet?:boolean};
export default function PaymentNotifications({items}:{items:PaymentNotification[]}){
 const [dismissed,setDismissed]=useState<string[]>([]),[selected,setSelected]=useState(''),[opened,setOpened]=useState(false);
 const keys=items.map(item=>item.id).join('\n');
 useEffect(()=>{setSelected('');const present=new Set(keys.split('\n'));setDismissed(old=>{const next=old.filter(id=>present.has(id));return next.length===old.length?old:next})},[keys]);
 const visible=items.filter(item=>!dismissed.includes(item.id)&&(!item.quiet||opened)),current=visible.find(item=>item.id===selected)||visible[0];
 if(!items.length)return null;
 if(!current)return <button type="button" className="opus-notification-reopen" onClick={()=>{setDismissed([]);setSelected('');setOpened(true)}}><Bell size={15}/>Payment notifications ({items.length})</button>;
 const index=visible.indexOf(current);
 function dismiss(){setDismissed(old=>[...old,current.id]);setSelected('');if(visible.length===1)setOpened(false)}
 return <section id={current.field?'opus-field-notice':undefined} className={`${current.field?'opus-field-notice ':''}opus-checkout-popup`} role={current.warning?'alert':'status'} aria-label={current.title} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();dismiss()}}}>
  <div className="opus-popup-heading"><span className="opus-notice-icon" data-warning={current.warning||undefined} aria-hidden="true">{current.loading?<LoaderCircle size={20} className="payment-spinner"/>:current.warning?<CircleAlert size={20} strokeWidth={2.8}/>:<Info size={20} strokeWidth={2.5}/>}</span><strong>{current.title}</strong><button type="button" className="opus-popup-close" aria-label="Dismiss notification" onClick={dismiss}>×</button></div>
  <div className="opus-popup-copy">{current.body}</div>
  {current.actions&&<div className="opus-popup-actions">{current.actions}</div>}
  {visible.length>1&&<nav className="opus-popup-navigation" aria-label="Notification navigation"><span>{index+1} of {visible.length}</span><button type="button" onClick={()=>setSelected(visible[(index+1)%visible.length].id)}>Next notification</button></nav>}
 </section>;
}
