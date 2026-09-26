'use client';
// Home page "Our Projects" grid.
// Projects are admin-managed (Projects tab in /admin): status 'active'
// renders as a link to the live site, 'coming_soon' renders as a badge.

import { ArrowRight } from 'lucide-react';
import { staticProjects } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function HomeProjects() {
  const { content } = useSiteContent();
  const projects = (content?.projects?.length ? content.projects : staticProjects)
    .filter((p) => p.visible)
    .slice(0, 4);

  if (projects.length === 0) return null;

  return (
    <div className="mt-8 grid max-w-4xl gap-6 text-left md:grid-cols-2 mx-auto">
      {projects.map((p) => {
        const body = (
          <>
            <h3 className="text-xl font-bold text-dark">{p.name}</h3>
            {p.status === 'coming_soon' ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[.72rem] font-bold uppercase tracking-widest text-primary">
                Coming soon
              </p>
            ) : (
              <p className="mt-3 flex items-center gap-1 text-primary">
                Visit project website <ArrowRight className="inline text-primary" size={16} />
              </p>
            )}
          </>
        );

        if (p.status === 'active' && p.url) {
          return (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-[26px] bg-muted p-7 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
            >
              {body}
            </a>
          );
        }

        return (
          <div key={p.id} className="rounded-[26px] bg-muted p-7">
            {body}
          </div>
        );
      })}
    </div>
  );
}
