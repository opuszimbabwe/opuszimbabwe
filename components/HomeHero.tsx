'use client';
import {gradientCss} from '@/lib/colors';
import Link from 'next/link';
import SolutionFinder from '@/components/SolutionFinder';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Pause, Play } from 'lucide-react';
import { DEFAULT_HERO_CYCLES, DEFAULT_HOME_SECTIONS, heroServiceWord, type HeroCycle, type HomeSectionsConfig } from '@/lib/content';
import { DEFAULT_HERO_DESIGN, type HeroDesign } from '@/lib/hero-design';
import { useSiteContent } from '@/lib/use-site-content';

// Transparent margins in our existing artwork are cropped in CSS, preserving
// the original files and leaving uploaded/custom images under the normal controls.
const artworkBounds: Record<string, [number, number, number, number, number, number]> = {
  '/images/hero-website-design.png': [500, 500, 46, 129, 410, 266],
  '/images/hero-software-systems.png': [666, 375, 36, 24, 612, 323],
  '/images/hero-ai-automation.png': [636, 392, 53, 53, 560, 321],
  '/images/hero-graphic-design.png': [743, 740, 127, 184, 442, 476],
  '/images/hero-domains-hosting.png': [586, 426, 1, 1, 585, 423],
  '/images/hero-api-integrations.png': [1408, 768, 305, 96, 788, 582],
};
function ServiceImage({ source, label, design }: { source: string; label: string; design: HeroDesign }) {
  const bounds = design.headline_mode === 'service_words' && design.media_fit === 'contain' ? artworkBounds[source] : null;
  if (!bounds) return <img src={source} alt={label} style={{ height: design.media_height, objectFit: design.media_fit, objectPosition: 'center bottom' }} />;
  const [width, height, left, top, cropWidth, cropHeight] = bounds;
  return <div className="hero-artwork-frame" style={{ height: design.media_height, display: 'grid', alignItems: 'end', justifyItems: 'center' }}><div style={{ position: 'relative', overflow: 'hidden', aspectRatio: `${cropWidth}/${cropHeight}`, width: `min(100%, ${design.media_height * cropWidth / cropHeight}px)` }}>
    <img src={source} alt={label} style={{ position: 'absolute', maxWidth: 'none', width: `${width / cropWidth * 100}%`, height: `${height / cropHeight * 100}%`, left: `${-left / cropWidth * 100}%`, top: `${-top / cropHeight * 100}%` }} />
  </div></div>;
}

function RotatingServiceWords({ words, index, animate }: { words: string[]; index: number; animate: boolean }) {
  const lastIndex = useRef(index);
  const [previous, setPrevious] = useState<number | null>(null);
  useEffect(() => {
    const oldIndex = lastIndex.current;
    lastIndex.current = index;
    if (!animate || oldIndex === index) { setPrevious(null); return; }
    setPrevious(oldIndex);
    const timer = window.setTimeout(() => setPrevious(null), 500);
    return () => window.clearTimeout(timer);
  }, [index, animate]);
  return <><span className="sr-only">{words[index]}</span><span className="hero-rotating-words" aria-hidden="true">
    {words.map((word, i) => <span key={`measure-${i}`} className="hero-rotating-words__measure">{word}</span>)}
    {words.map((word, i) => <span key={i} data-rotating-word data-current={i === index || undefined} data-previous={i === previous && i !== index || undefined} style={!animate ? { animation: 'none' } : undefined}>{word}</span>)}
  </span></>;
}

