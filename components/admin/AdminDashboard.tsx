'use client';
// Opus Zimbabwe admin dashboard.
// Reads/writes content through the Cloudflare Pages Functions API
// (D1 for content, R2 for uploaded images). Mutating endpoints only
// accept requests authenticated by Cloudflare Access for an allowed
// admin email (info.opuszim@gmail.com).

import { useEffect, useRef, useState } from 'react';
import {
  ApproachItem,
  ContactCard,
  DEFAULT_SETTINGS,
  FaqItem,
  PartnerRecord,
  PricingRecord,
  ProjectRecord,
  RelatedItem,
  ServiceExtras,
  ServiceRecord,
  SiteSettings,
  SocialLink,
  WhyItem,
  normalizeContent,
  staticContent,
  staticExtras,
  staticPartners,
  staticProjects,
} from '@/lib/content';
import { ICON_NAMES, resolveIcon } from '@/lib/icons';
import { useSiteContent } from '@/lib/use-site-content';

const ICON_OPTIONS = ['Globe', 'LayoutDashboard', 'Bot', 'Palette', 'Server', 'Plug'];

type Tab = 'services' | 'pricing' | 'home' | 'faq' | 'projects' | 'partners' | 'brand';

type Session = { email: string } | null;

const GRADIENT_PRESETS = [
  '160deg,#1a1a1a,#454545',
  '160deg,#E85D2A,#F4A226',
  '160deg,#454545,#6b7280',
  '135deg,#1a1a1a,#E85D2A',
  '180deg,#111827,#374151',
  '90deg,#F4A226,#E85D2A',
];

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

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] bg-white border border-[#ececec] p-6 shadow-[0_6px_24px_rgba(0,0,0,0.04)]">
      <h2 className="font-bold text-dark">{title}</h2>
      {hint && <p className="text-[.82rem] text-[#6b7280] mt-1">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  blank,
  render,
  addLabel,
  emptyLabel,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  render: (item: T, patch: (patch: Partial<T>) => void, remove: () => void) => React.ReactNode;
  addLabel: string;
  emptyLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) =>
        render(
          item,
          (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))),
          () => onChange(items.filter((_, j) => j !== i))
        )
      )}
      {items.length === 0 && emptyLabel && <p className="text-[.82rem] text-[#9ca3af]">{emptyLabel}</p>}
      <button
        type="button"
        onClick={() => onChange([...items, blank()])}
        className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-[.8rem] font-semibold text-dark hover:border-[#E85D2A]"
      >
        + {addLabel}
      </button>
    </div>
  );
}

function parseGradient(value: string): { angle: number; colors: string[] } {
  const parts = (value || '').split(',').map((p) => p.trim()).filter(Boolean);
  const angle = parseInt(parts[0] || '160', 10);
  const colors = parts.slice(1).filter((p) => p.startsWith('#'));
  return { angle: Number.isFinite(angle) ? angle : 160, colors: colors.length ? colors : ['#1a1a1a', '#454545'] };
}

function GradientBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { angle, colors } = parseGradient(value);
  const setAngle = (next: number) => onChange(`${next}deg,${colors.join(',')}`);
  const setColor = (index: number, color: string) => {
    const next = colors.map((c, i) => (i === index ? color : c));
    onChange(`${angle}deg,${next.join(',')}`);
  };

  return (
    <div className="rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] p-3">
      <div
        className="h-24 w-full rounded-lg"
        style={{ backgroundImage: `linear-gradient(${angle}deg,${colors.join(',')})` }}
      />
      <div className="mt-3 flex items-center gap-3">
        <label className="flex items-center gap-2 text-[.78rem] font-semibold text-dark">
          Angle
          <input
            type="number"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Math.max(0, Math.min(360, Number(e.target.value) || 0)))}
            className="w-20 rounded-lg border border-[#e5e7eb] bg-white px-2 py-1 text-[.85rem]"
          />
        </label>
        {colors.map((color, i) => (
          <label key={i} className="flex items-center gap-1.5 text-[.78rem] font-semibold text-dark">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(i, e.target.value)}
              className="h-8 w-10 rounded border border-[#e5e7eb] bg-white"
            />
            <span className="font-normal text-muted-fg">{color}</span>
          </label>
        ))}
        {colors.length > 2 && (
          <button
            type="button"
            onClick={() => onChange(`${angle}deg,${colors.slice(0, -1).join(',')}`)}
            className="text-[.75rem] font-semibold text-red-500 hover:underline"
          >
            Remove
          </button>
        )}
        {colors.length < 4 && (
          <button
            type="button"
            onClick={() => onChange(`${angle}deg,${[...colors, colors[colors.length - 1]].join(',')}`)}
            className="text-[.75rem] font-semibold text-primary hover:underline"
          >
            Add colour
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {GRADIENT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            title={preset}
            onClick={() => onChange(preset)}
            className={`h-7 w-14 rounded-md border-2 ${
              preset === `${angle}deg,${colors.join(',')}` ? 'border-[#E85D2A]' : 'border-white'
            }`}
            style={{ backgroundImage: `linear-gradient(${preset})` }}
          />
        ))}
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-[#e5e7eb] bg-white px-2 py-1.5 text-[.8rem] text-dark outline-none focus:border-[#E85D2A]"
      />
      <p className="mt-1 text-[.72rem] text-[#9ca3af]">Format: angle,#colour,#colour (saved to D1 verbatim).</p>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onUpload,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: () => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">{label}</span>
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3.5 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A] focus:bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onUpload}
          className="shrink-0 rounded-xl bg-dark px-4 text-[.8rem] font-semibold text-white hover:bg-black"
        >
          Upload
        </button>
      </div>
      {hint && <span className="block text-[.72rem] text-[#9ca3af] mt-1">{hint}</span>}
    </label>
  );
}

