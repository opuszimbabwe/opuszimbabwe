import ServicePageTemplate, { ServicePageData } from '@/components/ServicePageTemplate';

const data: ServicePageData = {
  eyebrow: 'Graphic Design & Branding',
  headline: 'Your brand is the first impression. Make it the right one.',
  intro:
    'We design logos, marketing materials and visual identities that make your business look credible, consistent and ready to compete — across digital and print platforms.',
  cta: 'See Our Work',
  image: '/images/hero-graphic-design.png',
  serviceId: 'graphic-design',
};

export default function Page() {
  return <ServicePageTemplate data={data} />;
}
