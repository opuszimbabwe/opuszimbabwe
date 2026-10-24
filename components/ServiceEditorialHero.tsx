'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { contactHref, extrasFor } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import type { ServicePageData } from '@/components/ServicePageTemplate';

/** Own service copy and live work, presented in a spacious editorial hero. */
export default function ServiceEditorialHero({ data }: { data: ServicePageData }) {
  const { content } = useSiteContent();
  const extras = extrasFor(content, data.serviceId);
  const service = content?.services.find(item => item.id === data.serviceId);
  const projects = data.serviceId === 'web-design' ? content?.projects.filter(item => item.visible && item.status === 'active' && item.screenshot) || [] : [];
  const images = [...new Set([extras?.visual_background || service?.image || data.image, ...projects.map(item => item.screenshot)].filter((src): src is string => Boolean(src)))];
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
  const cta = extras?.hero_cta || data.cta;
  const label = cta.toLowerCase();
  const href = /package|pricing/.test(label) ? '#pricing' : label.includes('our work') ? '/projects/' : contactHref(service?.name || data.eyebrow, data.domainCta ? '' : undefined);
  const index = active % images.length;
  const backdrop = extras?.hero_background_kind === 'gradient'
    ? `linear-gradient(${extras.hero_gradient || '135deg,#9b4236,#252943'})`
    : `linear-gradient(135deg,#9b4236,#252943)`;
  return <>
    <section className="site-frame service-editorial-hero">
      <h1>{extras?.hero_headline || data.headline}</h1>
      <div className="service-editorial-summary"><p>{extras?.hero_intro || data.intro}</p><Link href={href} className="get-started-gradient services-index-action">{cta}<ArrowUpRight size={20} aria-hidden="true" /></Link></div>
    </section>
    <section className="site-frame service-editorial-showcase" aria-label={`${service?.name || data.eyebrow} showcase`}>
      <div className="service-editorial-stage" style={{ backgroundImage: backdrop }} onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
        {extras?.hero_background_kind !== 'gradient' && extras?.hero_background && extras.hero_background !== data.image && <img className="service-editorial-backdrop" src={extras.hero_background} alt="" />}
        <div className="service-editorial-slides" aria-live="off">{images.map((src, i) => <img key={src} src={src} alt={i === 0 ? `${service?.name || data.eyebrow} by Opus Zimbabwe` : projects.find(project => project.screenshot === src)?.name || 'Our delivered website work'} className="service-editorial-slide" style={src === '/images/service-web-design.png' || src === '/images/hero-website-design.png' ? { objectPosition: 'center' } : undefined} data-active={index === i} aria-hidden={index !== i} loading={i === 0 ? 'eager' : 'lazy'} />)}</div>
        {images.length > 1 && <div className="service-editorial-controls"><div className="flex gap-2" aria-label="Choose showcase image">{images.map((src, i) => <button key={src} type="button" onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-pressed={index === i} className="service-editorial-dot" />)}</div><button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Play showcase' : 'Pause showcase'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button></div>}
      </div>
    </section>
  </>;
}
