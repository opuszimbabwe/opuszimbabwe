import ServicePageTemplate, { ServicePageData } from '@/components/ServicePageTemplate';

const data: ServicePageData = {
  eyebrow: 'Software & System Development',
  headline: 'Software built around the way your organisation actually works.',
  intro:
    'We build custom management systems, platforms and business tools that bring your operations into one organised digital environment — designed specifically for your organisation, not adapted from a generic template.',
  cta: 'Discuss Your Project',
  image: '/images/hero-software-systems.png',
  serviceId: 'software-development',
};

export default function Page() {
  return <ServicePageTemplate data={data} />;
}
