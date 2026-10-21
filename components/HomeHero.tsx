'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DEFAULT_HERO_CYCLES, DEFAULT_HOME_SECTIONS, HeroCycle } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function HomeHero() {
  const { content } = useSiteContent();
  const cycles: HeroCycle[] =
    content?.settings?.hero_cycles && content.settings.hero_cycles.length > 0
      ? content.settings.hero_cycles
      : DEFAULT_HERO_CYCLES;
  const homeSections = content?.settings?.home_sections || DEFAULT_HOME_SECTIONS;

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const safeIndex = activeIndex % cycles.length;
  const activeCycle = cycles[safeIndex] || DEFAULT_HERO_CYCLES[0];

  useEffect(() => {
    if (paused || cycles.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cycles.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [paused, cycles.length]);

  return (
    <section
      style={{ backgroundColor: homeSections.hero_bg || '#f8f8f6' }}
      className="pb-12 md:pb-16"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Grid parent: 40px edge-to-text on the sides */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-14 items-center" style={{ padding: '0 40px' }}>
        {/* Left column: 55% — Static Inter Headline + Rotating Question + Learn More CTA */}
        {/* Text container: navbar-to-text gap ~88px (24px gap + 64px navbar height) */}
        <div className="flex flex-col items-start text-left" style={{ paddingTop: 'calc(24px + 64px)' }}>
          <h1 className="font-inter font-black text-[#0d0d0d] text-[44px] sm:text-[62px] xl:text-[84px] leading-[1.02] tracking-[-0.035em]">
            {homeSections.hero_headline_main}{' '}
            <span className="text-[#DC2626]">{homeSections.hero_headline_accent}</span>
          </h1>

          {/* Rotating question — stacked in one grid cell for a true 600ms simultaneous morph fade */}
          <div className="mt-8 grid w-full max-w-xl items-center min-h-[72px]">
            {cycles.map((cycle, index) => {
              const isCurrent = index === safeIndex;
              return (
                <p
                  key={`${index}-${cycle.question}`}
                  aria-hidden={!isCurrent}
                  className={`col-start-1 row-start-1 font-poppins font-medium text-[22px] md:text-[25px] leading-[1.38] text-[#0d0d0d] transition-opacity duration-[600ms] ease-in-out m-0 ${
                    isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'
                  }`}
                >
                  {cycle.question}
                </p>
              );
            })}
          </div>

          <div className="mt-7">
            <Link
              href={activeCycle.href}
              className="inline-flex items-center justify-center rounded-full bg-[#E85D2A] hover:brightness-110 text-white font-poppins font-semibold text-[15px] px-8 py-3.5 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Right column: 45% — Hero image directly on the body (no container shape or background) + Solution Text */}
        <div className="w-full">
          <div className="grid w-full items-center">
            {cycles.map((cycle, index) => {
              const isCurrent = index === safeIndex;
              return (
                <div
                  key={`${index}-${cycle.image}`}
                  aria-hidden={!isCurrent}
                  className={`col-start-1 row-start-1 flex flex-col items-center lg:items-start transition-opacity duration-[600ms] ease-in-out ${
                    isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'
                  }`}
                >
                  <div className="w-full h-[320px] sm:h-[390px] lg:h-[440px] flex items-center justify-center bg-transparent">
                    <img
                      src={cycle.image}
                      alt={cycle.question}
                      className="max-h-full max-w-full w-auto h-auto object-contain object-center bg-transparent"
                    />
                  </div>
                  <p className="mt-5 font-poppins font-light text-[16px] leading-[1.65] text-[#0d0d0d]/85 m-0 max-w-lg">
                    {cycle.solution}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
