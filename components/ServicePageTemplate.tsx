'use client';

import Link from 'next/link';
import { PricingSection } from '@/components/PricingCard';
import ServiceHero from '@/components/ServiceHero';
import ServiceVisual from '@/components/ServiceVisual';
import {
  DEFAULT_SERVICE_PAGES,
  ServicePageDetails,
  contactHref,
  servicePageFor,
} from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export type ServicePageData = {
  eyebrow: string;
  headline: string;
  intro: string;
  cta: string;
  image: string;
  sectionTitle?: string;
  body?: string;
  items?: string[];
  price?: string;
  process?: string;
  who?: string;
  serviceId: string;
  domainCta?: boolean;
};

export default function ServicePageTemplate({
  data,
  pricing,
}: {
  data: ServicePageData;
  pricing?: { name: string; monthlyPrice: string; yearlyPrice: string; features: string[] }[];
}) {
  const { content } = useSiteContent();
  const page: ServicePageDetails =
    servicePageFor(content, data.serviceId) ||
    DEFAULT_SERVICE_PAGES[data.serviceId] ||
    DEFAULT_SERVICE_PAGES['web-design'];

  const isWebDesign = data.serviceId === 'web-design';
  const isDomainsHosting = data.serviceId === 'domains-hosting';

  return (
    <main className="bg-[#f8f8f6] text-[#0d0d0d]">
      {/* Hero */}
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

      {/* Section 1 — The problem */}
      <section className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
        <h2 className="font-poppins text-sm font-bold uppercase tracking-[0.14em] text-[#0d0d0d]/55">
          The problem
        </h2>
        <blockquote className="mt-5 border-l-4 border-[#0d0d0d] pl-6 font-poppins text-2xl font-bold leading-snug text-[#0d0d0d] md:text-3xl">
          {page.problem_text}
        </blockquote>
      </section>

      {/* Section 2 — What we build / design / provide / integrate (White section) */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-[#0d0d0d] md:text-4xl">
            {page.what_heading}
          </h2>
          {page.what_intro && (
            <p className="mt-4 max-w-3xl font-poppins text-[1.05rem] leading-8 text-[#0d0d0d]/80">
              {page.what_intro}
            </p>
          )}
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {page.what_items.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className="rounded-[24px] border border-[#ebebea] bg-[#f8f8f6] p-7 transition-all hover:bg-[#fff8f4]"
              >
                <h3 className="font-poppins text-lg font-bold text-[#0d0d0d]">{item.title}</h3>
                {item.body && (
                  <p className="mt-2 font-poppins text-[0.95rem] leading-7 text-[#0d0d0d]/75">
                    {item.body}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-4xl">
            <ServiceVisual serviceId={data.serviceId} fallback={data.image} />
          </div>
        </div>
      </section>

      {/* Section 3 — Pricing */}
      <section id="pricing" className="bg-[#f8f8f6] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="font-poppins text-3xl font-bold text-[#0d0d0d] md:text-4xl">Pricing</h2>
            {(isWebDesign || isDomainsHosting) && page.price_summary && (
              <p className="mx-auto mt-3 max-w-2xl font-poppins text-[#0d0d0d]/70">
                {page.price_summary}
              </p>
            )}
          </div>

          {isWebDesign ? (
            <div className="mt-10">
              <PricingSection pricing={pricing} />
              {page.price_note && (
                <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[#0d0d0d]/65">
                  {page.price_note}
                </p>
              )}
            </div>
          ) : isDomainsHosting ? (
            <div className="mt-10 space-y-12">
              {/* Domains Pricing Table */}
              <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 sm:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
                <h3 className="font-poppins text-xl font-bold text-[#0d0d0d]">Domains</h3>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#e5e7eb] text-[0.78rem] font-bold uppercase tracking-wider text-[#0d0d0d]/60">
                        <th className="py-3 pr-4">Extension</th>
                        <th className="py-3 pr-4">Price</th>
                        <th className="py-3">Registration time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f0] text-[0.95rem]">
                      {(page.domain_prices || DEFAULT_SERVICE_PAGES['domains-hosting'].domain_prices || []).map(
                        (d) => (
                          <tr key={d.extension}>
                            <td className="py-3.5 pr-4 font-bold text-[#0d0d0d]">{d.extension}</td>
                            <td className="py-3.5 pr-4 font-semibold text-[#0d0d0d]">{d.price}</td>
                            <td className="py-3.5 text-[#0d0d0d]/75">{d.registration_time}</td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Web Hosting Card (same card style) */}
              <div className="mx-auto max-w-md">
                <article className="bg-white rounded-[20px] p-2.5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#f0f0f0]">
                  <div className="bg-[#f1f1f1] rounded-[14px] p-5">
                    <span className="inline-block bg-white rounded-full px-3 py-1 text-[.62rem] font-semibold uppercase tracking-[.08em] text-[#0d0d0d] shadow-sm">
                      Web Hosting
                    </span>
                    <h3 className="text-[2rem] leading-none font-bold text-[#0d0d0d] mt-6 tracking-tight">
                      {page.hosting_price || 'from $10/month'}
                    </h3>
                  </div>
                  <div className="px-3 py-4 flex items-center justify-between gap-4">
                    <p className="text-[13px] font-medium text-[#0d0d0d]/80 m-0">
                      Enterprise-grade infrastructure, SSL &amp; local support
                    </p>
                    <Link
                      href={contactHref(data.eyebrow, '')}
                      className="shrink-0 bg-[#0d0d0d] hover:bg-[#E85D2A] text-white rounded-full px-5 py-2 text-[13px] font-semibold transition-colors"
                    >
                      Get Hosting
                    </Link>
                  </div>
                </article>
              </div>

              {/* Business Email Hosting Cards (same card style) */}
              <div>
                <h3 className="text-center font-poppins text-2xl font-bold text-[#0d0d0d]">
                  Business email hosting
                </h3>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  {(page.email_plans || DEFAULT_SERVICE_PAGES['domains-hosting'].email_plans || []).map(
                    (plan) => {
                      const highlighted = plan.plan === 'Business';
                      return (
                        <article
                          key={plan.plan}
                          className="bg-white rounded-[20px] p-2.5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#f0f0f0] transition-all hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)]"
                        >
                          <div
                            className={`${
                              highlighted ? 'bg-[#dce8f7]' : 'bg-[#f1f1f1]'
                            } rounded-[14px] p-4 pb-4`}
                          >
                            <span className="inline-block bg-white rounded-full px-3 py-1 text-[.62rem] font-semibold uppercase tracking-[.08em] text-[#0d0d0d] shadow-sm">
                              {plan.plan}
                            </span>
                            <h4 className="text-[1.9rem] leading-none font-bold text-[#0d0d0d] mt-8 tracking-tight">
                              {plan.price}
                            </h4>
                          </div>
                          <div className="px-2 pt-4 pb-3">
                            <p className="text-[13px] font-medium text-[#0d0d0d]">{plan.mailboxes}</p>
                            <Link
                              href={contactHref(`${data.eyebrow} (${plan.plan} Email)`, '')}
                              className="w-full mt-4 bg-[#0d0d0d] hover:bg-[#E85D2A] text-white rounded-full py-2.5 text-[13px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,.18)] flex justify-center transition-colors"
                            >
                              Choose {plan.plan}
                            </Link>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Single Service Pricing Card — keeps the exact PricingCard visual style */
            <div className="mx-auto mt-10 max-w-xl">
              <article className="bg-white rounded-[20px] p-2.5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#f0f0f0] transition-all hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] text-left">
                <div className="bg-[#dce8f7] rounded-[14px] p-6">
                  <span className="inline-block bg-white rounded-full px-3 py-1 text-[.62rem] font-semibold uppercase tracking-[.08em] text-[#0d0d0d] shadow-sm">
                    {data.eyebrow}
                  </span>
                  <h3 className="text-[2rem] sm:text-[2.25rem] leading-tight font-bold text-[#0d0d0d] mt-6 tracking-tight">
                    {page.price_range}
                  </h3>
                </div>
                <div className="px-4 pt-5 pb-4">
                  <p className="text-[15px] font-semibold text-[#0d0d0d] leading-6">
                    {page.price_summary}
                  </p>
                  {page.price_note && (
                    <p className="mt-2 text-[14px] text-[#0d0d0d]/75 leading-6">
                      {page.price_note}
                    </p>
                  )}
                  <Link
                    href={contactHref(data.eyebrow)}
                    className="w-full mt-6 bg-[#0d0d0d] hover:bg-[#E85D2A] text-white rounded-full py-3 text-[14px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,.18)] flex justify-center transition-colors"
                  >
                    Request a Fixed Quote
                  </Link>
                </div>
              </article>
            </div>
          )}
        </div>
      </section>

      {/* Section 4 — Process (White section) */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-poppins text-3xl font-bold tracking-tight text-[#0d0d0d] md:text-4xl">
            Process
          </h2>
          <div className="mt-10 divide-y divide-[#e7e9e8]">
            {page.process_steps.map((step, index) => (
              <div key={`${step.title}-${index}`} className="flex items-start gap-5 py-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f8f6] border border-[#e5e7eb] text-sm font-bold text-[#0d0d0d]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-poppins text-lg font-bold text-[#0d0d0d]">{step.title}</h3>
                  {step.body && (
                    <p className="mt-1 font-poppins text-[0.96rem] leading-7 text-[#0d0d0d]/75">
                      {step.body}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Tools we use (Admin-controlled logos strip) */}
      <section className="bg-[#f8f8f6] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h2 className="font-poppins text-2xl font-bold text-[#0d0d0d] md:text-3xl">
            Tools we use
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {page.tools_items.map((tool, idx) => (
              <div
                key={`${tool.name}-${idx}`}
                title={tool.name}
                className="group flex items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-5 py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.04)] transition-all hover:border-[#E85D2A]/40"
              >
                {tool.logo && (
                  <img
                    src={tool.logo}
                    alt={tool.name}
                    className="h-8 w-auto max-w-[150px] object-contain"
                  />
                )}
                {!tool.logo && (
                  <span className="font-poppins text-sm font-semibold text-[#0d0d0d]">
                    {tool.name}
                  </span>
                )}
              </div>
            ))}
          </div>
          {page.tools_note && (
            <p className="mt-5 font-poppins text-sm text-[#0d0d0d]/70">
              {page.tools_items.map((t) => t.name).join(' · ')} · {page.tools_note}
            </p>
          )}
        </div>
      </section>

      {/* Section 6 — WhatsApp CTA */}
      <section className="bg-white px-6 pb-24 pt-6">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-[#0d0d0d] px-7 py-16 text-center text-white shadow-[0_16px_45px_rgba(0,0,0,.14)] sm:px-12">
          <h2 className="mx-auto max-w-2xl font-poppins text-3xl font-bold md:text-5xl">
            {page.cta_heading}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-poppins leading-7 text-white/75">
            {page.cta_body}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={page.cta_url || 'https://wa.me/263710740387'}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#E85D2A] px-8 py-3.5 font-poppins font-semibold text-white transition-all hover:brightness-110"
            >
              {page.cta_button || 'Talk to us on WhatsApp'}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
