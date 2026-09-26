'use client';
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight} from 'lucide-react';

const services=[
  ['Website Design & Development','/images/hero-website-design.png','/services/web-design'],
  ['Software & System Development','/images/hero-software-systems.png','/services/software-development'],
  ['AI Solutions & Automation','/images/hero-ai-automation.png','/services/ai-automation'],
  ['Graphic Design & Branding','/images/hero-graphic-design.png','/services/graphic-design'],
  ['Domain Registration & Web Hosting','/images/hero-domains-hosting.png','/services/domains-hosting'],
  ['API & System Integrations','/images/hero-api-integrations.png','/services/api-integrations']
];

export default function HomeHero(){
  const[i,setI]=useState(0);
  useEffect(()=>{
    const t=setInterval(()=>setI(x=>(x+1)%services.length),4000);
    return()=>clearInterval(t)
  },[]);
  const [name,img,href]=services[i];
  return (
    <section className="min-h-[92vh] bg-dark relative flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <Image src="/images/hero-bg.jpg" alt="" fill priority className="object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20"/>
      </div>
      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <div className="min-h-[340px] flex flex-col justify-center">
          <h1 key={name} className="text-[clamp(2.6rem,5.2vw+1rem,4.2rem)] font-extrabold text-white leading-[0.98] tracking-tight max-w-2xl animate-[rise-in_0.7s_ease_both]">
            {name}
          </h1>
          <p className="mt-6 text-white/70 text-[1.05rem] max-w-xl leading-7">
            Professional work, fast turnaround, and support that stays with you after launch — built for Zimbabwean organisations.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link href={href} className="bg-white text-dark rounded-full px-7 py-3.5 font-semibold inline-flex items-center gap-2 hover:bg-primary hover:text-white transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
              Explore service <ArrowRight size={18}/>
            </Link>
            <Link href="/services" className="border border-white/30 text-white rounded-full px-7 py-3.5 font-semibold hover:bg-white hover:text-dark transition-colors backdrop-blur-sm">
              View all services
            </Link>
          </div>
        </div>
        <Link href={href} aria-label={name} className="relative block w-full h-[520px] md:h-[640px] lg:h-[700px] group">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={img}
              alt={name}
              className="w-full h-full object-contain object-center drop-shadow-[0_24px_48px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:drop-shadow-[0_28px_56px_rgba(0,0,0,0.7)]"
            />
          </div>
          <div className="absolute bottom-6 left-6 right-6 bg-white rounded-2xl p-4 text-dark font-semibold flex justify-between items-center shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-md">
            <span className="text-[0.95rem]">{name}</span>
            <span className="h-9 w-9 rounded-full bg-dark text-white flex items-center justify-center group-hover:bg-primary transition-colors">
              <ArrowRight size={16}/>
            </span>
          </div>
        </Link>
      </div>
    </section>
  )
}
