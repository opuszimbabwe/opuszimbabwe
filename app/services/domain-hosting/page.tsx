import Link from 'next/link';
import ServiceExtras from '@/components/ServiceExtras';
import ServiceHero from '@/components/ServiceHero';
import { DEFAULT_EXTRAS } from '@/lib/content';

export default function ServicePage() {
  return (
    <main>
      <ServiceHero
        serviceId="domains-hosting"
        serviceName="Domain Registration & Web Hosting"
        fallback={{
          eyebrow: 'Domain Registration & Hosting',
          headline: 'A reliable digital foundation.',
          intro: 'Domains, hosting and professional business email — configured correctly and supported locally.',
          cta: 'Register a Domain',
        }}
      />
      <section className="mx-auto max-w-5xl px-6 py-20">
        <p className="mt-5 max-w-2xl">
          Practical digital services designed around how your organisation works. Explore the service and speak with
          our team about the right next step.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {['Planning and consultation', 'Design and implementation', 'Handover and ongoing support'].map((x) => (
            <div key={x} className="rounded-[20px] bg-muted p-6">
              <h2 className="font-bold text-dark">{x}</h2>
              <p className="mt-2 text-sm text-muted-fg">
                A clear, outcome-focused approach from first conversation to delivery.
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/services/domains-hosting"
          className="mt-10 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-white"
        >
          See full service details
        </Link>
      </section>
      <section className="mx-auto max-w-5xl border-t border-[#eeeeee] px-6 py-20">
        <ServiceExtras
          serviceId="domains-hosting"
          fallbackWhy={DEFAULT_EXTRAS.why_items}
          fallbackRelated={DEFAULT_EXTRAS.related_items}
        />
      </section>
    </main>
  );
}
