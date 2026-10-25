'use client';
import {useState} from 'react';
import {Search} from 'lucide-react';
export default function EditorFinder(){
 const [query,setQuery]=useState(''),[result,setResult]=useState('');
 function find(e:React.FormEvent){e.preventDefault();const text=query.trim().toLowerCase();if(!text)return;const root=document.querySelector('.admin-editor-content');if(!root)return;const target=[...root.querySelectorAll<HTMLElement>('label, h2, h3, summary')].find(node=>node.textContent?.toLowerCase().includes(text));if(!target){setResult('No matching control in this section.');return;}let parent:HTMLElement|null=target;while(parent){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});target.querySelector<HTMLElement>('input,textarea,select,button')?.focus({preventScroll:true});target.animate([{outline:'3px solid #E85D2A',outlineOffset:'6px'},{outline:'3px solid transparent',outlineOffset:'12px'}],{duration:1600});setResult('Found: '+(target.textContent||'').slice(0,70));}
 return <form className="admin-editor-finder" onSubmit={find} role="search"><Search size={16}/><label className="sr-only" htmlFor="find-editor-control">Find a control in this section</label><input id="find-editor-control" value={query} onChange={e=>{setQuery(e.target.value);setResult('')}} placeholder="Find a control in this section…"/><button type="submit">Find</button><span role="status" className="sr-only">{result}</span></form>;
}
