'use client';
import Link from 'next/link';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { DEFAULT_WHY_CHOOSE_US, type WhyItem } from '@/lib/content';
import PaymentTrustStrip from '@/components/PaymentTrustStrip';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';
export type Reason = WhyItem;
export const DEFAULT_WHY_REASONS = DEFAULT_WHY_CHOOSE_US;

function ExpandingRegion({ active, children, className, id, labelledBy }: { active: boolean; children: ReactNode; className: string; id: string; labelledBy?: string }) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const node = inner.current; if (!node) return;
    const measure = () => setHeight(node.scrollHeight); measure();
    const observer = new ResizeObserver(measure); observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div id={id} className={className} style={{ height: active ? height : 0 }} aria-hidden={!active} aria-labelledby={labelledBy} role={labelledBy ? 'region' : undefined}><div ref={inner}>{children}</div></div>;
}

export default function WhyChooseUs({ items }: { items?: Reason[] }) {
  const { content } = useSiteContent();
  const reasons = content?.settings.why_choose_us ?? items ?? DEFAULT_WHY_CHOOSE_US;
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const current = reasons.length ? index % reasons.length : 0;
  const stopped = paused || hovered || focused || !inView || !visible || reducedMotion;
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); update(); media.addEventListener('change', update);
    const visibility = () => setVisible(document.visibilityState === 'visible'); visibility(); document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(entries => setInView(entries.some(entry => entry.isIntersecting)), { threshold: 0.01 }); if (root.current) observer.observe(root.current);
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); observer.disconnect(); };
  }, [reasons.length]);
  const select = (next: number) => { setIndex(next); setCycle(value => value + 1); };
  if (!reasons.length) return null;
  return <div className="why-accordion mt-12" ref={root} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    {reasons.map((item, i) => {
      const active = i === current; const Icon = item.icon ? resolveIcon(item.icon) : null;
      const headingId = `${id}-heading-${i}`, paragraphId = `${id}-paragraph-${i}`, linkId = `${id}-link-${i}`;
      const label = item.cta_label ?? 'Discuss your project';
      return <article key={i} className={`home-product_tab-link w-tab-link${active ? ' w--current' : ''}`} data-active={active}>
        <h3 className="heading-style-h4"><button ref={node => { buttons.current[i] = node; }} type="button" id={headingId} aria-expanded={active} aria-controls={`${paragraphId} ${linkId}`} onClick={() => select(i)} onKeyDown={event => {
          const next = event.key === 'ArrowDown' ? (i + 1) % reasons.length : event.key === 'ArrowUp' ? (i + reasons.length - 1) % reasons.length : event.key === 'Home' ? 0 : event.key === 'End' ? reasons.length - 1 : null;
          if (next === null) return; event.preventDefault(); select(next); buttons.current[next]?.focus();
        }}>{Icon && <Icon size={22} aria-hidden="true" />}{item.title}</button></h3>
        <ExpandingRegion active={active} className="home-product_paragraph" id={paragraphId} labelledBy={headingId}><div className="why-paragraph-inner"><p>{item.body}</p>{(item.show_payments ?? item.title.trim().toLowerCase() === 'local payments') && <PaymentTrustStrip compact />}</div></ExpandingRegion>
        <ExpandingRegion active={active} className="home-product_inner-link" id={linkId}>{label && <Link href={item.cta_href || '/contact/'} tabIndex={active ? 0 : -1}>{label}<ArrowRight size={16} aria-hidden="true" /></Link>}</ExpandingRegion>
        <div className="home-product_progress-wrapper" aria-hidden="true"><div key={`${i}-${cycle}`} className="home-product_progress-bar" style={{ animationPlayState: stopped ? 'paused' : 'running' }} onAnimationEnd={event => { if (reasons.length > 1 && active && !stopped && event.animationName === 'why-progress-fill') select((current + 1) % reasons.length); }} /></div>
      </article>;
    })}
    {reasons.length > 1 && <button type="button" className="why-cycle-control" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Play reasons rotation' : 'Pause reasons rotation'}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}{paused ? 'Play' : 'Pause'}</button>}
  </div>;
}
