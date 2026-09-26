// PUT /api/admin/settings — update site settings such as the hero background
// (Cloudflare Access protected).

import { json, requireAdmin } from '../../_lib/auth';
import { isUrlPath } from '../../_lib/db';
import { PagesHandler } from '../../_lib/types';

const ALLOWED_KEYS = new Set(['hero_background']);

export const onRequestPut: PagesHandler = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const updates: { key: string; value: string }[] = [];
  for (const key of Object.keys(body || {})) {
    if (!ALLOWED_KEYS.has(key)) continue;
    const value = body[key];
    if (typeof value !== 'string' || !isUrlPath(value)) {
      return json({ error: `invalid_value_for_${key}` }, 400);
    }
    updates.push({ key, value });
  }
  if (updates.length === 0) return json({ error: 'no_valid_settings' }, 400);

  try {
    const db = context.env.DB;
    const statements = updates.map((u) =>
      db
        .prepare(
          `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
        )
        .bind(u.key, u.value)
    );
    await db.batch(statements);
    return json({ ok: true, updated: updates.map((u) => u.key) });
  } catch (err) {
    return json({ error: 'database_error' }, 500);
  }
};
