'use client';

import { useEffect, useRef, useState } from 'react';
import { staticPartners } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function TrustedPartners() {
  const { content } = useSiteContent();
  const partners = (content?.partners?.length ? content.partners : staticPartners).filter((p) => p.visible);

  const rowRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const el = rowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (partners.length === 0) return null;

  const tileBase =
    'rounded-2xl p-5 h-32 flex items-center justify-center border border-[#eeeeee] shadow-[0_4px_16px_rgba(0,0,0,0.05)]';

  return (
    <div
      ref={rowRef}
      className="mx-auto mt-10 grid max-w-4xl grid-cols-2 items-center gap-6 md:grid-cols-4"
    >
      {partners.map((partner, index) => {
        const bgColor =
          partner.bg_color || (partner.id === 'killing-giants' ? '#000000' : '#ffffff');
        const animStyle = {
          transitionDelay: `${index * 100}ms`,
          backgroundColor: bgColor,
        };
        const animClass = `transition-all duration-500 ease-out ${
          inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-5'
        }`;

        const logo = (
          <img
            src={partner.logo}
            alt={partner.name}
            title={partner.name}
            className="max-h-24 max-w-full object-contain"
          />
        );

        return partner.url ? (
          <a
            key={partner.id}
            href={partner.url}
            target="_blank"
            rel="noreferrer"
            title={partner.name}
            style={animStyle}
            className={`${tileBase} ${animClass} hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]`}
          >
            {logo}
          </a>
        ) : (
          <div key={partner.id} style={animStyle} className={`${tileBase} ${animClass}`}>
            {logo}
          </div>
        );
      })}
    </div>
  );
}
