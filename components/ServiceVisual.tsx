'use client';

import { extrasFor } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function ServiceVisual({ serviceId, fallback }: { serviceId?: string; fallback: string }) {
  const { content } = useSiteContent();
  const visual = extrasFor(content, serviceId)?.visual_background || fallback;
  return (
    <div className="mt-5 overflow-hidden rounded-[48px] bg-[#f0f2f1] shadow-[0_16px_40px_rgba(0,0,0,.10)]">
      <img src={visual} alt="" className="h-[320px] w-full object-cover sm:h-[520px]" />
    </div>
  );
}
