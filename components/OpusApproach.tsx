'use client';

import type { CSSProperties } from 'react';
import { DEFAULT_SETTINGS } from '@/lib/content';
import { resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

export default function OpusApproach() {
  const { content } = useSiteContent();
  const steps = content?.settings?.approach_items
    ? content.settings.approach_items
    : DEFAULT_SETTINGS.approach_items;

  return (
    <ol className="approach-timeline" style={{ '--step-count': steps.length } as CSSProperties}>
      {steps.map((step, i) => {
        const Icon = resolveIcon(step.icon || 'Check');
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
