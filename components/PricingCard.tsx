'use client'
import {useState} from 'react'
import Link from 'next/link'

function Card({
  name,
  monthlyPrice,
  yearlyPrice,
  yearly,
  features
}: {
  name:string;
  monthlyPrice:string;
  yearlyPrice:string;
  yearly:boolean;
  features:string[]
}) {
  const professional = name==='Professional'
  const custom = name==='Custom'
  const price = custom ? monthlyPrice : yearly ? yearlyPrice : monthlyPrice
  const suffix = custom ? '' : yearly ? '/year' : '/project'

  return (
    <article className="bg-white rounded-[20px] p-2.5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#f0f0f0] min-h-[410px] transition-all hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)]">
      {/* Top like in reference image */}
      <div className={`${professional?'bg-[#dce8f7]':'bg-[#f1f1f1]'} rounded-[14px] p-4 pb-4`}>
        <span className="inline-block bg-white rounded-full px-3 py-1 text-[.62rem] font-semibold uppercase tracking-[.08em] text-dark shadow-sm">
          {name}
        </span>
        <h3 className="text-[2rem] leading-none font-bold text-dark mt-8 tracking-tight">
          {price}
          {!custom && <span className="text-[14px] font-medium ml-0.5">{suffix}</span>}
        </h3>
        {!custom && yearly && (
          <p className="text-[.68rem] text-[#6b7280] mt-1.5">2 months free vs monthly</p>
        )}
      </div>

      <div className="px-1.5 pt-4">
        <p className="text-[12.5px] font-medium text-dark">
          {professional?'Perfect for growing organisations':custom?'For large organisations':'Perfect for small organisations'}
        </p>
        <Link href="/contact" className="w-full mt-5 bg-dark hover:bg-[#111] text-white rounded-full py-2.5 text-[13px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,.18)] flex justify-center transition-colors">
          {custom?'Contact Us':'Start a Project'}
        </Link>
      </div>

      <div className="h-px bg-[#ececec] my-5 mx-1.5"/>

      <div className="px-1.5 pb-3">
        {features.map(f=>
          <p key={f} className="text-[12.5px] text-[#4a4a4a] mb-3 flex items-start gap-2 leading-5">
            <span className="text-[#a0a0a0] mt-[1px] flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5l10 -10"/></svg>
            </span>
            {f}
          </p>
        )}
      </div>
    </article>
  )
}

function BillingToggle({yearly,setYearly}:{yearly:boolean;setYearly:(v:boolean)=>void}){
  return (
    <div className="flex items-center justify-center mb-10">
      <div className="inline-flex items-center bg-[#f3f4f6] rounded-full p-1 gap-1">
        <button onClick={()=>setYearly(false)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${!yearly?'bg-white text-dark shadow-sm':'text-[#6b7280] hover:text-dark'}`}>
          Monthly
        </button>
        <button onClick={()=>setYearly(true)} className={`rounded-full px-5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${yearly?'bg-white text-dark shadow-sm':'text-[#6b7280] hover:text-dark'}`}>
          Annual
          {!yearly && <span className="ml-1 text-[.65rem] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">Save 17%</span>}
        </button>
      </div>
    </div>
  )
}

export function PricingSection({pricing}:{pricing:{name:string;monthlyPrice:string;yearlyPrice:string;features:string[]}[]}){
  const[yearly,setYearly]=useState(false);
  return (
    <div>
      <BillingToggle yearly={yearly} setYearly={setYearly}/>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pricing.map(p=><Card key={p.name} {...p} yearly={yearly}/>)}
      </div>
    </div>
  )
}

export default function PricingCard({name,price,features}:{name:string;price:string;features:string[]}){
  return <Card name={name} monthlyPrice={price} yearlyPrice={price} yearly={false} features={features}/>
}
