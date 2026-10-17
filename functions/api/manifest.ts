// GET /api/manifest — the web app manifest, with the icon set by the admin
// (Brand tab → Manifest icon). Public: the manifest is public site metadata.
// Served dynamically so an admin icon change takes effect without a rebuild.

import { isUrlPath } from '../_lib/db';
import { PagesHandler } from '../_lib/types';

const FALLBACK_ICON = '/images/icon-512.png';

const NAME = 'Opus Zimbabwe — Digital Services for Zimbabwe';
const SHORT_NAME = 'Opus Zimbabwe';
const DESCRIPTION =
  'Websites, software systems, AI automation, branding, domains, hosting and integrations for Zimbabwean organisations';

export const onRequestGet: PagesHandler = async (context) => {
  let icon = FALLBACK_ICON;
  const titles: Record<string, string> = {};
  try {
    const rows = await context.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('manifest_icon','browser_title')"
    ).all<{ key: string; value: string }>();
    for (const row of rows.results || []) titles[row.key] = row.value;
    if (titles.manifest_icon && isUrlPath(titles.manifest_icon)) icon = titles.manifest_icon;
  } catch {
    // Missing table/key (migration not applied yet) → serve the built-in icon.
  }

  const title = (titles.browser_title || '').trim();

  const manifest = {
    name: title || NAME,
    short_name: title ? title.split(/[—|–-]/)[0].trim().slice(0, 20) || SHORT_NAME : SHORT_NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E85D2A',
    icons: [
      { src: icon, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/images/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/manifest+json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
};
