import { validDesign, type SectionDesign } from './section-design';
export type HeroSlide = { id: string; image: string };
export type HeroDesign = {
  headline_mode: 'static' | 'service_words';
  caption_gap: number; caption_size: number; caption_weight: number;
  layout: 'split' | 'full_bleed' | 'card';
  text_align: 'left' | 'center' | 'right';
  text_position: 'left' | 'center' | 'right';
  vertical_align: 'top' | 'center' | 'bottom';
  rotation: 'services' | 'backgrounds' | 'none';
  animation: 'fade' | 'slide' | 'zoom' | 'none';
  interval_ms: number; transition_ms: number; pause_on_hover: boolean;
  use_existing_background: boolean; show_accent: boolean;
  use_reference_gutters: boolean; edge_spacing: number; frame_width: number;
  card_inset: number; border_radius: number; min_height: number;
  corner_mode: 'layout' | 'uniform' | 'individual';
  top_left_radius: number; top_right_radius: number; bottom_left_radius: number; bottom_right_radius: number;
  padding_top: number; padding_bottom: number; text_width: number;
  heading_size: number; heading_mobile_size: number; heading_weight: number;
  body_size: number; body_mobile_size: number;
  heading_color: string; accent_color: string; body_color: string;
  eyebrow: string; headline: string; headline_accent: string; description: string;
  button_label: string; button_href: string; button_color: string; button_text_color: string;
  secondary_label: string; secondary_href: string; secondary_action: 'link' | 'guide';
  show_media: boolean; media_image: string; media_fit: 'contain' | 'cover'; media_height: number;
  background_x: number; background_y: number;
  overlay_placement: 'full' | 'left' | 'center' | 'right'; overlay_width: number;
  text_panel: boolean; panel_color: string; panel_opacity: number; panel_radius: number; panel_padding: number;
  background: SectionDesign; backgrounds: HeroSlide[];
};
export const DEFAULT_HERO_DESIGN: HeroDesign = {
  headline_mode: 'service_words', caption_gap: 10, caption_size: 18, caption_weight: 500,
  layout: 'split', text_align: 'left', text_position: 'right', vertical_align: 'top',
  rotation: 'services', animation: 'fade', interval_ms: 4500, transition_ms: 600, pause_on_hover: true,
  use_existing_background: true, show_accent: true,
  use_reference_gutters: true, edge_spacing: 40, frame_width: 1440, card_inset: 24, border_radius: 32,
  corner_mode: 'layout', top_left_radius: 0, top_right_radius: 0, bottom_left_radius: 0, bottom_right_radius: 0,
  min_height: 620, padding_top: 88, padding_bottom: 64, text_width: 720,
  heading_size: 56, heading_mobile_size: 38, heading_weight: 700, body_size: 25, body_mobile_size: 22,
  heading_color: '#0d0d0d', accent_color: '#DC2626', body_color: '#0d0d0d',
  eyebrow: '', headline: "Work with Zimbabwe's Best", headline_accent: '', description: '', button_label: 'Learn More', button_href: '',
  button_color: '#E85D2A', button_text_color: '#ffffff', secondary_label: 'Help me choose', secondary_href: '/projects/', secondary_action: 'guide',
  show_media: true, media_image: '', media_fit: 'contain', media_height: 360,
  background_x: 50, background_y: 50, overlay_placement: 'full', overlay_width: 100,
  text_panel: false, panel_color: '#ffffff', panel_opacity: 0.92, panel_radius: 24, panel_padding: 32,
  background: { background_color: '#f8f8f6', background_image: '', overlay_kind: 'solid', overlay_color: '#0d0d0d', overlay_gradient: '90deg,#0d0d0d,#E85D2A', overlay_opacity: 0 },
  backgrounds: [],
};
const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const safeImage = (v: unknown) => typeof v === 'string' && v.length <= 500 && (!v || /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(v));
const safeLink = (v: unknown) => safeImage(v) || (typeof v === 'string' && v.length <= 500 && /^(#[A-Za-z][\w-]*|mailto:[^\s]+|tel:[+\d\s-]+)$/.test(v));
const numeric: Partial<Record<keyof HeroDesign, [number, number]>> = {
  caption_gap: [0, 48], caption_size: [14, 28],
  top_left_radius: [0, 160], top_right_radius: [0, 160], bottom_left_radius: [0, 160], bottom_right_radius: [0, 160],
  interval_ms: [3000, 30000], transition_ms: [0, 2000], edge_spacing: [0, 200], frame_width: [960, 1920],
  card_inset: [0, 160], border_radius: [0, 80], min_height: [320, 1100], padding_top: [0, 240], padding_bottom: [0, 200], text_width: [260, 1100],
  heading_size: [32, 120], heading_mobile_size: [24, 64], body_size: [14, 36], body_mobile_size: [14, 26],
  media_height: [200, 700], background_x: [0, 100], background_y: [0, 100], overlay_width: [10, 100],
  panel_opacity: [0, 1], panel_radius: [0, 64], panel_padding: [0, 80],
};
export function validHeroDesign(value: unknown): value is HeroDesign {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as HeroDesign;
  const enums: Partial<Record<keyof HeroDesign, readonly unknown[]>> = {
    headline_mode: ['static', 'service_words'], caption_weight: [300, 400, 500, 600, 700],
    corner_mode: ['layout', 'uniform', 'individual'], secondary_action: ['link', 'guide'],
    layout: ['split', 'full_bleed', 'card'], text_align: ['left', 'center', 'right'], text_position: ['left', 'center', 'right'],
    vertical_align: ['top', 'center', 'bottom'], rotation: ['services', 'backgrounds', 'none'], animation: ['fade', 'slide', 'zoom', 'none'],
    media_fit: ['contain', 'cover'], overlay_placement: ['full', 'left', 'center', 'right'], heading_weight: [400, 500, 600, 700, 800, 900],
  };
  if (Object.entries(enums).some(([k, options]) => !options.includes(v[k as keyof HeroDesign]))) return false;
  if (Object.entries(numeric).some(([k, [min, max]]) => { const n = v[k as keyof HeroDesign]; return typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max; })) return false;
  if (v.transition_ms > v.interval_ms / 2) return false;
  for (const k of ['pause_on_hover', 'use_reference_gutters', 'use_existing_background', 'show_accent', 'show_media', 'text_panel'] as const) if (typeof v[k] !== 'boolean') return false;
  for (const k of ['heading_color', 'accent_color', 'body_color', 'button_color', 'button_text_color', 'panel_color'] as const) if (!hex.test(v[k])) return false;
  for (const [k, max] of [['eyebrow', 160], ['headline', 300], ['headline_accent', 300], ['description', 1500], ['button_label', 100], ['secondary_label', 100]] as const) if (typeof v[k] !== 'string' || v[k].length > max) return false;
  if (!safeImage(v.media_image) || !safeLink(v.button_href) || !safeLink(v.secondary_href) || !validDesign(v.background)) return false;
  return Array.isArray(v.backgrounds) && v.backgrounds.length <= 20 && new Set(v.backgrounds.map(x => x?.id)).size === v.backgrounds.length
    && v.backgrounds.every(x => x && typeof x.id === 'string' && /^[\w-]{1,80}$/.test(x.id) && !!x.image && safeImage(x.image));
}
export function upgradeHeroDesign(value: unknown): HeroDesign | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Partial<HeroDesign>;
  if (raw.background !== undefined && (!raw.background || typeof raw.background !== 'object' || Array.isArray(raw.background))) return null;
  const secondaryAction = raw.secondary_action ?? (raw.secondary_label ? 'link' : DEFAULT_HERO_DESIGN.secondary_action);
  const upgraded = { ...structuredClone(DEFAULT_HERO_DESIGN), ...raw, headline_mode: raw.headline_mode ?? 'static', caption_gap: raw.caption_gap ?? 20, caption_size: raw.caption_size ?? 16, caption_weight: raw.caption_weight ?? 300, secondary_action: secondaryAction, background: { ...DEFAULT_HERO_DESIGN.background, ...raw.background } };
  return validHeroDesign(upgraded) ? upgraded : null;
}
export function normalizeHeroDesign(value: unknown): HeroDesign {
  return upgradeHeroDesign(value) || structuredClone(DEFAULT_HERO_DESIGN);
}
export function heroPreset(name: 'current' | 'classic' | 'campaign' | 'full_bleed' | 'centered_card'): HeroDesign {
  const d = structuredClone(DEFAULT_HERO_DESIGN);
  if (name === 'current') return d;
  if (name === 'classic') return { ...d, headline_mode: 'static', headline: '', text_position: 'left', vertical_align: 'top', heading_size: 72, media_height: 440, caption_gap: 20, caption_size: 16, caption_weight: 300 };
  d.headline_mode = 'static'; d.headline = 'Built for your next chapter.'; d.show_accent = false;
  d.use_existing_background = false;
  d.rotation = 'backgrounds'; d.animation = 'fade'; d.show_media = false; d.secondary_label = 'Help me choose'; d.button_label = 'Discuss my project'; d.button_href = '/contact/';
  d.description = 'Websites, software, AI and automation built around the way your organisation works.';
  d.background.background_image = '/images/hero-bg.jpg'; d.background.overlay_opacity = 0.65;
  d.heading_color = '#ffffff'; d.body_color = '#ffffff'; d.accent_color = '#ffffff';
  d.vertical_align = 'center';
  if (name === 'centered_card') { d.layout = 'card'; d.text_align = 'center'; d.text_position = 'center'; }
  else { d.layout = 'full_bleed'; if (name === 'full_bleed') { d.text_align = 'center'; d.text_position = 'center'; } }
  if (name === 'campaign' || name === 'full_bleed') { d.corner_mode = 'individual'; d.bottom_left_radius = 64; d.bottom_right_radius = 64; }
  if (name === 'campaign') { d.text_position = 'left'; d.text_width = 680; d.background.overlay_kind = 'gradient'; d.background.overlay_gradient = '90deg,#0d0d0d,#302220'; d.background.overlay_opacity = 0.7; }
  return d;
}
