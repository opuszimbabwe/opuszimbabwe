'use client';
import {useState} from 'react';
import {DEFAULT_GRAPHIC_DESIGN,type GraphicClassDesign} from '@/lib/graphic-design';
export default function GraphicClassCard({title,body,design,preview=false}:{title:string;body:string;design?:GraphicClassDesign;preview?:boolean}){
 const [failed,setFailed]=useState('');const d=design||DEFAULT_GRAPHIC_DESIGN;if(!d.image||failed===d.image)return preview?<div className="graphic-class-empty">Add an image to show this class on the website.</div>:null;
 const text=<div className="graphic-class-copy" style={{textAlign:d.align,color:d.text_overlay?d.text_color:'#0f0928'}}><h3 style={{fontSize:d.title_size,fontWeight:d.title_weight}}>{title}</h3>{body&&<p style={{fontSize:d.body_size,fontWeight:d.body_weight}}>{body}</p>}</div>;
 return <article className="graphic-class"><div className="graphic-class-media" style={{aspectRatio:d.aspect==='landscape'?'16 / 10':d.aspect==='portrait'?'3 / 4':'1',borderRadius:d.shape==='square'?0:d.shape==='arch'?'50% 50% 24px 24px':d.radius,justifyContent:d.position==='top'?'flex-start':d.position==='center'?'center':'flex-end'}}><img src={d.image} alt={title+' — Opus Zimbabwe design work'} loading="lazy" onError={()=>setFailed(d.image)}/>{d.text_overlay&&<><div className="graphic-class-overlay" aria-hidden="true" style={{background:d.overlay_kind==='gradient'?`linear-gradient(${d.overlay_gradient})`:d.overlay_color,opacity:d.overlay_opacity}}/>{text}</>}</div>{!d.text_overlay&&text}</article>;
}
