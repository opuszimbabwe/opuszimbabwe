'use client';

import {presentationBackground,presentationOverlay} from '@/lib/service-presentations';
import { extrasFor } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function ServiceVisual({ serviceId, fallback }: { serviceId?: string; fallback: string }) {
  const { content } = useSiteContent();
  const design=serviceId?content?.settings.service_presentations.detail_visual[serviceId]:undefined;
  const visual = design?design.image:extrasFor(content,serviceId)?.visual_background||fallback;
  return (
    <div style={design?{position:'relative',background:presentationBackground(design)}:undefined} className="mt-5 overflow-hidden rounded-[48px] bg-white shadow-[0_16px_40px_rgba(0,0,0,.10)]">
      {visual&&<img style={design?{objectFit:design.image_fit}:undefined} src={visual} alt="" loading="lazy" decoding="async" className="h-[320px] w-full object-cover sm:h-[520px]"/>}{design&&<div className="service-presentation-overlay" aria-hidden="true" style={{background:presentationOverlay(design),opacity:design.overlay_opacity}}/>}
    </div>
  );
}
