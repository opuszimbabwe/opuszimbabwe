'use client';
// Home page "Organisations We Have Built For" logo row.
// Partners are admin-managed (Partners tab in /admin): name, logo (static path
// or R2 upload), optional website link and visibility.

import { staticPartners } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function TrustedPartners() {
  const { content } = useSiteContent();
  const partners = (content?.partners?.length ? content.partners : staticPartners).filter((p) => p.visible);

  if (partners.length === 0) return null;

  const tile =
    'bg-white rounded-2xl p-5 h-32 flex items-center justify-center border border-[#f5f5f5] shadow-[0_2px_12px_rgba(0,0,0,0.03)]';

  return (
    <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 items-center gap-6 md:grid-cols-4">
      {partners.map((partner) => {
        const logo = (
          <img src={partner.logo} alt={partner.name} title={partner.name} className="max-h-24 max-w-full object-contain" />
        );

        return partner.url ? (
          <a
            key={partner.id}
            href={partner.url}
            target="_blank"
            rel="noreferrer"
            title={partner.name}
            className={`${tile} transition-colors hover:border-primary/30`}
          >
            {logo}
          </a>
        ) : (
          <div key={partner.id} className={tile}>
            {logo}
          </div>
        );
      })}
    </div>
  );
}
