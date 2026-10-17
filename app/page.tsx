'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import HomeHero from '@/components/HomeHero';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
import HomeServicesGrid from '@/components/HomeServicesGrid';
import TrustedPartners from '@/components/TrustedPartners';
import OpusApproach from '@/components/OpusApproach';
import HomeProjects from '@/components/HomeProjects';
import WhyChooseUs, { DEFAULT_WHY_REASONS } from '@/components/WhyChooseUs';
import FaqAccordion from '@/components/FaqAccordion';
import { DEFAULT_HOME_SECTIONS } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

const faqs = [
  {
    q: 'How do I pay for a project?',
    a: 'You can use EcoCash, OneMoney, InnBucks, Zimswitch and other supported Zimbabwean payment methods.',
  },
  {
    q: 'How long does a project take?',
    a: 'Timing depends on the scope. We confirm a delivery plan after understanding your requirements.',
  },
  {
    q: 'Do you provide domains, hosting and business email?',
    a: 'Yes. Domain registration, hosting and professional business email are available through Opus Zimbabwe.',
  },
];

export default function Home() {
  const { content } = useSiteContent();
  const s = content?.settings?.home_sections || DEFAULT_HOME_SECTIONS;

  return (
    <main className="bg-[#f8f8f6] text-[#0d0d0d]">
      {/* 1. Hero */}
      <HomeHero />

      {/* 2. Payment trust strip — immediately below the hero */}
      <PaymentTrustStrip />

      {/* 3. Services — six cards in a 3x2 grid (White section by default) */}
      <section
        id="services"
        style={{ backgroundColor: s.services_bg || '#ffffff' }}
        className="py-20 text-center"
      >
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mx-auto max-w-3xl font-poppins text-[1.85rem] font-bold leading-tight text-[#0d0d0d] md:text-[2.3rem]">
            {s.services_heading}
          </h2>
          <HomeServicesGrid />
        </div>
      </section>

      {/* 4. Trusted by — partner logos ("Partners who trust us") */}
      <section
        style={{ backgroundColor: s.partners_bg || '#f8f8f6' }}
        className="py-16"
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mx-auto text-center font-poppins text-2xl font-bold text-[#0d0d0d] md:text-3xl">
            {s.partners_heading}
          </h2>
          {s.partners_subheading && (
            <p className="mx-auto mt-3 max-w-2xl text-center text-[#0d0d0d]/70">
              {s.partners_subheading}
            </p>
          )}
          <TrustedPartners />
        </div>
      </section>

      {/* 5. How it works — five steps (White section by default) */}
      <section
        style={{ backgroundColor: s.how_it_works_bg || '#ffffff' }}
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mx-auto text-center font-poppins text-2xl font-bold text-[#0d0d0d] md:text-3xl">
            {s.how_it_works_heading}
          </h2>
          <OpusApproach />
        </div>
      </section>

      {/* 6. Projects — live work */}
      <section
        style={{ backgroundColor: s.projects_bg || '#f8f8f6' }}
        className="py-20 text-center"
      >
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mx-auto text-center font-poppins text-2xl font-bold text-[#0d0d0d] md:text-3xl">
            {s.projects_heading}
          </h2>
          <HomeProjects />
        </div>
      </section>

      {/* 7. Why Choose Us (White section by default) */}
      <section
        id="why"
        style={{ backgroundColor: s.why_bg || '#ffffff' }}
        className="py-20"
      >
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mx-auto text-center font-poppins text-3xl font-bold text-[#0d0d0d] md:text-4xl">
            {s.why_heading}
          </h2>
          <WhyChooseUs items={DEFAULT_WHY_REASONS} />
        </div>
      </section>

      {/* 8. FAQ */}
      <section
        style={{ backgroundColor: s.faq_bg || '#f8f8f6' }}
        className="py-20 text-center"
      >
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center font-poppins text-2xl font-bold text-[#0d0d0d] md:text-3xl">
            {s.faq_heading}
          </h2>
          <div className="mt-8 text-left">
            <FaqAccordion list="home" items={faqs} />
          </div>
          <Link
            href="/faq/"
            className="mt-7 inline-flex items-center font-poppins font-semibold text-[#E85D2A] transition-transform duration-200 hover:translate-x-1"
          >
            See all questions <ArrowRight size={16} className="ml-1.5" />
          </Link>
        </div>
      </section>

      {/* 9. Final CTA (White outer section by default) */}
      <section
        style={{ backgroundColor: s.cta_bg || '#ffffff' }}
        className="px-6 py-20"
      >
        <div className="mx-auto max-w-6xl rounded-[32px] bg-[#0d0d0d] px-7 py-16 text-center text-white shadow-[0_16px_45px_rgba(0,0,0,0.14)] sm:px-12">
          <h2 className="mt-2 font-poppins text-3xl font-bold md:text-5xl">
            {s.cta_heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-white/75">
            {s.cta_subheading}
          </p>
          <Link
            href="/contact/"
            className="mt-8 inline-flex rounded-full bg-[#E85D2A] px-8 py-3.5 font-poppins font-semibold text-white transition-all duration-200 hover:brightness-110"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
  );
}
