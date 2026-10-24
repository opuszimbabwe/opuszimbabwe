'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_SETTINGS } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

export default function BrandHeadSync() {
  const pathname = usePathname();
  const { content, status } = useSiteContent();
  const favicon = content?.settings?.favicon_icon || DEFAULT_SETTINGS.favicon_icon;
  const browserTitle = content?.settings?.browser_title || DEFAULT_SETTINGS.browser_title;

  useEffect(() => {
    if (typeof document === 'undefined' || status === 'loading') return;

    // Public content pages take the admin-set browser title. Utility pages
    // (admin, sysadmin, sitemap) keep their own metadata titles.
    const isUtilityPage =
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/sysadmin') ||
      pathname?.startsWith('/sitemap');

    if (!isUtilityPage && browserTitle) document.title = browserTitle;

    if (favicon) {
      const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
      rels.forEach((rel) => {
        const links = [...document.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)];
        if (!links.length) {
          const link = document.createElement('link'); link.rel = rel;
          document.head.appendChild(link); links.push(link);
        }
        links.forEach(link => {
          // Old size/type hints must not make a browser prefer an obsolete icon.
          link.removeAttribute('sizes'); link.removeAttribute('type');
          if (link.getAttribute('href') !== favicon) link.href = favicon;
        });
      });
    }
  }, [favicon, browserTitle, pathname, status]);

  return null;
}
