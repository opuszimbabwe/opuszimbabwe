'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { loadSiteContent, useSiteContent } from '@/lib/use-site-content';
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Never expose a previous content snapshot while a document or route refreshes. */
export default function SiteContentBoundary({ children }: { children: React.ReactNode }) {
  const { status } = useSiteContent();
  const path = usePathname();
  const previousPath = useRef<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  useBeforePaint(() => {
    if (previousPath.current === path) return;
    previousPath.current = path;
    void loadSiteContent(true, true);
  }, [path]);
  useEffect(() => {
    let mounted = true;
    Promise.all([300, 400, 500, 600, 700, 800, 900].map(weight =>
      document.fonts.load(`${weight} 16px ${getComputedStyle(document.body).fontFamily}`)
    )).catch(() => undefined).finally(() => { if (mounted) setFontsReady(true); });
    return () => { mounted = false; };
  }, []);
  const loading = status === 'loading' || !fontsReady;
  const failed = !loading && status === 'failed';
  return <>
    {failed && <div className="content-unavailable" role="alert"><h1 className="text-2xl font-semibold">We couldn’t load the latest site content.</h1><p className="mt-4 text-base">Please retry. We won’t display an older version in its place.</p><button type="button" className="mt-6 rounded-full bg-[#b8441c] px-6 py-3 text-sm font-semibold text-white" onClick={() => void loadSiteContent(true, true)}>Retry latest content</button></div>}
    <div className="site-content" data-loading={loading || failed} aria-busy={loading}>{children}</div>
    <noscript><style>{`.site-content{display:block!important}`}</style></noscript>
  </>;
}
