import routes from '../../ops/site/seo-routes.json';

/** Public document SEO only; never transforms API responses or private pages. */
export function publicRedirect(request: Request): Response | null {
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  const path = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
  const target = (routes.aliases as Record<string, string>)[path];
  if (!target) return null;
  url.pathname = target;
  return Response.redirect(url.href, 308);
}

export function publicMetadata(request: Request, response: Response): Response {
  if (!['GET', 'HEAD'].includes(request.method) || !response.headers.get('content-type')?.includes('text/html')) return response;
  const path = new URL(request.url).pathname;
  const headers = new Headers(response.headers);
  if (['/404/', '/404.html', '/404/index.html'].includes(path)) {
    headers.set('x-robots-tag', 'noindex');
    return new Response(response.body, { status: 404, headers });
  }
  const canonicalPath = path.endsWith('/index.html') ? path.slice(0, -10) : path;
  if (response.status === 200 && routes.routes.includes(canonicalPath)) {
    // HTTP canonical persists if the client framework updates its document head.
    headers.set('link', `<${routes.origin}${canonicalPath}>; rel="canonical"`);
    return new Response(response.body, { status: response.status, headers });
  }
  return response;
}
