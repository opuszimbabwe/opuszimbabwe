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
const hex = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
function cleanGradient(value: string): string | null {
 let text = value.trim(); if (text.length > 500) return null;
 if (/^linear-gradient\(/i.test(text)) { if (!text.endsWith(')')) return null; text = text.slice(text.indexOf('(') + 1, -1).trim(); }
 const parts = text.split(',').map(part => part.trim());
 if (parts.length < 3 || parts.length > 7 || !/^-?(?:\d{1,3}(?:\.\d{1,3})?|\.\d{1,3})deg$/i.test(parts[0])) return null;
 const angle = Number(parts[0].slice(0, -3)); if (!Number.isFinite(angle) || Math.abs(angle) > 360) return null;
 for (const stop of parts.slice(1)) {
  const match = stop.match(/^(#[a-f0-9]+)(?:\s+([\d.]+)%)?$/i);
  if (!match || !hex.test(match[1]) || (match[2] !== undefined && (!/^\d+(?:\.\d+)?$/.test(match[2]) || Number(match[2]) > 100))) return null;
 }
 return `${angle}deg,${parts.slice(1).join(',')}`;
}
export function parseSectionDesign(value: unknown): SectionDesign | null {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
 const v = value as Record<string, unknown>;
 if (v.overlay_kind !== 'solid' && v.overlay_kind !== 'gradient') return null;
 const background = typeof v.background_color === 'string' ? v.background_color.trim() : '';
 const colour = typeof v.overlay_color === 'string' ? v.overlay_color.trim() : '';
 const overlay = !colour && v.overlay_kind === 'gradient' ? DEFAULT_CTA_DESIGN.overlay_color : colour;
 const rawGradient = typeof v.overlay_gradient === 'string' ? v.overlay_gradient.trim() : '';
 const gradient = !rawGradient && v.overlay_kind === 'solid' ? DEFAULT_CTA_DESIGN.overlay_gradient : cleanGradient(rawGradient);
 const image = typeof v.background_image === 'string' ? v.background_image.trim() : '';
 if (!hex.test(background) || !hex.test(overlay) || !gradient || typeof v.background_image !== 'string' || image.length > 500 || (image && !/^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(image)) || typeof v.overlay_opacity !== 'number' || !Number.isFinite(v.overlay_opacity) || v.overlay_opacity < 0 || v.overlay_opacity > 1) return null;
 return { background_color: background, background_image: image, overlay_kind: v.overlay_kind, overlay_color: overlay, overlay_gradient: gradient, overlay_opacity: v.overlay_opacity };
}
export function validDesign(value: unknown): value is SectionDesign { return parseSectionDesign(value) !== null; }
export function normalizeDesign(value: unknown, fallback: SectionDesign): SectionDesign { return parseSectionDesign(value) || fallback; }
export function sectionDesignError() { return 'Check the section background: use a valid hex colour (including transparency), an HTTPS or site image URL, opacity from 0–100%, and a gradient with an angle and two to six hex colour stops. A plain overlay does not need a gradient.'; }
