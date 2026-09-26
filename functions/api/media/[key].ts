// GET /api/media/<key> — serve uploaded images from R2 (public; images are
// public content). Uploads use immutable random keys, so responses are
// cached for a year.

import { json } from '../../_lib/auth';
import { PagesHandler } from '../../_lib/types';

const KEY_PATTERN = /^img_[a-f0-9]{1,24}\.(jpg|png|webp|gif|avif)$/;

export const onRequestGet: PagesHandler = async (context) => {
  const rawKey = context.params.key;
  const key = Array.isArray(rawKey) ? rawKey.join('/') : rawKey;

  if (!key || !KEY_PATTERN.test(key)) return json({ error: 'not_found' }, 404);

  try {
    const object = await context.env.MEDIA.get(key);
    if (!object) return json({ error: 'not_found' }, 404);
    const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    return new Response(object.body, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (err) {
    return json({ error: 'storage_error' }, 500);
  }
};
