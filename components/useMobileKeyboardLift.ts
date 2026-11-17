'use client';
import {useEffect,useState,type RefObject} from 'react';

// The keyboard changes the visible window, not the customer's form layout.
// Capture normal geometry before it opens; restore every inline style on close.
const geometry=['display','position','clip-path','white-space','overflow','width','height','min-height','max-width','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','row-gap','column-gap','grid-template-columns','grid-column-start','grid-column-end','font-size','line-height'] as const;
type SavedStyle={element:HTMLElement;values:[string,string,string][];normal:[string,string][]};
type Snapshot={card:HTMLElement;button:HTMLElement;top:number;left:number;width:number;viewportHeight:number;viewportWidth:number;styles:SavedStyle[];active:boolean};
export default function useMobileKeyboardLift(root:RefObject<HTMLElement>){
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  const page=root.current;if(!page)return;let snapshot:Snapshot|null=null,frame=0;
  const viewport=()=>({height:window.visualViewport?.height||innerHeight,top:window.visualViewport?.offsetTop||0,width:innerWidth});
  function restore(){
   if(!snapshot)return;
   for(const saved of snapshot.styles)for(const [property,value,priority]of saved.values){if(value)saved.element.style.setProperty(property,value,priority);else saved.element.style.removeProperty(property)}
   snapshot=null;page!.removeAttribute('data-mobile-keyboard');setOpen(false);
  }
  function capture(target:EventTarget|null){
   if(!(target instanceof HTMLElement)||!target.matches('input:not([type=hidden]),textarea')||innerWidth>700||snapshot)return;
   const card=target.closest<HTMLElement>('#payment-entry,.opus-wallet-panel'),button=card?.querySelector<HTMLButtonElement>('.payment-submit');if(!card||!button||!page!.contains(card))return;
   const box=card.getBoundingClientRect(),v=viewport();
   const styles=[card,...card.querySelectorAll<HTMLElement>('*')].filter(e=>e instanceof HTMLElement&&!e.classList.contains('opus-float-caption')).map(element=>{
    const computed=getComputedStyle(element),properties=[...geometry,...(element===card?['top','left','transform','translate','animation','z-index']:[])];
    return {element,values:properties.map(property=>[property,element.style.getPropertyValue(property),element.style.getPropertyPriority(property)] as [string,string,string]),normal:geometry.map(property=>[property,computed.getPropertyValue(property)] as [string,string])};
   });
   snapshot={card,button,top:box.top,left:box.left,width:box.width,viewportHeight:v.height,viewportWidth:v.width,styles,active:false};
  }
  function update(){
   frame=0;const s=snapshot;if(!s)return;if(!s.card.isConnected||Math.abs(innerWidth-s.viewportWidth)>40){restore();return}
   const v=viewport();if(s.viewportHeight-v.height<100){if(s.active)restore();return}
   if(!s.active){
    s.active=true;s.card.setAttribute('data-keyboard-settled','true');
    for(const saved of s.styles)for(const [property,value]of saved.normal)saved.element.style.setProperty(property,value);
    Object.assign(s.card.style,{position:'fixed',left:s.left+'px',width:s.width+'px',top:'0px',transform:'none',translate:'none',animation:'none',zIndex:'30',margin:'0'});
    page!.setAttribute('data-mobile-keyboard','true');setOpen(true);
   }
   // Measure from the submit button, so helper copy/card padding below it may
   // naturally sit behind the keyboard. No document scrolling or field scaling.
   s.card.style.top='0px';
   const end=s.button.getBoundingClientRect().bottom;
   s.card.style.top=Math.min(s.top,v.top+v.height-8-end)+'px';
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update)};
  const pointer=(e:PointerEvent)=>{capture(e.target)};
  const focus=(e:FocusEvent)=>{capture(e.target);schedule()};
  const blur=()=>{requestAnimationFrame(()=>{if(snapshot&&!snapshot.active&&!snapshot.card.contains(document.activeElement))restore()})};
  page.addEventListener('pointerdown',pointer);page.addEventListener('focusin',focus);page.addEventListener('focusout',blur);
  window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
  const observer=new MutationObserver(()=>{if(snapshot&&!snapshot.card.isConnected)restore()});observer.observe(page,{childList:true,subtree:true});
  return()=>{observer.disconnect();cancelAnimationFrame(frame);page.removeEventListener('pointerdown',pointer);page.removeEventListener('focusin',focus);page.removeEventListener('focusout',blur);window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('scroll',schedule);restore()};
 },[root]);
 return open;
}
