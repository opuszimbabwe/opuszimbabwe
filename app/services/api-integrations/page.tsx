import ServicePageTemplate, { ServicePageData } from '@/components/ServicePageTemplate';

const data: ServicePageData = {
  eyebrow: 'API & System Integrations',
  headline: 'Your systems should work together. We make sure they do.',
  intro:
    'We connect your website, software, payment platforms and third-party tools so your digital systems work as one joined-up environment instead of a collection of disconnected parts.',
  cta: 'Discuss Your Project',
  image: '/images/hero-api-integrations.png',
  serviceId: 'api-integrations',
};

export default function Page() {
  return <ServicePageTemplate data={data} />;
}
