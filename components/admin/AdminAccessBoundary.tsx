'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
const AdminSession = createContext<{ email: string } | null>(null);
export const useAdminSession = () => useContext(AdminSession);

// The static export contains no dashboard controls until a live, authenticated
// session check succeeds. A cached document must re-check on return as well.
export default function AdminAccessBoundary({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ email: string } | null>(null);
  const [checking, setChecking] = useState(true);
  const generation = useRef(0);
  useEffect(() => {
    let alive = true;
    const check = async (mask = true) => {
      if (document.visibilityState !== 'visible') return;
      const request = ++generation.current; if (mask) setChecking(true);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000), headers: local ? { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'local-admin-check' } : {} });
        const data = response.ok && response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
        if (alive && request === generation.current) setSession(data && typeof data.email === 'string' ? { email: data.email } : null);
      } catch { if (alive && request === generation.current) setSession(null); }
      finally { if (alive && request === generation.current) setChecking(false); }
    };
    const visibility = () => { if (document.visibilityState === 'hidden') { generation.current++; setChecking(true); } else void check(); };
    const hide = () => { generation.current++; setChecking(true); };
    const show = (event: PageTransitionEvent) => { if (event.persisted) void check(); };
    const focus = () => { void check(false); };
    void check(); window.addEventListener('focus', focus); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide); window.addEventListener('pageshow', show);
    return () => { alive = false; generation.current++; window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', show); };
  }, []);
  return <>
    {checking && <div className="min-h-[50vh] grid place-items-center" role="status">Checking secure admin access…</div>}
    {!checking && !session && <main className="mx-auto max-w-lg px-6 py-20 text-center"><h1 className="text-2xl font-semibold">Administrator sign-in required</h1><p className="mt-4">The dashboard is available only to an authenticated, authorised administrator.</p><a href="https://opuszim.co.zw/sysadmin/" className="mt-6 inline-flex rounded-full bg-[#b8441c] px-6 py-3 text-sm font-semibold text-white">Sign in securely</a></main>}
    {session && <AdminSession.Provider value={session}><div hidden={checking}>{children}</div></AdminSession.Provider>}
  </>;
}
