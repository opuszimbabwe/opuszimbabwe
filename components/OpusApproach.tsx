'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_SETTINGS } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function OpusApproach() {
  const { content } = useSiteContent();
  const steps = content?.settings?.approach_items?.length
    ? content.settings.approach_items
    : DEFAULT_SETTINGS.approach_items;

  const [revealed, setRevealed] = useState<boolean[]>(() => steps.map(() => false));
  const nodes = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(steps.map(() => true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number((entry.target as HTMLElement).dataset.stepIndex);
          if (Number.isNaN(idx)) return;
          observer.unobserve(entry.target);
          setRevealed((prev) => (prev[idx] ? prev : prev.map((v, i) => (i === idx ? true : v))));
        });
      },
      { threshold: 0.2 }
    );

    nodes.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [steps.length]);

  // Connector line + diamond hub belong to the single-row (desktop) layout.
  const singleRow = steps.length <= 5;
  // The diamond hub highlights the middle step of the row.
  const diamondIndex = Math.floor((steps.length - 1) / 2);
  const HUB = 96; // hub diameter (px)

  return (
    <div
      className={`mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0 ${
        singleRow ? 'relative' : ''
      }`}
    >
      {/* Connector line behind the hubs (desktop only) */}
      {singleRow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[48px] hidden h-[2px] bg-[#e2e8f0] lg:block"
          style={{
            left: `calc(${50 / steps.length}% - 48px)`,
            right: `calc(${50 / steps.length}% - 48px)`,
          }}
        />
      )}
      {steps.map((step, i) => {
        const isVisible = revealed[i] ?? false;
        const hasDiamond = i === diamondIndex;
        // Icons can be a built-in Lucide name or an admin-uploaded image URL.
        const Icon = step.icon ? resolveIcon(step.icon) : null;

        return (
          <div
            key={`${step.title}-${i}`}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            data-step-index={i}
            className={`flex flex-col items-center px-4 text-center transition-all duration-500 ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Hub: white circle, or a navy-outlined white diamond on the middle step */}
            <div
              className="relative z-10 flex items-center justify-center"
              style={{ height: HUB, width: HUB }}
            >
              {hasDiamond ? (
                <div
                  aria-hidden="true"
                  className="absolute h-[68px] w-[68px] rotate-45 border-2 border-[#0a2540] bg-white"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="absolute h-full w-full rounded-full bg-white"
                />
              )}
              {Icon && (
                <Icon
                  size={34}
                  strokeWidth={1.5}
                  className="relative z-10 text-[#0a2540]"
                />
              )}
            </div>

            <h3 className="mt-8 font-poppins text-xl font-bold text-[#0f172a]">
              <span className="mr-1.5">{String(i + 1).padStart(2, '0')}.</span>
              {step.title}
            </h3>
            <p className="mt-3 font-poppins text-[0.95rem] leading-[1.7] text-[#475569] m-0">
              {step.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
