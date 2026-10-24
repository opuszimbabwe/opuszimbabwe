import type { ReactNode } from 'react';
import type { SectionDesign } from '@/lib/section-design';

export default function SectionBackdrop({ design, children, className = '' }: { design: SectionDesign; children: ReactNode; className?: string }) {
  return <div className={`section-backdrop relative isolate overflow-hidden ${className}`} style={{ backgroundColor: design.background_color }}>
    {design.background_image && <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(design.background_image)})` }} aria-hidden="true" />}
    <div className="absolute inset-0 -z-10" aria-hidden="true" style={{ background: design.overlay_kind === 'gradient' ? `linear-gradient(${design.overlay_gradient})` : design.overlay_color, opacity: design.overlay_opacity }} />
    {children}
  </div>;
}
