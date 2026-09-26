'use client';
// Opus Zimbabwe admin dashboard.
// Reads/writes content through the Cloudflare Pages Functions API
// (D1 for content, R2 for uploaded images). Mutating endpoints only
// accept requests authenticated by Cloudflare Access for an allowed
// admin email (info.opuszim@gmail.com).

import { useEffect, useRef, useState } from 'react';
import { staticContent, ServiceRecord, PricingRecord, SiteContent } from '@/lib/content';
import { useSiteContent } from '@/lib/use-site-content';

const ICON_OPTIONS = ['Globe', 'LayoutDashboard', 'Bot', 'Palette', 'Server', 'Plug'];

type Tab = 'services' | 'pricing' | 'hero';

type Session = { email: string } | null;

function parseJson(text: string): any {
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    cache: 'no-store',
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Access redirected the fetch to its login page, or a proxy returned HTML.
    throw new Error('Not signed in via Cloudflare Access — sign in and try again.');
  }
  const data = parseJson(await res.text());
  if (!res.ok) {
    throw new Error((data && (data.error || data.hint)) || `Request failed (HTTP ${res.status})`);
  }
  return data;
}

async function uploadFile(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', body: form, cache: 'no-store' });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Not signed in via Cloudflare Access — sign in and try again.');
  }
  const data = parseJson(await res.text());
  if (!res.ok) throw new Error((data && (data.error || data.hint)) || `Upload failed (HTTP ${res.status})`);
  return data;
}

