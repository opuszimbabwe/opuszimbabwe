import type { PagesContext } from './_lib/types';
import { requireAdmin } from './_lib/auth';

function noStore(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store, no-cache, max-age=0, must-revalidate');
  headers.set('cdn-cache-control', 'no-store');
  headers.set('cloudflare-cdn-cache-control', 'no-store');
  headers.set('pragma', 'no-cache');
  headers.set('expires', '0');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export const onRequest = async (context: PagesContext & { next: () => Promise<Response> }) => {
  const url = new URL(context.request.url);
  let path = url.pathname;
  try { for (let i = 0; i < 3; i++) { const decoded = decodeURIComponent(path); if (decoded === path) break; path = decoded; } }
  catch { return noStore(new Response('Invalid request.', { status: 400 })); }
  path = path.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  // Protect route payloads and index.html variants as well as the page URL.
  if (/^\/admin(?:\/|\.|$)/i.test(path)) {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    return noStore(Response.redirect(new URL('/sysadmin/', local ? url.origin : 'https://opuszim.co.zw').href, 308));
  }
  if (/^\/sysadmin(?:\/|\.|$)/i.test(path) && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    const auth = await requireAdmin(context);
    if (auth instanceof Response) return noStore(new Response('Authentication required.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } }));
  }
  if (url.hostname === 'payments.opuszim.co.zw' && path === '/') return noStore(Response.redirect(new URL('/payments/', url).href, 302));
  let response = await context.next();
  if (/^\/payments(?:\/|$)/.test(path)) {
    const headers = new Headers(response.headers);
    headers.set('referrer-policy', 'no-referrer');
    headers.set('x-frame-options', 'DENY');
    headers.set('content-security-policy', "frame-ancestors 'none'");
    headers.set('x-content-type-options', 'nosniff');
    response = new Response(response.body, { status: response.status, headers });
  }
  if (!response.headers.get('content-type')?.includes('text/html') && !(path.startsWith('/api/') && !path.startsWith('/api/media/'))) return response;
  return noStore(response);
};
