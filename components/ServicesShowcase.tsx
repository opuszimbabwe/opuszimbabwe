'use client';
// Home page "What We Do" carousel — Monzo-style horizontal cards.
//
// Each card is a hero slide whose background is admin-managed per service
// (Services tab in /admin → Hero): either an image or a gradient.
// Renders the baked-in static cards first, then upgrades to D1 content
// from /api/content when the Pages Functions API is available.

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { extrasFor, staticServices, ServiceRecord } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function ServicesShowcase() {
  const { content } = useSiteContent();
  const services: ServiceRecord[] = (content ? content.services : staticServices).filter((s) => s.visible);
  const track = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector('[data-carousel-card]') as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  if (services.length === 0) return null;

  return (
    <div className="relative mt-10">
      <div className="hidden md:block">
        <div className="mb-4 flex justify-end gap-2 pr-1">
          <button
            type="button"
            aria-label="Previous services"
            onClick={() => scrollByCard(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-dark shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={17} />
          </button>
          <button
            type="button"
            aria-label="Next services"
            onClick={() => scrollByCard(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-dark shadow-sm transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4"
      >
        {services.map((s) => {
          const extras = extrasFor(content, s.id);
          const Icon = resolveIcon(s.icon);
          const background = extras?.hero_background || s.image;
          const gradient = extras?.hero_gradient || s.gradient;
          const backgroundStyle =
            extras?.hero_background_kind === 'gradient' || !background
              ? { backgroundImage: `linear-gradient(${gradient})` }
              : { backgroundImage: `url('${background}')` };

          return (
            <Link
              key={s.id}
              data-carousel-card
              href={`/services/${s.slug}`}
              className="group relative isolate flex min-h-[420px] w-[86%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[32px] p-6 text-left shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 hover:-translate-y-1 sm:w-[46%] lg:w-[32%]"
            >
              <div aria-hidden="true" className="absolute inset-0 bg-cover bg-center" style={backgroundStyle} />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
              />

              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-[.65rem] font-bold uppercase tracking-[.12em] text-white backdrop-blur-sm">
                  <Icon size={14} strokeWidth={2} />
                  {s.tagline}
                </span>

                <h3 className="mt-4 text-[1.35rem] font-bold leading-tight tracking-tight text-white">{s.name}</h3>
                <p className="mt-3 line-clamp-4 text-[.9rem] leading-[1.6] text-white/80">{s.description}</p>

                <span className="mt-5 inline-flex items-center gap-2 text-[.85rem] font-semibold text-white">
                  Learn more
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight size={15} />
                  </span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
