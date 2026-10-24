'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { staticProjects } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

const REMOVED_PROJECT_IDS = new Set(['zimtrade', 'agricom']);

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Neutral browser-frame placeholder shown until the admin uploads a screenshot. */
export function ProjectPreviewPlaceholder({ url, name }: { url: string; name: string }) {
  return (
    <div className="flex aspect-[16/10] w-full flex-col overflow-hidden rounded-[16px] border border-[#e7e9e8] bg-[#f8f8f6]">
      <div className="flex items-center gap-1.5 border-b border-[#e7e9e8] bg-white px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-[#d9d9d4]" />
        <span className="h-2 w-2 rounded-full bg-[#d9d9d4]" />
        <span className="h-2 w-2 rounded-full bg-[#d9d9d4]" />
        <span className="ml-2 truncate rounded-full bg-[#f3f3f0] px-2.5 py-0.5 text-[.65rem] text-[#0d0d0d]/55">
          {domainOf(url) || 'Preview coming soon'}
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <span className="text-[.7rem] font-semibold uppercase tracking-[.16em] text-[#0d0d0d]/35">
          Website preview
        </span>
        <span className="mt-2 line-clamp-2 text-sm font-semibold text-[#0d0d0d]/70">{name}</span>
      </div>
    </div>
  );
}

export default function HomeProjects() {
  const { content } = useSiteContent();
  // Admin can add as many active live work projects as needed — all visible active projects render.
  const projects = (content ? content.projects : staticProjects).filter(
    (p) =>
      p.visible &&
      p.status === 'active' &&
      Boolean(p.url) &&
      !REMOVED_PROJECT_IDS.has(p.id)
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [projects.length]);

  if (projects.length === 0) return null;

  return (
    <div ref={gridRef} className="mx-auto mt-10 grid max-w-5xl gap-6 text-left md:grid-cols-2">
      {projects.map((p, index) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          style={{ transitionDelay: `${index * 100}ms` }}
          className={`group flex flex-col rounded-[26px] border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_22px_rgba(13,13,13,0.04)] transition-all duration-500 ease-out hover:bg-[#fff8f4] hover:shadow-[0_12px_30px_rgba(13,13,13,0.08)] ${
            inView ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="overflow-hidden rounded-[18px] bg-[#f8f8f6]">
            {p.screenshot ? (
              <img
                src={p.screenshot}
                alt={`${p.name} website screenshot`}
                loading="lazy"
                className="aspect-[16/10] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            ) : (
              <ProjectPreviewPlaceholder url={p.url} name={p.name} />
            )}
          </div>
          <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
            <h3 className="text-xl font-bold text-[#0d0d0d]">{p.name}</h3>
            {p.description && (
              <p className="mt-2.5 line-clamp-3 text-[0.92rem] leading-[1.65] text-[#0d0d0d]/75">
                {p.description}
              </p>
            )}
            <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0d0d0d] transition-colors duration-200 group-hover:text-[#E85D2A]">
              Visit project website
              <ArrowRight
                size={16}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
