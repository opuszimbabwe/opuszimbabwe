'use client';
// Home page "Built for Zimbabwe" section.
// Content is admin-managed (Home tab in /admin); falls back to the built-in
// copy when the content API is unreachable.

import { DEFAULT_SETTINGS } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function BuiltForZimbabwe() {
  const { content } = useSiteContent();
  const built = content?.settings?.built_for_zimbabwe || DEFAULT_SETTINGS.built_for_zimbabwe;

  return (
    <section className="bg-[#f8f7fb] bg-cover bg-center py-20" style={{ backgroundImage: `url('${built.image}')` }}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2">
        <div className="rounded-[28px] bg-white/90 p-8 shadow-[0_12px_32px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <p className="text-[.8rem] font-semibold uppercase tracking-[.12em] text-primary">{built.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-dark">{built.heading}</h2>
          <p className="mt-4 leading-7">{built.body}</p>
        </div>
        <div aria-hidden="true" className="min-h-64" />
      </div>
    </section>
  );
}
