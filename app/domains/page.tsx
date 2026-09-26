import Link from 'next/link';
import DomainSearchBar from '@/components/DomainSearchBar';
import { contactHref } from '@/lib/content';

const SERVICE = 'Domain Registration & Web Hosting';

const localDomains = [
  ['.co.zw', '$5/year', 'The standard for Zimbabwean businesses'],
  ['.org.zw', '$6/year', 'For NGOs and non-profit organisations'],
  ['.ac.zw', '$6/year', 'For academic and educational institutions'],
];
const intlDomains = [
  ['.com', '$15/year', 'The global standard'],
  ['.org', '$15/year', 'International organisations'],
  ['.net', '$20/year', 'Technology and networks'],
];

export default function Domains() {
  return (
    <main>
      <section className="mx-auto max-w-5xl border-b border-[#eeeeee] px-6 py-20">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-primary">
          Domains, Hosting & Business Email
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight text-dark md:text-5xl">
          Your domain. Your email. Your business, online and credible.
        </h1>
        <p className="mt-5 max-w-2xl leading-7 text-fg">
          Register your domain, set up reliable hosting and get a professional business email address — all from one
          place, configured correctly from day one.
        </p>
        <div className="mt-8 max-w-2xl">
          <DomainSearchBar />
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-b border-[#eeeeee] px-6 py-20">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-primary">Zimbabwe Domains</p>
        <h2 className="mt-2 text-2xl font-bold text-dark">
          Establish your Zimbabwean presence with a local domain.
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-fg">
          A .co.zw domain tells customers immediately that you are a legitimate Zimbabwean business. Local domains also
          rank better in Zimbabwean search results.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {localDomains.map(([ext, price, note]) => (
            <div
              key={ext}
              className="rounded-[20px] border border-[#e8e8e8] bg-white p-6 transition-all hover:border-primary/40"
            >
              <h3 className="text-2xl font-bold text-dark">{ext}</h3>
              <p className="mt-1 text-lg font-bold text-primary">{price}</p>
              <p className="mt-2 text-[.85rem] leading-5 text-muted-fg">{note}</p>
              <Link
                href={contactHref(SERVICE, ext)}
                className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-dark"
              >
                Register domain
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-b border-[#eeeeee] px-6 py-16">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-primary">International Domains</p>
        <h2 className="mt-2 text-2xl font-bold text-dark">International extensions also available.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {intlDomains.map(([ext, price, note]) => (
            <div key={ext} className="rounded-[20px] border border-[#e8e8e8] bg-[#f8f7fb] p-6">
              <h3 className="text-2xl font-bold text-dark">{ext}</h3>
              <p className="mt-1 text-lg font-bold text-primary">{price}</p>
              <p className="mt-2 text-[.85rem] leading-5 text-muted-fg">{note}</p>
              <Link
                href={contactHref(SERVICE, ext)}
                className="mt-5 inline-flex rounded-full border border-dark px-4 py-2 text-sm font-semibold text-dark transition-colors hover:bg-dark hover:text-white"
              >
                Register domain
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-b border-[#eeeeee] px-6 py-20">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.14em] text-primary">Hosting & Email</p>
        <h2 className="mt-2 text-2xl font-bold text-dark">
          Everything else your digital presence needs to run.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {[
            [
              'Web Hosting',
              'From $10/month',
              ['SSL certificate included', 'Regular automated backups', 'Security configuration', 'Deployment assistance', 'Technical support'],
              'Enquire about hosting',
            ],
            [
              'Business Email',
              'From $20/month',
              ['Your own domain address', 'Full mailbox and webmail', 'Mobile email setup', 'Spam and security filtering', 'Multiple addresses available'],
              'Enquire about email',
            ],
          ].map(([title, price, features, cta]) => (
            <div key={title as string} className="rounded-[24px] border border-[#e8e8e8] bg-white p-7">
              <p className="mb-3 text-[.72rem] font-semibold uppercase tracking-widest text-primary">{title}</p>
              <h3 className="text-2xl font-bold text-dark">{price}</h3>
              <p className="mt-3 text-[.95rem] leading-7 text-fg">
                Professional infrastructure configured and supported by Opus Zimbabwe.
              </p>
              <div className="mt-5 grid gap-2">
                {(features as string[]).map((f) => (
                  <p key={f} className="text-[.85rem] text-fg">
                    ✓ {f}
                  </p>
                ))}
              </div>
              <Link
                href={contactHref(SERVICE, '')}
                className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-dark"
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-dark py-20 text-center text-white">
        <h2 className="text-3xl font-bold">Not sure which domain or package you need?</h2>
        <p className="mx-auto mt-3 max-w-lg text-[1rem] text-white/65">
          Tell us what your business does and we will recommend the right domain and setup.
        </p>
        <Link
          href={contactHref(SERVICE, '')}
          className="mt-7 inline-flex rounded-full bg-primary px-7 py-3.5 text-[1rem] font-semibold text-white"
        >
          Talk to us
        </Link>
      </section>
    </main>
  );
}
