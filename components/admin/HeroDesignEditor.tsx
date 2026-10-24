'use client';
import { HomeHeroView } from '@/components/HomeHero';
import { heroPreset, validHeroDesign, type HeroDesign } from '@/lib/hero-design';
import type { HeroCycle, HomeSectionsConfig } from '@/lib/content';

function Select({ label, value, choices, onChange }: { label: string; value: string; choices: [string, string][]; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium">{label}<select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="mt-2 block w-full rounded-xl border bg-white p-3">{choices.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
function Text({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return <label className="block text-sm font-medium">{label}{multiline ? <textarea aria-label={label} value={value} onChange={e => onChange(e.target.value)} rows={3} className="mt-2 block w-full rounded-xl border bg-white p-3" /> : <input aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="mt-2 block w-full rounded-xl border bg-white p-3" />}</label>;
}
function Range({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return <label className="block text-sm font-medium">{label}: {value}<input className="mt-3 block w-full accent-[#E85D2A]" type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-3 text-sm font-medium"><input className="accent-[#E85D2A]" type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />{label}</label>;
}
function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="flex items-center justify-between gap-3 text-sm font-medium">{label}<input aria-label={label} type="color" value={value} onChange={e => onChange(e.target.value)} className="h-10 w-16" /></label>;
}
export default function HeroDesignEditor({ value: d, onChange, onUpload, onSave, busy, sections, cycles }: { value: HeroDesign; onChange: (value: HeroDesign) => void; onUpload: (target: string) => void; onSave: () => void; busy: boolean; sections: HomeSectionsConfig; cycles: HeroCycle[] }) {
  const patch = (v: Partial<HeroDesign>) => onChange({ ...d, ...v });
  const set = (key: keyof HeroDesign, value: unknown) => patch({ [key]: value });
  const range = (key: keyof HeroDesign, label: string, min: number, max: number, step = 1) => <Range key={key} label={label} value={d[key] as number} min={min} max={max} step={step} onChange={v => set(key, v)} />;
  const color = (key: keyof HeroDesign, label: string) => <Color key={key} label={label} value={d[key] as string} onChange={v => set(key, v)} />;
  const select = (key: keyof HeroDesign, label: string, choices: [string, string][]) => <Select label={label} value={String(d[key])} choices={choices} onChange={v => set(key, key === 'heading_weight' ? Number(v) : v)} />;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Home Hero Design Studio</h2><p className="mt-2 text-sm text-black/60">Choose a starting point, adjust the controls, then save. Poppins stays consistent across every layout.</p></div><button disabled={busy || !validHeroDesign(d)} onClick={onSave} className="rounded-full bg-[#E85D2A] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">Save hero design</button></div>
    <p className="text-sm text-black/60">1. Choose a preset → 2. Adjust the sections below → 3. Review the layout → 4. Save hero design.</p>
    <div className="flex flex-wrap gap-2" aria-label="Hero presets">{([['current', 'Current split'], ['campaign', 'Campaign banner'], ['full_bleed', 'Full-bleed centred'], ['centered_card', 'Centred card']] as const).map(([name, label]) => <button type="button" key={name} onClick={() => onChange(heroPreset(name))} className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-medium hover:border-[#E85D2A]">{label}</button>)}</div>
    <p className="text-sm text-black/60">The campaign preset provides a McAfee-style background banner with fixed text and two actions. Use your own images and wording. Background rotation never changes the service text.</p>
    <details open className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Layout & spacing</summary><div className="mt-5 grid gap-5 md:grid-cols-2">
      {select('layout', 'Hero layout', [['split', 'Current split layout'], ['full_bleed', 'Full-bleed background'], ['card', 'Inset hero card']])}
      {select('text_align', 'Text alignment', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']])}
      {select('text_position', 'Text position', [['left', 'Left'], ['center', 'Centre'], ['right', 'Right']])}
      {select('vertical_align', 'Vertical position', [['top', 'Top'], ['center', 'Middle'], ['bottom', 'Bottom']])}
      <Toggle label="Use reference responsive gutters" value={d.use_reference_gutters} onChange={v => patch({ use_reference_gutters: v })} />
      {!d.use_reference_gutters && range('edge_spacing', 'Custom edge-to-content spacing (px)', 0, 200)}
      {range('frame_width', 'Maximum content width (px)', 960, 1920, 10)}
      {range('text_width', 'Text column maximum width (px)', 260, 1100, 10)}
      {range('min_height', 'Minimum hero height (px)', 320, 1100, 10)}
      {range('padding_top', 'Top content padding (px)', 0, 240)}
      {range('padding_bottom', 'Bottom content padding (px)', 0, 200)}
      {d.layout === 'card' && range('card_inset', 'Card distance from page edge (px)', 0, 160)}
      {select('corner_mode', 'Hero corner style', [['layout', 'Layout default'], ['uniform', 'All corners together'], ['individual', 'Set each corner separately']])}
      {(d.corner_mode === 'uniform' || (d.corner_mode === 'layout' && d.layout === 'card')) && range('border_radius', 'Card corner radius (px)', 0, 80)}
      {d.corner_mode === 'individual' && <>{range('top_left_radius', 'Top left hero corner (px)', 0, 160)}{range('top_right_radius', 'Top right hero corner (px)', 0, 160)}{range('bottom_left_radius', 'Bottom left hero corner (px)', 0, 160)}{range('bottom_right_radius', 'Bottom right hero corner (px)', 0, 160)}</>}
    </div></details>
    <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Copy, typography & buttons</summary><p className="mt-3 text-sm text-black/60">Blank headline, emphasis and description fields use the existing homepage copy and service-cycle text. Fill them to keep your own fixed message.</p><div className="mt-5 grid gap-5 md:grid-cols-2">
      <Text label="Eyebrow" value={d.eyebrow} onChange={v => patch({ eyebrow: v })} />
      <Text label="Headline override" value={d.headline} onChange={v => patch({ headline: v })} multiline />
      <Toggle label="Show headline emphasis" value={d.show_accent} onChange={v => patch({ show_accent: v })} />
      <Text label="Headline emphasis override" value={d.headline_accent} onChange={v => patch({ headline_accent: v })} />
      <Text label="Fixed description override" value={d.description} onChange={v => patch({ description: v })} multiline />
      {range('heading_size', 'Desktop headline size (px)', 32, 120)}{range('heading_mobile_size', 'Phone headline size (px)', 24, 64)}
      {select('heading_weight', 'Poppins headline weight', [['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold'], ['800', 'Extra bold'], ['900', 'Black']])}
      {range('body_size', 'Desktop description size (px)', 14, 36)}{range('body_mobile_size', 'Phone description size (px)', 14, 26)}
      {color('heading_color', 'Headline colour')}{color('accent_color', 'Headline emphasis colour')}{color('body_color', 'Description colour')}
      <Text label="Primary button label" value={d.button_label} onChange={v => patch({ button_label: v })} />
      <Text label="Primary button URL" value={d.button_href} onChange={v => patch({ button_href: v })} />
      {color('button_color', 'Primary button background')}{color('button_text_color', 'Primary button text colour')}
      {select('secondary_action', 'Secondary button action', [['guide', 'Open Help Me Choose wizard'], ['link', 'Open a page or URL']])}
      <Text label="Secondary button label" value={d.secondary_label} onChange={v => patch({ secondary_label: v })} />
      {d.secondary_action === 'link' && <Text label="Secondary button URL" value={d.secondary_href} onChange={v => patch({ secondary_href: v })} />}
    </div></details>
    <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Background & overlay</summary><div className="mt-5 grid gap-5 md:grid-cols-2">
      <Toggle label="Use existing homepage background colour" value={d.use_existing_background} onChange={v => patch({ use_existing_background: v })} />
      <Color label="Hero background colour" value={d.background.background_color} onChange={v => patch({ use_existing_background: false, background: { ...d.background, background_color: v } })} />
      <div><Text label="Static background image URL" value={d.background.background_image} onChange={v => patch({ background: { ...d.background, background_image: v } })} /><button type="button" disabled={busy} onClick={() => onUpload('heroimage:background')} className="mt-2 rounded-full border px-4 py-2 text-sm disabled:opacity-50">Upload hero background</button></div>
      <Select label="Hero overlay type" value={d.background.overlay_kind} choices={[["solid", "Plain colour"], ["gradient", "Gradient"]]} onChange={v => patch({ background: { ...d.background, overlay_kind: v as 'solid' | 'gradient' } })} />
      <Color label="Hero overlay colour" value={d.background.overlay_color} onChange={v => patch({ background: { ...d.background, overlay_color: v } })} />
      {d.background.overlay_kind === 'gradient' && <div className="space-y-4">
        <Range label="Hero gradient angle (degrees)" value={parseInt(d.background.overlay_gradient) || 0} min={0} max={360} onChange={angle => patch({ background: { ...d.background, overlay_gradient: `${angle}deg,${d.background.overlay_gradient.split(',').slice(1).join(',')}` } })} />
        {d.background.overlay_gradient.split(',').slice(1).map((colour, i) => <Color key={i} label={`Hero gradient colour ${i + 1}`} value={colour.trim()} onChange={colour => { const parts = d.background.overlay_gradient.split(','); parts[i + 1] = colour; patch({ background: { ...d.background, overlay_gradient: parts.join(',') } }); }} />)}
        <Text label="Hero overlay gradient (angledeg,#colour,#colour)" value={d.background.overlay_gradient} onChange={v => patch({ background: { ...d.background, overlay_gradient: v } })} />
      </div>}
      <Range label="Hero overlay opacity" value={d.background.overlay_opacity} min={0} max={1} step={0.05} onChange={v => patch({ background: { ...d.background, overlay_opacity: v } })} />
      {select('overlay_placement', 'Overlay position', [['full', 'Whole hero'], ['left', 'Left'], ['center', 'Centre'], ['right', 'Right']])}
      {range('overlay_width', 'Overlay width (%)', 10, 100)}{range('background_x', 'Background horizontal focal point (%)', 0, 100)}{range('background_y', 'Background vertical focal point (%)', 0, 100)}
      <Toggle label="Show a coloured panel behind the text" value={d.text_panel} onChange={v => patch({ text_panel: v })} />
      {d.text_panel && <>{color('panel_color', 'Text panel colour')}{range('panel_opacity', 'Text panel opacity', 0, 1, 0.05)}{range('panel_radius', 'Text panel corners (px)', 0, 64)}{range('panel_padding', 'Text panel padding (px)', 0, 80)}</>}
    </div></details>
    <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Foreground image</summary><div className="mt-5 grid gap-5 md:grid-cols-2">
      <Toggle label="Show foreground image in split/card layouts" value={d.show_media} onChange={v => patch({ show_media: v })} />
      <div><Text label="Foreground image override URL" value={d.media_image} onChange={v => patch({ media_image: v })} /><button type="button" disabled={busy} onClick={() => onUpload('heroimage:foreground')} className="mt-2 rounded-full border px-4 py-2 text-sm disabled:opacity-50">Upload foreground image</button></div>
      {select('media_fit', 'Foreground image fit', [['contain', 'Fit whole image'], ['cover', 'Fill and crop']])}{range('media_height', 'Foreground image height (px)', 200, 700)}
    </div></details>
    <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-semibold">Rotation & animation</summary><div className="mt-5 grid gap-5 md:grid-cols-2">
      {select('rotation', 'Rotation mode', [['none', 'Static hero'], ['services', 'Current service-image and text rotation'], ['backgrounds', 'Background images only; keep text fixed']])}
      {select('animation', 'Transition style', [['fade', 'Fade'], ['slide', 'Slide'], ['zoom', 'Zoom'], ['none', 'Instant change']])}
      {range('interval_ms', 'Time per slide (ms)', 3000, 30000, 500)}{range('transition_ms', 'Transition duration (ms)', 0, 2000, 50)}
      <Toggle label="Pause rotation while hovering the hero" value={d.pause_on_hover} onChange={v => patch({ pause_on_hover: v })} />
    </div><p className="mt-5 text-sm text-black/60">Add background slides below. With none, the static background image is used. Service cycles are managed in Hero & Sections. Visitors can pause rotation; reduced-motion users see a static slide.</p>
      <div className="mt-4 space-y-4">{d.backgrounds.map((slide, index) => <div key={slide.id} className="rounded-xl border p-4">
        <Text label={`Background slide ${index + 1} URL`} value={slide.image} onChange={image => patch({ backgrounds: d.backgrounds.map(s => s.id === slide.id ? { ...s, image } : s) })} />
        <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} className="rounded-full border px-3 py-2 text-sm disabled:opacity-50" onClick={() => onUpload(`heroslide:${slide.id}`)}>Upload slide {index + 1}</button>
          <button type="button" disabled={index === 0} className="rounded-full border px-3 py-2 text-sm disabled:opacity-40" onClick={() => { const backgrounds = [...d.backgrounds]; [backgrounds[index - 1], backgrounds[index]] = [backgrounds[index], backgrounds[index - 1]]; patch({ backgrounds }); }}>Move up</button>
          <button type="button" disabled={index === d.backgrounds.length - 1} className="rounded-full border px-3 py-2 text-sm disabled:opacity-40" onClick={() => { const backgrounds = [...d.backgrounds]; [backgrounds[index + 1], backgrounds[index]] = [backgrounds[index], backgrounds[index + 1]]; patch({ backgrounds }); }}>Move down</button>
          <button type="button" className="rounded-full border px-3 py-2 text-sm text-red-700" onClick={() => patch({ backgrounds: d.backgrounds.filter(s => s.id !== slide.id) })}>Remove slide {index + 1}</button>
        </div></div>)}</div>
      <button type="button" disabled={d.backgrounds.length >= 20} className="mt-4 rounded-full border px-4 py-2 text-sm disabled:opacity-40" onClick={() => patch({ backgrounds: [...d.backgrounds, { id: `slide_${crypto.randomUUID()}`, image: '/images/hero-bg.jpg' }] })}>Add background slide</button>
    </details>
    {!validHeroDesign(d) && <p role="alert" className="text-sm text-red-700">Check image/button URLs and gradient format. Transition duration must be no more than half the slide interval. Unsaved settings have not changed the public site.</p>}
    <div className="rounded-2xl border bg-white p-4"><h3 className="mb-4 font-semibold">Live layout preview</h3><p className="mb-4 text-xs text-black/60">Preview uses this editor’s available width. Phone sizes and full desktop sizes apply on the public page. Rotation is paused here for editing.</p><HomeHeroView design={d} sections={sections} cycles={cycles} preview /></div>
    <button disabled={busy || !validHeroDesign(d)} onClick={onSave} className="rounded-full bg-[#E85D2A] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">Save hero design</button>
  </div>;
}
