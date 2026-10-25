import {isCssColor,cleanGradient} from './colors';
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
 if (!isCssColor(background) || !isCssColor(overlay) || !gradient || typeof v.background_image !== 'string' || image.length > 500 || (image && !/^(\/(?!\/)[^\s]*|https:\/\/[^\s]+)$/.test(image)) || typeof v.overlay_opacity !== 'number' || !Number.isFinite(v.overlay_opacity) || v.overlay_opacity < 0 || v.overlay_opacity > 1) return null;
 return { background_color: background, background_image: image, overlay_kind: v.overlay_kind, overlay_color: overlay, overlay_gradient: gradient, overlay_opacity: v.overlay_opacity };
}
export function validDesign(value: unknown): value is SectionDesign { return parseSectionDesign(value) !== null; }
export function normalizeDesign(value: unknown, fallback: SectionDesign): SectionDesign { return parseSectionDesign(value) || fallback; }
export function sectionDesignError() { return 'Check the section background: use a valid RGB, RGBA or hex colour (including transparency), an HTTPS or site image URL, opacity from 0–100%, and a gradient with an angle and two to twelve RGB, RGBA or hex colour stops. A plain overlay does not need a gradient.'; }
