import Link from 'next/link'
import { PricingSection } from '@/components/PricingCard'
import ServiceExtras from '@/components/ServiceExtras'
import ServiceHero from '@/components/ServiceHero'
import ServiceVisual from '@/components/ServiceVisual'
import { DEFAULT_EXTRAS } from '@/lib/content'

export type ServicePageData = {
  eyebrow: string;
  headline: string;
  intro: string;
  cta: string;
  image: string;
  sectionTitle: string;
  body: string;
  items: string[];
  price: string;
  process: string;
  who: string;
  serviceId?: string;
  domainCta?: boolean;
}

const label = 'text-[.74rem] font-bold uppercase tracking-[.16em] text-primary'
const rule = 'border-b border-[#e7e9e8] py-6'

export default function ServicePageTemplate({
  data,
  pricing,
}: {
  data: ServicePageData;
  pricing?: { name: string; monthlyPrice: string; yearlyPrice: string; features: string[] }[];
}) {
  const steps = data.process.split('→').map((s) => s.trim()).filter(Boolean)
  const contactHref = `/contact?service=${encodeURIComponent(data.eyebrow)}${data.domainCta ? '&domain=' : ''}`

  return (
    <main>
      <ServiceHero
        serviceId={data.serviceId}
        serviceName={data.eyebrow}
        domainCta={data.domainCta}
        fallback={{ eyebrow: data.eyebrow, headline: data.headline, intro: data.intro, cta: data.cta, background: data.image }}
      />

      <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <p className={label}>01 — Introduction</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-dark md:text-5xl">{data.sectionTitle}</h2>
        <p className="mt-6 max-w-3xl text-[1.05rem] leading-8 text-fg">{data.body}</p>
        <Link
          href={contactHref}
          className="mt-8 inline-flex rounded-full px-6 py-3.5 font-semibold text-white shadow-[0_8px_20px_rgba(232,93,42,.22)] transition hover:brightness-105"
          style={{ background: 'linear-gradient(90deg,#E85D2A 0%,#F97316 52%,#F4A226 100%)' }}
        >
          {data.cta}
        </Link>
      </section>

      <section className="border-y border-[#eeeeee] bg-[#fafbfa]">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <p className={label}>02 — What we do</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-dark md:text-4xl">Capabilities built around your needs.</h2>
          <div className="mt-10">
            {data.items.map((item, index) => (
              <div key={item} className={rule + ' flex items-start gap-6'}>
                <span className="pt-1 text-[.75rem] font-bold tracking-[.14em] text-primary">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-lg font-semibold text-dark">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <p className={label}>03 — How it works / what you get</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-dark md:text-4xl">A clear process from first conversation to launch.</h2>
        <div className="mt-10">
          {steps.map((step, index) => (
            <div key={`${step}-${index}`} className={rule + ' flex items-center gap-6'}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
              <span className="text-lg font-semibold text-dark">{step}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[.95rem] leading-7 text-muted-fg">Starting point: <strong className="text-dark">{data.price}</strong></p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:pb-24">
        <p className={label + ' text-center'}>04 — Visual / example</p>
        <ServiceVisual serviceId={data.serviceId} fallback={data.image} />
      </section>

      <section className="border-y border-[#eeeeee]">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <p className={label}>05 — Who it is for</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-dark md:text-4xl">For organisations ready to work better.</h2>
          <p className="mt-6 max-w-2xl text-[1.05rem] leading-8 text-fg">{data.who}</p>
        </div>
      </section>

      {pricing && (
        <section className="bg-[#f8f7fb] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <p className={label + ' text-center'}>Pricing</p>
            <h2 className="mt-3 text-center text-3xl font-bold text-dark">Website Packages</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-[#6b7280]">Choose a package or contact us for a custom quote.</p>
            <div className="mt-10"><PricingSection pricing={pricing} /></div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <p className={label}>06 — Related services</p>
        <div className="mt-8"><ServiceExtras serviceId={data.serviceId} fallbackWhy={DEFAULT_EXTRAS.why_items} fallbackRelated={DEFAULT_EXTRAS.related_items} /></div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-dark px-7 py-16 text-center text-white shadow-[0_16px_45px_rgba(0,0,0,.14)] sm:px-12">
          <p className="text-[.74rem] font-bold uppercase tracking-[.16em] text-primary">07 — Ready to get started?</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold md:text-5xl">Tell us what you need. We will take it from there.</h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70">We will scope it, price it clearly, and get moving fast.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="rounded-full px-6 py-3 font-semibold text-white" style={{ background: 'linear-gradient(90deg,#E85D2A 0%,#F97316 52%,#F4A226 100%)' }}>Get started</Link>
            <a href="https://wa.me/263776396530" target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white">Talk on WhatsApp</a>
          </div>
        </div>
      </section>
    </main>
  )
}
