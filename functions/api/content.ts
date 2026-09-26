// GET /api/content — public read of D1-backed site content.
// The public site calls this after load and falls back to the built-in
// static content when it is unavailable.

import { readContent } from '../_lib/db';
import { json } from '../_lib/auth';
import { PagesHandler } from '../_lib/types';

export const onRequestGet: PagesHandler = async (context) => {
  try {
    const content = await readContent(context.env);
    return json(content, 200, { 'cache-control': 'no-store' });
  } catch (err) {
    return json({ error: 'content_unavailable' }, 503, { 'cache-control': 'no-store' });
  }
};
