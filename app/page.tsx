import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import ServicesShowcase from '@/components/ServicesShowcase';
import HomeHero from '@/components/HomeHero';
import FaqAccordion from '@/components/FaqAccordion';
import OpusApproach from '@/components/OpusApproach';
import BuiltForZimbabwe from '@/components/BuiltForZimbabwe';
import HomeProjects from '@/components/HomeProjects';
const reasons=[
  ['Quality','Professional digital products built with attention to detail, usability and long-term value.'],
  ['Convenience','From websites and domains to payments and support, accessing digital services stays straightforward.'],
  ['Local Payments','EcoCash · OneMoney · InnBucks · Zimswitch · ZIPIT.'],
  ['Local Support','WhatsApp · Live Chat · Phone · Email.'],
  ['Affordable','Professional digital services priced with individuals, businesses and organisations in mind.'],
  ['Consistency','Consistent quality, communication and support throughout the project.']
];
const faqs=[
  {q:'How do I pay for a project?',a:'You can use EcoCash, OneMoney, InnBucks, Zimswitch and other supported Zimbabwean payment methods.'},
  {q:'How long does a project take?',a:'Timing depends on the scope. We confirm a delivery plan after understanding your requirements.'},
  {q:'Do you provide domains, hosting and business email?',a:'Yes. Domain registration, hosting and professional business email are available through Opus Zimbabwe.'}
];

export default function Home(){
  return <main>
    <HomeHero/>

    {/* Organisations We Have Built For - CENTRE ALIGNED */}
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-primary text-[.8rem] font-semibold uppercase tracking-[.12em] text-center">Organisations We Have Built For</p>
        <h2 className="text-2xl font-bold text-dark mt-3 text-center mx-auto">Real organisations. Real digital work.</h2>
        <p className="mt-3 text-muted-fg text-center mx-auto max-w-2xl">Trusted by businesses, NGOs, and institutions across Zimbabwe.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 items-center max-w-4xl mx-auto">
          {[
            ['/images/partner-great-couples.png','Great Couples International Trust'],
            ['/images/partner-forgepoint.png','ForgePoint Technologies'],
            ['/images/partner-rays-of-hope.png','Rays of Hope Academy'],
            ['/images/partner-killing-giants.png','Killing Giants']
          ].map(([src,alt])=>
            <div key={src} className="bg-white rounded-2xl p-5 h-32 flex items-center justify-center border border-[#f5f5f5] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <img src={src} alt={alt} className="max-h-24 max-w-full object-contain" />
            </div>
          )}
        </div>
      </div>
    </section>

    {/* What We Do - Monzo-style carousel of admin-managed service hero slides */}
    <section id="services" className="py-20 max-w-7xl mx-auto px-6 text-center">
      <p className="text-primary text-[.8rem] font-semibold uppercase tracking-[.12em] text-center">What We Do</p>
      <h2 className="text-[1.7rem] md:text-[2rem] font-bold text-dark mt-3 text-center mx-auto max-w-3xl leading-tight">One team. Every digital capability your organisation needs.</h2>
      <p className="mt-4 text-muted-fg text-center mx-auto max-w-2xl leading-7">From your first online presence to automated systems and connected platforms — everything under one roof, with one team that knows your business.</p>
      <ServicesShowcase/>
    </section>

    <section className="py-20 max-w-5xl mx-auto px-6 text-center">
      <p className="text-primary text-[.8rem] font-semibold uppercase tracking-[.12em] text-center">What is OPUS?</p>
      <h2 className="text-3xl font-bold text-dark mt-3 text-center mx-auto">More than digital services. A digital ecosystem for your business.</h2>
      <p className="mt-5 text-lg text-center mx-auto max-w-3xl leading-7">OPUS is a digitalisation company helping businesses and organisations build the digital ecosystem around their work. From websites and software to AI, automation, hosting and integrations, we connect the digital pieces so your business can work better.</p>
      <Link href="/services" className="inline-flex text-primary font-semibold mt-6 mx-auto">See What We Do <ArrowRight size={16} className="ml-1"/></Link>
    </section>

    {/* The Opus Approach - CENTRE ALIGNED (admin-managed) */}
    <section className="py-20 bg-[#f8f7fb]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-primary text-[.8rem] font-semibold uppercase tracking-[.12em] text-center">The Opus Approach</p>
        <h2 className="text-3xl font-bold text-dark mt-3 text-center mx-auto">Your business is more than one digital tool.</h2>
        <p className="mt-4 max-w-3xl mx-auto text-center text-muted-fg leading-7">A website should not exist separately from your operations. Your digital tools should work together.</p>
        <OpusApproach/>
      </div>
    </section>

    <section id="why" className="py-24 border-b border-[#eeeeee]">
      <div className="max-w-5xl mx-auto px-6">
        <p className="text-primary text-[.78rem] font-semibold uppercase tracking-[.14em] text-center">Why choose Opus Zimbabwe</p>
        <h2 className="text-3xl font-bold text-dark mt-3 max-w-xl mx-auto text-center">Fast, affordable, and built to last — with a team that picks up the phone.</h2>
        <div className="mt-16">
          {reasons.map(([title,body],i)=>
            <div key={title} className="flex items-stretch gap-6 md:gap-10 py-10 border-b border-[#eeeeee]">
              <div className="flex-shrink-0 w-px self-stretch bg-primary/30"/>
              <div className="flex-1 py-1">
                <h3 className="text-xl font-bold text-dark">{title}</h3>
                <p className="mt-2 text-[1rem] text-fg max-w-lg leading-7">{body}</p>
              </div>
              <div className="flex-shrink-0 w-8 flex items-start justify-end pt-1">
                <span className="text-[.7rem] font-bold text-primary/40 tracking-widest">{String(i+1).padStart(2,'0')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>

    {/* Our Projects (admin-managed: active = link, coming_soon = badge) */}
    <section className="py-20 max-w-7xl mx-auto px-6 text-center">
      <p className="text-primary text-[.8rem] font-semibold uppercase tracking-[.12em] text-center">Our Projects</p>
      <h2 className="text-[1.53rem] font-bold text-dark mt-2 text-center mx-auto">Live work. Real clients. Real results.</h2>
      <HomeProjects/>
    </section>

    <BuiltForZimbabwe/>

    <section className="py-20 max-w-3xl mx-auto px-6 text-center">
      <p className="text-primary text-[.8rem] font-semibold uppercase tracking-[.12em] text-center">FAQ</p>
      <h2 className="text-2xl font-bold text-dark mt-2 text-center">Common questions.</h2>
      <div className="mt-7 text-left">
        <FaqAccordion list="home" items={faqs}/>
      </div>
      <Link href="/faq" className="inline-flex text-primary font-semibold mt-6">See all questions <ArrowRight size={16} className="ml-1"/></Link>
    </section>

    <section className="py-20 bg-dark text-white text-center">
      <h2 className="text-3xl font-bold">Ready to get your business online properly?</h2>
      <Link href="/contact" className="inline-flex bg-primary hover:bg-white hover:text-dark text-white rounded-full px-8 py-3.5 font-semibold mt-7 transition-colors">Contact Us</Link>
    </section>
  </main>
}
