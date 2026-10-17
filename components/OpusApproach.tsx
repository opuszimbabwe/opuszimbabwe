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

  return (
    <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
      {steps.map((step, i) => {
        const isLeft = i % 2 === 0;
        const isVisible = revealed[i] ?? false;
        // Icons can be a built-in Lucide name or an admin-uploaded image URL.
        const Icon = step.icon ? resolveIcon(step.icon) : null;

        return (
          <div
            key={`${step.title}-${i}`}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            data-step-index={i}
            className={`rounded-[24px] border border-[#e5e7eb] bg-[#f8f8f6] p-7 text-left shadow-[0_6px_20px_rgba(13,13,13,0.03)] transition-all duration-500 ease-out ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : isLeft
                ? 'opacity-0 -translate-x-8'
                : 'opacity-0 translate-x-8'
            }`}
          >
            {Icon && (
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0d0d0d] shadow-sm">
                <Icon size={22} />
              </div>
            )}
            <h3 className="font-poppins text-[1.2rem] font-bold text-[#0d0d0d]">{step.title}</h3>
            <p className="mt-2.5 font-poppins text-[0.95rem] leading-[1.7] text-[#0d0d0d]/75 m-0">
              {step.body}
            </p>
          </div>
        );
      })}
    </div>
  );
}
