'use client';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { staticServices, DEFAULT_HOME_SECTIONS, type ServiceRecord } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';
import OpusApproach from '@/components/OpusApproach';
import SolutionFinder from '@/components/SolutionFinder';
import AccentHeadingText from '@/components/AccentHeadingText';
const surfaces = ['#9b4236', '#58415d', '#a13f65', '#274e48', '#a05c14', '#252943'];

const surfaceFor = (service: ServiceRecord, index: number) => service.card_bg_color && service.card_bg_color.toLowerCase() !== '#ffffff' ? service.card_bg_color : surfaces[index % surfaces.length];
function inkFor(surface: string) {
  const hex = surface.slice(1); const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex;
  const [r, g, b] = [0, 2, 4].map(offset => parseInt(full.slice(offset, offset + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 145 ? '#ffffff' : '#0f0928';
}
export default function ServicesList() {
  const { content } = useSiteContent();
  const services = (content ? content.services : staticServices).filter(service => service.visible);
  const sections = content?.settings.home_sections || DEFAULT_HOME_SECTIONS;
  return <>
    <section className="services-index-hero">
      <div className="site-frame services-index-intro">
        <div className="services-index-heading"><h1>What we <span className="textured-accent">build</span><br />for you.</h1></div>
        <div className="services-index-intro-copy"><p>Websites, software, AI and automation, branding, domains, hosting and integrations. One team in Zimbabwe, building around the way your business works.</p><p>Clear pricing, fast turnaround and support that continues after launch.</p><Link href="/contact/" className="get-started-gradient services-index-action">Discuss your project <ArrowUpRight size={22} aria-hidden="true" /></Link>{services.length > 0 && <a href="#all-services" className="services-index-jump">Explore our services <ArrowDown size={16} aria-hidden="true" /></a>}</div>
      </div>
    </section>
    {services.length > 0 && <>
      <section id="all-services" className="site-frame services-index-featured" aria-labelledby="services-featured-heading"><h2 id="services-featured-heading" className="sr-only">Our services</h2>
        <div className="services-index-grid">{services.map((service, index) => <Link key={service.id} href={`/services/${service.slug}/`} className={`services-index-card ${index % 3 === 0 ? 'services-index-card-tall' : 'services-index-card-wide'} ${index === 2 || index === 4 ? 'services-index-card-full-image' : ''}`} style={{ backgroundColor: surfaceFor(service, index), color: index === 2 || index === 4 ? '#ffffff' : inkFor(surfaceFor(service, index)) }}>
          <div className="services-index-card-copy"><h3>{service.name}</h3><div className="services-index-card-description">{service.page_description}</div><span className="services-index-card-link">Explore service <ArrowUpRight size={18} aria-hidden="true" /></span></div>
          <div className="services-index-card-image"><img src={service.image} alt="" loading="lazy" /></div>
        </Link>)}</div>
      </section>
      <section className="site-frame services-capabilities-frame" aria-labelledby="services-capabilities-heading"><div className="services-capabilities"><h2 id="services-capabilities-heading">One team.<br /><span className="textured-accent">Built around you.</span></h2>
        <div className="services-capability-list">{services.map(service => { const Icon = resolveIcon(service.icon); return <article key={service.id} className="services-capability-row"><div className="services-capability-name"><Icon size={56} aria-hidden="true" /><h3><Link href={`/services/${service.slug}/`}>{service.name}<ArrowUpRight size={22} aria-hidden="true" /></Link></h3></div><ul className="services-capability-tags" aria-label={`${service.name} capabilities`}>{service.items.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul></article>; })}</div>
      </div></section>
    </>}
    <section className="services-index-process" style={{ backgroundColor: sections.how_it_works_bg }}><div className="site-frame"><h2 className="editorial-heading"><AccentHeadingText text={sections.how_it_works_heading} /></h2><OpusApproach /></div></section>
    <section className="site-frame services-index-next"><div><h2>Not sure<br />where to <span className="textured-accent">start?</span></h2><p>Tell us what your business needs. We will match you to the right service and give you a clear quote.</p><div className="services-index-next-actions"><Link href="/contact/" className="get-started-gradient services-index-action">Talk to us <ArrowUpRight size={22} aria-hidden="true" /></Link><SolutionFinder label="Help me choose" className="services-index-guide" /></div></div></section>
  </>;
}
