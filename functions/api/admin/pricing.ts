// PUT /api/admin/pricing — replace the full pricing card list (add/edit/remove)
// in one transaction (Cloudflare Access protected).

import { json, requireAdmin } from '../../_lib/auth';
import { PagesHandler } from '../../_lib/types';

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, max);
}

function features(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200)).slice(0, 30);
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

  const cards = Array.isArray(body?.cards) ? body.cards : null;
  if (!cards) return json({ error: 'missing_cards' }, 400);
  if (cards.length > 30) return json({ error: 'too_many_cards' }, 400);

  const cleaned: { id: string; name: string; monthly: string; yearly: string; features: string; visible: number }[] = [];
  for (const card of cards) {
    const name = str(card?.name, 120).trim();
    if (!name) return json({ error: 'card_missing_name' }, 400);
    cleaned.push({
      id: str(card?.id, 80).trim() || `p_${crypto.randomUUID().slice(0, 8)}`,
      name,
      monthly: str(card?.monthly_price, 60),
      yearly: str(card?.yearly_price, 60),
      features: JSON.stringify(features(card?.features)),
      visible: card?.visible === false || card?.visible === 0 ? 0 : 1,
    });
  }

  try {
    const db = context.env.DB;
    const statements = [db.prepare('DELETE FROM pricing_cards')];
    cleaned.forEach((card, index) => {
      statements.push(
        db
          .prepare(
            'INSERT INTO pricing_cards (id, name, monthly_price, yearly_price, features, order_index, visible, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
          )
          .bind(card.id, card.name, card.monthly, card.yearly, card.features, index, card.visible)
      );
    });
    await db.batch(statements);
    return json({ ok: true, count: cleaned.length });
  } catch (err) {
    return json({ error: 'database_error' }, 500);
  }
};
