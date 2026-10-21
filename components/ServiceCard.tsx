import Link from 'next/link';
import { Check } from 'lucide-react';
import React from 'react';

type ServiceCardProps = {
  title: string;
  icon: React.ComponentType<any>;
  heading: string;
  description: string;
  items: string[];
  ctaText: string;
  ctaHref: string;
  cardBgColor?: string;
};

const FEATURE_COUNT = 3;

export default function ServiceCard({
  title,
  icon: Icon,
  heading,
  description,
  items,
  ctaText,
  ctaHref,
  cardBgColor = '#ffffff',
}: ServiceCardProps) {
  // The reference design uses a light-grey inset panel. Keep the old
  // admin-controlled card colour useful when a non-white colour is set.
  const panelColor =
    cardBgColor && !['#fff', '#ffffff'].includes(cardBgColor.trim().toLowerCase())
      ? cardBgColor
      : '#eeeeee';
  const featuredItems = items.slice(0, FEATURE_COUNT);
  const remainingCount = Math.max(0, items.length - featuredItems.length);

  return (
    <article className="group flex h-full flex-col rounded-[26px] border border-black/[0.04] bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.11)] sm:p-2.5">
      <div
        style={{ backgroundColor: panelColor }}
        className="flex min-h-[280px] flex-col rounded-[19px] p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex max-w-[calc(100%-3rem)] items-center rounded-full bg-white px-3.5 py-1.5 text-[.65rem] font-bold uppercase leading-none tracking-[.12em] text-[#0d0d0d]">
            {title}
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0d0d0d]">
            <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>

        <h3 className="mt-4 line-clamp-2 min-h-[3.2rem] text-[1.28rem] font-bold leading-[1.22] tracking-tight text-[#0d0d0d] sm:text-[1.38rem]">
          {heading}
        </h3>
        <p className="mt-2 line-clamp-3 min-h-[4rem] max-w-none text-[.84rem] leading-[1.58] text-[#0d0d0d]/70">
          {description}
        </p>

        <Link
          href={ctaHref}
          className="mt-auto inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#0d0d0d] px-5 py-2.5 text-[.86rem] font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.14)] transition-colors duration-200 hover:bg-[#292929] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E85D2A]"
        >
          {ctaText}
        </Link>
      </div>

      <ul className="space-y-2.5 px-3.5 py-4 sm:px-4 sm:py-[18px]">
        {featuredItems.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-left text-[.84rem] leading-5 text-[#0d0d0d]">
            <Check size={14} strokeWidth={2.4} className="mt-[3px] shrink-0 text-[#c8c8c8]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
        {remainingCount > 0 && (
          <li className="flex items-start gap-2.5 text-left text-[.84rem] leading-5 text-[#525252]">
            <span className="mt-[1px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#f1f1f1] text-[.65rem] font-semibold leading-none">
              +
            </span>
            <span>{remainingCount} more capabilities</span>
          </li>
        )}
      </ul>
    </article>
  );
}
