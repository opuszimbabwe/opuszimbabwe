'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Check,ArrowUpRight} from 'lucide-react';
import type {CarePlan} from '@/lib/care';
export default function CarePlans(){
 const [plans,setPlans]=useState<CarePlan[]>([]);
 useEffect(()=>{const controller=new AbortController();fetch('/api/care-plans',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(b=>{if(b)setPlans(b.plans)}).catch(()=>{});return()=>controller.abort();},[]);
 if(!plans.length)return null;
 return <section id="care" className="site-frame care-public"><div className="care-public-heading"><h2>Keep your business<br/><span className="textured-accent">moving.</span></h2><p>Ongoing care for websites, software and digital systems. Clear monthly limits. A report you can understand.</p></div><div className="care-plan-grid">{plans.map(plan=><article className="care-plan" key={plan.price_usd}><h3>{plan.name}</h3><p className="care-plan-price">US${plan.price_usd}<span>/ month</span></p><p>{plan.summary}</p><ul>{plan.features.map(f=><li key={f}><Check size={16}/>{f}</li>)}</ul><Link href={`/contact/?service=${encodeURIComponent(`Monthly care — USD ${plan.price_usd}`)}`}>Choose {plan.name}<ArrowUpRight size={17}/></Link></article>)}</div><p className="care-plan-terms">Per project. Included time resets monthly and does not roll over. Support: Monday–Friday, 08:00–17:00 Zimbabwe time, excluding public holidays. Priority means queue priority during those hours, with no guaranteed repair time. Hosting, domains, paid services, new development and work beyond the included time are quoted separately. Backup verification is included only when a backup source is connected.</p></section>;
}
