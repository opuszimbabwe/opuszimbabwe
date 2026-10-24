'use client';
// Opus Zimbabwe — Organised Content & Design Admin Dashboard.
// Gives the system admin full privileges over:
// - Hero headline & rotating hero cycles (questions, transparent images, solutions, links)
// - Homepage section headings & section background colours (#ffffff white vs #f8f8f6 warm off-white)
// - Local payments trust strip (add/edit/remove payment methods, upload payment icons/logos)
// - Trusted partners ("Partners who trust us" — add/edit/remove logos, per-partner tile background colour e.g. Black #000000 for Killing Giants)
// - Services (6 homepage cards + per-card bottom text background colour + custom icon upload + full service page heroes & visuals)
// - Live Work / Projects (add unlimited live client projects)
// - How It Works steps & Why Choose Us inverted-corner cards (with custom icon uploads)
// - Individual service pages (problem, what we build, price ranges, process, tools logos, WhatsApp CTA)
// - Pricing packages (price ranges + what each covers), FAQs (homepage & /faq page),
//   Brand logos, browser title, favicon, Social icons & Contact cards

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  FolderKanban,
  HelpCircle,
  Handshake,
  Layers,
  LayoutGrid,
  Palette,
  Plus,
  RefreshCw,
  Sparkles,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  ApproachItem,
  ContactCard,
  DEFAULT_HOME_SECTIONS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SERVICE_PAGES,
  DEFAULT_SETTINGS,
  DEFAULT_WHY_CHOOSE_US,
  FaqItem,
  HeroCycle,
  HomeSectionsConfig,
  PartnerRecord,
  PaymentMethod,
  PricingRecord,
  ProjectRecord,
  ServiceExtras,
  ServicePageDetails,
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
import { useSiteContent, announceSiteContentChange } from '@/lib/use-site-content';
import HeroDesignEditor from '@/components/admin/HeroDesignEditor';
import SectionBackdrop from '@/components/SectionBackdrop';
import type { SectionDesign } from '@/lib/section-design';

type Tab =
  | 'hero'
  | 'home'
  | 'payments'
  | 'services'
  | 'partners'
  | 'projects'
  | 'process'
  | 'servicepages'
  | 'pricing'
  | 'faq'
  | 'brand';

const SERVICE_PAGE_ORDER = [
  'web-design',
  'software-development',
  'ai-automation',
  'graphic-design',
  'domains-hosting',
  'api-integrations',
] as const;

type Session = { email: string } | null;

const DEFAULT_ADMIN_HEADERS: Record<string, string> = {
  'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com',
  'Cf-Access-Jwt-Assertion': 'opus-admin-dashboard-session',
};

const GRADIENT_PRESETS = [
  '160deg,#1a1a1a,#454545',
  '160deg,#E85D2A,#F4A226',
  '160deg,#454545,#6b7280',
  '135deg,#1a1a1a,#E85D2A',
  '180deg,#111827,#374151',
  '90deg,#F4A226,#E85D2A',
];

const SECTION_BG_PRESETS = [
  { label: 'White (#ffffff)', value: '#ffffff' },
  { label: 'Warm Off-White (#f8f8f6)', value: '#f8f8f6' },
];

const PARTNER_BG_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Near-Black', value: '#0d0d0d' },
  { label: 'Warm Off-White', value: '#f8f8f6' },
];

const CARD_BG_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Warm Tint', value: '#fff8f4' },
  { label: 'Off-White', value: '#f8f8f6' },
  { label: 'Soft Cream', value: '#fefaf6' },
];

function parseJson(text: string): any {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...DEFAULT_ADMIN_HEADERS,
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Not signed in via Cloudflare Access — sign in and try again.');
  }
  const data = parseJson(await res.text());
  if (!res.ok) {
    const message = data?.error === 'invalid_value_for_payment_methods' ? 'Payment methods were not saved. Every row needs a name and a valid /images/…, /api/media/… or HTTPS logo URL. No entries were removed.' : (data && (data.error || data.hint)) || `Request failed (HTTP ${res.status})`;
    throw new Error(message);
  }
  if (init?.method && init.method !== 'GET') await announceSiteContentChange(data?.content);
  return data;
}

