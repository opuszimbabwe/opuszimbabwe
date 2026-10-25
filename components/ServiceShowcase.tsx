'use client';

import {presentationBackground,presentationOverlay} from '@/lib/service-presentations';
import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { extrasFor, staticExtras } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import type { ServicePageData } from '@/components/ServicePageTemplate';

/** Managed service imagery and delivered work in an edge-to-edge showcase. */
export default function ServiceShowcase({ data }: { data: ServicePageData }) {
  const { content } = useSiteContent();
  const extras = extrasFor(content, data.serviceId);
  const design=content?.settings.service_presentations.detail_showcase[data.serviceId];
  const service = content?.services.find(item => item.id === data.serviceId);
  const projects = data.serviceId === 'web-design' ? content?.projects.filter(item => item.visible && item.status === 'active' && item.screenshot) || [] : [];
  const visual = extras?.visual_background;
  const customVisual = visual && visual !== staticExtras[data.serviceId]?.visual_background ? visual : '';
  const images = [...new Set((design?[design.image,...design.slides]:[customVisual||service?.image||visual||data.image,...projects.map(item=>item.screenshot)]).filter((src):src is string=>Boolean(src)))];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  useEffect(() => {
    if (paused || interacting || images.length < 2) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (!motion.matches && document.visibilityState === 'visible') timer = setInterval(() => setActive(value => (value + 1) % images.length), 5000);
    };
    sync(); motion.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(timer); motion.removeEventListener('change', sync); document.removeEventListener('visibilitychange', sync); };
  }, [images.length, paused, interacting]);
  const index = images.length?active%images.length:0;
  if(!images.length)return null;
  return (
    <section className="site-frame service-editorial-showcase" aria-label={`${service?.name || data.eyebrow} showcase`}>
      <div className="service-editorial-stage" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
        <div className="service-editorial-slides" style={design?{background:presentationBackground(design)}:undefined} aria-live="off">{images.map((src, i) => <img key={src} src={src} alt={i === 0 ? `${service?.name || data.eyebrow} by Opus Zimbabwe` : projects.find(project => project.screenshot === src)?.name || 'Our delivered website work'} className="service-editorial-slide" style={design?{objectFit:design.image_fit}:undefined} data-artwork={src === '/images/service-graphic.png' ? 'graphic' : src === '/images/service-web-design.png' || src === '/images/hero-website-design.png' ? 'web' : undefined} data-active={index === i} aria-hidden={index !== i} loading={i === 0 ? 'eager' : 'lazy'} />)}</div>
        {design&&<div className="service-presentation-overlay" aria-hidden="true" style={{background:presentationOverlay(design),opacity:design.overlay_opacity}}/>}
        {images.length > 1 && <div className="service-editorial-controls"><div className="flex gap-2" aria-label="Choose showcase image">{images.map((src, i) => <button key={src} type="button" onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-pressed={index === i} className="service-editorial-dot" />)}</div><button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play showcase' : 'Pause showcase'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button></div>}
      </div>
    </section>
  );
}
