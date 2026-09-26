'use client';
// Per-service “Why Opus Zimbabwe?” and related services. The page template
// places these in the final editorial chapter, so the content stays vertical.

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { extrasFor, RelatedItem, WhyItem } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function ServiceExtras({
  serviceId,
  fallbackWhy,
  fallbackRelated,
  heading = 'Why Opus Zimbabwe?',
}: {
  serviceId?: string;
  fallbackWhy: WhyItem[];
  fallbackRelated: RelatedItem[];
  heading?: string;
}) {
  const { content } = useSiteContent();
  const extras = extrasFor(content, serviceId);
  const why = extras?.why_items?.length ? extras.why_items : fallbackWhy;
  const related = extras?.related_items?.length ? extras.related_items : fallbackRelated;

  if (why.length === 0 && related.length === 0) return null;

  return (
    <div>
      {why.length > 0 && (
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-dark md:text-4xl">{heading}</h2>
          <div className="mt-8">
            {why.map((item, index) => (
              <div key={`${item.title}-${index}`} className="flex items-start gap-6 border-b border-[#e7e9e8] py-6">
                <span className="pt-1 text-[.75rem] font-bold tracking-[.14em] text-primary">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-lg font-semibold text-dark">{item.title}</p>
                  {item.body && <p className="mt-1 max-w-2xl leading-7 text-muted-fg">{item.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-3xl font-bold tracking-tight text-dark md:text-4xl">Related services</h2>
          <div className="mt-8">
            {related.map((item, index) => item.href ? (
              <Link key={`${item.label}-${item.href}`} href={item.href} className="flex items-center justify-between border-b border-[#e7e9e8] py-5 text-lg font-semibold text-dark transition-colors hover:text-primary">
                <span><span className="mr-5 text-[.75rem] tracking-[.14em] text-primary">{String(index + 1).padStart(2, '0')}</span>{item.label}</span>
                <ArrowRight size={18} className="text-primary" />
              </Link>
            ) : (
              <div key={item.label} className="border-b border-[#e7e9e8] py-5 text-lg font-semibold text-muted-fg">{item.label}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
