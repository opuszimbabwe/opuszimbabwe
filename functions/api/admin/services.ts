// PATCH /api/admin/services — update fields of one service card, including its
// service-page hero (image or gradient), "Why Opus" cards and related links
// (Cloudflare Access protected). Only the fields present in the request
// body are updated; omitted fields are left untouched.

import { json, requireAdmin } from '../../_lib/auth';
import { isGradient, isUrlPath } from '../../_lib/db';
import { PagesHandler } from '../../_lib/types';

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, max);
}

function strArray(v: unknown, maxItems = 40, maxLen = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, maxLen)).slice(0, maxItems);
}

function pairs(
  v: unknown,
  fields: { key: string; max: number }[],
  maxItems: number
): Record<string, string>[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .slice(0, maxItems)
    .map((item) => {
      const out: Record<string, string> = {};
      for (const field of fields) out[field.key] = str(item[field.key], field.max);
      return out;
    })
    .filter((item) => fields.some((field) => item[field.key].trim()));
}

const ICONS = new Set(['Globe', 'LayoutDashboard', 'Bot', 'Palette', 'Server', 'Plug']);

const EXTRA_TEXT_FIELDS: { key: string; column: string; max: number }[] = [
  { key: 'hero_eyebrow', column: 'hero_eyebrow', max: 300 },
  { key: 'hero_headline', column: 'hero_headline', max: 500 },
  { key: 'hero_intro', column: 'hero_intro', max: 2000 },
  { key: 'hero_cta', column: 'hero_cta', max: 200 },
];

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

  // --- service page hero / Why Opus / related links (service_extras) -------
  const extras = body?.extras && typeof body.extras === 'object' && !Array.isArray(body.extras) ? body.extras : null;
  const extraSets: string[] = [];
  const extraValues: unknown[] = [];

  if (extras) {
    for (const field of EXTRA_TEXT_FIELDS) {
      if (typeof extras[field.key] === 'string') {
        extraSets.push(`${field.column} = ?`);
        extraValues.push(str(extras[field.key], field.max));
      }
    }
    if (typeof extras.hero_background === 'string') {
      const background = str(extras.hero_background, 500);
      if (background && !isUrlPath(background)) return json({ error: 'invalid_hero_background' }, 400);
      extraSets.push('hero_background = ?');
      extraValues.push(background);
    }
    if (extras.hero_background_kind !== undefined) {
      const kind = extras.hero_background_kind === 'gradient' ? 'gradient' : 'image';
      extraSets.push('hero_background_kind = ?');
      extraValues.push(kind);
    }
    if (typeof extras.hero_gradient === 'string') {
      if (!isGradient(extras.hero_gradient)) return json({ error: 'invalid_hero_gradient' }, 400);
      extraSets.push('hero_gradient = ?');
      extraValues.push(str(extras.hero_gradient, 200).trim());
    }
    if (extras.why_items !== undefined) {
      const items = pairs(extras.why_items, [{ key: 'title', max: 200 }, { key: 'body', max: 600 }], 12);
      extraSets.push('why_items = ?');
      extraValues.push(JSON.stringify(items));
    }
    if (extras.related_items !== undefined) {
      const items = pairs(extras.related_items, [{ key: 'label', max: 200 }, { key: 'href', max: 300 }], 12).map(
        (item) => ({ label: item.label, href: isUrlPath(item.href) ? item.href : '' })
      );
      extraSets.push('related_items = ?');
      extraValues.push(JSON.stringify(items));
    }
  }

  const db = context.env.DB;

  try {
    if (sets.length > 0) {
      const updateSets = [...sets, "updated_at = datetime('now')"];
      const result = await db
        .prepare(`UPDATE services SET ${updateSets.join(', ')} WHERE id = ?`)
        .bind(...values, id)
        .run();
      const changed = (result as any)?.meta?.changes ?? 0;
      if (!changed) return json({ error: 'service_not_found', id }, 404);
    }

    if (extraSets.length > 0) {
      if (sets.length === 0) {
        // Extras-only save: make sure the service itself exists.
        const exists = await db.prepare('SELECT 1 AS ok FROM services WHERE id = ?').bind(id).first();
        if (!exists) return json({ error: 'service_not_found', id }, 404);
      }
      const columns = ['service_id', ...extraSets.map((s) => s.split(' = ')[0])];
      const placeholders = columns.map(() => '?').join(', ');
      const updates = extraSets.join(', ');
      // Values are bound twice: once for the INSERT, once for the DO UPDATE set.
      await db
        .prepare(
          `INSERT INTO service_extras (${columns.join(', ')}) VALUES (${placeholders})
           ON CONFLICT(service_id) DO UPDATE SET ${updates}, updated_at = datetime('now')`
        )
        .bind(id, ...extraValues, ...extraValues)
        .run();
    }

    if (sets.length === 0 && extraSets.length === 0) return json({ error: 'no_fields_to_update' }, 400);

    return json({ ok: true, id, updated: sets.length, extras_updated: extraSets.length });
  } catch (err) {
    return json({ error: 'database_error' }, 500);
  }
};
