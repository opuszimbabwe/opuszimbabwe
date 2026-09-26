'use client';
// Full-bleed, centred service-page hero.
//
// The background is admin-managed: either an image or a gradient
// (Brand/Services tabs in /admin). When the content API is unreachable the
// built-in copy passed in as `fallback` is rendered instead.

import Link from 'next/link';
import { contactHref, extrasFor } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export type ServiceHeroFallback = {
  eyebrow: string;
  headline: string;
  intro: string;
  cta: string;
  background?: string;
  gradient?: string;
};

export default function ServiceHero({
  serviceId,
  fallback,
  serviceName,
  domainCta,
}: {
  serviceId?: string;
  fallback: ServiceHeroFallback;
  /** Name used to pre-fill /contact?service=… (defaults to the eyebrow). */
  serviceName?: string;
  /** Domain CTAs add an empty &domain= field to the enquiry form. */
  domainCta?: boolean;
}) {
  const { content } = useSiteContent();
  const extras = extrasFor(content, serviceId);

  const eyebrow = extras?.hero_eyebrow || fallback.eyebrow;
  const headline = extras?.hero_headline || fallback.headline;
  const intro = extras?.hero_intro || fallback.intro;
  const cta = extras?.hero_cta || fallback.cta;

  const background = extras?.hero_background || fallback.background || '';
  const kind = extras?.hero_background_kind || 'image';
  const gradient = extras?.hero_gradient || fallback.gradient || '160deg,#1a1a1a,#454545';

  const backgroundStyle =
    kind === 'gradient' || !background
      ? { backgroundImage: `linear-gradient(${gradient})` }
      : { backgroundImage: `url('${background}')` };

  const href = contactHref(serviceName || eyebrow, domainCta ? '' : undefined);

  return (
    <section className="relative isolate overflow-hidden bg-dark">
      <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={backgroundStyle} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/72 to-black/85" />

      <div className="relative mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
        <p className="text-[.78rem] font-semibold uppercase tracking-[.16em] text-white/70">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">{headline}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-[1.05rem] leading-7 text-white/80">{intro}</p>
        <Link
          href={href}
          className="mt-8 inline-flex rounded-full bg-primary px-7 py-3.5 font-semibold text-white transition-all hover:brightness-110"
        >
          {cta}
        </Link>
      </div>
    </section>
  );
}
