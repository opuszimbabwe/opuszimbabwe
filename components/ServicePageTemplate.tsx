import Link from 'next/link'
import { PricingSection } from '@/components/PricingCard'
import ServiceExtras from '@/components/ServiceExtras'
import ServiceHero from '@/components/ServiceHero'
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
  /** Service id whose admin-managed hero / Why Opus / related links apply. */
  serviceId?: string;
  /** Domain CTAs pre-fill the enquiry form with an extra &domain= field. */
  domainCta?: boolean;
}

export default function ServicePageTemplate({
  data,
  pricing,
}: {
  data: ServicePageData;
  pricing?: { name: string; monthlyPrice: string; yearlyPrice: string; features: string[] }[];
}) {
  const steps = data.process.split('→').map((s) => s.trim())

  return (
    <main>
      <ServiceHero
        serviceId={data.serviceId}
        serviceName={data.eyebrow}
        domainCta={data.domainCta}
        fallback={{
          eyebrow: data.eyebrow,
          headline: data.headline,
          intro: data.intro,
          cta: data.cta,
          background: data.image,
        }}
      />

      <section className="mx-auto max-w-7xl border-t border-[#eeeeee] px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1.2fr_.8fr]">
          <div>
            <h2 className="text-2xl font-bold text-dark">{data.sectionTitle}</h2>
            <p className="mt-5 leading-7 text-fg">{data.body}</p>
            <h3 className="mt-12 text-[1rem] font-bold text-dark">What we provide</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.items.map((x) => {
                const logos: Record<string, string> = {
                  'Paynow Payment Integration': '/images/paynow-logo.png',
                  'EcoCash Integration': '/images/ecocash-logo.png',
                  'Stripe & International Payments': '/images/stripe-logo.webp',
                  'WhatsApp Business API': '/images/meta-logo.png',
                  'Google Workspace APIs': '/images/google-logo.png',
                  'Microsoft APIs': '/images/microsoft-logo.png',
                }
                return (
                  <div key={x} className="flex items-center gap-3 rounded-xl border border-[#e8e8e8] bg-muted p-4 text-[.9rem] text-fg">
                    {data.eyebrow.includes('API') && logos[x] && (
                      <img src={logos[x]} alt="" className="h-7 w-7 object-contain" />
                    )}
                    <span>{x}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <aside className="h-fit rounded-[26px] border border-[#e8e8e8] bg-[#f8f7fb] p-7">
            <p className="text-[.78rem] font-semibold uppercase tracking-[.12em] text-primary">Starting point</p>
            <p className="mt-2 text-4xl font-bold text-dark">{data.price}</p>
            <div className="mt-6 border-t border-[#eeeeee] pt-6">
              <p className="mb-1 text-[.82rem] font-semibold text-dark">Who it is for</p>
              <p className="text-[.9rem] leading-6 text-fg">{data.who}</p>
            </div>
            <div className="mt-5 border-t border-[#eeeeee] pt-5">
              <p className="mb-3 text-[.82rem] font-semibold text-dark">How it works</p>
              <div className="flex flex-wrap gap-2">
                {steps.map((step, i) => (
                  <span key={step} className="flex items-center gap-1.5 text-[.8rem] text-fg">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary">{step}</span>
                    {i < steps.length - 1 && <span className="text-[#cccccc]">›</span>}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href={`/contact?service=${encodeURIComponent(data.eyebrow)}${data.domainCta ? '&domain=' : ''}`}
              className="mt-7 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
            >
              Get in touch
            </Link>
          </aside>
        </div>
      </section>

      {pricing && (
        <section className="border-t border-[#eeeeee] bg-[#f8f7fb] py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-center text-2xl font-bold text-dark">Website Packages</h2>
            <p className="mt-2 mb-10 text-center text-[#6b7280]">Choose a package or contact us for a custom quote.</p>
            <PricingSection pricing={pricing} />
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl border-t border-[#eeeeee] px-6 py-20">
        <ServiceExtras
          serviceId={data.serviceId}
          fallbackWhy={DEFAULT_EXTRAS.why_items}
          fallbackRelated={DEFAULT_EXTRAS.related_items}
        />

        <div className="mt-20 rounded-[28px] bg-primary p-8 text-white md:p-12">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 max-w-xl leading-7 text-white/70">
            Tell us what you need and we will scope it, price it clearly, and get moving fast.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-full bg-primary px-6 py-3 font-semibold text-white">
              Get Started
            </Link>
            <a
              href="https://wa.me/263776396530"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/30 px-6 py-3 font-semibold text-white"
            >
              Talk to us on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
