'use client';

import { useEffect,useRef, type CSSProperties } from 'react';
import { DEFAULT_SETTINGS, type ApproachItem } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function OpusApproach({ steps: suppliedSteps, horizontal = false }: { steps?: ApproachItem[]; horizontal?: boolean } = {}) {
  const { content } = useSiteContent();
  const steps = suppliedSteps ?? content?.settings?.approach_items ?? DEFAULT_SETTINGS.approach_items;

  const list=useRef<HTMLOListElement>(null);
  useEffect(()=>{
    const root=list.current;if(!root)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    if(reduced.matches||!('IntersectionObserver' in window))return;
    const nodes=[...root.querySelectorAll<HTMLElement>('.approach-step')];
    nodes.forEach(node=>node.dataset.reveal='waiting');
    const observer=new IntersectionObserver(entries=>entries.filter(e=>e.isIntersecting).sort((a,b)=>nodes.indexOf(a.target as HTMLElement)-nodes.indexOf(b.target as HTMLElement)).forEach((entry,i)=>{const node=entry.target as HTMLElement;node.style.setProperty('--reveal-delay',`${i*130}ms`);node.dataset.reveal='shown';observer.unobserve(node)}),{threshold:.15});
    nodes.forEach(node=>observer.observe(node));
    const show=()=>{if(reduced.matches){nodes.forEach(node=>node.dataset.reveal='shown');observer.disconnect()}};reduced.addEventListener('change',show);
    return()=>{observer.disconnect();reduced.removeEventListener('change',show)};
  },[steps]);
  return (
    <ol ref={list} tabIndex={horizontal ? 0 : undefined} aria-label={horizontal ? "Project process, scroll to see all steps" : undefined} className={`approach-timeline${horizontal ? ' approach-horizontal' : ''}`} style={{ '--step-count': steps.length } as CSSProperties}>
      {steps.map((step, i) => {
        const Icon = resolveIcon(step.icon || 'CheckCircle2');
        return (
          <li key={`${step.title}-${i}`} className="approach-step">
            <div className="approach-icon" aria-hidden="true">
              <Icon size={30} strokeWidth={1.8} />
            </div>
            <h3 className="mt-9 text-lg font-semibold leading-snug tracking-tight text-[#0d0d0d]">
              {step.title}
            </h3>
            <p className="mx-auto mt-5 max-w-[32ch] text-base leading-[1.75] text-[#525252]">
              {step.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