function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const Icon = resolveIcon(value);
  return (
    <label className="block">
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">{label}</span>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f5] text-dark">
          <Icon size={18} />
        </span>
        <select
          className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

export default function AdminDashboard() {
  const { content, status } = useSiteContent();
  const [tab, setTab] = useState<Tab>('services');
  const [session, setSession] = useState<Session>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [services, setServices] = useState<ServiceRecord[] | null>(null);
  const [extras, setExtras] = useState<Record<string, ServiceExtras> | null>(null);
  const [pricing, setPricing] = useState<PricingRecord[] | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null);
  const [partners, setPartners] = useState<PartnerRecord[] | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
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
      setExtras(structuredClone(content.extras));
      setPricing(structuredClone(content.pricing));
      setProjects(structuredClone(content.projects));
      setPartners(structuredClone(content.partners));
      setSettings(structuredClone(content.settings));
    } else if (status === 'failed') {
      setServices(structuredClone(staticContent.services));
      setExtras(structuredClone(staticExtras));
      setPricing(structuredClone(staticContent.pricing));
      setProjects(structuredClone(staticProjects));
      setPartners(structuredClone(staticPartners));
      setSettings(structuredClone(DEFAULT_SETTINGS));
      setMessage({ kind: 'info', text: 'Content API unreachable — editing the built-in fallback content. Saving will fail until the API is available.' });
    }
  }, [status, content, services]);

  const patchService = (id: string, patch: Partial<ServiceRecord>) => {
    setServices((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) : prev));
  };

  const patchExtras = (id: string, patch: Partial<ServiceExtras>) => {
    setExtras((prev) => {
      if (!prev) return prev;
      const current = prev[id] || { ...staticExtras[id], service_id: id };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  };

  const patchSettings = (patch: Partial<SiteSettings>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const saveService = async (s: ServiceRecord) => {
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/services', {
        method: 'PATCH',
        body: JSON.stringify({ ...s, extras: extras?.[s.id] || null }),
      });
      setMessage({ kind: 'ok', text: `Saved “${s.name}” (card, hero, Why Opus and related links).` });
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

  const saveProjects = async () => {
    if (!projects) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/projects', { method: 'PUT', body: JSON.stringify({ projects }) });
      setMessage({ kind: 'ok', text: `Saved ${projects.length} project${projects.length === 1 ? '' : 's'}.` });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const savePartners = async () => {
    if (!partners) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/partners', {
        method: 'PUT',
        body: JSON.stringify({ partners }),
      });
      setMessage({ kind: 'ok', text: `Saved ${partners.length} partner${partners.length === 1 ? '' : 's'}.` });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async (keys: (keyof SiteSettings)[], label: string) => {
    if (!settings) return;
    setBusy(true);
    setMessage(null);
    const body: Record<string, unknown> = {};
    for (const key of keys) body[key] = settings[key];
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(body) });
      setMessage({ kind: 'ok', text: label });
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
        patchSettings({ hero_background: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save to apply.` });
      } else if (target === 'navbar_logo') {
        patchSettings({ navbar_logo: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save to apply.` });
      } else if (target === 'manifest_icon') {
        patchSettings({ manifest_icon: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save to apply.` });
      } else if (target === 'built_image') {
        patchSettings({ built_for_zimbabwe: { ...(settings as SiteSettings).built_for_zimbabwe, image: url } });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save to apply.` });
      } else if (target && target.startsWith('service:')) {
        const id = target.slice('service:'.length);
        patchExtras(id, { hero_background: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save on the card to apply.` });
      } else if (target && target.startsWith('card:')) {
        const id = target.slice('card:'.length);
        patchService(id, { image: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save on the card to apply.` });
      } else if (target && target.startsWith('partnerlogo:')) {
        const index = Number(target.slice('partnerlogo:'.length));
        setPartners((prev) =>
          prev && Number.isFinite(index) ? prev.map((p, i) => (i === index ? { ...p, logo: url } : p)) : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save partners to apply.` });
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
      const normalized = normalizeContent(data);
      if (!normalized) throw new Error('Content API returned an unexpected shape.');
      setServices(structuredClone(normalized.services));
      setExtras(structuredClone(normalized.extras));
      setPricing(structuredClone(normalized.pricing));
      setProjects(structuredClone(normalized.projects));
      setPartners(structuredClone(normalized.partners));
      setSettings(structuredClone(normalized.settings));
      setMessage({ kind: 'ok', text: 'Reloaded from D1.' });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'home', label: 'Home' },
    { id: 'faq', label: 'FAQ' },
    { id: 'projects', label: 'Projects' },
    { id: 'brand', label: 'Brand' },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7f9] pb-24">
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" className="hidden" onChange={onFile} />

      <section className="bg-dark text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-white/60 text-[.75rem] font-semibold uppercase tracking-[.16em]">Opus Zimbabwe</p>
          <h1 className="text-3xl font-bold mt-2">Content admin</h1>
          <p className="text-white/70 text-[.9rem] mt-2">
            Services, heroes, pricing, projects, home sections, FAQs and branding — stored in Cloudflare D1, images in R2.
          </p>
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
            {services.map((s) => {
              const extra: ServiceExtras = extras?.[s.id] || { ...staticExtras[s.id], service_id: s.id };
              const isGradient = extra.hero_background_kind === 'gradient';
              return (
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
                      <ImageField
                        label="Card image"
                        value={s.image}
                        onChange={(v) => patchService(s.id, { image: v })}
                        onUpload={() => pickFile(`card:${s.id}`)}
                        hint="Static path (/images/…) or R2 upload (/api/media/…)."
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                          <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">Icon</span>
                          <select className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A]" value={s.icon} onChange={(e) => patchService(s.id, { icon: e.target.value })}>
                            {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </label>
                        <Field label="Order" value={String(s.order_index)} onChange={(v) => patchService(s.id, { order_index: Number(v) || 0 })} />
                      </div>
                      <Field label="Card gradient" value={s.gradient} onChange={(v) => patchService(s.id, { gradient: v })} hint="160deg,#1a1a1a,#454545" />
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4">
                    <p className="text-[.78rem] font-bold uppercase tracking-widest text-primary">Service page hero</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <Field label="Eyebrow" value={extra.hero_eyebrow} onChange={(v) => patchExtras(s.id, { hero_eyebrow: v })} />
                      <Field label="Button label" value={extra.hero_cta} onChange={(v) => patchExtras(s.id, { hero_cta: v })} />
                    </div>
                    <div className="mt-4 grid gap-4">
                      <Field label="Headline" value={extra.hero_headline} onChange={(v) => patchExtras(s.id, { hero_headline: v })} rows={2} />
                      <Field label="Intro" value={extra.hero_intro} onChange={(v) => patchExtras(s.id, { hero_intro: v })} rows={3} />
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">Background</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => patchExtras(s.id, { hero_background_kind: 'image' })} className={`flex-1 rounded-xl px-3 py-2 text-[.82rem] font-semibold border-2 ${!isGradient ? 'border-[#E85D2A] bg-white text-dark' : 'border-[#e5e7eb] bg-[#f5f5f5] text-muted-fg'}`}>
                            Image
                          </button>
                          <button type="button" onClick={() => patchExtras(s.id, { hero_background_kind: 'gradient' })} className={`flex-1 rounded-xl px-3 py-2 text-[.82rem] font-semibold border-2 ${isGradient ? 'border-[#E85D2A] bg-white text-dark' : 'border-[#e5e7eb] bg-[#f5f5f5] text-muted-fg'}`}>
                            Gradient
                          </button>
                        </div>
                        <div className="mt-3">
                          {isGradient ? (
                            <GradientBuilder value={extra.hero_gradient} onChange={(v) => patchExtras(s.id, { hero_gradient: v })} />
                          ) : (
                            <ImageField
                              label="Hero image"
                              value={extra.hero_background}
                              onChange={(v) => patchExtras(s.id, { hero_background: v })}
                              onUpload={() => pickFile(`service:${s.id}`)}
                              hint="Static path (/images/…) or R2 upload (/api/media/…)."
                            />
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">Preview</span>
                        <div
                          className="flex h-40 items-end rounded-xl p-4 text-white"
                          style={{
                            backgroundImage: isGradient
                              ? `linear-gradient(${extra.hero_gradient})`
                              : `url('${extra.hero_background || s.image}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        >
                          <span className="text-[.8rem] font-bold drop-shadow">{extra.hero_headline || s.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-[.78rem] font-bold uppercase tracking-widest text-primary">Why Opus</p>
                      <div className="mt-3">
                        <ListEditor<WhyItem>
                          items={extra.why_items}
                          onChange={(next) => patchExtras(s.id, { why_items: next })}
                          blank={() => ({ title: '', body: '' })}
                          addLabel="Add reason"
                          emptyLabel="No reasons yet."
                          render={(item, patch, remove) => (
                            <div className="rounded-xl border border-[#ececec] p-3">
                              <Field label="Title" value={item.title} onChange={(v) => patch({ title: v })} />
                              <div className="mt-2">
                                <Field label="Body" value={item.body} onChange={(v) => patch({ body: v })} rows={2} />
                              </div>
                              <button type="button" onClick={remove} className="mt-2 text-[.75rem] font-semibold text-red-500 hover:underline">Remove</button>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[.78rem] font-bold uppercase tracking-widest text-primary">Related services</p>
                      <div className="mt-3">
                        <ListEditor<RelatedItem>
                          items={extra.related_items}
                          onChange={(next) => patchExtras(s.id, { related_items: next })}
                          blank={() => ({ label: '', href: '' })}
                          addLabel="Add link"
                          emptyLabel="No related links yet."
                          render={(item, patch, remove) => (
                            <div className="rounded-xl border border-[#ececec] p-3">
                              <Field label="Label" value={item.label} onChange={(v) => patch({ label: v })} />
                              <div className="mt-2">
                                <Field label="Link" value={item.href} onChange={(v) => patch({ href: v })} hint="/services/…" />
                              </div>
                              <button type="button" onClick={remove} className="mt-2 text-[.75rem] font-semibold text-red-500 hover:underline">Remove</button>
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={busy}
                    onClick={() => saveService(s)}
                    className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50"
                  >
                    Save service
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* PRICING */}
        {tab === 'pricing' && pricing && (
          <Card title="Pricing cards" hint="Shown in the Website Packages pricing section. Add, edit, remove — then save.">
            <div className="flex items-center justify-between">
              <p className="text-[.82rem] text-[#6b7280]">{pricing.length} card{pricing.length === 1 ? '' : 's'}.</p>
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
          </Card>
        )}

        {/* HOME */}
        {tab === 'home' && settings && (
          <div className="space-y-5">
            <Card title="Hero background" hint="Background image behind the home page hero. Static path or R2 upload.">
              <div className="rounded-[18px] overflow-hidden border border-[#e5e7eb] h-56 bg-dark bg-cover bg-center" style={{ backgroundImage: `url('${settings.hero_background}')` }} />
              <div className="mt-4">
                <ImageField
                  label="Image"
                  value={settings.hero_background}
                  onChange={(v) => patchSettings({ hero_background: v })}
                  onUpload={() => pickFile('hero')}
                />
              </div>
              <button disabled={busy} onClick={() => saveSettings(['hero_background'], 'Hero background updated.')} className="mt-4 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save hero background
              </button>
            </Card>

            <Card title="The Opus Approach" hint="Five cards on the home page. Icons come from the shared icon set.">
              <ListEditor<ApproachItem>
                items={settings.approach_items}
                onChange={(next) => patchSettings({ approach_items: next })}
                blank={() => ({ title: '', body: '', icon: 'Globe' })}
                addLabel="Add step"
                emptyLabel="No steps yet."
                render={(item, patch, remove) => (
                  <div className="rounded-xl border border-[#ececec] p-3 grid gap-3 md:grid-cols-[1fr_1.4fr]">
                    <div className="space-y-3">
                      <Field label="Title" value={item.title} onChange={(v) => patch({ title: v })} />
                      <IconPicker label="Icon" value={item.icon} onChange={(v) => patch({ icon: v })} />
                    </div>
                    <div>
                      <Field label="Body" value={item.body} onChange={(v) => patch({ body: v })} rows={3} />
                      <button type="button" onClick={remove} className="mt-2 text-[.75rem] font-semibold text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                )}
              />
              <button disabled={busy} onClick={() => saveSettings(['approach_items'], 'Opus Approach saved.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save approach
              </button>
            </Card>

            <Card title="Built for Zimbabwe" hint="Full-width home page section.">
              <div className="grid gap-4">
                <Field label="Eyebrow" value={settings.built_for_zimbabwe.eyebrow} onChange={(v) => patchSettings({ built_for_zimbabwe: { ...settings.built_for_zimbabwe, eyebrow: v } })} />
                <Field label="Heading" value={settings.built_for_zimbabwe.heading} onChange={(v) => patchSettings({ built_for_zimbabwe: { ...settings.built_for_zimbabwe, heading: v } })} rows={2} />
                <Field label="Body" value={settings.built_for_zimbabwe.body} onChange={(v) => patchSettings({ built_for_zimbabwe: { ...settings.built_for_zimbabwe, body: v } })} rows={4} />
                <ImageField
                  label="Background image"
                  value={settings.built_for_zimbabwe.image}
                  onChange={(v) => patchSettings({ built_for_zimbabwe: { ...settings.built_for_zimbabwe, image: v } })}
                  onUpload={() => pickFile('built_image')}
                />
              </div>
              <button disabled={busy} onClick={() => saveSettings(['built_for_zimbabwe'], 'Built for Zimbabwe saved.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save section
              </button>
            </Card>
          </div>
        )}

        {/* FAQ */}
        {tab === 'faq' && settings && (
          <div className="space-y-5">
            <Card title="Home page FAQ" hint="Short list shown on the home page.">
              <ListEditor<FaqItem>
                items={settings.faq_home}
                onChange={(next) => patchSettings({ faq_home: next })}
                blank={() => ({ q: '', a: '' })}
                addLabel="Add question"
                emptyLabel="No questions yet."
                render={(item, patch, remove) => (
                  <div className="rounded-xl border border-[#ececec] p-3">
                    <Field label="Question" value={item.q} onChange={(v) => patch({ q: v })} />
                    <div className="mt-2">
                      <Field label="Answer" value={item.a} onChange={(v) => patch({ a: v })} rows={3} />
                    </div>
                    <button type="button" onClick={remove} className="mt-2 text-[.75rem] font-semibold text-red-500 hover:underline">Remove</button>
                  </div>
                )}
              />
              <button disabled={busy} onClick={() => saveSettings(['faq_home'], 'Home FAQ saved.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save home FAQ
              </button>
            </Card>

            <Card title="FAQ page" hint="Full list shown on /faq.">
              <ListEditor<FaqItem>
                items={settings.faq_page}
                onChange={(next) => patchSettings({ faq_page: next })}
                blank={() => ({ q: '', a: '' })}
                addLabel="Add question"
                emptyLabel="No questions yet."
                render={(item, patch, remove) => (
                  <div className="rounded-xl border border-[#ececec] p-3">
                    <Field label="Question" value={item.q} onChange={(v) => patch({ q: v })} />
                    <div className="mt-2">
                      <Field label="Answer" value={item.a} onChange={(v) => patch({ a: v })} rows={3} />
                    </div>
                    <button type="button" onClick={remove} className="mt-2 text-[.75rem] font-semibold text-red-500 hover:underline">Remove</button>
                  </div>
                )}
              />
              <button disabled={busy} onClick={() => saveSettings(['faq_page'], 'FAQ page saved.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save FAQ page
              </button>
            </Card>
          </div>
        )}

        {/* PROJECTS */}
        {tab === 'projects' && projects && (
          <Card title="Projects" hint="Shown on /projects and the home page grid. Active projects link out; Coming soon renders as a badge.">
            <ListEditor<ProjectRecord>
              items={projects}
              onChange={setProjects}
              blank={() => ({ id: '', name: '', url: '', tag: '', location: '', description: '', status: 'coming_soon', order_index: projects.length, visible: true })}
              addLabel="Add project"
              emptyLabel="No projects yet."
              render={(item, patch, remove) => (
                <div className="rounded-xl border border-[#ececec] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Name" value={item.name} onChange={(v) => patch({ name: v })} />
                    <Field label="Link (https://…)" value={item.url} onChange={(v) => patch({ url: v })} hint="Required for Active projects." />
                    <Field label="Tag" value={item.tag} onChange={(v) => patch({ tag: v })} />
                    <Field label="Location" value={item.location} onChange={(v) => patch({ location: v })} />
                    <label className="block">
                      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-muted-fg mb-1.5">Status</span>
                      <select
                        className="w-full rounded-xl border-2 border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2.5 text-[.9rem] outline-none focus:border-[#E85D2A]"
                        value={item.status}
                        onChange={(e) => patch({ status: e.target.value === 'coming_soon' ? 'coming_soon' : 'active' })}
                      >
                        <option value="active">Active (link)</option>
                        <option value="coming_soon">Coming soon (badge)</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2 self-end text-[.8rem] font-semibold text-dark">
                      <input type="checkbox" checked={item.visible} onChange={(e) => patch({ visible: e.target.checked })} />
                      Visible
                    </label>
                  </div>
                  <div className="mt-3">
                    <Field label="Description" value={item.description} onChange={(v) => patch({ description: v })} rows={3} />
                  </div>
                  <button type="button" onClick={remove} className="mt-3 text-[.75rem] font-semibold text-red-500 hover:underline">Remove project</button>
                </div>
              )}
            />
            <button disabled={busy} onClick={saveProjects} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
              Save projects
            </button>
          </Card>
        )}

        {/* PARTNERS */}
        {tab === 'partners' && partners && (
          <Card
            title="Trusted partners"
            hint="The “Organisations We Have Built For” logo row on the home page. Add, edit, remove — then save."
          >
            <ListEditor<PartnerRecord>
              items={partners}
              onChange={setPartners}
              blank={() => ({ id: '', name: '', logo: '', url: '', order_index: partners.length, visible: true })}
              addLabel="Add partner"
              emptyLabel="No partners yet."
              render={(item, patch, remove) => (
                <div className="rounded-xl border border-[#ececec] p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Name" value={item.name} onChange={(v) => patch({ name: v })} />
                    <Field label="Website (optional)" value={item.url} onChange={(v) => patch({ url: v })} hint="https://… — leave empty to show the logo unlinked" />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <ImageField
                      label="Logo"
                      value={item.logo}
                      onChange={(v) => patch({ logo: v })}
                      onUpload={() => pickFile(`partnerlogo:${partners.indexOf(item)}`)}
                      hint="Static path (/images/…) or R2 upload (/api/media/…)."
                    />
                    <label className="flex items-center gap-2 text-[.8rem] font-semibold text-dark md:pb-2.5">
                      <input type="checkbox" checked={item.visible} onChange={(e) => patch({ visible: e.target.checked })} />
                      Visible
                    </label>
                  </div>
                  {item.logo && (
                    <div className="mt-3 flex h-20 w-40 items-center justify-center rounded-lg border border-[#ececec] bg-white p-2">
                      <img src={item.logo} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <button type="button" onClick={remove} className="mt-3 text-[.75rem] font-semibold text-red-500 hover:underline">
                    Remove partner
                  </button>
                </div>
              )}
            />
            <button
              disabled={busy}
              onClick={savePartners}
              className="mt-5 rounded-full bg-primary px-6 py-2.5 text-[.85rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              Save partners
            </button>
          </Card>
        )}

        {/* BRAND */}
        {tab === 'brand' && settings && (
          <div className="space-y-5">
            <Card title="Logos & app icon" hint="Navbar logo (home page header) and the icon served by /api/manifest.">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <ImageField label="Navbar logo" value={settings.navbar_logo} onChange={(v) => patchSettings({ navbar_logo: v })} onUpload={() => pickFile('navbar_logo')} />
                  {settings.navbar_logo && <img src={settings.navbar_logo} alt="" className="mt-3 h-14 w-auto rounded-lg border border-[#ececec] bg-white p-2 object-contain" />}
                </div>
                <div>
                  <ImageField label="Manifest icon" value={settings.manifest_icon} onChange={(v) => patchSettings({ manifest_icon: v })} onUpload={() => pickFile('manifest_icon')} hint="512×512 PNG works best." />
                  {settings.manifest_icon && <img src={settings.manifest_icon} alt="" className="mt-3 h-20 w-20 rounded-2xl border border-[#ececec] bg-white p-1 object-contain" />}
                </div>
              </div>
              <button disabled={busy} onClick={() => saveSettings(['navbar_logo', 'manifest_icon'], 'Branding saved. /api/manifest serves the new icon immediately.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save branding
              </button>
            </Card>

            <Card title="Footer socials" hint="Rounded icon links at the top of the footer.">
              <ListEditor<SocialLink>
                items={settings.footer_socials}
                onChange={(next) => patchSettings({ footer_socials: next })}
                blank={() => ({ label: '', href: 'https://', icon: 'Globe' })}
                addLabel="Add social"
                emptyLabel="No socials yet."
                render={(item, patch, remove) => (
                  <div className="rounded-xl border border-[#ececec] p-3 grid gap-3 md:grid-cols-3">
                    <Field label="Label" value={item.label} onChange={(v) => patch({ label: v })} />
                    <Field label="Link" value={item.href} onChange={(v) => patch({ href: v })} hint="https://…" />
                    <div>
                      <IconPicker label="Icon" value={item.icon} onChange={(v) => patch({ icon: v })} />
                      <button type="button" onClick={remove} className="mt-2 text-[.75rem] font-semibold text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                )}
              />
              <button disabled={busy} onClick={() => saveSettings(['footer_socials'], 'Footer socials saved.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save socials
              </button>
            </Card>

            <Card title="Contact cards" hint="The three contact cards on /contact.">
              <ListEditor<ContactCard>
                items={settings.contact_cards}
                onChange={(next) => patchSettings({ contact_cards: next })}
                blank={() => ({ title: '', line: '', note: '', href: '', icon: 'Mail' })}
                addLabel="Add card"
                emptyLabel="No contact cards yet."
                render={(item, patch, remove) => (
                  <div className="rounded-xl border border-[#ececec] p-3 grid gap-3 md:grid-cols-2">
                    <Field label="Title" value={item.title} onChange={(v) => patch({ title: v })} />
                    <IconPicker label="Icon" value={item.icon} onChange={(v) => patch({ icon: v })} />
                    <Field label="Line" value={item.line} onChange={(v) => patch({ line: v })} />
                    <Field label="Note" value={item.note} onChange={(v) => patch({ note: v })} />
                    <div className="md:col-span-2">
                      <Field label="Link" value={item.href} onChange={(v) => patch({ href: v })} hint="https://…, mailto:… or tel:…" />
                    </div>
                    <button type="button" onClick={remove} className="text-[.75rem] font-semibold text-red-500 hover:underline md:col-span-2">Remove</button>
                  </div>
                )}
              />
              <button disabled={busy} onClick={() => saveSettings(['contact_cards'], 'Contact cards saved.')} className="mt-5 rounded-full bg-primary hover:brightness-110 text-white px-6 py-2.5 text-[.85rem] font-semibold disabled:opacity-50">
                Save contact cards
              </button>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
