'use client';
// FAQ accordion.
//
// `list` pulls one of the two admin-managed FAQ lists (FAQ tab in /admin):
// 'home' → the short list on the home page, 'page' → the full /faq page.
// `items` is the built-in copy, used when the content API is unreachable
// or when no list is requested.

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FaqItem } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function FaqAccordion({
  items,
  list,
}: {
  items?: FaqItem[];
  list?: 'home' | 'page';
}) {
  const [open, setOpen] = useState<number | null>(null);
  const { content } = useSiteContent();

  const managed =
    list === 'home' ? content?.settings?.faq_home : list === 'page' ? content?.settings?.faq_page : null;
  const resolved: FaqItem[] = managed && managed.length ? managed : items || [];

  if (resolved.length === 0) return null;

  return (
    <div className="space-y-3">
      {resolved.map((x, i) => (
        <div
          key={x.q}
          className={`overflow-hidden rounded-2xl ${
            open === i ? 'border border-border bg-white shadow-[0_10px_28px_rgba(23,19,31,0.08)]' : 'bg-muted'
          }`}
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-dark"
          >
            {x.q}
            <Plus className={`text-primary transition-transform ${open === i ? 'rotate-45' : ''}`} />
          </button>
          <div
            className={`px-6 text-sm leading-[1.6] text-muted-fg transition-all duration-300 ${
              open === i ? 'max-h-96 pb-5' : 'max-h-0 overflow-hidden'
            }`}
          >
            {x.a}
          </div>
        </div>
      ))}
    </div>
  );
}
