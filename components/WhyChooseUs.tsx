'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_WHY_CHOOSE_US, WhyItem } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export type Reason = WhyItem;
export const DEFAULT_WHY_REASONS: Reason[] = DEFAULT_WHY_CHOOSE_US;

export default function WhyChooseUs({ items }: { items?: Reason[] }) {
  const { content } = useSiteContent();
  const resolvedItems: Reason[] =
    content?.settings?.why_choose_us
      ? content.settings.why_choose_us
      : items || DEFAULT_WHY_CHOOSE_US;

  const [revealed, setRevealed] = useState<boolean[]>(() => resolvedItems.map(() => false));
  const nodes = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(resolvedItems.map(() => true));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.reasonIndex);
          if (Number.isNaN(index)) return;
          observer.unobserve(entry.target);
          setRevealed((prev) =>
            prev[index] ? prev : resolvedItems.map((_, i) => i === index || Boolean(prev[i]))
          );
        });
      },
      { threshold: 0.2 }
    );

    nodes.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [resolvedItems.length]);

  return (
    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
      {resolvedItems.map((item, i) => {
        const isLeftColumn = i % 2 === 0;
        const isVisible = revealed[i] ?? false;
        const Icon = item.icon ? resolveIcon(item.icon) : null;

        return (
          <div
            key={`${item.title}-${i}`}
            ref={(node) => {
              nodes.current[i] = node;
            }}
            data-reason-index={i}
            className={`filter drop-shadow-[0_8px_24px_rgba(13,13,13,0.06)] transition-all duration-500 ease-out ${
              isVisible
                ? 'opacity-100 translate-x-0'
                : isLeftColumn
                ? 'opacity-0 -translate-x-8'
                : 'opacity-0 translate-x-8'
            }`}
          >
            <article className="why-inverted-card h-full bg-[#f8f8f6] border border-[#ebebea] p-8 pr-12 text-left">
              {Icon && (
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0d0d0d] shadow-sm">
                  <Icon size={22} />
                </div>
              )}
              <h3 className="font-poppins text-[1.2rem] font-bold text-[#0d0d0d]">
                {item.title}
              </h3>
              <p className="mt-3 font-poppins text-[0.96rem] leading-[1.7] text-[#0d0d0d]/75 m-0">
                {item.body}
              </p>
            </article>
          </div>
        );
      })}
    </div>
  );
}
