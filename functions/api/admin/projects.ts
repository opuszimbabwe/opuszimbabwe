// PUT /api/admin/projects — replace the full project list (add/edit/remove)
// in one transaction (Cloudflare Access protected).
//
// status: 'active' renders as a link to `url`; 'coming_soon' renders as a
// badge with no link.

import { json, requireAdmin } from '../../_lib/auth';
import { PagesHandler } from '../../_lib/types';

const MAX_PROJECTS = 50;

function str(v: unknown, max: number, fallback = ''): string {
  if (typeof v !== 'string') return fallback;
  return v.slice(0, max);
}

function validUrl(value: string): boolean {
  if (!value) return true; // empty = no link (badge / not linked yet)
  if (value.length > 500) return false;
  return /^https:\/\/[^\s]+$/i.test(value);
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

  const projects = Array.isArray(body?.projects) ? body.projects : null;
  if (!projects) return json({ error: 'missing_projects' }, 400);
  if (projects.length > MAX_PROJECTS) return json({ error: 'too_many_projects' }, 400);

  const cleaned: {
    id: string;
    name: string;
    url: string;
    tag: string;
    location: string;
    description: string;
    status: string;
    visible: number;
  }[] = [];

  for (const project of projects) {
    const name = str(project?.name, 200).trim();
    if (!name) return json({ error: 'project_missing_name' }, 400);
    const url = str(project?.url, 500).trim();
    if (!validUrl(url)) return json({ error: 'invalid_project_url', name }, 400);
    const status = project?.status === 'coming_soon' ? 'coming_soon' : 'active';
    if (status === 'active' && !url) return json({ error: 'active_project_needs_url', name }, 400);
    cleaned.push({
      id: str(project?.id, 80).trim() || `pr_${crypto.randomUUID().slice(0, 8)}`,
      name,
      url,
      tag: str(project?.tag, 200).trim(),
      location: str(project?.location, 200).trim(),
      description: str(project?.description, 3000).trim(),
      status,
      visible: project?.visible === false || project?.visible === 0 ? 0 : 1,
    });
  }

  try {
    const db = context.env.DB;
    const statements = [db.prepare('DELETE FROM projects')];
    cleaned.forEach((project, index) => {
      statements.push(
        db
          .prepare(
            'INSERT INTO projects (id, name, url, tag, location, description, status, order_index, visible, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime(\'now\'))'
          )
          .bind(
            project.id,
            project.name,
            project.url,
            project.tag,
            project.location,
            project.description,
            project.status,
            index,
            project.visible
          )
      );
    });
    await db.batch(statements);
    return json({ ok: true, count: cleaned.length });
  } catch (err) {
    return json({ error: 'database_error' }, 500);
  }
};
