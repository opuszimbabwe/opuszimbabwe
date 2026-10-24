'use client';

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
    list === 'home'
      ? content?.settings?.faq_home
      : list === 'page'
      ? content?.settings?.faq_page
      : null;
  const rawList: FaqItem[] = managed ?? items ?? [];
  const resolved: FaqItem[] = rawList;

  if (resolved.length === 0) return null;

  return (
    <div className="space-y-3">
      {resolved.map((x, i) => {
        const isOpen = open === i;
        return (
          <div
            key={x.q}
            className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
              isOpen
                ? 'border-[#e5e7eb] bg-white shadow-[0_10px_28px_rgba(13,13,13,0.06)]'
                : 'border-transparent bg-white/80 hover:bg-[#ffffff]'
            }`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-[#0d0d0d]"
            >
              <span>{x.q}</span>
              <Plus
                size={18}
                className={`shrink-0 text-[#0d0d0d] transition-all duration-300 group-hover:text-[#E85D2A] ${
                  isOpen ? 'rotate-45 text-[#E85D2A]' : ''
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-5 text-[14.5px] leading-[1.68] text-[#0d0d0d]/75">
                  {x.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
