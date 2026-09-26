'use client';
// /projects page list.
// Projects are admin-managed (Projects tab in /admin): status 'active'
// renders as a link to the live site, 'coming_soon' renders as a badge.

import { ArrowRight } from 'lucide-react';
import { staticProjects } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function ProjectsList() {
  const { content } = useSiteContent();
  const projects = (content?.projects?.length ? content.projects : staticProjects).filter((p) => p.visible);

  if (projects.length === 0) {
    return (
      <p className="text-fg">Our project showcase is being updated. Contact us to see recent work.</p>
    );
  }

  return (
    <div className="grid gap-6">
      {projects.map((p) => {
        const inner = (
          <>
            <div className="flex justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-primary/8 px-3 py-1 text-[.72rem] font-semibold uppercase tracking-widest text-primary">
                  {p.tag}
                </span>
                <h2 className="mt-4 text-2xl font-bold text-dark">{p.name}</h2>
                <p className="mt-1 text-sm text-muted-fg">{p.location}</p>
              </div>
              <ArrowRight className="text-primary" />
            </div>
            <p className="mt-4 leading-7 text-fg">{p.description}</p>
            <p className="mt-6 text-sm font-semibold text-primary">
              {p.status === 'coming_soon' ? 'Coming soon' : 'Visit live project →'}
            </p>
          </>
        );

        if (p.status === 'active' && p.url) {
          return (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-[28px] border border-[#e8e8e8] bg-white p-8 transition-all hover:border-primary/40"
            >
              {inner}
            </a>
          );
        }

        return (
          <div key={p.id} className="rounded-[28px] border border-[#e8e8e8] bg-white p-8">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
