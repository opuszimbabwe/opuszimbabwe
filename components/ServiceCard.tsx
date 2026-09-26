import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function ServiceCard({
  gradient,
  title,
  icon,
  heading,
  description,
  ctaText,
  ctaHref
}: {
  gradient: string;
  title: string;
  icon: any;
  heading: string;
  description: string;
  ctaText: string;
  ctaHref: string
}) {
  const Icon = icon;

  // Use light grey for top like pricing card, but keep gradient hint for special cards
  const isOrangeGradient = gradient.includes('#E85D2A') || gradient.includes('E85D2A');
  const topBgClass = isOrangeGradient ? 'bg-gradient-to-br from-[#fff0e6] to-[#ffe4cc]' : 'bg-[#f1f1f1]';
  const topInlineStyle = isOrangeGradient ? {} : {};

  return (
    <article className="bg-white rounded-[20px] p-2.5 flex flex-col shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-[#f0f0f0] min-h-[380px] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] hover:border-primary/15 group">
      {/* Top section like pricing card */}
      <div className={`${topBgClass} rounded-[14px] p-4 pb-5 relative overflow-hidden`} style={topInlineStyle}>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-block bg-white rounded-full px-3 py-1 text-[.62rem] font-semibold uppercase tracking-[.08em] text-dark shadow-sm">
            {title}
          </span>
          <div className="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-dark/70 group-hover:text-primary transition-colors flex-shrink-0">
            <Icon size={16} strokeWidth={1.8} />
          </div>
        </div>
        <h3 className="text-[1.35rem] leading-[1.15] font-bold text-dark mt-8 max-w-[90%] tracking-tight">
          {heading}
        </h3>
      </div>

      {/* Middle content */}
      <div className="px-1.5 pt-4 flex-1 flex flex-col">
        <p className="text-[.9rem] text-[#6b7280] leading-[1.65] flex-1">
          {description}
        </p>

        {/* CTA with brand gradient red -> orange */}
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 mt-6 rounded-full px-5 py-2.5 text-[.85rem] font-semibold text-white shadow-[0_4px_12px_rgba(232,93,42,0.25)] transition-all duration-200 hover:shadow-[0_6px_16px_rgba(232,93,42,0.35)] hover:brightness-[1.05] self-start"
          style={{
            background: 'linear-gradient(90deg, #E85D2A 0%, #F97316 50%, #F4A226 100%)'
          }}
        >
          {ctaText}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-[2px]" />
        </Link>
      </div>
    </article>
  )
}
