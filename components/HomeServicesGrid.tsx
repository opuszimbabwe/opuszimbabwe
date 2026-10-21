'use client';

import { useEffect, useRef, useState } from 'react';
import ServiceCard from '@/components/ServiceCard';
import { ServiceRecord, staticServices } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function HomeServicesGrid() {
  const { content } = useSiteContent();
  const services: ServiceRecord[] = (content?.services?.length ? content.services : staticServices)
    .filter((s) => s.visible)
    .slice(0, 6);

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
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (services.length === 0) return null;

  return (
    <div
      ref={gridRef}
      className="mt-12 grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 lg:grid-cols-3"
    >
      {services.map((s, index) => {
        const Icon = resolveIcon(s.icon);
        return (
          <div
            key={s.id}
            style={{ transitionDelay: `${index * 80}ms` }}
            className={`h-full transition-all duration-500 ease-out ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
          >
            <ServiceCard
              title={s.tagline}
              icon={Icon}
              heading={s.name}
              description={s.description}
              items={s.items}
              ctaText="Explore"
              ctaHref={`/services/${s.slug}/`}
              cardBgColor={s.card_bg_color || '#ffffff'}
            />
          </div>
        );
      })}
    </div>
  );
}
