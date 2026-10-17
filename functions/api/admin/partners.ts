// PUT /api/admin/partners — replace the full trusted-partner list
// (add/edit/remove) in one transaction (Cloudflare Access protected).
//
// Partners are the logo row under "Partners who trust us" on the home page.
// `logo` is a site path (/images/…) or an R2 upload (/api/media/…); `url` is
// optional; `bg_color` controls the partner tile background colour (e.g.
// `#000000` for Killing Giants, `#ffffff` for light tiles).

import { json, requireAdmin } from '../../_lib/auth';
import { isHexColor, isUrlPath } from '../../_lib/db';
import { PagesHandler } from '../../_lib/types';

const MAX_PARTNERS = 60;

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, max);
}

export const onRequestPut: PagesHandler = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const partners = Array.isArray(body?.partners) ? body.partners : null;
  if (!partners) return json({ error: 'missing_partners' }, 400);
  if (partners.length > MAX_PARTNERS) return json({ error: 'too_many_partners' }, 400);

  const cleaned: {
    id: string;
    name: string;
    logo: string;
    url: string;
    bg_color: string;
    visible: number;
  }[] = [];

  for (const partner of partners) {
    const name = str(partner?.name, 200).trim();
    if (!name) return json({ error: 'partner_missing_name' }, 400);

    const logo = str(partner?.logo, 500).trim();
    if (logo && !isUrlPath(logo)) return json({ error: 'invalid_partner_logo', name }, 400);

    const url = str(partner?.url, 500).trim();
    if (url && !/^https:\/\/[^\s]+$/i.test(url)) return json({ error: 'invalid_partner_url', name }, 400);

    const rawBg = str(partner?.bg_color, 20).trim() || '#ffffff';
    const bg_color = isHexColor(rawBg) ? rawBg : '#ffffff';

    cleaned.push({
      id: str(partner?.id, 80).trim() || `pa_${crypto.randomUUID().slice(0, 8)}`,
      name,
      logo,
      url,
      bg_color,
      visible: partner?.visible === false || partner?.visible === 0 ? 0 : 1,
    });
  }

  try {
    const db = context.env.DB;
    const statements = [db.prepare('DELETE FROM partners')];
    cleaned.forEach((partner, index) => {
      statements.push(
        db
          .prepare(
            "INSERT INTO partners (id, name, logo, url, bg_color, order_index, visible, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
          )
          .bind(
            partner.id,
            partner.name,
            partner.logo,
            partner.url,
            partner.bg_color,
            index,
            partner.visible
          )
      );
    });
    await db.batch(statements);
    return json({ ok: true, count: cleaned.length });
  } catch (err) {
    return json({ error: 'database_error' }, 500);
  }
};
