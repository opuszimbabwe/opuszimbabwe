// GET /api/admin/session — reports the Cloudflare Access identity.

import { json, requireAdmin } from '../../_lib/auth';
import { PagesHandler } from '../../_lib/types';

export const onRequestGet: PagesHandler = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;
  return json({ email: auth }, 200, { 'cache-control': 'no-store' });
};
