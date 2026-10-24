'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { ProjectRecord } from '@/lib/content';

export default function ProjectCard({ project: p }: { project: ProjectRecord }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const showVideo = Boolean(p.preview_video) && (hovered || focused) && !reducedMotion;
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches); update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const film = video.current; setPlaying(false);
    if (showVideo && film) void film.play().catch(() => setPlaying(false));
    return () => { film?.pause(); };
  }, [showVideo, p.preview_video]);
  return <a className="project-work" href={p.url} target="_blank" rel="noreferrer" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
    <div className="project-work-media">
      {p.screenshot ? <img className="project-work-screenshot" src={p.screenshot} alt={`${p.name} complete website screenshot`} loading="lazy" /> : <div className="project-work-placeholder"><span>Website preview</span><strong>{p.name}</strong></div>}
      {p.preview_video && <video ref={video} className="project-work-film" data-playing={showVideo && playing} src={showVideo ? p.preview_video : undefined} preload="none" muted loop playsInline aria-hidden="true" onPlaying={() => setPlaying(true)} onError={() => setPlaying(false)} />}
    </div>
    <div className="project-work-identity">{p.logo ? <><img src={p.logo} alt={p.name} loading="lazy" /><h3 className="sr-only">{p.name}</h3></> : <h3>{p.name}</h3>}<span className="project-work-arrow" aria-hidden="true"><ArrowUpRight size={22} /></span></div>
    {p.description && <p className="project-work-description">{p.description}</p>}
    {(p.tag || p.location) && <p className="project-work-meta">{[p.tag, p.location].filter(Boolean).join(' · ')}</p>}
    <span className="project-work-visit">Visit project website <ArrowUpRight size={16} aria-hidden="true" /></span>
  </a>;
}
