'use client';
import { useState } from 'react';
import ServiceCard from '@/components/ServiceCard';
import { staticServices, type ServiceRecord } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

function ServiceRail({ services }: { services: ServiceRecord[] }) {
  const {content}=useSiteContent();
  const [active, setActive] = useState<string | null>(services[services.length - 1]?.id ?? null);
  return <div className="service-rail">{services.map(service => <ServiceCard design={content?.settings.service_presentations.home[service.id]} key={service.id} service={service} expanded={active === service.id} onExpand={open => setActive(open ? service.id : null)} />)}</div>;
}
export default function HomeServicesGrid() {
  const { content } = useSiteContent();
  const services = (content ? content.services : staticServices).filter(service => service.visible);
  return <div className="mt-12 space-y-6">{Array.from({ length: Math.ceil(services.length / 3) }, (_, i) => <ServiceRail key={services[i * 3].id} services={services.slice(i * 3, i * 3 + 3)} />)}</div>;
}
