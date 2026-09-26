'use client';
// Home page "What We Do" service card grid.
// Renders the baked-in static cards first, then upgrades to D1 content
// from /api/content when the Pages Functions API is available.

import Link from 'next/link';
import { Globe, LayoutDashboard, Bot, Palette, Server, Plug } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import { staticServices, ServiceRecord } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

const iconMap: Record<string, any> = { Globe, LayoutDashboard, Bot, Palette, Server, Plug };

export default function ServicesShowcase() {
  const { content } = useSiteContent();
  const services: ServiceRecord[] = (content ? content.services : staticServices).filter((s) => s.visible);
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 text-left">
      {services.map((s) => (
        <ServiceCard
          key={s.id}
          title={s.tagline}
          gradient={s.gradient}
          icon={iconMap[s.icon] ?? Globe}
          heading={s.name}
          description={s.description}
          image={s.image}
          ctaText="Learn more"
          ctaHref={`/services/${s.slug}`}
        />
      ))}
    </div>
  );
}
