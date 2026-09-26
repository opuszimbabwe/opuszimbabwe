'use client';
// Home page “What We Do” carousel.
//
// The service cards intentionally follow a split editorial layout: copy on a
// soft panel at the left and the service's own image on the right. The track
// shows a small part of the neighbouring cards so visitors can tell it is a
// carousel, rather than a grid of unrelated cards.

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { staticServices, ServiceRecord } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function ServicesShowcase({ serviceIds, eyebrow, heading, intro }: {
  serviceIds: string[];
  eyebrow: string;
  heading: string;
  intro: string;
}) {
  const { content } = useSiteContent();
  const source: ServiceRecord[] = content ? content.services : staticServices;
  const services: ServiceRecord[] = serviceIds
    .map((id) => source.find((service) => service.id === id))
    .filter((service): service is ServiceRecord => Boolean(service?.visible));
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const scrollToCard = (index: number) => {
    const el = track.current;
    if (!el || services.length === 0) return;
    const next = Math.max(0, Math.min(index, services.length - 1));
    const card = el.querySelector<HTMLElement>('[data-carousel-card]');
    const gap = 20;
    el.scrollTo({ left: next * ((card?.offsetWidth || el.clientWidth) + gap), behavior: 'smooth' });
    setActive(next);
  };

  const scrollByCard = (direction: 1 | -1) => scrollToCard(active + direction);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.querySelector<HTMLElement>('[data-carousel-card]');
      if (!card) return;
      setActive(Math.max(0, Math.min(services.length - 1, Math.round(el.scrollLeft / (card.offsetWidth + 20)))));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [services.length]);

  if (services.length === 0) return null;

  return (
    <div className="relative mt-14 text-left">
      {(eyebrow || heading || intro) && (
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow && <p className="text-[.75rem] font-bold uppercase tracking-[.16em] text-primary">{eyebrow}</p>}
          {heading && <h3 className={`${eyebrow ? 'mt-3' : 'mt-0'} text-4xl font-bold tracking-tight text-dark sm:text-5xl`}>{heading}</h3>}
          {intro && <p className="mx-auto mt-3 max-w-2xl leading-7 text-muted-fg">{intro}</p>}
        </div>
      )}
      <div
        ref={track}
        className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3"
        aria-label="Our services"
      >
        {services.map((s) => (
          <Link
            key={s.id}
            data-carousel-card
            href={`/services/${s.slug}`}
            className="group relative flex min-h-[430px] w-[calc(100%-2.5rem)] shrink-0 snap-start overflow-hidden rounded-[48px] bg-[#eef7f3] p-0.5 text-left shadow-[0_12px_35px_rgba(12,35,30,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(12,35,30,0.16)] sm:min-h-[500px] sm:w-[calc(100%-7rem)] lg:min-h-[560px] lg:w-[calc(100%-10rem)]"
          >
            <div className="flex w-full flex-1 flex-col overflow-hidden rounded-[48px] md:flex-row">
              <div className="flex w-full flex-col justify-center px-7 py-10 sm:px-12 sm:py-14 md:w-1/2 md:px-14 lg:px-16">
                <p className="text-[.7rem] font-bold uppercase tracking-[.16em] text-[#58766d]">{s.tagline}</p>
                <h3 className="mt-5 max-w-[500px] text-[1.8rem] font-bold leading-[1.08] tracking-[-.035em] text-[#10202d] sm:text-[2.35rem] lg:text-[2.8rem]">
                  {s.name}
                </h3>
                <p className="mt-5 max-w-[520px] text-[.95rem] leading-[1.75] text-[#66736f] sm:text-[1.02rem]">
                  {s.description}
                </p>
                <span
                  className="mt-8 inline-flex w-fit items-center gap-3 rounded-full px-5 py-3 text-[.84rem] font-semibold text-white shadow-[0_8px_20px_rgba(232,93,42,0.24)] transition-all group-hover:brightness-105 group-hover:shadow-[0_10px_25px_rgba(232,93,42,0.34)] sm:px-7 sm:py-3.5 sm:text-[.9rem]"
                  style={{ background: 'linear-gradient(90deg,#E85D2A 0%,#F97316 52%,#F4A226 100%)' }}
                >
                  Explore {s.name}
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>

              <div className="relative min-h-[250px] w-full overflow-hidden rounded-[48px] md:min-h-0 md:w-1/2">
                <img
                  src={s.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/10" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-7 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label="Previous service"
          onClick={() => scrollByCard(-1)}
          disabled={active === 0}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#10202d] text-[#10202d] transition-colors hover:bg-[#10202d] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-3" aria-label={`Service ${active + 1} of ${services.length}`}>
          {services.map((s, index) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to ${s.name}`}
              aria-current={index === active ? 'true' : undefined}
              onClick={() => scrollToCard(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${index === active ? 'w-12 bg-[#10202d]' : 'w-2.5 bg-[#9eada8] hover:bg-[#58766d]'}`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next service"
          onClick={() => scrollByCard(1)}
          disabled={active === services.length - 1}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#10202d] text-[#10202d] transition-colors hover:bg-[#10202d] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
