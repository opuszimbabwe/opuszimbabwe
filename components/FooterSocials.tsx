'use client';
// Footer social links — admin-managed (Brand tab in /admin).
// Falls back to the built-in links when the content API is unreachable.

import { DEFAULT_SETTINGS } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function FooterSocials() {
  const { content } = useSiteContent();
  const socials = content?.settings?.footer_socials?.length
    ? content.settings.footer_socials
    : DEFAULT_SETTINGS.footer_socials;

  return (
    <div className="mb-12 flex justify-end gap-3">
      {socials.map((social) => {
        const Icon = resolveIcon(social.icon);
        return (
          <a
            key={`${social.label}-${social.href}`}
            aria-label={social.label}
            title={social.label}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-dark/15 text-[#6b7280] transition-colors hover:border-dark hover:bg-dark hover:text-white"
          >
            <Icon size={17} />
          </a>
        );
      })}
    </div>
  );
}
