'use client';
import Link from 'next/link';
import SolutionFinder from '@/components/SolutionFinder';
import { useEffect, useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import { DEFAULT_HERO_CYCLES, DEFAULT_HOME_SECTIONS, type HeroCycle, type HomeSectionsConfig } from '@/lib/content';
import { DEFAULT_HERO_DESIGN, type HeroDesign } from '@/lib/hero-design';
import { useSiteContent } from '@/lib/use-site-content';

export function HomeHeroView({ design, sections, cycles, loading = false, preview = false }: { design: HeroDesign; sections: HomeSectionsConfig; cycles: HeroCycle[]; loading?: boolean; preview?: boolean }) {
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const items = cycles.length ? cycles : DEFAULT_HERO_CYCLES;
  const backgrounds = design.backgrounds.length ? design.backgrounds : design.background.background_image ? [{ id: 'single', image: design.background.background_image }] : [];
  const count = design.rotation === 'services' ? items.length : design.rotation === 'backgrounds' ? backgrounds.length : 1;
  const activeIndex = count ? index % count : 0;
  const activeService = design.rotation === 'services' ? activeIndex : 0;
  const stopped = paused || reducedMotion || (design.pause_on_hover && hovered);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches); update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => { setIndex(0); }, [design.rotation, design.layout, count]);
  useEffect(() => {
    if (loading || stopped || count < 2 || design.rotation === 'none' || preview) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % count), design.interval_ms);
    return () => window.clearInterval(timer);
  }, [loading, stopped, count, design.rotation, design.interval_ms, preview]);
  const showMedia = design.show_media && design.layout !== 'full_bleed';
  const Heading = preview ? 'h2' : 'h1';
  const style = {
    '--hero-surface-color': design.use_existing_background ? sections.hero_bg : design.background.background_color,
    '--hero-frame': `${design.frame_width}px`, '--hero-gutter': design.use_reference_gutters ? 'var(--page-gutter)' : `${design.edge_spacing}px`,
    '--hero-inset': `${design.card_inset}px`, '--hero-radius': `${design.border_radius}px`, '--hero-height': `${design.min_height}px`,
    '--hero-top': `${design.padding_top}px`, '--hero-bottom': `${design.padding_bottom}px`, '--hero-text-width': `${design.text_width}px`,
    '--hero-heading-size': `${design.heading_size}px`, '--hero-heading-mobile': `${design.heading_mobile_size}px`,
    '--hero-body-size': `${design.body_size}px`, '--hero-body-mobile': `${design.body_mobile_size}px`, '--hero-duration': `${design.animation === 'none' || reducedMotion ? 0 : design.transition_ms}ms`,
    '--hero-card-padding': `${design.panel_padding}px`,
  } as CSSProperties;
  const uniformRadius = design.corner_mode === 'uniform' || (design.corner_mode === 'layout' && design.layout === 'card') ? design.border_radius : 0;
  const corners = design.corner_mode === 'individual' ? `${design.top_left_radius}px ${design.top_right_radius}px ${design.bottom_right_radius}px ${design.bottom_left_radius}px` : `${uniformRadius}px`;
  const panelStyle = design.text_panel ? { padding: design.panel_padding, borderRadius: design.panel_radius } : {};
  return <section className={`home-hero-shell${preview ? ' hero-editor-preview' : ''}`} data-panel={design.text_panel} data-layout={design.layout} data-media={showMedia} data-position={design.text_position} data-vertical={design.vertical_align} data-animation={design.animation} style={style} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    <div className="home-hero-surface" style={{ borderRadius: corners }}>
      <div className="home-hero-backgrounds" aria-hidden="true">{backgrounds.map((slide, i) => <img key={slide.id} src={slide.image} alt="" fetchPriority={i === 0 && !preview ? 'high' : 'auto'} className="home-hero-background" data-active={design.rotation === 'backgrounds' ? i === activeIndex : i === 0} style={{ objectPosition: `${design.background_x}% ${design.background_y}%` }} />)}</div>
      <div className="home-hero-overlay" aria-hidden="true" data-placement={design.overlay_placement} style={{ background: design.background.overlay_kind === 'gradient' ? `linear-gradient(${design.background.overlay_gradient})` : design.background.overlay_color, opacity: design.background.overlay_opacity, width: design.overlay_placement === 'full' ? '100%' : `${design.overlay_width}%` }} />
      <div className="home-hero-grid">
        <div className="home-hero-text" style={{ textAlign: design.text_align, color: design.body_color }}>
          <div className="home-hero-copy" style={panelStyle}>
            {design.text_panel && <div className="home-hero-text-panel" aria-hidden="true" style={{ backgroundColor: design.panel_color, opacity: design.panel_opacity, borderRadius: design.panel_radius }} />}
            {design.eyebrow && <p className="mb-4 text-sm font-semibold uppercase tracking-wider">{design.eyebrow}</p>}
            <Heading className="hero-heading font-poppins" style={{ color: design.heading_color, fontWeight: design.heading_weight }}>{design.headline || sections.hero_headline_main}{design.show_accent && <>{' '}<span style={{ color: design.accent_color }}>{design.headline_accent || sections.hero_headline_accent}</span></>}</Heading>
            <div className="hero-description mt-8" aria-live="off">{design.description ? <p>{design.description}</p> : <div className="hero-cycle-stack">{items.map((cycle, i) => <p key={`${i}-${cycle.question}`} data-active={i === activeService} aria-hidden={i !== activeService}>{cycle.question}</p>)}</div>}</div>
            <div className="hero-actions mt-7 flex flex-wrap gap-3" style={{ justifyContent: design.text_align === 'center' ? 'center' : design.text_align === 'right' ? 'flex-end' : 'flex-start' }}>
              {design.button_label && <Link href={design.button_href || items[activeService]?.href || '/contact/'} className="hero-primary-action inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold hover:brightness-110" style={{ backgroundColor: design.button_color, color: design.button_text_color }} tabIndex={preview ? -1 : undefined} onClick={preview ? e => e.preventDefault() : undefined}>{design.button_label}</Link>}
              {design.secondary_label && (design.secondary_action === 'guide' ? <SolutionFinder label={design.secondary_label} className="inline-flex items-center justify-center rounded-full border border-current px-7 py-3.5 text-sm font-semibold" preview={preview} /> : <Link href={design.secondary_href || '/projects/'} className="inline-flex items-center justify-center rounded-full border border-current px-7 py-3.5 text-sm font-semibold" tabIndex={preview ? -1 : undefined} onClick={preview ? e => e.preventDefault() : undefined}>{design.secondary_label}</Link>)}
            </div>
          </div>
        </div>
        {showMedia && <div className="home-hero-media">
          <div className="hero-cycle-stack" style={{ minHeight: design.media_height }}>{items.map((cycle, i) => <div key={`${i}-${cycle.image}`} data-active={i === activeService} aria-hidden={i !== activeService} className="hero-media-slide">
            <img src={design.media_image || cycle.image} alt={cycle.question} style={{ height: design.media_height, objectFit: design.media_fit }} />
            {(design.rotation === 'services' || (!design.description && design.rotation === 'none')) && <p className="mt-5 text-base font-light" style={{ color: design.body_color }}>{cycle.solution}</p>}
          </div>)}</div>
        </div>}
      </div>
      {count > 1 && design.rotation !== 'none' && !preview && <button type="button" className="hero-rotation-control" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Play hero rotation' : 'Pause hero rotation'} aria-pressed={paused}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused ? 'Play' : 'Pause'}</button>}
    </div>
  </section>;
}
export default function HomeHero() {
  const { content, status } = useSiteContent();
  return <HomeHeroView design={content?.settings.hero_design || DEFAULT_HERO_DESIGN} sections={content?.settings.home_sections || DEFAULT_HOME_SECTIONS} cycles={content?.settings.hero_cycles || DEFAULT_HERO_CYCLES} loading={status === 'loading'} />;
}
