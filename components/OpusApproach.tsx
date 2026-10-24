'use client';

import type { CSSProperties } from 'react';
import { DEFAULT_SETTINGS, type ApproachItem } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function OpusApproach({ steps: suppliedSteps, horizontal = false }: { steps?: ApproachItem[]; horizontal?: boolean } = {}) {
  const { content } = useSiteContent();
  const steps = suppliedSteps ?? content?.settings?.approach_items ?? DEFAULT_SETTINGS.approach_items;

  return (
    <ol tabIndex={horizontal ? 0 : undefined} aria-label={horizontal ? "Project process, scroll to see all steps" : undefined} className={`approach-timeline${horizontal ? ' approach-horizontal' : ''}`} style={{ '--step-count': steps.length } as CSSProperties}>
      {steps.map((step, i) => {
        const Icon = resolveIcon(step.icon || 'CheckCircle2');
        return (
          <li key={`${step.title}-${i}`} className="approach-step">
            <div className="approach-icon" aria-hidden="true">
              <Icon size={42} strokeWidth={1.8} />
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
