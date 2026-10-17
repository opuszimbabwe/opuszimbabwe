import ServicePageTemplate, { ServicePageData } from '@/components/ServicePageTemplate';

const data: ServicePageData = {
  eyebrow: 'Domain Registration & Web Hosting',
  headline: 'Your domain. Your brand. Your foundation — set up correctly from the start.',
  intro:
    'We register domains, set up reliable hosting and configure professional business email — the digital infrastructure every serious organisation needs, handled correctly from day one.',
  cta: 'View Pricing',
  image: '/images/hero-domains-hosting.png',
  serviceId: 'domains-hosting',
  domainCta: true,
};

export default function Page() {
  return <ServicePageTemplate data={data} />;
}
