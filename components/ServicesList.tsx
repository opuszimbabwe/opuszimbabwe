'use client';
// /services page list. Renders the baked-in static list first, then
// upgrades to D1 content when /api/content is available.

import Link from 'next/link';
import { Globe, LayoutDashboard, Bot, Palette, Server, Plug, ArrowRight } from 'lucide-react';
import { staticServices, ServiceRecord } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

const iconMap: Record<string, any> = { Globe, LayoutDashboard, Bot, Palette, Server, Plug };

export default function ServicesList() {
  const { content } = useSiteContent();
  const services: ServiceRecord[] = (content ? content.services : staticServices).filter((s) => s.visible);
  return (
    <div className="max-w-5xl mx-auto px-6">
      {services.map((s) => {
        const Icon = iconMap[s.icon] ?? Globe;
        return (
          <div key={s.id} className="py-16 border-b border-[#eeeeee] grid md:grid-cols-[2fr_1.6fr] gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <p className="text-[.72rem] font-semibold text-muted-fg uppercase tracking-widest">{s.tagline}</p>
              </div>
              <h2 className="text-[1.5rem] font-bold text-dark leading-snug">{s.name}</h2>
              <p className="mt-3 text-[1rem] text-fg leading-7 max-w-md">{s.page_description}</p>
              <Link href={`/services/${s.slug}`} className="inline-flex items-center gap-2 mt-6 bg-primary hover:bg-dark text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-colors">
                Learn more <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {s.items.map((item) => (
                <span key={item} className="bg-[#f5f5f5] border border-[#e8e8e8] rounded-full px-3.5 py-1.5 text-[.85rem] text-dark">
                  {item}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
