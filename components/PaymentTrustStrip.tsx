'use client';

import { DEFAULT_HOME_SECTIONS, DEFAULT_PAYMENT_METHODS, PaymentMethod } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function PaymentTrustStrip({ compact = false }: { compact?: boolean }) {
  const { content } = useSiteContent();
  const methods: PaymentMethod[] = (
    content?.settings?.payment_methods
      ? content.settings.payment_methods
      : DEFAULT_PAYMENT_METHODS
  ).filter((m) => m.visible);

  const homeSections = content?.settings?.home_sections || DEFAULT_HOME_SECTIONS;

  if (methods.length === 0) return null;

  return <div className={compact ? 'payment-card-logos mt-6 flex flex-wrap items-center gap-x-5 gap-y-4' : 'flex flex-wrap items-center justify-center gap-8'} aria-label={homeSections.payment_label || 'Accepted local payment methods'}>
    {methods.map(method => method.logo === '/images/paynow-logo.png' ?
      <span key={method.id} title={method.name} data-logo-crop="paynow" style={{ position: 'relative', overflow: 'hidden', width: 96, aspectRatio: '152/27' }}>
        <img src={method.logo} alt={method.name} loading="lazy" style={{ position: 'absolute', maxWidth: 'none', width: `${685 / 152 * 100}%`, height: `${364 / 27 * 100}%`, left: `${-267 / 152 * 100}%`, top: `${-167 / 27 * 100}%` }} />
      </span> : <img key={method.id} src={method.logo} alt={method.name} title={method.name} loading="lazy" className="h-7 max-w-[100px] object-contain" />)}
  </div>;
}
