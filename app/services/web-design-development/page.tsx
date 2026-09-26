import Link from 'next/link';
import PricingCard from '@/components/PricingCard';
import ServiceExtras from '@/components/ServiceExtras';
import ServiceHero from '@/components/ServiceHero';
import { DEFAULT_EXTRAS } from '@/lib/content';

const plans: [string, string, string[]][] = [
  ['Starter', '$30', ['Up to 5 pages', 'Responsive design', 'Contact form', 'Basic SEO']],
  ['Standard', '$60', ['Everything in Starter', 'Up to 10 pages', 'Gallery', 'Enhanced SEO']],
  ['Business', '$100', ['Everything in Standard', 'CMS integration', 'Portfolio section']],
  ['Professional', '$200', ['Advanced UI/UX', 'Booking systems', 'Client dashboard', 'API integrations']],
  ['Premium', '$400', ['Advanced integrations', 'AI features', 'Priority support', 'Strategy session']],
  ['Custom', 'Custom', ['Websites, portals, platforms, SaaS', 'Bespoke digital experiences']],
];

export default function WebsitePage() {
  return (
    <main>
      <ServiceHero
        serviceId="web-design"
        serviceName="Website Design & Development"
        fallback={{
          eyebrow: 'Website Design & Development',
          headline: 'Digital experiences that work.',
          intro: 'We build responsive websites that help Zimbabwean organisations communicate clearly and move work forward.',
          cta: 'View Packages',
        }}
      />

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mt-2 text-2xl font-bold text-dark">Website packages</h2>
        <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PricingCard key={p[0]} name={p[0]} price={p[1]} features={p[2] as string[]} />
          ))}
        </div>
        <Link
          href="/services/web-design"
          className="mt-10 inline-flex rounded-full bg-primary px-6 py-3 font-semibold text-white"
        >
          See full service details
        </Link>
      </section>

      <section className="mx-auto max-w-7xl border-t border-[#eeeeee] px-6 py-20">
        <ServiceExtras
          serviceId="web-design"
          fallbackWhy={DEFAULT_EXTRAS.why_items}
          fallbackRelated={DEFAULT_EXTRAS.related_items}
        />
      </section>
    </main>
  );
}
