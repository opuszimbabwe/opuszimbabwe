'use client';

import Link from 'next/link';
import { staticPricing } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

function Card({
  name,
  monthlyPrice,
  yearlyPrice,
  features,
}: {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
}) {
  const highlighted = name === 'Professional';
  const custom = name === 'Custom' || monthlyPrice.toLowerCase().includes('custom');
  const priceDisplay = monthlyPrice || (custom ? 'Custom quote' : '');

  // If yearlyPrice is descriptive ("What it covers"), show it directly; otherwise fall back to a sensible description.
  const isDescriptiveSummary =
    Boolean(yearlyPrice) &&
    !yearlyPrice.endsWith('/mo') &&
    yearlyPrice.toLowerCase() !== "let's talk";

  const whatItCovers = isDescriptiveSummary
    ? yearlyPrice
    : highlighted
    ? 'Perfect for growing organisations'
    : custom
    ? 'Standalone custom scope — contact us for a quote'
    : 'Perfect for small organisations';

  return (
    <article className="bg-white rounded-[20px] p-2.5 flex flex-col shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-[#f0f0f0] min-h-[410px] transition-all hover:shadow-[0_16px_40px_rgba(0,0,0,0.10)] text-left">
      {/* Top header box — exact existing card design */}
      <div className={`${highlighted ? 'bg-[#dce8f7]' : 'bg-[#f1f1f1]'} rounded-[14px] p-4 pb-4`}>
        <span className="inline-block bg-white rounded-full px-3 py-1 text-[.62rem] font-semibold uppercase tracking-[.08em] text-dark shadow-sm">
          {name}
        </span>
        <h3 className="text-[1.75rem] sm:text-[1.95rem] leading-tight font-bold text-dark mt-8 tracking-tight">
          {priceDisplay}
        </h3>
      </div>

      <div className="px-1.5 pt-4">
        <p className="text-[12.5px] font-medium text-dark leading-5 min-h-[40px]">
          {whatItCovers}
        </p>
        <Link
          href={`/contact/?service=${encodeURIComponent(`Website Design & Development (${name})`)}`}
          className="w-full mt-4 bg-dark hover:bg-[#E85D2A] text-white rounded-full py-2.5 text-[13px] font-semibold shadow-[0_4px_12px_rgba(0,0,0,.18)] flex justify-center transition-colors"
        >
          {custom ? 'Contact Us' : 'Start a Project'}
        </Link>
      </div>

      <div className="h-px bg-[#ececec] my-5 mx-1.5" />

      <div className="px-1.5 pb-3">
        {features.map((f) => (
          <p key={f} className="text-[12.5px] text-[#4a4a4a] mb-3 flex items-start gap-2 leading-5">
            <span className="text-[#a0a0a0] mt-[1px] flex-shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12l5 5l10 -10" />
              </svg>
            </span>
            {f}
          </p>
        ))}
      </div>
    </article>
  );
}

export function PricingSection({
  pricing,
}: {
  pricing?: { name: string; monthlyPrice: string; yearlyPrice: string; features: string[] }[];
}) {
  const { content } = useSiteContent();
  type LegacyCard = { name: string; monthlyPrice: string; yearlyPrice: string; features: string[] };
  const fallback: LegacyCard[] =
    pricing ??
    staticPricing.map((p) => ({
      name: p.name,
      monthlyPrice: p.monthly_price,
      yearlyPrice: p.yearly_price,
      features: p.features,
    }));
  const cards =
    content
      ? content.pricing
          .filter((p) => p.visible)
          .map((p) => ({
            key: p.id,
            name: p.name,
            monthlyPrice: p.monthly_price,
            yearlyPrice: p.yearly_price,
            features: p.features,
          }))
      : fallback.map((p, i) => ({
          key: `${p.name}-${i}`,
          name: p.name,
          monthlyPrice: p.monthlyPrice,
          yearlyPrice: p.yearlyPrice,
          features: p.features,
        }));

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((p) => (
        <Card
          key={p.key}
          name={p.name}
          monthlyPrice={p.monthlyPrice}
          yearlyPrice={p.yearlyPrice}
          features={p.features}
        />
      ))}
    </div>
  );
}

export default function PricingCard({
  name,
  price,
  subtitle,
  features,
}: {
  name: string;
  price: string;
  subtitle?: string;
  features: string[];
}) {
  return <Card name={name} monthlyPrice={price} yearlyPrice={subtitle || ''} features={features} />;
}
