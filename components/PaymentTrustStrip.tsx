'use client';

import { DEFAULT_HOME_SECTIONS, DEFAULT_PAYMENT_METHODS, PaymentMethod } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function PaymentTrustStrip() {
  const { content } = useSiteContent();
  const methods: PaymentMethod[] = (
    content?.settings?.payment_methods?.length
      ? content.settings.payment_methods
      : DEFAULT_PAYMENT_METHODS
  ).filter((m) => m.visible);

  const homeSections = content?.settings?.home_sections || DEFAULT_HOME_SECTIONS;

  if (methods.length === 0) return null;

  return (
    <div
      style={{ backgroundColor: homeSections.hero_bg || '#f8f8f6' }}
      className="w-full pt-2 pb-12"
    >
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
        <p className="font-poppins font-light text-[14px] text-[#0d0d0d]/70 m-0">
          {homeSections.payment_label || 'We accept local payments'}
        </p>
        <div
          className="mt-5 w-full flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16"
          aria-label="Accepted local payment methods"
        >
          {methods.map((method) => {
            const isPaynow = method.logo.includes('paynow-logo.png');
            return (
              <div
                key={method.id}
                title={method.name}
                className="flex items-center justify-center px-2 py-1 overflow-hidden"
              >
                <img
                  src={method.logo}
                  alt={method.name}
                  className={`${
                    isPaynow ? 'h-12 sm:h-14 scale-150' : 'h-8 sm:h-9'
                  } w-auto object-contain`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
