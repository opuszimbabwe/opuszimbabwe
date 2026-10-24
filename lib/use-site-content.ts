'use client';
// Client-side access to D1-backed site content.
// Shares current public content and refreshes after saves, on focus and while visible.
// A failed refresh retains the last successful response.

import { useEffect, useSyncExternalStore } from 'react';
import { SiteContent, normalizeContent } from './content';

export type ContentStatus = 'loading' | 'ready' | 'failed';

let cache: SiteContent | null = null;
let status: ContentStatus = 'loading';
let inflight: Promise<SiteContent | null> | null = null;
let refreshQueued = false;
let freshRequired = false;
let publication = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function loadSiteContent(force = false, requireFresh = false): Promise<SiteContent | null> {
  if (requireFresh) { freshRequired = true; status = 'loading'; notify(); }
  if (inflight) { if (force) refreshQueued = true; return inflight; }
  if (!force && status !== 'loading') return Promise.resolve(cache);
  const requestPublication = publication;
  inflight = fetch('/api/content', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    .then((res) => (res.ok ? res.json().catch(() => null) : null))
    .then((raw) => normalizeContent(raw))
    .then((value) => {
      if (refreshQueued) return cache;
      if (requestPublication !== publication || (value && cache && value.revision < cache.revision)) { refreshQueued = true; return cache; }
      if (value) { cache = value; freshRequired = false; }
      status = value ? 'ready' : freshRequired ? 'failed' : cache ? 'ready' : 'failed';
      notify();
      return cache;
    })
    .catch(() => {
      if (refreshQueued || requestPublication !== publication) return cache;
      status = freshRequired ? 'failed' : cache ? 'ready' : 'failed';
      notify();
      return cache;
    }).finally(() => {
      inflight = null;
      if (refreshQueued) { refreshQueued = false; void loadSiteContent(true); }
    });
  return inflight;
}

let stopRefreshing: (() => void) | null = null;
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!stopRefreshing && typeof window !== 'undefined') {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      const admin = /^\/sysadmin(?:\/|$)/.test(window.location.pathname);
      const mask = !admin || document.documentElement.hasAttribute('data-content-returning');
      void loadSiteContent(true, mask).finally(() => document.documentElement.removeAttribute('data-content-returning'));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (!/^\/sysadmin(?:\/|$)/.test(window.location.pathname)) document.documentElement.setAttribute('data-content-returning', 'true');
      }
      else refresh();
    };
    const onPageHide = () => document.documentElement.setAttribute('data-content-returning', 'true');
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) refresh(); };
    const onStorage = (event: StorageEvent) => { if (event.key === 'opus-content-updated') refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('storage', onStorage);
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible' && !inflight) void loadSiteContent(true); }, 5000);
    stopRefreshing = () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(timer);
    };
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { stopRefreshing?.(); stopRefreshing = null; }
  };
}
export async function announceSiteContentChange(committedContent?: unknown) {
  const committed = normalizeContent(committedContent);
  if (committed && (!cache || committed.revision >= cache.revision)) {
    publication++;
    // Only settings were changed by this endpoint; preserve any newer service,
    // project or pricing data already in this tab. Settings/revision share a
    // single D1 read so delayed saves cannot restore an older hero design.
    cache = cache ? { ...cache, revision: committed.revision, settings: committed.settings } : committed;
    status = 'ready';
    freshRequired = false;
    notify();
  }
  try { window.localStorage.setItem('opus-content-updated', String(Date.now())); } catch { /* Storage may be disabled. */ }
  if (committed) return;
  await loadSiteContent(true, true);
  while (inflight) await inflight;
}

const serverSnapshot = { content: null, status: 'loading' } as const;
let snapshot: { content: SiteContent | null; status: ContentStatus } = serverSnapshot;
function getSnapshot() {
  if (snapshot.content !== cache || snapshot.status !== status) snapshot = { content: cache, status };
  return snapshot;
}

export function useSiteContent(): { content: SiteContent | null; status: ContentStatus } {
  const value = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  useEffect(() => { void loadSiteContent(); }, []);
  return value;
}
