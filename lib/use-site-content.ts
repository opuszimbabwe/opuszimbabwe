'use client';
// Client-side access to D1-backed site content.
// Fetches /api/content once per page load; on any failure the hook simply
// keeps returning null and components render the static fallback content.

import { useEffect, useState } from 'react';
import { SiteContent, normalizeContent } from './content';

export type ContentStatus = 'loading' | 'ready' | 'failed';

let cache: SiteContent | null = null;
let status: ContentStatus = 'loading';
let inflight: Promise<SiteContent | null> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function loadSiteContent(): Promise<SiteContent | null> {
  if (inflight) return inflight;
  inflight = fetch('/api/content', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json().catch(() => null) : null))
    .then((raw) => normalizeContent(raw))
    .then((value) => {
      cache = value;
      status = value ? 'ready' : 'failed';
      notify();
      return value;
    })
    .catch(() => {
      cache = null;
      status = 'failed';
      notify();
      return null;
    });
  return inflight;
}

export function useSiteContent(): { content: SiteContent | null; status: ContentStatus } {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((v) => v + 1);
    listeners.add(listener);
    loadSiteContent();
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return { content: cache, status };
}
