import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import React from 'react';

type ServiceCardProps = {
  gradient: string;
  title: string;
  icon: any;
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  cardBgColor?: string;
};

export default function ServiceCard({
  title,
  icon,
  heading,
  description,
  ctaText,
  ctaHref,
  image,
  cardBgColor = '#ffffff',
}: ServiceCardProps) {
  const Icon = icon;

  return (
    <article
      style={{ '--card-text-bg': cardBgColor || '#ffffff' } as React.CSSProperties}
      className="svc-card group relative isolate overflow-hidden rounded-[40px] border-l-[3px] border-l-transparent bg-white text-left shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-200 ease-out hover:-translate-y-[6px] hover:border-l-[#E85D2A] hover:bg-[#fff8f4] hover:shadow-[0_18px_44px_rgba(0,0,0,0.12)]"
    >
      <div className="absolute inset-x-0 top-0 h-[350px] overflow-hidden rounded-t-[40px] bg-[#e9e9e9]">
        <img
          src={image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/55" />
        <span className="absolute left-6 top-6 rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-[.65rem] font-bold uppercase tracking-[.12em] text-[#0d0d0d] shadow-sm backdrop-blur-sm">
          {title}
        </span>
      </div>

      <div className="svc-text-section relative mt-[290px] min-h-[260px] rounded-tr-[55px] px-6 pb-7 pt-[76px] sm:px-7">
        <div className="svc-avatar-ring" aria-hidden="true">
          <span className="flex h-[110px] w-[110px] items-center justify-center rounded-full bg-[#0d0d0d] text-white shadow-inner">
            <Icon size={34} strokeWidth={1.7} />
          </span>
        </div>

        <h3 className="text-[1.3rem] font-bold leading-tight tracking-tight text-[#0d0d0d]">
          {heading}
        </h3>
        <p className="mt-3 min-h-[7.5rem] text-[.9rem] leading-[1.7] text-[#0d0d0d]/75">
          {description}
        </p>

        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#E85D2A] px-5 py-2.5 text-[.85rem] font-semibold text-white shadow-[0_4px_12px_rgba(232,93,42,0.25)] transition-all duration-200 ease-out group-hover:translate-x-1.5 hover:brightness-110"
        >
          {ctaText}
          <ArrowRight size={15} className="transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