function lines(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

function Field({ label, value, onChange, rows, hint }: { label: string; value: string; onChange: (v: string) => void; rows?: number; hint?: string }) {
  const cls = 'w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3.5 py-2.5 text-[.9rem] text-dark outline-none focus:border-[#E85D2A] focus:bg-white';
  return (
    <label className="block">
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">{label}</span>
      {rows ? (
        <textarea className={cls + ' min-h-[96px] leading-6'} value={value} rows={rows} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <span className="block text-[.72rem] text-[#9ca3af] mt-1">{hint}</span>}
    </label>
  );
}

function Banner({ kind, children }: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) {
  const styles = {
    ok: 'bg-green-50 border-green-200 text-green-800',
    err: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-amber-50 border-amber-200 text-amber-800',
  }[kind];
  return <div className={`rounded-xl border px-4 py-3 text-[.85rem] leading-5 ${styles}`}>{children}</div>;
}

export default function AdminDashboard() {
  const { content, status } = useSiteContent();
  const [tab, setTab] = useState<Tab>('services');
  const [session, setSession] = useState<Session>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [services, setServices] = useState<ServiceRecord[] | null>(null);
  const [pricing, setPricing] = useState<PricingRecord[] | null>(null);
  const [hero, setHero] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const uploadTarget = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Check Cloudflare Access session.
  useEffect(() => {
    api('/api/admin/session')
      .then((data) => setSession({ email: data.email }))
      .catch(() => setSession(null))
      .finally(() => setCheckedSession(true));
  }, []);

  // Initialize local editors from remote content (preferred) or static fallback.
  useEffect(() => {
    if (services !== null) return;
    if (status === 'ready' && content) {
      setServices(structuredClone(content.services));
      setPricing(structuredClone(content.pricing));
      setHero(content.settings.hero_background);
    } else if (status === 'failed') {
      setServices(structuredClone(staticContent.services));
      setPricing(structuredClone(staticContent.pricing));
      setHero(staticContent.settings.hero_background);
      setMessage({ kind: 'info', text: 'Content API unreachable — editing the built-in fallback content. Saving will fail until the API is available.' });
    }
  }, [status, content, services]);

  const patchService = (id: string, patch: Partial<ServiceRecord>) => {
    setServices((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) : prev));
  };

  const saveService = async (s: ServiceRecord) => {
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/services', { method: 'PATCH', body: JSON.stringify(s) });
      setMessage({ kind: 'ok', text: `Saved “${s.name}”.` });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const savePricing = async () => {
    if (!pricing) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/pricing', { method: 'PUT', body: JSON.stringify({ cards: pricing }) });
      setMessage({ kind: 'ok', text: `Saved ${pricing.length} pricing card${pricing.length === 1 ? '' : 's'}.` });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const addPricing = () => {
    setPricing((prev) => (prev === null ? prev : [
      ...prev,
      { id: '', name: 'New plan', monthly_price: '$0', yearly_price: '$0/mo', features: ['Feature one'], order_index: prev.length, visible: true },
    ]));
  };

  const removePricing = (idx: number) => {
    setPricing((prev) => (prev === null ? prev : prev.filter((_, i) => i !== idx)));
  };

  const saveHero = async () => {
    if (hero === null) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ hero_background: hero }) });
      setMessage({ kind: 'ok', text: 'Hero background updated.' });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const pickFile = (target: string) => {
    uploadTarget.current = target;
    fileInput.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const { url } = await uploadFile(file);
      const target = uploadTarget.current;
      if (target === 'hero') {
        setHero(url);
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save to apply.` });
      } else if (target && target.startsWith('service:')) {
        const id = target.slice('service:'.length);
        patchService(id, { image: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save on the card to apply.` });
      }
    } catch (err: any) {
      setMessage({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const reload = async () => {
    setMessage({ kind: 'info', text: 'Reloading…' });
    try {
      const data = await api('/api/content');
      const normalized = data as SiteContent;
      setServices(structuredClone(normalized.services));
      setPricing(structuredClone(normalized.pricing));
      setHero(normalized.settings.hero_background);
      setMessage({ kind: 'ok', text: 'Reloaded from D1.' });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'services', label: 'Service cards' },
    { id: 'pricing', label: 'Pricing cards' },
    { id: 'hero', label: 'Hero background' },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f9] pb-24">
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={onFile} />

      <section className="bg-dark text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-white/60 text-[.75rem] font-semibold uppercase tracking-[.16em]">Opus Zimbabwe</p>
          <h1 className="text-3xl font-bold mt-2">Content admin</h1>
          <p className="text-white/70 text-[.9rem] mt-2">Services, pricing and hero imagery — stored in Cloudflare D1, images in R2.</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 mt-6 space-y-4">
        {checkedSession &&
          (session ? (
            <Banner kind="ok">Signed in via Cloudflare Access as <b>{session.email}</b>.</Banner>
          ) : (
            <Banner kind="info">
              Cloudflare Access session not detected. The dashboard will load, but saving requires an Access sign-in for <b>info.opuszim@gmail.com</b> covering <code>/admin*</code> and <code>/api/admin/*</code>. See <code>docs/ADMIN.md</code>.
            </Banner>
          ))}

        {message && <Banner kind={message.kind}>{message.text}</Banner>}

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-[.85rem] font-semibold transition-colors ${tab === t.id ? 'bg-dark text-white' : 'bg-white text-dark border border-[#e5e7eb] hover:border-[#E85D2A]'}`}
            >
              {t.label}
            </button>
          ))}
          <button onClick={reload} className="ml-auto rounded-full px-5 py-2.5 text-[.85rem] font-semibold bg-white border border-[#e5e7eb] hover:border-[#E85D2A]">
            Reload from D1
          </button>
        </div>

        {/* SERVICES */}
        {tab === 'services' && services && (
          <div className="space-y-5">
            {services.map((s) => (
              <div key={s.id} className="rounded-[22px] bg-white border border-[#ececec] p-6 shadow-[0_6px_24px_rgba(0,0,0,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={s.image} alt="" className="h-14 w-14 rounded-xl object-cover bg-[#eee]" />
                    <div>
                      <p className="font-bold text-dark">{s.name}</p>
                      <p className="text-[.78rem] text-[#9ca3af]">/services/{s.slug}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[.8rem] text-dark font-semibold">
                    <input type="checkbox" checked={s.visible} onChange={(e) => patchService(s.id, { visible: e.target.checked })} />
                    Visible
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <Field label="Name" value={s.name} onChange={(v) => patchService(s.id, { name: v })} />
                  <Field label="Tagline" value={s.tagline} onChange={(v) => patchService(s.id, { tagline: v })} />
                  <Field label="Home card copy" value={s.description} onChange={(v) => patchService(s.id, { description: v })} rows={4} />
                  <Field label="/services list copy" value={s.page_description} onChange={(v) => patchService(s.id, { page_description: v })} rows={4} />
                  <Field label="Feature chips (one per line)" value={s.items.join('\n')} onChange={(v) => patchService(s.id, { items: lines(v) })} rows={5} />
                  <div className="space-y-4">
                    <label className="block">
                      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">Card image</span>
                      <div className="flex gap-2">
                        <input className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3.5 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A] focus:bg-white" value={s.image} onChange={(e) => patchService(s.id, { image: e.target.value })} />
                        <button onClick={() => pickFile(`service:${s.id}`)} className="shrink-0 rounded-xl bg-dark text-white px-4 text-[.8rem] font-semibold hover:bg-black">
                          Upload
                        </button>
                      </div>
                      <span className="block text-[.72rem] text-[#9ca3af] mt-1">Static path (/images/…) or R2 upload (/api/media/…).</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">Icon</span>
                        <select className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A]" value={s.icon} onChange={(e) => patchService(s.id, { icon: e.target.value })}>
                          {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </label>
                      <Field label="Order" value={String(s.order_index)} onChange={(v) => patchService(s.id, { order_index: Number(v) || 0 })} />
                    </div>
                    <Field label="Gradient" value={s.gradient} onChange={(v) => patchService(s.id, { gradient: v })} hint="160deg,#1a1a1a,#454545" />
                  </div>
                </div>

                <button
                  disabled={busy}
                  onClick={() => saveService(s)}
                  className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50"
                >
                  Save card
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PRICING */}
        {tab === 'pricing' && pricing && (
          <div className="rounded-[22px] bg-white border border-[#ececec] p-6 shadow-[0_6px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-dark">Pricing cards</h2>
                <p className="text-[.82rem] text-[#6b7280] mt-1">Shown in the Website Packages pricing section. Add, edit, remove — then save.</p>
              </div>
              <button onClick={addPricing} className="rounded-full bg-dark text-white px-5 py-2.5 text-[.85rem] font-semibold hover:bg-black">
                + Add card
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {pricing.map((p, i) => (
                <div key={p.id || `new-${i}`} className="rounded-[18px] border-2 border-[#ececec] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-[.78rem] font-semibold text-dark">
                      <input type="checkbox" checked={p.visible} onChange={(e) => setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x)))} />
                      Visible
                    </label>
                    <button onClick={() => removePricing(i)} className="text-[.78rem] font-semibold text-red-500 hover:underline">
                      Remove
                    </button>
                  </div>
                  <div className="space-y-3">
                    <Field label="Plan name" value={p.name} onChange={(v) => setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Monthly" value={p.monthly_price} onChange={(v) => setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, monthly_price: v } : x)))} />
                      <Field label="Annual" value={p.yearly_price} onChange={(v) => setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, yearly_price: v } : x)))} />
                    </div>
                    <Field label="Features (one per line)" value={p.features.join('\n')} onChange={(v) => setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, features: lines(v) } : x)))} rows={5} />
                  </div>
                </div>
              ))}
              {pricing.length === 0 && (
                <p className="text-[.85rem] text-[#9ca3af]">No pricing cards. Use “+ Add card” to create one.</p>
              )}
            </div>

            <button disabled={busy} onClick={savePricing} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
              Save pricing
            </button>
          </div>
        )}

        {/* HERO */}
        {tab === 'hero' && hero !== null && (
          <div className="rounded-[22px] bg-white border border-[#ececec] p-6 shadow-[0_6px_24px_rgba(0,0,0,0.04)]">
            <h2 className="font-bold text-dark">Hero background</h2>
            <p className="text-[.82rem] text-[#6b7280] mt-1">Background image behind the home page hero. Static path or R2 upload.</p>
            <div className="mt-4 rounded-[18px] overflow-hidden border border-[#e5e7eb] h-56 bg-dark bg-cover bg-center" style={{ backgroundImage: `url('${hero}')` }} />
            <div className="flex gap-2 mt-4">
              <input className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3.5 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A] focus:bg-white" value={hero} onChange={(e) => setHero(e.target.value)} />
              <button onClick={() => pickFile('hero')} className="shrink-0 rounded-xl bg-dark text-white px-4 text-[.8rem] font-semibold hover:bg-black">
                Upload
              </button>
            </div>
            <button disabled={busy} onClick={saveHero} className="mt-4 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
              Save hero background
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
