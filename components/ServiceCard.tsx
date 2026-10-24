'use client';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { ServiceRecord } from '@/lib/content';

const tones: Record<string, string> = { 'web-design': '#9b4236', 'software-development': '#58415d', 'ai-automation': '#a13f65', 'graphic-design': '#274e48', 'domains-hosting': '#a05c14', 'api-integrations': '#252943' };
export default function ServiceCard({ service, expanded, onExpand }: { service: ServiceRecord; expanded: boolean; onExpand: (next: boolean) => void }) {
  const tone = service.card_bg_color && service.card_bg_color.toLowerCase() !== '#ffffff' ? service.card_bg_color : tones[service.id] || '#735b4a';
  const detailsId = `service-details-${service.id}`;
  return <article className="service-panel" data-open={expanded} style={{ '--service-tone': tone } as CSSProperties}
    onPointerEnter={event => { if (event.pointerType === 'mouse') onExpand(true); }}>
    <img className="service-panel-image" src={service.image} alt="" loading="lazy" />
    <div className="service-panel-shade" aria-hidden="true" />
    <button type="button" className="service-panel-trigger" aria-expanded={expanded} aria-controls={detailsId} onClick={() => onExpand(!expanded)} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) onExpand(true); }}>
      <span className="service-panel-title">{service.name}</span>
      <span className="service-panel-plus" aria-hidden="true"><Plus size={24} /></span>
    </button>
    <div id={detailsId} className="service-panel-details" hidden={!expanded}>
      <p>{service.description}</p>
      <Link href={`/services/${service.slug}/`} className="service-page-button mt-5 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">Explore {service.tagline.toLowerCase()} <ArrowRight size={17} /></Link>
    </div>
  </article>;
}
