// Resolve the administrator's current tab icon before client hydration.
import type { PagesHandler } from '../_lib/types';
import { isUrlPath } from '../_lib/db';
export const onRequestGet: PagesHandler = async ({ env, request }) => {
  let icon = '/images/opus-favicon-transparent.png';
  try {
    const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'favicon_icon'").first<{ value: string }>();
    if (row?.value && isUrlPath(row.value)) icon = row.value;
  } catch { /* The transparent bundled icon also works before database setup. */ }
  return new Response(null, { status: 302, headers: { location: new URL(icon, request.url).href, 'cache-control': 'no-store' } });
};
