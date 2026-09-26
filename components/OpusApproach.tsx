'use client';
// Home page "The Opus Approach" cards.
// Content is admin-managed (Home tab in /admin); falls back to the built-in
// copy when the content API is unreachable.

import { DEFAULT_SETTINGS } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function OpusApproach() {
  const { content } = useSiteContent();
  const items = content?.settings?.approach_items?.length
    ? content.settings.approach_items
    : DEFAULT_SETTINGS.approach_items;

  return (
    <div className="mt-10 grid gap-4 text-left md:grid-cols-5">
      {items.map((item) => {
        const Icon = resolveIcon(item.icon);
        return (
          <div
            key={item.title}
            className="rounded-[20px] border border-[#f0f0f0] bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={25} strokeWidth={1.8} />
            </div>
            <h3 className="mt-5 text-[1.05rem] font-bold text-dark">{item.title}</h3>
            <p className="mt-2 text-[0.9rem] leading-6 text-[#6b7280]">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}
