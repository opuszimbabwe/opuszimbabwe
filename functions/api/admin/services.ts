// PATCH /api/admin/services — update fields of one service card
// (Cloudflare Access protected). Only the fields present in the request
// body are updated; omitted fields are left untouched.

import { json, requireAdmin } from '../../_lib/auth';
import { isUrlPath } from '../../_lib/db';
import { PagesHandler } from '../../_lib/types';

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, max);
}

function strArray(v: unknown, maxItems = 40, maxLen = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, maxLen)).slice(0, maxItems);
}

const ICONS = new Set(['Globe', 'LayoutDashboard', 'Bot', 'Palette', 'Server', 'Plug']);

export const onRequestPatch: PagesHandler = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const id = str(body?.id, 80).trim();
  if (!id) return json({ error: 'missing_service_id' }, 400);

  const sets: string[] = [];
  const values: unknown[] = [];

  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (!name) return json({ error: 'missing_name' }, 400);
    sets.push('name = ?');
    values.push(name);
  }
  if (typeof body.tagline === 'string') {
    sets.push('tagline = ?');
    values.push(str(body.tagline, 120));
  }
  if (typeof body.description === 'string') {
    sets.push('description = ?');
    values.push(str(body.description, 3000));
  }
  if (typeof body.page_description === 'string') {
    sets.push('page_description = ?');
    values.push(str(body.page_description, 3000));
  }
  if (body.items !== undefined) {
    sets.push('items = ?');
    values.push(JSON.stringify(strArray(body.items)));
  }
  if (typeof body.icon === 'string') {
    if (!ICONS.has(body.icon)) return json({ error: 'invalid_icon' }, 400);
    sets.push('icon = ?');
    values.push(body.icon);
  }
  if (typeof body.gradient === 'string') {
    sets.push('gradient = ?');
    values.push(str(body.gradient, 120, '160deg,#1a1a1a,#454545'));
  }
  if (typeof body.slug === 'string') {
    sets.push('slug = ?');
    values.push(str(body.slug, 120));
  }
  if (typeof body.image === 'string') {
    const image = str(body.image, 500);
    if (image && !isUrlPath(image)) return json({ error: 'invalid_image_url' }, 400);
    sets.push('image = ?');
    values.push(image);
  }
  if (body.order_index !== undefined) {
    const order = Number(body.order_index);
    if (!Number.isFinite(order)) return json({ error: 'invalid_order' }, 400);
    sets.push('order_index = ?');
    values.push(Math.trunc(order));
  }
  if (body.visible !== undefined) {
    sets.push('visible = ?');
    values.push(body.visible === false || body.visible === 0 ? 0 : 1);
  }

  if (sets.length === 0) return json({ error: 'no_fields_to_update' }, 400);

  sets.push("updated_at = datetime('now')");
  values.push(id);

  try {
    const result = await context.env.DB.prepare(`UPDATE services SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    const changed = (result as any)?.meta?.changes ?? 0;
    if (!changed) return json({ error: 'service_not_found', id }, 404);
    return json({ ok: true, id, updated: sets.length - 1 });
  } catch (err) {
    return json({ error: 'database_error' }, 500);
  }
};
