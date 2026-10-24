import type { PagesContext } from './_lib/types';

// Always revalidate documents and dynamic content. Hashed assets and immutable
// R2 uploads keep their existing cache policy; their URLs change when edited.
export const onRequest = async (context: PagesContext & { next: () => Promise<Response> }) => {
  const response = await context.next();
  const path = new URL(context.request.url).pathname;
  if (!response.headers.get('content-type')?.includes('text/html') && !(path.startsWith('/api/') && !path.startsWith('/api/media/'))) return response;
  const headers = new Headers(response.headers);
  headers.set('cache-control', 'no-store, no-cache, max-age=0, must-revalidate');
  headers.set('cdn-cache-control', 'no-store');
  headers.set('cloudflare-cdn-cache-control', 'no-store');
  headers.set('pragma', 'no-cache');
  headers.set('expires', '0');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
