import ServicePageTemplate, { ServicePageData } from '@/components/ServicePageTemplate';
import { staticPricing } from '@/lib/content';

const data: ServicePageData = {
  eyebrow: 'Website Design & Development',
  headline: 'A website that represents your business the way it deserves to be represented.',
  intro:
    'We design and develop professional websites for businesses, NGOs, schools, churches and organisations across Zimbabwe — built to be fast, credible and ready to grow with you.',
  cta: 'View Packages',
  image: '/images/hero-website-design.png',
  serviceId: 'web-design',
};

export default function Page() {
  return (
    <ServicePageTemplate
      data={data}
      pricing={staticPricing.map((p) => ({
        name: p.name,
        monthlyPrice: p.monthly_price,
        yearlyPrice: p.yearly_price,
        features: p.features,
      }))}
    />
  );
}
