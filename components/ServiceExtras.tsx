'use client';
// Per-service "Why Opus Zimbabwe?" cards and "Related services" links.
//
// Both lists are admin-managed per service (Services tab in /admin →
// Hero / Why Opus / Related). Falls back to the built-in copy when the
// content API is unreachable or the service has no extras row.

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
    <div className="grid gap-10 md:grid-cols-2">
      {why.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-dark">{heading}</h2>
          <div className="mt-6 grid gap-3">
            {why.map((item) => (
              <div key={item.title} className="rounded-xl border border-[#e8e8e8] p-4">
                <p className="text-[.9rem] font-bold text-dark">{item.title}</p>
                {item.body && <p className="mt-1 text-[.85rem] leading-5 text-muted-fg">{item.body}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-dark">Related services</h2>
          <div className="mt-6 grid gap-3">
            {related.map((item) =>
              item.href ? (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-[#e8e8e8] px-4 py-3.5 text-[.9rem] font-semibold text-dark transition-colors hover:text-primary"
                >
                  {item.label}
                  <span className="text-primary">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-[#e8e8e8] px-4 py-3.5 text-[.9rem] font-semibold text-muted-fg"
                >
                  {item.label}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
