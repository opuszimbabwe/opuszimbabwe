'use client';

// "How we take your project from idea to launch." — a single horizontal process rail:
// circular icon badges joined by a hairline connector, numbered step titles and centred
// muted copy. RAIL_LAYOUT decides at which breakpoint the steps collapse into that one
// row (five steps: `xl`); below it they wrap into a plain centred list and the connector
// is switched off.

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_SETTINGS } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

// Column rhythm follows however many steps the admin has saved. `rail` is the class that
// switches the connector hairline on, and it is deliberately the same breakpoint at which
// the steps become a single row — a hairline drawn across a wrapped row would point at
// empty space. Counts that never form one row (6+) get no connector at all.
const RAIL_LAYOUT: Record<number, { cols: string; rail: string }> = {
  1: { cols: 'grid-cols-1', rail: 'hidden' },
  2: { cols: 'grid-cols-1 sm:grid-cols-2', rail: 'hidden sm:block' },
  3: { cols: 'grid-cols-1 sm:grid-cols-3', rail: 'hidden sm:block' },
  4: { cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', rail: 'hidden lg:block' },
  5: { cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5', rail: 'hidden xl:block' },
};

const DEFAULT_LAYOUT = { cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', rail: 'hidden' };

// Must match the row gap so the hairline lands exactly badge-centre to badge-centre.
const GAP_CLASS = 'gap-x-8 gap-y-14';
const GAP_VALUE = '2rem';

const stepNumber = (index: number) => String(index + 1).padStart(2, '0');

export default function OpusApproach() {
  const { content } = useSiteContent();
  const steps = content?.settings?.approach_items?.length
    ? content.settings.approach_items
    : DEFAULT_SETTINGS.approach_items;

  const [revealed, setRevealed] = useState<boolean[]>(() => steps.map(() => false));
  const nodes = useRef<Array<HTMLLIElement | null>>([]);

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

  const layout = RAIL_LAYOUT[steps.length] || DEFAULT_LAYOUT;

  return (
    <ol
      className={`mx-auto mt-16 grid w-full max-w-[80rem] items-start lg:mt-24 ${GAP_CLASS} ${layout.cols}`}
      aria-label="Our step-by-step process"
    >
      {steps.map((step, i) => {
        const isVisible = revealed[i] ?? false;
        const isLast = i === steps.length - 1;
        // Icons can be a built-in Lucide name or an admin-uploaded image URL.
        const Icon = step.icon ? resolveIcon(step.icon) : null;

        return (
          <li
            key={`${step.title}-${i}`}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            data-step-index={i}
            style={{ transitionDelay: `${i * 90}ms` }}
            className={`relative flex flex-col items-center text-center transition-all duration-[650ms] ease-out ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            {/* Connector hairline between badge centres — only rendered at the
                breakpoint where the steps form one continuous row. */}
            {!isLast && (
              <span
                aria-hidden
                className={`pointer-events-none absolute left-1/2 top-[2.125rem] h-px bg-[#e6e6e2] ${layout.rail}`}
                style={{ width: `calc(100% + ${GAP_VALUE})` }}
              />
            )}

            <div className="relative z-10 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-white text-[#0d0d0d] shadow-[0_12px_28px_rgba(13,13,13,0.08)] ring-1 ring-[#ededea]">
              {Icon ? (
                <Icon size={25} strokeWidth={1.75} />
              ) : (
                <span className="font-poppins text-[1.05rem] font-bold tabular-nums">
                  {stepNumber(i)}
                </span>
              )}
            </div>

            <h3 className="mt-8 font-poppins text-[1.05rem] font-bold leading-snug text-[#0d0d0d] md:text-[1.15rem]">
              <span className="tabular-nums">{stepNumber(i)}.</span> {step.title}
            </h3>

            <p className="m-0 mt-3 max-w-[30ch] font-poppins text-[0.95rem] leading-[1.75] text-[#0d0d0d]/65">
              {step.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
