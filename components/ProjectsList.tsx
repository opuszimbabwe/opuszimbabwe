'use client';

import { ArrowRight } from 'lucide-react';
import { staticProjects } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import { ProjectPreviewPlaceholder } from '@/components/HomeProjects';

const REMOVED_PROJECT_IDS = new Set(['zimtrade', 'agricom']);

export default function ProjectsList() {
  const { content } = useSiteContent();
  const projects = (content?.projects?.length ? content.projects : staticProjects).filter(
    (p) => p.visible && p.status === 'active' && !REMOVED_PROJECT_IDS.has(p.id)
  );

  if (projects.length === 0) {
    return (
      <p className="text-fg">Our project showcase is being updated. Contact us to see recent work.</p>
    );
  }

  return (
    <div className="grid gap-8">
      {projects.map((p) => {
        const inner = (
          <>
            <div className="overflow-hidden rounded-[20px] border border-[#ececea] bg-[#f8f8f6]">
              {p.screenshot ? (
                <img
                  src={p.screenshot}
                  alt={`${p.name} website screenshot`}
                  loading="lazy"
                  className="aspect-[16/9] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.015]"
                />
              ) : (
                <ProjectPreviewPlaceholder url={p.url} name={p.name} />
              )}
            </div>
            <div className="mt-6 flex justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-[#f5f5f5] px-3 py-1 text-[.72rem] font-semibold uppercase tracking-widest text-[#0d0d0d]/70">
                  {p.tag}
                </span>
                <h2 className="mt-4 text-2xl font-bold text-[#0d0d0d]">{p.name}</h2>
                <p className="mt-1 text-sm text-[#0d0d0d]/60">{p.location}</p>
              </div>
              <ArrowRight className="shrink-0 text-[#0d0d0d] transition-colors group-hover:text-[#E85D2A]" />
            </div>
            <p className="mt-4 leading-7 text-[#0d0d0d]/80">{p.description}</p>
            <p className="mt-6 text-sm font-semibold text-[#0d0d0d] transition-colors group-hover:text-[#E85D2A]">
              Visit live project →
            </p>
          </>
        );

        return (
          <a
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-[28px] border border-[#e8e8e8] bg-white p-6 transition-all hover:bg-[#fff8f4] sm:p-8"
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}
