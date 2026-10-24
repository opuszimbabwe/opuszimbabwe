export type SectionDesign = {
  background_color: string;
  background_image: string;
  overlay_kind: 'solid' | 'gradient';
  overlay_color: string;
  overlay_gradient: string;
  overlay_opacity: number;
};
export const DEFAULT_CTA_DESIGN: SectionDesign = { background_color: '#0d0d0d', background_image: '', overlay_kind: 'solid', overlay_color: '#0d0d0d', overlay_gradient: '160deg,#0d0d0d,#E85D2A', overlay_opacity: 0.65 };
export const DEFAULT_CONTACT_DESIGN: SectionDesign = { ...DEFAULT_CTA_DESIGN, background_color: '#E85D2A', overlay_opacity: 0 };
const hex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const gradient = /^\d{1,3}deg(?:,\s*#(?:[0-9a-f]{6}|[0-9a-f]{3})){2,5}$/i;
export function validDesign(value: unknown): value is SectionDesign {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as SectionDesign;
  return hex.test(v.background_color) && hex.test(v.overlay_color)
    && typeof v.background_image === 'string' && v.background_image.length <= 500
    && (!v.background_image || /^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(v.background_image))
    && (v.overlay_kind === 'solid' || v.overlay_kind === 'gradient')
    && typeof v.overlay_gradient === 'string' && gradient.test(v.overlay_gradient)
    && typeof v.overlay_opacity === 'number' && Number.isFinite(v.overlay_opacity) && v.overlay_opacity >= 0 && v.overlay_opacity <= 1;
}
export function normalizeDesign(value: unknown, fallback: SectionDesign): SectionDesign {
  return validDesign(value) ? value : fallback;
}