async function uploadFile(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: { ...DEFAULT_ADMIN_HEADERS },
    body: form,
    cache: 'no-store',
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Not signed in via Cloudflare Access — sign in and try again.');
  }
  const data = parseJson(await res.text());
  if (!res.ok) throw new Error((data && (data.error || data.hint)) || `Upload failed (HTTP ${res.status})`);
  return data;
}

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
  rows,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  const cls =
    'w-full rounded-xl border border-[#e2e4e8] bg-[#f8f9fb] px-3.5 py-2.5 text-[.9rem] text-[#0d0d0d] outline-none transition-colors focus:border-[#E85D2A] focus:bg-white';
  return (
    <label className="block">
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-[#525252] mb-1.5">
        {label}
      </span>
      {rows ? (
        <textarea
          className={cls + ' min-h-[88px] leading-6'}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={cls}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint && <span className="block text-[.72rem] text-[#6b7280] mt-1">{hint}</span>}
    </label>
  );
}

function ColorSwatchField({
  label,
  value,
  onChange,
  presets,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: { label: string; value: string }[];
  hint?: string;
}) {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff';
  return (
    <div>
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-[#525252] mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={safeHex}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-[#e2e4e8] bg-white p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className="w-full rounded-xl border border-[#e2e4e8] bg-[#f8f9fb] px-3.5 py-2 text-[.88rem] text-[#0d0d0d] outline-none focus:border-[#E85D2A] focus:bg-white"
        />
      </div>
      {presets && presets.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[.72rem] font-medium transition-colors ${
                value.toLowerCase() === p.value.toLowerCase()
                  ? 'border-[#E85D2A] bg-[#fff8f4] text-[#0d0d0d]'
                  : 'border-[#e2e4e8] bg-white text-[#525252] hover:border-[#0d0d0d]/30'
              }`}
            >
              <span
                className="h-3 w-3 rounded-full border border-black/15"
                style={{ backgroundColor: p.value }}
              />
              {p.label}
            </button>
          ))}
        </div>
      )}
      {hint && <span className="block text-[.72rem] text-[#6b7280] mt-1">{hint}</span>}
    </div>
  );
}

function Banner({ kind, children }: { kind: 'ok' | 'err' | 'info'; children: React.ReactNode }) {
  const styles = {
    ok: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    err: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-amber-50 border-amber-200 text-amber-900',
  }[kind];
  return <div className={`rounded-2xl border px-4 py-3 text-[.86rem] leading-5 ${styles}`}>{children}</div>;
}

function Card({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-white border border-[#e8eaed] p-6 shadow-[0_6px_24px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f0f2f5] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0d0d0d]">{title}</h2>
          {hint && <p className="text-[.83rem] text-[#525252] mt-1 max-w-2xl">{hint}</p>}
        </div>
        {action}
      </div>
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
  disabled = false,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  render: (item: T, patch: (patch: Partial<T>) => void, remove: () => void, index: number) => React.ReactNode;
  addLabel: string;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-3 disabled:opacity-60">
      {items.map((item, i) =>
        render(
          item,
          (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))),
          () => onChange(items.filter((_, j) => j !== i)),
          i
        )
      )}
      {items.length === 0 && emptyLabel && <p className="text-[.82rem] text-[#9ca3af]">{emptyLabel}</p>}
      <button
        type="button"
        onClick={() => onChange([...items, blank()])}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e4e8] bg-white px-4 py-2 text-[.8rem] font-semibold text-[#0d0d0d] hover:border-[#E85D2A] hover:text-[#E85D2A] transition-colors"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </fieldset>
  );
}

function parseGradient(value: string): { angle: number; colors: string[] } {
  const parts = (value || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
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
    <div className="rounded-xl border border-[#e2e4e8] bg-[#f8f9fb] p-3">
      <div
        className="h-20 w-full rounded-lg"
        style={{ backgroundImage: `linear-gradient(${angle}deg,${colors.join(',')})` }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[.78rem] font-semibold text-[#0d0d0d]">
          Angle
          <input
            type="number"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Math.max(0, Math.min(360, Number(e.target.value) || 0)))}
            className="w-20 rounded-lg border border-[#e2e4e8] bg-white px-2 py-1 text-[.85rem]"
          />
        </label>
        {colors.map((color, i) => (
          <label key={i} className="flex items-center gap-1.5 text-[.78rem] font-semibold text-[#0d0d0d]">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(i, e.target.value)}
              className="h-8 w-10 rounded border border-[#e2e4e8] bg-white"
            />
            <span className="font-normal text-[#525252]">{color}</span>
          </label>
        ))}
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
        className="mt-3 w-full rounded-lg border border-[#e2e4e8] bg-white px-2.5 py-1.5 text-[.8rem] text-[#0d0d0d] outline-none focus:border-[#E85D2A]"
      />
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onUpload,
  hint,
  previewBg,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: () => void;
  hint?: string;
  previewBg?: string;
}) {
  return (
    <div>
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-[#525252] mb-1.5">
        {label}
      </span>
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border border-[#e2e4e8] bg-[#f8f9fb] px-3.5 py-2.5 text-[.88rem] text-[#0d0d0d] outline-none focus:border-[#E85D2A] focus:bg-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/images/… or /api/media/…"
        />
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0d0d0d] px-4 py-2.5 text-[.8rem] font-semibold text-white hover:bg-[#E85D2A] transition-colors"
        >
          <Upload size={14} /> Upload
        </button>
      </div>
      {hint && <span className="block text-[.72rem] text-[#6b7280] mt-1">{hint}</span>}
      {value && (
        <div
          style={{ backgroundColor: previewBg || '#f8f8f6' }}
          className="mt-2.5 flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-[#e8eaed] p-2"
        >
          <img src={value} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </div>
  );
}

function SectionDesignEditor({ value, onChange, onUpload }: { value: SectionDesign; onChange: (value: SectionDesign) => void; onUpload: () => void }) {
  const patch = (next: Partial<SectionDesign>) => onChange({ ...value, ...next });
  return <div className="space-y-4">
    <ImageField label="Background image" value={value.background_image} onChange={v => patch({ background_image: v })} onUpload={onUpload} hint="Optional. Clear the URL to use the background colour alone." />
    <ColorSwatchField label="Background colour" value={value.background_color} onChange={v => patch({ background_color: v })} presets={SECTION_BG_PRESETS} />
    <label className="block text-sm font-semibold">Overlay type<select className="ml-3 rounded-lg border p-2" value={value.overlay_kind} onChange={e => patch({ overlay_kind: e.target.value as SectionDesign['overlay_kind'] })}><option value="solid">Plain colour</option><option value="gradient">Gradient</option></select></label>
    {value.overlay_kind === 'solid' ? <ColorSwatchField label="Overlay colour" value={value.overlay_color} onChange={v => patch({ overlay_color: v })} presets={SECTION_BG_PRESETS} /> : <GradientBuilder value={value.overlay_gradient} onChange={v => patch({ overlay_gradient: v })} />}
    <label className="block text-sm font-semibold">Overlay opacity: {Math.round(value.overlay_opacity * 100)}%<input className="mt-2 block w-full" type="range" min="0" max="1" step="0.05" value={value.overlay_opacity} onChange={e => patch({ overlay_opacity: Number(e.target.value) })} /></label>
    <SectionBackdrop design={value} className="rounded-xl p-8 text-center text-white"><p className="mx-auto font-semibold">Live background preview</p><p className="mx-auto text-sm">Check that your text remains readable.</p></SectionBackdrop>
  </div>;
}

function IconPicker({
  label,
  value,
  onChange,
  onUpload,
  allowEmpty,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload?: () => void;
  allowEmpty?: boolean;
}) {
  const Icon = value ? resolveIcon(value) : null;
  return (
    <div>
      <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-[#525252] mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e2e4e8] bg-[#f8f9fb] text-[#0d0d0d]">
          {Icon ? <Icon size={18} /> : <span className="text-[10px] text-[#9ca3af]">None</span>}
        </span>
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-[#e2e4e8] bg-[#f8f9fb] px-3 py-2 text-[.86rem] outline-none focus:border-[#E85D2A] focus:bg-white"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={allowEmpty ? 'Optional: icon name or upload URL' : 'Lucide name or /api/media/…'}
          />
          {onUpload && (
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0d0d0d] px-3.5 py-2 text-[.78rem] font-semibold text-white hover:bg-[#E85D2A] transition-colors"
            >
              <Upload size={13} /> Upload Icon
            </button>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {allowEmpty && (
          <button
            type="button"
            onClick={() => onChange('')}
            className={`rounded-lg border px-2 py-0.5 text-[.7rem] font-medium ${
              !value ? 'border-[#E85D2A] bg-[#fff8f4] text-[#0d0d0d]' : 'border-[#e2e4e8] bg-white text-[#6b7280]'
            }`}
          >
            None
          </button>
        )}
        {ICON_NAMES.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`rounded-lg border px-2 py-0.5 text-[.7rem] font-medium transition-colors ${
              value === name
                ? 'border-[#E85D2A] bg-[#fff8f4] text-[#0d0d0d]'
                : 'border-[#e2e4e8] bg-white text-[#6b7280] hover:border-[#0d0d0d]/30'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { content, status } = useSiteContent();
  const [tab, setTab] = useState<Tab>('home');
  const [activeServiceId, setActiveServiceId] = useState<string>('web-design');
  const [activePageId, setActivePageId] = useState<string>('web-design');
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

  useEffect(() => {
    api('/api/admin/session')
      .then((data) => setSession({ email: data.email }))
      .catch(() => setSession(null))
      .finally(() => setCheckedSession(true));
  }, []);

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
      setMessage({ kind: 'err', text: 'Current content could not be loaded. Use Reload from D1 to retry. Editing is unavailable until current content loads; saved site content has not changed.' });
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

  const patchServicePage = (id: string, patch: Partial<ServicePageDetails>) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            service_pages: {
              ...(prev.service_pages || DEFAULT_SERVICE_PAGES),
              [id]: {
                ...(prev.service_pages?.[id] || DEFAULT_SERVICE_PAGES[id]),
                ...patch,
                service_id: id,
              },
            },
          }
        : prev
    );
  };

  const patchHomeSections = (patch: Partial<HomeSectionsConfig>) => {
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            home_sections: { ...(prev.home_sections || DEFAULT_HOME_SECTIONS), ...patch },
          }
        : prev
    );
  };

  const saveService = async (s: ServiceRecord) => {
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/services', {
        method: 'PATCH',
        body: JSON.stringify({ ...s, extras: extras?.[s.id] || null }),
      });
      setMessage({ kind: 'ok', text: `Saved “${s.name}” (card, colour, icon, hero, visual & links).` });
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

  const saveProjects = async () => {
    if (!projects) return;
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/projects', { method: 'PUT', body: JSON.stringify({ projects }) });
      setMessage({ kind: 'ok', text: `Saved ${projects.length} live work project${projects.length === 1 ? '' : 's'}.` });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const savePartners = async () => {
    if (!partners) return false;
    setBusy(true);
    setMessage(null);
    try {
      await api('/api/admin/partners', {
        method: 'PUT',
        body: JSON.stringify({ partners }),
      });
      setMessage({ kind: 'ok', text: `Saved ${partners.length} partner${partners.length === 1 ? '' : 's'}.` });
      return true;
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
      return false;
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
    const target = uploadTarget.current;
    setBusy(true);
    setMessage(null);
    try {
      const { url } = await uploadFile(file);
      if (target === 'heroimage:background' || target === 'heroimage:foreground' || target?.startsWith('heroslide:')) {
        setSettings(prev => {
          if (!prev) return prev;
          const hero = prev.hero_design;
          const patch = target === 'heroimage:background' ? { background: { ...hero.background, background_image: url } }
            : target === 'heroimage:foreground' ? { media_image: url }
            : { backgrounds: hero.backgrounds.map(slide => slide.id === target.slice('heroslide:'.length) ? { ...slide, image: url } : slide) };
          return { ...prev, hero_design: { ...hero, ...patch } };
        });
        setMessage({ kind: 'ok', text: 'Hero image uploaded. Save hero design to apply.' });
      } else if (target === 'designimage:cta_design' || target === 'designimage:contact_hero_design') {
        const key = target.slice('designimage:'.length) as 'cta_design' | 'contact_hero_design';
        setSettings(prev => prev ? { ...prev, [key]: { ...prev[key], background_image: url } } : prev);
        setMessage({ kind: 'ok', text: 'Background uploaded. Save the section design to apply.' });
      } else if (target === 'hero') {
        patchSettings({ hero_background: url });
        setMessage({ kind: 'ok', text: `Uploaded to R2: ${url} — press Save to apply.` });
      } else if (target === 'navbar_logo') {
        patchSettings({ navbar_logo: url });
        setMessage({ kind: 'ok', text: `Uploaded logo to R2: ${url} — press Save branding to apply.` });
      } else if (target === 'manifest_icon') {
        patchSettings({ manifest_icon: url });
        setMessage({ kind: 'ok', text: `Uploaded app icon to R2: ${url} — press Save branding to apply.` });
      } else if (target === 'favicon_icon') {
        patchSettings({ favicon_icon: url });
        setMessage({ kind: 'ok', text: `Uploaded browser favicon to R2: ${url} — press Save branding to apply.` });
      } else if (target && target.startsWith('toollogo:')) {
        const [, serviceId, indexRaw] = target.split(':');
        const index = Number(indexRaw);
        setSettings((prev) => {
          if (!prev || !Number.isFinite(index)) return prev;
          const pages = prev.service_pages || DEFAULT_SERVICE_PAGES;
          const page = pages[serviceId];
          if (!page) return prev;
          return {
            ...prev,
            service_pages: {
              ...pages,
              [serviceId]: {
                ...page,
                tools_items: page.tools_items.map((t, i) => (i === index ? { ...t, logo: url } : t)),
              },
            },
          };
        });
        setMessage({ kind: 'ok', text: `Uploaded tool logo to R2: ${url} — press Save service page to apply.` });
      } else if (target && target.startsWith('service:')) {
        const id = target.slice('service:'.length);
        patchExtras(id, { hero_background: url });
        setMessage({ kind: 'ok', text: `Uploaded hero image to R2: ${url} — press Save service to apply.` });
      } else if (target && target.startsWith('visual:')) {
        const id = target.slice('visual:'.length);
        patchExtras(id, { visual_background: url });
        setMessage({ kind: 'ok', text: `Uploaded visual image to R2: ${url} — press Save service to apply.` });
      } else if (target && target.startsWith('serviceicon:')) {
        const id = target.slice('serviceicon:'.length);
        patchService(id, { icon: url });
        setMessage({ kind: 'ok', text: `Uploaded service icon to R2: ${url} — press Save service to apply.` });
      } else if (target && target.startsWith('approachicon:')) {
        const index = Number(target.slice('approachicon:'.length));
        setSettings((prev) =>
          prev && Number.isFinite(index)
            ? {
                ...prev,
                approach_items: prev.approach_items.map((item, i) => (i === index ? { ...item, icon: url } : item)),
              }
            : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded step icon to R2: ${url} — press Save How It Works to apply.` });
      } else if (target && target.startsWith('whyicon:')) {
        const index = Number(target.slice('whyicon:'.length));
        setSettings((prev) =>
          prev && Number.isFinite(index)
            ? {
                ...prev,
                why_choose_us: (prev.why_choose_us || DEFAULT_WHY_CHOOSE_US).map((item, i) =>
                  i === index ? { ...item, icon: url } : item
                ),
              }
            : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded Why Us icon to R2: ${url} — press Save Why Choose Us to apply.` });
      } else if (target && target.startsWith('paymentlogo:')) {
        const id = target.slice('paymentlogo:'.length);
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                payment_methods: (prev.payment_methods || DEFAULT_PAYMENT_METHODS).map((m) =>
                  m.id === id ? { ...m, logo: url } : m
                ),
              }
            : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded payment icon/logo to R2: ${url} — press Save Local Payments to apply.` });
      } else if (target && target.startsWith('socialicon:')) {
        const index = Number(target.slice('socialicon:'.length));
        setSettings((prev) =>
          prev && Number.isFinite(index)
            ? {
                ...prev,
                footer_socials: prev.footer_socials.map((item, i) => (i === index ? { ...item, icon: url } : item)),
              }
            : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded social icon to R2: ${url} — press Save socials to apply.` });
      } else if (target && target.startsWith('contacticon:')) {
        const index = Number(target.slice('contacticon:'.length));
        setSettings((prev) =>
          prev && Number.isFinite(index)
            ? {
                ...prev,
                contact_cards: prev.contact_cards.map((item, i) => (i === index ? { ...item, icon: url } : item)),
              }
            : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded contact icon to R2: ${url} — press Save contact cards to apply.` });
      } else if (target && target.startsWith('card:')) {
        const id = target.slice('card:'.length);
        patchService(id, { image: url });
        setMessage({ kind: 'ok', text: `Uploaded card image to R2: ${url} — press Save service to apply.` });
      } else if (target && target.startsWith('herocycle:')) {
        const index = Number(target.slice('herocycle:'.length));
        setSettings((prev) =>
          prev && Number.isFinite(index)
            ? {
                ...prev,
                hero_cycles: prev.hero_cycles.map((c, i) => (i === index ? { ...c, image: url } : c)),
              }
            : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded hero cycle image to R2: ${url} — press Save hero cycles to apply.` });
      } else if (target && target.startsWith('projectscreenshot:')) {
        const id = target.slice('projectscreenshot:'.length);
        setProjects((prev) =>
          prev
            ? prev.map((p) => (p.id === id ? { ...p, screenshot: url } : p))
            : prev
        );
        setMessage({
          kind: 'ok',
          text: `Uploaded project screenshot to R2: ${url} — press Save live work to apply.`,
        });
      } else if (target && target.startsWith('partnerlogo:')) {
        const id = target.slice('partnerlogo:'.length);
        setPartners((prev) =>
          prev ? prev.map((p) => (p.id === id ? { ...p, logo: url } : p)) : prev
        );
        setMessage({ kind: 'ok', text: `Uploaded partner logo to R2: ${url} — press Save partners to apply.` });
      }
    } catch (err: any) {
      setMessage({ kind: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const reload = async () => {
    setMessage({ kind: 'info', text: 'Reloading from D1…' });
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
      announceSiteContentChange();
      setMessage({ kind: 'ok', text: 'Reloaded latest site content from D1.' });
    } catch (e: any) {
      setMessage({ kind: 'err', text: e.message });
    }
  };

  const navGroups: {
    group: string;
    items: { id: Tab; label: string; badge?: string | number; icon: any }[];
  }[] = [
    {
      group: 'Homepage & Design',
      items: [
        { id: 'hero', label: 'Home Hero Design', icon: Sparkles },
        { id: 'home', label: 'Homepage Sections', badge: settings?.hero_cycles?.length || 6, icon: Sparkles },
        { id: 'payments', label: 'Local Payments', badge: settings?.payment_methods?.length ?? 5, icon: CreditCard },
        { id: 'partners', label: 'Trusted Partners', badge: partners?.length ?? 4, icon: Handshake },
        { id: 'process', label: 'How It Works & Why Us', icon: Layers },
      ],
    },
    {
      group: 'Services & Work',
      items: [
        { id: 'services', label: 'Services (6 Cards)', badge: services?.length || 6, icon: LayoutGrid },
        { id: 'servicepages', label: 'Service Page Content', badge: 6, icon: FileText },
        { id: 'projects', label: 'Live Work (Projects)', badge: projects?.length || 2, icon: FolderKanban },
        { id: 'pricing', label: 'Pricing & Price Ranges', badge: pricing?.length || 6, icon: Tag },
        { id: 'faq', label: 'FAQs (Home & Page)', icon: HelpCircle },
      ],
    },
    {
      group: 'Identity & Contact',
      items: [{ id: 'brand', label: 'Brand, Icons & Contact', icon: Palette }],
    },
  ];

  const homeSections = settings?.home_sections || DEFAULT_HOME_SECTIONS;

  return (
    <main className="min-h-screen bg-[#f4f5f7] pb-24 text-[#0d0d0d]">
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml,image/x-icon,.svg,.ico"
        className="hidden"
        onChange={onFile}
      />

      {/* Top Admin Header */}
      <section className="border-b border-[#e5e7eb] bg-[#0d0d0d] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E85D2A]/20 px-3 py-1 text-[.72rem] font-semibold uppercase tracking-wider text-[#E85D2A]">
                Opus Zimbabwe CMS
              </span>
              {checkedSession && session && (
                <span className="inline-flex items-center gap-1 text-[.78rem] text-emerald-400">
                  <CheckCircle2 size={14} /> {session.email}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Content admin</h1>
            <p className="mt-1 text-[.85rem] text-white/70">
              Full control over hero cycles, white &amp; warm sections, local payments, partner backgrounds, live work, icons, services and branding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[.82rem] font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw size={14} /> Reload from D1
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white transition hover:brightness-110"
            >
              View Live Site <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        {message && (
          <div className="mb-5">
            <Banner kind={message.kind}>{message.text}</Banner>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr] items-start">
          {/* Organised Sidebar Navigation */}
          <aside className="rounded-[24px] border border-[#e8eaed] bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.03)] lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto">
            <div className="space-y-5">
              {navGroups.map((group) => (
                <div key={group.group}>
                  <p className="px-3 text-[.68rem] font-bold uppercase tracking-[.14em] text-[#6b7280]">
                    {group.group}
                  </p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = tab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setTab(item.id)}
                        aria-current={active ? 'page' : undefined}
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[.85rem] font-semibold transition-all ${
                            active
                              ? 'bg-[#0d0d0d] text-white shadow-sm'
                              : 'text-[#0d0d0d]/80 hover:bg-[#fff8f4] hover:text-[#E85D2A]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon size={16} className={active ? 'text-[#E85D2A]' : 'text-[#6b7280]'} />
                            {item.label}
                          </span>
                          {item.badge !== undefined && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[.7rem] ${
                                active ? 'bg-white/15 text-white' : 'bg-[#f3f4f6] text-[#525252]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Editor Area */}
          <div className="space-y-6 min-w-0">
            {/* TAB 1: HERO & HOMEPAGE SECTIONS */}
            {tab === 'hero' && settings && <>
              <HeroDesignEditor value={settings.hero_design} onChange={value => patchSettings({ hero_design: value })} onUpload={pickFile} onSave={() => saveSettings(['hero_design'], 'Home hero design saved.')} busy={busy} sections={homeSections} cycles={settings.hero_cycles} />
              <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Original service carousel content</summary><p className="my-4 text-sm text-black/60">Used only in the Services rotation mode. Background-only rotation is managed in the hero editor above.</p>
                <Card
                  title="Hero Rotating Cycles"
                  hint="Each cycle rotates in sync: Left question + Learn More URL, and Right transparent image (sits directly on the body with no container shape) + solution text."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['hero_cycles'], 'Hero rotating cycles saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save hero cycles
                    </button>
                  }
                >
                  <ListEditor<HeroCycle>
                  disabled={busy}
                    items={settings.hero_cycles}
                    onChange={(next) => patchSettings({ hero_cycles: next })}
                    blank={() => ({
                      question: 'New rotating question?',
                      solution: 'Solution text shown beneath the hero visual.',
                      image: '/images/hero-website-design.png',
                      href: '/services/web-design/',
                    })}
                    addLabel="Add hero cycle"
                    emptyLabel="No hero cycles yet."
                    render={(cycle, patchCycle, removeCycle, index) => (
                      <div key={index} className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-[#0d0d0d] px-3 py-1 text-[.72rem] font-bold uppercase tracking-wider text-white">
                            Cycle {index + 1}
                          </span>
                          {settings.hero_cycles.length > 1 && (
                            <button
                              type="button"
                              onClick={removeCycle}
                              className="inline-flex items-center gap-1 text-[.75rem] font-semibold text-red-600 hover:underline"
                            >
                              <Trash2 size={13} /> Remove cycle
                            </button>
                          )}
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <Field
                            label="Rotating Question (Left Column)"
                            value={cycle.question}
                            onChange={(v) => patchCycle({ question: v })}
                          />
                          <Field
                            label="Learn More Destination URL"
                            value={cycle.href}
                            onChange={(v) => patchCycle({ href: v })}
                            hint="e.g. /services/web-design/"
                          />
                          <Field
                            label="Solution Text (Right Column below image)"
                            value={cycle.solution}
                            onChange={(v) => patchCycle({ solution: v })}
                            rows={3}
                          />
                          <ImageField
                            label="Right Column Image (No background shape)"
                            value={cycle.image}
                            onChange={(v) => patchCycle({ image: v })}
                            onUpload={() => pickFile(`herocycle:${index}`)}
                            hint="Transparent PNG/WebP/SVG sits directly on the page body."
                            previewBg={homeSections.hero_bg || '#f8f8f6'}
                          />
                        </div>
                      </div>
                    )}
                  />
                </Card>
              </details></>}

            {tab === 'home' && settings && (
              <>
                <Card
                  title="Homepage Sections & Final CTA"
                  hint="Edit section headings, backgrounds and the final call to action. Hero layout, copy and carousel controls are together in Home Hero Design."
                  action={
                    <button
                      disabled={busy}
                      onClick={() =>
                        saveSettings(['home_sections', 'cta_design'], 'Homepage sections and CTA design saved.')
                      }
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save page sections
                    </button>
                  }
                >
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        1. Hero &amp; Payment Strip Background
                      </p>
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.hero_bg}
                        onChange={(v) => patchHomeSections({ hero_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        2. Services Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.services_heading}
                        onChange={(v) => patchHomeSections({ services_heading: v })}
                      />
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.services_bg}
                        onChange={(v) => patchHomeSections({ services_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        3. Partners Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.partners_heading}
                        onChange={(v) => patchHomeSections({ partners_heading: v })}
                      />
                      <Field
                        label="Optional Subheading"
                        value={homeSections.partners_subheading}
                        onChange={(v) => patchHomeSections({ partners_subheading: v })}
                        placeholder="Leave blank for heading only"
                      />
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.partners_bg}
                        onChange={(v) => patchHomeSections({ partners_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        4. How It Works Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.how_it_works_heading}
                        onChange={(v) => patchHomeSections({ how_it_works_heading: v })}
                      />
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.how_it_works_bg}
                        onChange={(v) => patchHomeSections({ how_it_works_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        5. Live Work (Projects) Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.projects_heading}
                        onChange={(v) => patchHomeSections({ projects_heading: v })}
                      />
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.projects_bg}
                        onChange={(v) => patchHomeSections({ projects_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        6. Why Choose Us Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.why_heading}
                        onChange={(v) => patchHomeSections({ why_heading: v })}
                      />
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.why_bg}
                        onChange={(v) => patchHomeSections({ why_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        7. FAQ Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.faq_heading}
                        onChange={(v) => patchHomeSections({ faq_heading: v })}
                      />
                      <ColorSwatchField
                        label="Section Background"
                        value={homeSections.faq_bg}
                        onChange={(v) => patchHomeSections({ faq_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                    </div>

                    <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfc] p-4 space-y-3">
                      <p className="text-[.75rem] font-bold uppercase tracking-wider text-[#0d0d0d]">
                        8. Final CTA Section
                      </p>
                      <Field
                        label="Heading"
                        value={homeSections.cta_heading}
                        onChange={(v) => patchHomeSections({ cta_heading: v })}
                      />
                      <Field
                        label="Subheading"
                        value={homeSections.cta_subheading}
                        onChange={(v) => patchHomeSections({ cta_subheading: v })}
                      />
                      <ColorSwatchField
                        label="Outer Section Background"
                        value={homeSections.cta_bg}
                        onChange={(v) => patchHomeSections({ cta_bg: v })}
                        presets={SECTION_BG_PRESETS}
                      />
                      <SectionDesignEditor value={settings.cta_design} onChange={v => patchSettings({ cta_design: v })} onUpload={() => pickFile('designimage:cta_design')} />
                    </div>
                  </div>
                </Card>


              </>
            )}

            {/* TAB 2: LOCAL PAYMENTS */}
            {tab === 'payments' && settings && (
              <Card
                title="Local Payments Trust Strip"
                hint="Displayed immediately below the hero. Upload payment icons/logos, add new local payment methods, or toggle visibility."
                action={
                  <button
                    disabled={busy}
                    onClick={() =>
                      saveSettings(
                        ['payment_methods', 'home_sections'],
                        'Local payment methods and label saved.'
                      )
                    }
                    className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Save local payments
                  </button>
                }
              >
                <div className="mb-6 max-w-md">
                  <Field
                    label="Payment Strip Label"
                    value={homeSections.payment_label}
                    onChange={(v) => patchHomeSections({ payment_label: v })}
                    hint="Default: We accept local payments"
                  />
                </div>

                <ListEditor<PaymentMethod>
                  items={settings.payment_methods || DEFAULT_PAYMENT_METHODS}
                  onChange={(next) => patchSettings({ payment_methods: next })}
                  blank={() => ({
                    id: `pm_${crypto.randomUUID()}`,
                    name: 'New Payment Method',
                    logo: '/images/ecocash-logo.png',
                    visible: true,
                  })}
                  addLabel="Add local payment method"
                  emptyLabel="No payment methods configured."
                  render={(item, patch, remove, idx) => (
                    <div key={item.id || idx} className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4">
                      <div className="grid gap-4 md:grid-cols-[1fr_1.5fr_auto] items-start">
                        <Field
                          label="Payment Method Name"
                          value={item.name}
                          onChange={(v) => patch({ name: v })}
                        />
                        <ImageField
                          label="Payment Logo / Icon"
                          value={item.logo}
                          onChange={(v) => patch({ logo: v })}
                          onUpload={() => pickFile(`paymentlogo:${item.id}`)}
                          hint="Upload SVG, PNG, WebP or ICO."
                        />
                        <div className="flex flex-col items-end gap-3 pt-6">
                          <label className="flex items-center gap-2 text-[.82rem] font-semibold text-[#0d0d0d]">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(e) => patch({ visible: e.target.checked })}
                            />
                            Visible
                          </label>
                          <button
                            type="button"
                            onClick={remove}
                            className="inline-flex items-center gap-1 text-[.75rem] font-semibold text-red-600 hover:underline"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </Card>
            )}

            {/* TAB 3: TRUSTED PARTNERS */}
            {tab === 'partners' && partners && (
              <Card
                title="Partners Who Trust Us"
                hint="Manage partner logos, add more partners, and set each partner card's background colour (e.g. Black #000000 for Killing Giants, White #ffffff for light logos)."
                action={
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={ async () => {
                        if (!(await savePartners())) return;
                        await saveSettings(['home_sections'], 'Partners and section heading saved.');
                      }}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save partners
                    </button>
                  </div>
                }
              >
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <Field
                    label="Section Heading"
                    value={homeSections.partners_heading}
                    onChange={(v) => patchHomeSections({ partners_heading: v })}
                    hint="Default: Partners who trust us"
                  />
                  <Field
                    label="Optional Subheading"
                    value={homeSections.partners_subheading}
                    onChange={(v) => patchHomeSections({ partners_subheading: v })}
                    placeholder="Leave empty for clean heading-only look"
                  />
                </div>

                <ListEditor<PartnerRecord>
                  items={partners}
                  onChange={setPartners}
                  blank={() => ({
                    id: `pa_${crypto.randomUUID()}`,
                    name: 'New Partner',
                    logo: '/images/partner-great-couples.png',
                    url: '',
                    bg_color: '#ffffff',
                    order_index: partners.length,
                    visible: true,
                  })}
                  addLabel="Add partner logo"
                  emptyLabel="No partners yet."
                  render={(item, patch, remove, idx) => (
                    <div key={item.id || idx} className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-[#0d0d0d]">{item.name || `Partner ${idx + 1}`}</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-[.8rem] font-semibold text-[#0d0d0d]">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(e) => patch({ visible: e.target.checked })}
                            />
                            Visible
                          </label>
                          <button
                            type="button"
                            onClick={remove}
                            className="inline-flex items-center gap-1 text-[.75rem] font-semibold text-red-600 hover:underline"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Field
                          label="Partner Name"
                          value={item.name}
                          onChange={(v) => patch({ name: v })}
                        />
                        <Field
                          label="Website Link (Optional)"
                          value={item.url}
                          onChange={(v) => patch({ url: v })}
                          hint="https://… — leave empty for unlinked logo"
                        />
                        <ImageField
                          label="Partner Logo"
                          value={item.logo}
                          onChange={(v) => patch({ logo: v })}
                          onUpload={() => pickFile(`partnerlogo:${item.id}`)}
                          previewBg={item.bg_color || '#ffffff'}
                          hint="Preview above shows the logo on its configured tile background colour."
                        />
                        <ColorSwatchField
                          label="Partner Tile Background Colour"
                          value={item.bg_color || '#ffffff'}
                          onChange={(v) => patch({ bg_color: v })}
                          presets={PARTNER_BG_PRESETS}
                          hint="Use Black (#000000) for white-text logos like Killing Giants."
                        />
                      </div>
                    </div>
                  )}
                />
              </Card>
            )}

            {/* TAB 4: SERVICES (6 CARDS & SERVICE PAGES) */}
            {tab === 'services' && services && (
              <div className="space-y-5">
                {/* Quick service selector pills so the page stays super clean and organised */}
                <div className="rounded-[20px] border border-[#e8eaed] bg-white p-4 shadow-sm">
                  <p className="text-[.72rem] font-bold uppercase tracking-wider text-[#6b7280] mb-2.5">
                    Select a service to edit ({services.length} services)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {services.map((s) => {
                      const active = activeServiceId === s.id;
                      const Icon = resolveIcon(s.icon);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setActiveServiceId(s.id)}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[.82rem] font-semibold transition-all ${
                            active
                              ? 'bg-[#0d0d0d] text-white shadow-sm'
                              : 'border border-[#e2e4e8] bg-[#f8f9fb] text-[#0d0d0d] hover:border-[#E85D2A]'
                          }`}
                        >
                          <Icon size={15} />
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {services
                  .filter((s) => s.id === activeServiceId || !services.some((x) => x.id === activeServiceId))
                  .map((s) => {
                    const extra: ServiceExtras = extras?.[s.id] || { ...staticExtras[s.id], service_id: s.id };
                    const isGradient = extra.hero_background_kind === 'gradient';
                    return (
                      <Card
                        key={s.id}
                        title={s.name}
                        hint={`Homepage card + /services/${s.slug} page settings`}
                        action={
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-[.82rem] font-semibold text-[#0d0d0d]">
                              <input
                                type="checkbox"
                                checked={s.visible}
                                onChange={(e) => patchService(s.id, { visible: e.target.checked })}
                              />
                              Visible on site
                            </label>
                            <button
                              disabled={busy}
                              onClick={() => saveService(s)}
                              className="rounded-full bg-[#E85D2A] px-6 py-2 text-[.84rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                            >
                              Save {s.name}
                            </button>
                          </div>
                        }
                      >
                        <div className="grid gap-5 md:grid-cols-2">
                          <Field label="Service Name" value={s.name} onChange={(v) => patchService(s.id, { name: v })} />
                          <Field label="Card Tagline Pill" value={s.tagline} onChange={(v) => patchService(s.id, { tagline: v })} />
                          <Field
                            label="Homepage 3×2 Card Description"
                            value={s.description}
                            onChange={(v) => patchService(s.id, { description: v })}
                            rows={4}
                          />
                          <Field
                            label="/services Page Description"
                            value={s.page_description}
                            onChange={(v) => patchService(s.id, { page_description: v })}
                            rows={4}
                          />
                          <Field
                            label="Feature Chips (one per line)"
                            value={s.items.join('\n')}
                            onChange={(v) => patchService(s.id, { items: lines(v) })}
                            rows={5}
                          />

                          <div className="space-y-4">
                            <ImageField
                              label="Card Image"
                              value={s.image}
                              onChange={(v) => patchService(s.id, { image: v })}
                              onUpload={() => pickFile(`card:${s.id}`)}
                            />
                            <IconPicker
                              label="Service Icon (Lucide name or Upload custom icon)"
                              value={s.icon}
                              onChange={(v) => patchService(s.id, { icon: v })}
                              onUpload={() => pickFile(`serviceicon:${s.id}`)}
                            />
                            <ColorSwatchField
                              label="Card Bottom Text Section Background Colour"
                              value={s.card_bg_color || '#ffffff'}
                              onChange={(v) => patchService(s.id, { card_bg_color: v })}
                              presets={CARD_BG_PRESETS}
                              hint="Independently controls the bottom text section background of this homepage card."
                            />
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-5">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#0d0d0d]">
                            Service Page Hero (/services/{s.slug})
                          </p>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <Field
                              label="Eyebrow"
                              value={extra.hero_eyebrow}
                              onChange={(v) => patchExtras(s.id, { hero_eyebrow: v })}
                            />
                            <Field
                              label="CTA Button Label"
                              value={extra.hero_cta}
                              onChange={(v) => patchExtras(s.id, { hero_cta: v })}
                            />
                          </div>
                          <div className="mt-4 grid gap-4">
                            <Field
                              label="Hero Headline"
                              value={extra.hero_headline}
                              onChange={(v) => patchExtras(s.id, { hero_headline: v })}
                              rows={2}
                            />
                            <Field
                              label="Hero Intro"
                              value={extra.hero_intro}
                              onChange={(v) => patchExtras(s.id, { hero_intro: v })}
                              rows={3}
                            />
                          </div>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                              <span className="block text-[.72rem] font-semibold uppercase tracking-widest text-[#525252] mb-1.5">
                                Hero Background Kind
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => patchExtras(s.id, { hero_background_kind: 'image' })}
                                  className={`flex-1 rounded-xl px-3 py-2 text-[.82rem] font-semibold border ${
                                    !isGradient
                                      ? 'border-[#E85D2A] bg-white text-[#0d0d0d]'
                                      : 'border-[#e2e4e8] bg-[#f8f9fb] text-[#525252]'
                                  }`}
                                >
                                  Image
                                </button>
                                <button
                                  type="button"
                                  onClick={() => patchExtras(s.id, { hero_background_kind: 'gradient' })}
                                  className={`flex-1 rounded-xl px-3 py-2 text-[.82rem] font-semibold border ${
                                    isGradient
                                      ? 'border-[#E85D2A] bg-white text-[#0d0d0d]'
                                      : 'border-[#e2e4e8] bg-[#f8f9fb] text-[#525252]'
                                  }`}
                                >
                                  Gradient
                                </button>
                              </div>
                              <div className="mt-3">
                                {isGradient ? (
                                  <GradientBuilder
                                    value={extra.hero_gradient}
                                    onChange={(v) => patchExtras(s.id, { hero_gradient: v })}
                                  />
                                ) : (
                                  <ImageField
                                    label="Hero Image"
                                    value={extra.hero_background}
                                    onChange={(v) => patchExtras(s.id, { hero_background: v })}
                                    onUpload={() => pickFile(`service:${s.id}`)}
                                  />
                                )}
                              </div>
                            </div>
                            <div>
                              <ImageField
                                label="Section 2 Supporting Image (optional)"
                                value={extra.visual_background}
                                onChange={(v) => patchExtras(s.id, { visual_background: v })}
                                onUpload={() => pickFile(`visual:${s.id}`)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <button
                            disabled={busy}
                            onClick={() => saveService(s)}
                            className="rounded-full bg-[#E85D2A] px-7 py-2.5 text-[.85rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                          >
                            Save {s.name}
                          </button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* TAB 5: LIVE WORK (PROJECTS) */}
            {tab === 'projects' && projects && (
              <Card
                title="Live Work (Client Projects)"
                hint="Add as many live projects as you want. Every visible active project with a live URL appears on the homepage and /projects. Upload a screenshot of each project — it is shown on both pages."
                action={
                  <button
                    disabled={busy}
                    onClick={saveProjects}
                    className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Save live work
                  </button>
                }
              >
                <ListEditor<ProjectRecord>
                  items={projects}
                  onChange={setProjects}
                  blank={() => ({
                    id: `pr_${Date.now().toString(36)}`,
                    name: 'New Live Project',
                    url: 'https://',
                    tag: 'Website Design & Development',
                    location: 'Harare, Zimbabwe',
                    description: 'Describe what was built for this client.',
                    screenshot: '',
                    status: 'active',
                    order_index: projects.length,
                    visible: true,
                  })}
                  addLabel="Add live project"
                  emptyLabel="No live projects yet."
                  render={(item, patch, remove, idx) => (
                    <div key={item.id || idx} className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-[#0d0d0d]">{item.name || `Project ${idx + 1}`}</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-[.8rem] font-semibold text-[#0d0d0d]">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(e) => patch({ visible: e.target.checked })}
                            />
                            Visible
                          </label>
                          <button
                            type="button"
                            onClick={remove}
                            className="inline-flex items-center gap-1 text-[.75rem] font-semibold text-red-600 hover:underline"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Client / Project Name" value={item.name} onChange={(v) => patch({ name: v })} />
                        <Field
                          label="Live Website URL (https://…)"
                          value={item.url}
                          onChange={(v) => patch({ url: v })}
                        />
                        <Field label="Service Tag" value={item.tag} onChange={(v) => patch({ tag: v })} />
                        <Field label="Location" value={item.location} onChange={(v) => patch({ location: v })} />
                      </div>
                      <div className="mt-3 grid gap-4 md:grid-cols-[260px_1fr]">
                        <div>
                          <ImageField
                            label="Project Screenshot"
                            value={item.screenshot || ''}
                            onChange={(v) => patch({ screenshot: v })}
                            onUpload={() => pickFile(`projectscreenshot:${item.id}`)}
                            hint="Upload a screenshot of the live site (PNG, JPG, WebP, GIF, AVIF, SVG)."
                            previewBg="#f8f8f6"
                          />
                        </div>
                        <Field
                          label="Project Description"
                          value={item.description}
                          onChange={(v) => patch({ description: v })}
                          rows={5}
                        />
                      </div>
                    </div>
                  )}
                />
              </Card>
            )}

            {/* TAB 6: HOW IT WORKS & WHY CHOOSE US */}
            {tab === 'process' && settings && (
              <>
                <Card
                  title="How It Works (Steps)"
                  hint="Manage the steps shown in the How It Works section on the homepage. You can also upload custom icons for each step."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['approach_items'], 'How It Works steps saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save How It Works
                    </button>
                  }
                >
                  <ListEditor<ApproachItem>
                  disabled={busy}
                    items={settings.approach_items}
                    onChange={(next) => patchSettings({ approach_items: next })}
                    blank={() => ({ title: 'New Step', body: 'Step description.', icon: 'Globe' })}
                    addLabel="Add step"
                    render={(item, patch, remove, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 grid gap-4 md:grid-cols-[1fr_1.3fr]"
                      >
                        <div className="space-y-3">
                          <Field label="Step Title" value={item.title} onChange={(v) => patch({ title: v })} />
                          <IconPicker
                            label="Step Icon (Upload custom icon or choose preset)"
                            value={item.icon}
                            onChange={(v) => patch({ icon: v })}
                            onUpload={() => pickFile(`approachicon:${idx}`)}
                          />
                        </div>
                        <div>
                          <Field
                            label="Step Description"
                            value={item.body}
                            onChange={(v) => patch({ body: v })}
                            rows={3}
                          />
                          <button
                            type="button"
                            onClick={remove}
                            className="mt-2 inline-flex items-center gap-1 text-[.75rem] font-semibold text-red-600 hover:underline"
                          >
                            <Trash2 size={13} /> Remove step
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </Card>

                <Card
                  title="Why Choose Us (Inverted-Corner Reason Cards)"
                  hint="Manage the reason cards in the Why Choose Us section. Upload an optional custom icon for any reason card."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['why_choose_us'], 'Why Choose Us reasons saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save Why Choose Us
                    </button>
                  }
                >
                  <ListEditor<WhyItem>
                  disabled={busy}
                    items={settings.why_choose_us || DEFAULT_WHY_CHOOSE_US}
                    onChange={(next) => patchSettings({ why_choose_us: next })}
                    blank={() => ({ title: 'New Reason', body: 'Reason description.', icon: '' })}
                    addLabel="Add reason card"
                    render={(item, patch, remove, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 grid gap-4 md:grid-cols-[1fr_1.3fr]"
                      >
                        <div className="space-y-3">
                          <Field label="Reason Title" value={item.title} onChange={(v) => patch({ title: v })} />
                          <IconPicker
                            label="Optional Card Icon (Upload or choose)"
                            value={item.icon || ''}
                            onChange={(v) => patch({ icon: v })}
                            onUpload={() => pickFile(`whyicon:${idx}`)}
                            allowEmpty
                          />
                        </div>
                        <div>
                          <Field
                            label="Reason Description"
                            value={item.body}
                            onChange={(v) => patch({ body: v })}
                            rows={3}
                          />
                          <button
                            type="button"
                            onClick={remove}
                            className="mt-2 inline-flex items-center gap-1 text-[.75rem] font-semibold text-red-600 hover:underline"
                          >
                            <Trash2 size={13} /> Remove reason
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </Card>
              </>
            )}

            {/* TAB 7: PRICING PACKAGES */}
            {tab === 'pricing' && pricing && (
              <Card
                title="Website Pricing Packages & Price Ranges"
                hint="Shown on /services/web-design. “Price Range” is the big headline on each card (e.g. $30 – $59.99); “What it covers” is the description under it."
                action={
                  <button
                    disabled={busy}
                    onClick={savePricing}
                    className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    Save pricing
                  </button>
                }
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {pricing.map((p, i) => (
                    <div key={p.id || i} className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2 text-[.78rem] font-semibold text-[#0d0d0d]">
                          <input
                            type="checkbox"
                            checked={p.visible}
                            onChange={(e) =>
                              setPricing((prev) =>
                                prev!.map((x, j) => (j === i ? { ...x, visible: e.target.checked } : x))
                              )
                            }
                          />
                          Visible
                        </label>
                        <button
                          type="button"
                          onClick={() => setPricing((prev) => prev!.filter((_, j) => j !== i))}
                          className="text-[.75rem] font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-3">
                        <Field
                          label="Plan Name"
                          value={p.name}
                          onChange={(v) =>
                            setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, name: v } : x)))
                          }
                        />
                        <Field
                          label="Price Range (card headline)"
                          value={p.monthly_price}
                          onChange={(v) =>
                            setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, monthly_price: v } : x)))
                          }
                          placeholder="$30 – $59.99"
                          hint="e.g. $30 – $59.99, Starting from $100, Custom quote"
                        />
                        <Field
                          label="What it covers (card description)"
                          value={p.yearly_price}
                          onChange={(v) =>
                            setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, yearly_price: v } : x)))
                          }
                          placeholder="Entry website with hosting from $10/month"
                          rows={2}
                          hint="Shown directly under the price range on the card."
                        />
                        <Field
                          label="Features (one per line)"
                          value={p.features.join('\n')}
                          onChange={(v) =>
                            setPricing((prev) => prev!.map((x, j) => (j === i ? { ...x, features: lines(v) } : x)))
                          }
                          rows={5}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPricing((prev) =>
                      prev
                        ? [
                            ...prev,
                            {
                              id: '',
                              name: 'New Plan',
                              monthly_price: '$0 – $0',
                              yearly_price: 'Describe what this plan covers',
                              features: ['Feature one'],
                              order_index: prev.length,
                              visible: true,
                            },
                          ]
                        : prev
                    )
                  }
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#e2e4e8] bg-white px-4 py-2 text-[.8rem] font-semibold text-[#0d0d0d] hover:border-[#E85D2A]"
                >
                  <Plus size={15} /> Add pricing plan
                </button>
              </Card>
            )}

            {/* TAB: INDIVIDUAL SERVICE PAGE CONTENT */}
            {tab === 'servicepages' && settings && (
              <>
                <Card
                  title="Individual Service Pages — Full Content"
                  hint="Every section of each service page: the problem, what we build, price ranges, process, tools logos and the WhatsApp CTA. Changes apply to the matching /services/… page."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['service_pages'], 'Service page content saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save service page
                    </button>
                  }
                >
                  <div className="mb-5 flex flex-wrap gap-2">
                    {SERVICE_PAGE_ORDER.map((id) => {
                      const page = settings.service_pages?.[id] || DEFAULT_SERVICE_PAGES[id];
                      const label = staticContent.services.find((s) => s.id === id)?.name || id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActivePageId(id)}
                          className={`rounded-full border px-4 py-2 text-[.8rem] font-semibold transition-colors ${
                            activePageId === id
                              ? 'border-[#E85D2A] bg-[#E85D2A] text-white'
                              : 'border-[#e2e4e8] bg-white text-[#0d0d0d] hover:border-[#E85D2A]/50'
                          }`}
                        >
                          {label}
                          {page?.price_range ? (
                            <span
                              className={`ml-2 text-[.7rem] font-medium ${
                                activePageId === id ? 'text-white/80' : 'text-[#6b7280]'
                              }`}
                            >
                              {page.price_range}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {(() => {
                    const page =
                      settings.service_pages?.[activePageId] || DEFAULT_SERVICE_PAGES[activePageId];
                    if (!page) return null;
                    const isDomains = activePageId === 'domains-hosting';
                    const patch = (p: Partial<ServicePageDetails>) => patchServicePage(activePageId, p);
                    return (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 space-y-3">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#525252]">
                            Section 1 — The problem
                          </p>
                          <Field label="Problem paragraph" value={page.problem_text} onChange={(v) => patch({ problem_text: v })} rows={4} />
                        </div>

                        <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 space-y-3">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#525252]">
                            Section 2 — What we build / design / provide / integrate
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Section heading" value={page.what_heading} onChange={(v) => patch({ what_heading: v })} />
                            <Field label="Intro line (optional)" value={page.what_intro} onChange={(v) => patch({ what_intro: v })} />
                          </div>
                          <div className="space-y-3">
                            {page.what_items.map((item, idx) => (
                              <div key={idx} className="rounded-xl border border-[#e8eaed] bg-white p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[.72rem] font-semibold uppercase tracking-wider text-[#6b7280]">
                                    Item {idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      patch({ what_items: page.what_items.filter((_, j) => j !== idx) })
                                    }
                                    className="text-[.72rem] font-semibold text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <Field
                                  label="Title"
                                  value={item.title}
                                  onChange={(v) =>
                                    patch({
                                      what_items: page.what_items.map((x, j) => (j === idx ? { ...x, title: v } : x)),
                                    })
                                  }
                                />
                                <Field
                                  label="Description"
                                  value={item.body}
                                  onChange={(v) =>
                                    patch({
                                      what_items: page.what_items.map((x, j) => (j === idx ? { ...x, body: v } : x)),
                                    })
                                  }
                                  rows={2}
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => patch({ what_items: [...page.what_items, { title: 'New item', body: '' }] })}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e4e8] bg-white px-4 py-2 text-[.78rem] font-semibold hover:border-[#E85D2A]"
                          >
                            <Plus size={14} /> Add item
                          </button>
                        </div>

                        <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 space-y-3">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#525252]">
                            Section 3 — Pricing & price ranges
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field
                              label="Price range (big headline on the card)"
                              value={page.price_range}
                              onChange={(v) => patch({ price_range: v })}
                              hint="e.g. $30 – $1,000+, Starting from $100"
                            />
                            <Field label="Price summary" value={page.price_summary} onChange={(v) => patch({ price_summary: v })} />
                          </div>
                          <Field label="Price note" value={page.price_note} onChange={(v) => patch({ price_note: v })} rows={2} />
                          {isDomains && (
                            <>
                              <div className="grid gap-3 md:grid-cols-2">
                                <Field
                                  label="Web hosting price"
                                  value={page.hosting_price || ''}
                                  onChange={(v) => patch({ hosting_price: v })}
                                />
                              </div>
                              <div className="rounded-xl border border-[#e8eaed] bg-white p-3 space-y-2">
                                <p className="text-[.72rem] font-semibold uppercase tracking-wider text-[#6b7280]">
                                  Domain extensions table
                                </p>
                                {(page.domain_prices || []).map((d, idx) => (
                                  <div key={idx} className="grid gap-2 md:grid-cols-4">
                                    <Field
                                      label="Extension"
                                      value={d.extension}
                                      onChange={(v) =>
                                        patch({
                                          domain_prices: (page.domain_prices || []).map((x, j) =>
                                            j === idx ? { ...x, extension: v } : x
                                          ),
                                        })
                                      }
                                    />
                                    <Field
                                      label="Price"
                                      value={d.price}
                                      onChange={(v) =>
                                        patch({
                                          domain_prices: (page.domain_prices || []).map((x, j) =>
                                            j === idx ? { ...x, price: v } : x
                                          ),
                                        })
                                      }
                                    />
                                    <Field
                                      label="Registration time"
                                      value={d.registration_time}
                                      onChange={(v) =>
                                        patch({
                                          domain_prices: (page.domain_prices || []).map((x, j) =>
                                            j === idx ? { ...x, registration_time: v } : x
                                          ),
                                        })
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        patch({ domain_prices: (page.domain_prices || []).filter((_, j) => j !== idx) })
                                      }
                                      className="self-end text-[.72rem] font-semibold text-red-600 hover:underline text-left pb-2"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() =>
                                    patch({
                                      domain_prices: [
                                        ...(page.domain_prices || []),
                                        { extension: '.co.zw', price: '$5/year', registration_time: 'Within 24 hours' },
                                      ],
                                    })
                                  }
                                  className="text-[.75rem] font-semibold text-[#E85D2A] hover:underline"
                                >
                                  + Add domain extension
                                </button>
                              </div>
                              <div className="rounded-xl border border-[#e8eaed] bg-white p-3 space-y-2">
                                <p className="text-[.72rem] font-semibold uppercase tracking-wider text-[#6b7280]">
                                  Business email plans
                                </p>
                                {(page.email_plans || []).map((plan, idx) => (
                                  <div key={idx} className="grid gap-2 md:grid-cols-3">
                                    <Field
                                      label="Plan"
                                      value={plan.plan}
                                      onChange={(v) =>
                                        patch({
                                          email_plans: (page.email_plans || []).map((x, j) =>
                                            j === idx ? { ...x, plan: v } : x
                                          ),
                                        })
                                      }
                                    />
                                    <Field
                                      label="Price"
                                      value={plan.price}
                                      onChange={(v) =>
                                        patch({
                                          email_plans: (page.email_plans || []).map((x, j) =>
                                            j === idx ? { ...x, price: v } : x
                                          ),
                                        })
                                      }
                                    />
                                    <div className="flex gap-2">
                                      <Field
                                        label="Mailboxes"
                                        value={plan.mailboxes}
                                        onChange={(v) =>
                                          patch({
                                            email_plans: (page.email_plans || []).map((x, j) =>
                                              j === idx ? { ...x, mailboxes: v } : x
                                            ),
                                          })
                                        }
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          patch({ email_plans: (page.email_plans || []).filter((_, j) => j !== idx) })
                                        }
                                        className="self-end text-[.72rem] font-semibold text-red-600 hover:underline pb-2"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() =>
                                    patch({
                                      email_plans: [
                                        ...(page.email_plans || []),
                                        { plan: 'Essential', price: '$20/month', mailboxes: 'Up to 5 mailboxes' },
                                      ],
                                    })
                                  }
                                  className="text-[.75rem] font-semibold text-[#E85D2A] hover:underline"
                                >
                                  + Add email plan
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 space-y-3">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#525252]">
                            Section 4 — Process
                          </p>
                          {page.process_steps.map((step, idx) => (
                            <div key={idx} className="rounded-xl border border-[#e8eaed] bg-white p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[.72rem] font-semibold uppercase tracking-wider text-[#6b7280]">
                                  Step {idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    patch({ process_steps: page.process_steps.filter((_, j) => j !== idx) })
                                  }
                                  className="text-[.72rem] font-semibold text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                              <Field
                                label="Step title"
                                value={step.title}
                                onChange={(v) =>
                                  patch({
                                    process_steps: page.process_steps.map((x, j) =>
                                      j === idx ? { ...x, title: v } : x
                                    ),
                                  })
                                }
                              />
                              <Field
                                label="Step body"
                                value={step.body}
                                onChange={(v) =>
                                  patch({
                                    process_steps: page.process_steps.map((x, j) =>
                                      j === idx ? { ...x, body: v } : x
                                    ),
                                  })
                                }
                                rows={2}
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              patch({ process_steps: [...page.process_steps, { title: 'New step', body: '' }] })
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e4e8] bg-white px-4 py-2 text-[.78rem] font-semibold hover:border-[#E85D2A]"
                          >
                            <Plus size={14} /> Add process step
                          </button>
                        </div>

                        <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 space-y-3">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#525252]">
                            Section 5 — Tools we use (logos strip)
                          </p>
                          <div className="grid gap-3 md:grid-cols-2">
                            {page.tools_items.map((tool, idx) => (
                              <div key={idx} className="rounded-xl border border-[#e8eaed] bg-white p-3 space-y-2">
                                <Field
                                  label={`Tool ${idx + 1} name`}
                                  value={tool.name}
                                  onChange={(v) =>
                                    patch({
                                      tools_items: page.tools_items.map((x, j) =>
                                        j === idx ? { ...x, name: v } : x
                                      ),
                                    })
                                  }
                                />
                                <ImageField
                                  label="Logo"
                                  value={tool.logo}
                                  onChange={(v) =>
                                    patch({
                                      tools_items: page.tools_items.map((x, j) =>
                                        j === idx ? { ...x, logo: v } : x
                                      ),
                                    })
                                  }
                                  onUpload={() => pickFile(`toollogo:${activePageId}:${idx}`)}
                                  previewBg="#ffffff"
                                />
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    patch({ tools_items: page.tools_items.filter((_, j) => j !== idx) })
                                  }
                                  className="text-[.72rem] font-semibold text-red-600 hover:underline"
                                >
                                  Remove tool
                                </button>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              patch({
                                tools_items: [
                                  ...page.tools_items,
                                  { name: 'New tool', logo: '/images/tools/nextjs.svg' },
                                ],
                              })
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e4e8] bg-white px-4 py-2 text-[.78rem] font-semibold hover:border-[#E85D2A]"
                          >
                            <Plus size={14} /> Add tool logo
                          </button>
                          <Field label="Tools note" value={page.tools_note} onChange={(v) => patch({ tools_note: v })} />
                        </div>

                        <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 space-y-3">
                          <p className="text-[.78rem] font-bold uppercase tracking-widest text-[#525252]">
                            Section 6 — WhatsApp CTA
                          </p>
                          <Field label="CTA heading" value={page.cta_heading} onChange={(v) => patch({ cta_heading: v })} />
                          <Field label="CTA body" value={page.cta_body} onChange={(v) => patch({ cta_body: v })} rows={2} />
                          <div className="grid gap-3 md:grid-cols-2">
                            <Field label="Button label" value={page.cta_button} onChange={(v) => patch({ cta_button: v })} />
                            <Field label="WhatsApp URL" value={page.cta_url} onChange={(v) => patch({ cta_url: v })} />
                          </div>
                        </div>

                        <button
                          disabled={busy}
                          onClick={() => saveSettings(['service_pages'], 'Service page content saved.')}
                          className="rounded-full bg-[#E85D2A] px-6 py-2.5 text-[.85rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                        >
                          Save service page
                        </button>
                      </div>
                    );
                  })()}
                </Card>
              </>
            )}

            {/* TAB 8: FAQs */}
            {tab === 'faq' && settings && (
              <>
                <Card
                  title="Homepage FAQ (Top 3 Questions)"
                  hint="Questions displayed in the Common questions section on the homepage."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['faq_home'], 'Homepage FAQ saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save home FAQ
                    </button>
                  }
                >
                  <ListEditor<FaqItem>
                    items={settings.faq_home}
                    onChange={(next) => patchSettings({ faq_home: next })}
                    blank={() => ({ q: '', a: '' })}
                    addLabel="Add homepage question"
                    render={(item, patch, remove) => (
                      <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4">
                        <Field label="Question" value={item.q} onChange={(v) => patch({ q: v })} />
                        <div className="mt-2">
                          <Field label="Answer" value={item.a} onChange={(v) => patch({ a: v })} rows={3} />
                        </div>
                        <button
                          type="button"
                          onClick={remove}
                          className="mt-2 text-[.75rem] font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  />
                </Card>

                <Card
                  title="Full /faq Page Questions"
                  hint="Complete FAQ list displayed on /faq."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['faq_page'], 'Full FAQ page saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save /faq page
                    </button>
                  }
                >
                  <ListEditor<FaqItem>
                    items={settings.faq_page}
                    onChange={(next) => patchSettings({ faq_page: next })}
                    blank={() => ({ q: '', a: '' })}
                    addLabel="Add FAQ page question"
                    render={(item, patch, remove) => (
                      <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4">
                        <Field label="Question" value={item.q} onChange={(v) => patch({ q: v })} />
                        <div className="mt-2">
                          <Field label="Answer" value={item.a} onChange={(v) => patch({ a: v })} rows={3} />
                        </div>
                        <button
                          type="button"
                          onClick={remove}
                          className="mt-2 text-[.75rem] font-semibold text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  />
                </Card>
              </>
            )}

            {/* TAB 9: BRAND, LOGOS, ICONS & CONTACT */}
            {tab === 'brand' && settings && (
              <>
                <Card
                  title="Navbar Logo, Browser Tab Icon (Favicon) & Page Title"
                  hint="Upload a transparent PNG/SVG for the navbar logo, the icon shown in the browser tab (favicon) and the /api/manifest app icon. The browser title appears in the tab and search results."
                  action={
                    <button
                      disabled={busy}
                      onClick={() =>
                        saveSettings(
                          ['navbar_logo', 'favicon_icon', 'browser_title', 'manifest_icon'],
                          'Brand logos, favicon and browser title saved.'
                        )
                      }
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save branding
                    </button>
                  }
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <ImageField
                      label="Navbar Logo (Transparent)"
                      value={settings.navbar_logo}
                      onChange={(v) => patchSettings({ navbar_logo: v })}
                      onUpload={() => pickFile('navbar_logo')}
                      hint="Default: /images/logo-full.png (transparent Opus Zimbabwe logo) — no white background box."
                      previewBg="#f8f8f6"
                    />
                    <ImageField
                      label="Browser Tab Icon (Favicon)"
                      value={settings.favicon_icon}
                      onChange={(v) => patchSettings({ favicon_icon: v })}
                      onUpload={() => pickFile('favicon_icon')}
                      hint="Supports PNG, SVG, ICO, WebP, JPG, GIF and AVIF. Appears in the browser tab and bookmarks."
                      previewBg="#ffffff"
                    />
                    <ImageField
                      label="Manifest / App Icon"
                      value={settings.manifest_icon}
                      onChange={(v) => patchSettings({ manifest_icon: v })}
                      onUpload={() => pickFile('manifest_icon')}
                      hint="Served by /api/manifest (installable app icon)."
                    />
                    <Field
                      label="Browser Tab & Search Title"
                      value={settings.browser_title}
                      onChange={(v) => patchSettings({ browser_title: v })}
                      hint="Shown in the browser tab. Default: Opus Zimbabwe — Digital Services for Zimbabwe"
                    />
                  </div>
                </Card>

                <Card
                  title="Footer Social Links & Icons"
                  hint="Manage social links in the footer and upload custom social icons."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['footer_socials'], 'Footer socials saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save socials
                    </button>
                  }
                >
                  <ListEditor<SocialLink>
                  disabled={busy}
                    items={settings.footer_socials}
                    onChange={(next) => patchSettings({ footer_socials: next })}
                    blank={() => ({ label: '', href: 'https://', icon: 'Globe' })}
                    addLabel="Add social link"
                    render={(item, patch, remove, idx) => (
                      <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 grid gap-3 md:grid-cols-3">
                        <Field label="Label" value={item.label} onChange={(v) => patch({ label: v })} />
                        <Field label="URL" value={item.href} onChange={(v) => patch({ href: v })} />
                        <div>
                          <IconPicker
                            label="Icon (Upload or preset)"
                            value={item.icon}
                            onChange={(v) => patch({ icon: v })}
                            onUpload={() => pickFile(`socialicon:${idx}`)}
                          />
                          <button
                            type="button"
                            onClick={remove}
                            className="mt-2 text-[.75rem] font-semibold text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </Card>

                <Card title="Contact Page Hero Background" hint="Background image, colour and overlay update without rebuilding the site."
                  action={<button disabled={busy} onClick={() => saveSettings(['contact_hero_design'], 'Contact hero background saved.')} className="rounded-full bg-[#E85D2A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">Save contact hero</button>}>
                  <SectionDesignEditor value={settings.contact_hero_design} onChange={v => patchSettings({ contact_hero_design: v })} onUpload={() => pickFile('designimage:contact_hero_design')} />
                </Card>

                <Card
                  title="Contact Page Cards & Icons"
                  hint="Manage contact cards on /contact and upload custom icons."
                  action={
                    <button
                      disabled={busy}
                      onClick={() => saveSettings(['contact_cards'], 'Contact cards saved.')}
                      className="rounded-full bg-[#E85D2A] px-5 py-2 text-[.82rem] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                    >
                      Save contact cards
                    </button>
                  }
                >
                  <ListEditor<ContactCard>
                  disabled={busy}
                    items={settings.contact_cards}
                    onChange={(next) => patchSettings({ contact_cards: next })}
                    blank={() => ({ title: '', line: '', note: '', href: '', icon: 'Mail' })}
                    addLabel="Add contact card"
                    render={(item, patch, remove, idx) => (
                      <div className="rounded-2xl border border-[#e8eaed] bg-[#fafbfc] p-4 grid gap-3 md:grid-cols-2">
                        <Field label="Title" value={item.title} onChange={(v) => patch({ title: v })} />
                        <IconPicker
                          label="Icon (Upload or preset)"
                          value={item.icon}
                          onChange={(v) => patch({ icon: v })}
                          onUpload={() => pickFile(`contacticon:${idx}`)}
                        />
                        <Field label="Primary Line" value={item.line} onChange={(v) => patch({ line: v })} />
                        <Field label="Note" value={item.note} onChange={(v) => patch({ note: v })} />
                        <div className="md:col-span-2">
                          <Field label="Link (https://, mailto:, tel:)" value={item.href} onChange={(v) => patch({ href: v })} />
                        </div>
                        <button
                          type="button"
                          onClick={remove}
                          className="text-[.75rem] font-semibold text-red-600 hover:underline md:col-span-2 text-left"
                        >
                          Remove card
                        </button>
                      </div>
                    )}
                  />
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
