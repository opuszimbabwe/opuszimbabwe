'use client';
import { staticProjects } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';
import ProjectCard from '@/components/ProjectCard';
const REMOVED_PROJECT_IDS = new Set(['zimtrade', 'agricom']);
export default function HomeProjects() {
  const { content } = useSiteContent();
  const projects = (content ? content.projects : staticProjects).filter(p => p.visible && p.status === 'active' && Boolean(p.url) && !REMOVED_PROJECT_IDS.has(p.id));
  if (!projects.length) return null;
  return <div className="project-work-grid mx-auto mt-10 max-w-5xl">{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>;
}
