'use client';
// Full-bleed, centred service-page hero.
//
// The background is admin-managed: either an image or a gradient
// (Services tab in /admin). When the content API is unreachable the
// built-in copy passed in as `fallback` is rendered instead.

import {presentationBackground,presentationOverlay} from '@/lib/service-presentations';
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
  const design=serviceId?content?.settings.service_presentations.detail_hero[serviceId]:undefined;

  const eyebrow = extras?.hero_eyebrow || fallback.eyebrow;
  const headline = extras?.hero_headline || fallback.headline;
  const intro = extras?.hero_intro || fallback.intro;
  const cta = extras?.hero_cta || fallback.cta;

  const background = design?design.image:extras?.hero_background||fallback.background||'';
  const kind = extras?.hero_background_kind || 'image';
  const gradient = extras?.hero_gradient || fallback.gradient || '160deg,#1a1a1a,#454545';

  const backgroundStyle=design?{background:presentationBackground(design),backgroundSize:design.image_fit,backgroundRepeat:'no-repeat',...(background?{backgroundImage:`url(${JSON.stringify(background)}),${design.background_kind==='gradient'?presentationBackground(design):'none'}`}:{})}:kind==='gradient'||!background?{backgroundImage:`linear-gradient(${gradient})`}:{backgroundImage:`url(${JSON.stringify(background)})`};

  const ctaLower = cta.toLowerCase();
  const href =
    ctaLower.includes('package') || ctaLower.includes('pricing')
      ? '#pricing'
      : ctaLower.includes('our work')
      ? '/projects/'
      : contactHref(serviceName || eyebrow, domainCta ? '' : undefined);

  return (
    <div className="inner-hero-frame"><section className="service-hero relative isolate overflow-hidden rounded-[36px] bg-dark shadow-[0_16px_45px_rgba(0,0,0,0.14)]">
      <div aria-hidden="true" className="service-hero-background absolute inset-0 bg-cover bg-center" style={backgroundStyle} />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/72 to-black/85" style={design?{background:presentationOverlay(design),opacity:design.overlay_opacity}:undefined}/>

      <div className="relative mx-auto max-w-4xl px-6 py-20 sm:px-10 text-center md:py-28" style={design?{textAlign:design.text_align}:undefined}>

        <h1 style={{color:design?.title_color}} className="mt-4 text-4xl font-bold leading-tight text-white md:text-5xl">{headline}</h1>
        <p style={{color:design?.text_color}} className="mx-auto mt-5 max-w-2xl text-[1.05rem] leading-7 text-white/80">{intro}</p>
        <Link
          href={href}
          className="mt-8 inline-flex rounded-full bg-[#E85D2A] px-7 py-3.5 font-semibold text-white shadow-[0_8px_20px_rgba(232,93,42,0.25)] transition-all hover:brightness-110"
        >
          {cta}
        </Link>
      </div>
    </section></div>
  );
}
