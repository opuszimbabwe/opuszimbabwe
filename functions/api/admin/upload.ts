// POST /api/admin/upload — store an uploaded image in R2 and return its URL
// (Cloudflare Access protected).

import { json, requireAdmin } from '../../_lib/auth';
import { PagesHandler } from '../../_lib/types';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export const onRequestPost: PagesHandler = async (context) => {
  const auth = await requireAdmin(context);
  if (auth instanceof Response) return auth;

  let form: FormData;
  try {
    form = await context.request.formData();
  } catch {
    return json({ error: 'invalid_form_data' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'missing_file' }, 400);

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return json({ error: 'unsupported_image_type', allowed: Object.keys(EXT_BY_TYPE) }, 415);
  if (file.size > MAX_BYTES) return json({ error: 'file_too_large', max_bytes: MAX_BYTES }, 413);

  const key = `img_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}.${ext}`;
  try {
    const buffer = await file.arrayBuffer();
    await context.env.MEDIA.put(key, buffer, { httpMetadata: { contentType: file.type } });
    return json({ ok: true, key, url: `/api/media/${key}` });
  } catch (err) {
    return json({ error: 'upload_failed' }, 500);
  }
};
