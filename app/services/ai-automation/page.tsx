import ServicePageTemplate, { ServicePageData } from '@/components/ServicePageTemplate';

const data: ServicePageData = {
  eyebrow: 'AI Solutions & Automation',
  headline: 'Stop doing manually what technology can do for you.',
  intro:
    'We build practical AI tools and automated workflows that reduce repetitive work and help your organisation operate more efficiently — grounded in what your business actually needs, not technology for the sake of it.',
  cta: 'Discuss Your Project',
  image: '/images/hero-ai-automation.png',
  serviceId: 'ai-automation',
};

export default function Page() {
  return <ServicePageTemplate data={data} />;
}