export function HomeHeroView({ design, sections, cycles, loading = false, preview = false }: { design: HeroDesign; sections: HomeSectionsConfig; cycles: HeroCycle[]; loading?: boolean; preview?: boolean }) {
  const [index, setIndex] = useState(0);
  const [backgroundIndex,setBackgroundIndex]=useState(0);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const items = cycles.length ? cycles : DEFAULT_HERO_CYCLES;
  const backgrounds = design.background_rotation==='none'?[]:design.background_rotation==='slides'&&design.backgrounds.length?design.backgrounds:design.background.background_image?[{id:'single',image:design.background.background_image}]:design.backgrounds.slice(0,1);
  const backgroundCount=design.background_rotation==='slides'?backgrounds.length:1;
  const activeBackground=backgroundCount?backgroundIndex%backgroundCount:0;
  const count = design.rotation === 'services' ? items.length : 1;
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
  useEffect(()=>{setBackgroundIndex(0)},[design.background_rotation,backgroundCount]);
  useEffect(()=>{if(loading||stopped||backgroundCount<2||preview)return;const timer=window.setInterval(()=>setBackgroundIndex(i=>(i+1)%backgroundCount),design.interval_ms);return()=>clearInterval(timer)},[loading,stopped,backgroundCount,design.interval_ms,preview]);
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
  return <section className={`home-hero-shell${preview ? ' hero-editor-preview' : ''}`} data-panel={design.text_panel} data-layout={design.layout} data-media={showMedia} data-position={design.text_position} data-vertical={design.vertical_align} data-animation={design.animation} data-headline-mode={design.headline_mode} style={style} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    <div className="home-hero-surface" style={{ borderRadius: corners }}>
      <div className="home-hero-backgrounds" aria-hidden="true">{backgrounds.map((slide, i) => <img key={slide.id} src={slide.image} alt="" fetchPriority={i === 0 && !preview ? 'high' : 'auto'} className="home-hero-background" data-active={i===activeBackground} style={{ objectPosition: `${design.background_x}% ${design.background_y}%` }} />)}</div>
      <div className="home-hero-overlay" aria-hidden="true" data-placement={design.overlay_placement} style={{ background: design.background.overlay_kind === 'gradient' ? gradientCss(design.background.overlay_gradient) : design.background.overlay_color, opacity: design.background.overlay_opacity, width: design.overlay_placement === 'full' ? '100%' : `${design.overlay_width}%` }} />
      <div className="home-hero-grid">
        <div className="home-hero-text" style={{ textAlign: design.text_align, color: design.body_color }}>
          <div className="home-hero-copy" style={panelStyle}>
            {design.text_panel && <div className="home-hero-text-panel" aria-hidden="true" style={{ backgroundColor: design.panel_color, opacity: design.panel_opacity, borderRadius: design.panel_radius }} />}

            <Heading className="hero-heading font-poppins" style={{ color: design.heading_color, fontWeight: design.heading_weight }}>
              {design.headline_mode === 'service_words' ? <>{design.headline || "Work with Zimbabwe's Best"}{' '}<span style={{ color: design.show_accent ? design.accent_color : design.heading_color }}><RotatingServiceWords words={items.map(heroServiceWord)} index={activeService} animate={!reducedMotion && design.animation !== 'none'} /></span></> : <>{design.headline || sections.hero_headline_main}{design.show_accent && <>{' '}<span style={{ color: design.accent_color }}>{design.headline_accent || sections.hero_headline_accent}</span></>}</>}
            </Heading>
            {(design.description || design.headline_mode === 'static') && <div className="hero-description mt-8" aria-live="off">{design.description ? <p>{design.description}</p> : <div className="hero-cycle-stack">{items.map((cycle, i) => <p key={`${i}-${cycle.question}`} data-active={i === activeService} aria-hidden={i !== activeService}>{cycle.question}</p>)}</div>}</div>}
            <div className="hero-actions mt-7 flex flex-wrap gap-3" style={{ justifyContent: design.text_align === 'center' ? 'center' : design.text_align === 'right' ? 'flex-end' : 'flex-start' }}>
              {design.button_label && <Link href={design.button_href || items[activeService]?.href || '/contact/'} className="hero-primary-action inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold hover:brightness-110" style={{ backgroundColor: design.button_color, color: design.button_text_color }} tabIndex={preview ? -1 : undefined} onClick={preview ? e => e.preventDefault() : undefined}>{design.button_label}</Link>}
              {design.secondary_label && (design.secondary_action === 'guide' ? <SolutionFinder label={design.secondary_label} className="inline-flex items-center justify-center rounded-full border border-current px-7 py-3.5 text-sm font-semibold" preview={preview} /> : <Link href={design.secondary_href || '/projects/'} className="inline-flex items-center justify-center rounded-full border border-current px-7 py-3.5 text-sm font-semibold" tabIndex={preview ? -1 : undefined} onClick={preview ? e => e.preventDefault() : undefined}>{design.secondary_label}</Link>)}
            </div>
          </div>
        </div>
        {showMedia && <div className="home-hero-media">
          <div className="hero-cycle-stack" style={{ minHeight: design.media_height }}>{items.map((cycle, i) => <div key={`${i}-${cycle.image}`} data-active={i === activeService} aria-hidden={i !== activeService} className="hero-media-slide">
            <ServiceImage source={design.media_image || cycle.image} label={heroServiceWord(cycle)} design={design} />
            {(design.rotation === 'services' || (!design.description && design.rotation === 'none')) && <p className="hero-media-caption" style={{ color: design.body_color, marginTop: design.caption_gap, fontSize: design.caption_size, fontWeight: design.caption_weight }}>{cycle.solution}</p>}
          </div>)}</div>
        </div>}
      </div>
      {(count>1||backgroundCount>1) && !preview && <button type="button" className="hero-rotation-control" onClick={() => setPaused(v => !v)} aria-label={paused ? 'Play hero rotation' : 'Pause hero rotation'} aria-pressed={paused}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}{paused ? 'Play' : 'Pause'}</button>}
    </div>
  </section>;
}
export default function HomeHero() {
  const { content, status } = useSiteContent();
  return <HomeHeroView design={content?.settings.hero_design || DEFAULT_HERO_DESIGN} sections={content?.settings.home_sections || DEFAULT_HOME_SECTIONS} cycles={content?.settings.hero_cycles || DEFAULT_HERO_CYCLES} loading={status === 'loading'} />;
}
