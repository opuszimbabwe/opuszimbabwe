'use client';
// Home page "Why choose Opus Zimbabwe" list.
//
// Each reason starts collapsed showing only its heading. As the visitor
// scrolls down the section expands reason by reason, and every reason that
// has been seen stays expanded — it never collapses again.

import { useEffect, useRef, useState } from 'react';

export type Reason = { title: string; body: string };

export default function WhyChooseUs({ items }: { items: Reason[] }) {
  const [revealed, setRevealed] = useState<boolean[]>(() => items.map(() => false));
  const nodes = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    // No IntersectionObserver (very old browsers): show everything at once.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(items.map(() => true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.reasonIndex);
          if (Number.isNaN(index)) return;
          // One-way reveal: stop observing so it can never collapse again.
          observer.unobserve(entry.target);
          setRevealed((prev) => (prev[index] ? prev : prev.map((value, i) => (i === index ? true : value))));
        });
      },
      { threshold: 0.25, rootMargin: '0px 0px -10% 0px' }
    );

    nodes.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <div className="mt-16">
      {/* Without JavaScript there is no scroll observer — show every reason. */}
      <noscript>
        <style>{'.why-body{max-height:40rem !important;opacity:1 !important;transform:none !important}.why-line{transform:none !important}'}</style>
      </noscript>

      {items.map((item, i) => {
        const open = revealed[i] ?? false;
        return (
          <div
            key={item.title}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            data-reason-index={i}
            className="flex items-stretch gap-6 border-b border-[#eeeeee] py-10 md:gap-10"
          >
            <div className="relative w-px flex-shrink-0 self-stretch bg-[#eeeeee]">
              <span
                className={`why-line absolute inset-x-0 top-0 h-full w-px origin-top bg-primary transition-transform duration-[900ms] ease-out ${
                  open ? 'scale-y-100' : 'scale-y-0'
                }`}
              />
            </div>

            <div className="flex-1 py-1">
              <h3 className="text-xl font-bold text-dark">{item.title}</h3>
              <div
                className={`why-body overflow-hidden transition-all duration-700 ease-out ${
                  open ? 'mt-2 max-h-64 translate-y-0 opacity-100' : 'mt-0 max-h-0 translate-y-2 opacity-0'
                }`}
              >
                <p className="max-w-lg text-[1rem] leading-7 text-fg">{item.body}</p>
              </div>
            </div>

            <div className="flex w-8 flex-shrink-0 items-start justify-end pt-1">
              <span
                className={`text-[.7rem] font-bold tracking-widest transition-colors duration-700 ${
                  open ? 'text-primary' : 'text-primary/40'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
