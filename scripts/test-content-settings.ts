import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSetting } from '../functions/_lib/db';
import { normalizeContent } from '../lib/content';
import { DEFAULT_CTA_DESIGN, DEFAULT_CONTACT_DESIGN } from '../lib/section-design';

const raw = (settings = {}, partners: unknown[] = []) => ({ services: [], pricing: [], partners, settings });
test('payment logo updates never silently discard rows', () => {
  const methods = Array.from({ length: 7 }, (_, i) => ({ id: `new-${i}`, name: `Method ${i}`, logo: `/api/media/img_${i.toString(16)}.png`, visible: true }));
  const saved = sanitizeSetting('payment_methods', methods);
  assert.ok(saved);
  assert.deepEqual(JSON.parse(saved), methods);
  const invalid = methods.map((m, i) => i === 3 ? { ...m, logo: 'javascript:alert(1)' } : m);
  assert.equal(sanitizeSetting('payment_methods', invalid), null);
  assert.equal(sanitizeSetting('payment_methods', [...methods, methods[0]]), null);
  assert.equal(sanitizeSetting('payment_methods', {}), null);
});
test('intentional removal of all logos stays empty through public normalization', () => {
  assert.equal(sanitizeSetting('payment_methods', []), '[]');
  const content = normalizeContent(raw({ payment_methods: [] }));
  assert.ok(content);
  assert.deepEqual(content.settings.payment_methods, []);
  assert.deepEqual(content.partners, []);
});
test('new and replaced partner logos survive normalization with visibility', () => {
  const partners = Array.from({ length: 8 }, (_, i) => ({ id: `partner-${i}`, name: `Partner ${i}`, logo: `/api/media/img_${i.toString(16)}.svg`, visible: true }));
  const content = normalizeContent(raw({}, partners));
  assert.ok(content);
  assert.equal(content.partners.length, 8);
  assert.deepEqual(content.partners.map(p => p.logo), partners.map(p => p.logo));
});
test('both background designs round-trip from admin validation to public render model', () => {
  const cta = { ...DEFAULT_CTA_DESIGN, background_image: '/api/media/img_abc.png', overlay_kind: 'gradient' as const, overlay_gradient: '90deg,#0d0d0d,#E85D2A', overlay_opacity: 0.7 };
  const contact = { ...DEFAULT_CONTACT_DESIGN, background_image: 'https://example.com/contact.webp', overlay_opacity: 0.5 };
  for (const [key, design] of [['cta_design', cta], ['contact_hero_design', contact]] as const) {
    assert.deepEqual(JSON.parse(sanitizeSetting(key, design)!), design);
    assert.equal(sanitizeSetting(key, { ...design, overlay_opacity: 1.1 }), null);
    assert.equal(sanitizeSetting(key, { ...design, background_image: 'javascript:alert(1)' }), null);
    assert.equal(sanitizeSetting(key, { ...design, overlay_gradient: 'url(https://example.com)' }), null);
  }
  const content = normalizeContent(raw({ cta_design: cta, contact_hero_design: contact }));
  assert.deepEqual(content?.settings.cta_design, cta);
  assert.deepEqual(content?.settings.contact_hero_design, contact);
});

import { DEFAULT_HERO_DESIGN, heroPreset, validHeroDesign } from '../lib/hero-design';
test('hero presets validate and round-trip through the public content model', () => {
  for (const name of ['current', 'classic', 'campaign', 'full_bleed', 'centered_card'] as const) {
    const hero = heroPreset(name);
    assert.ok(validHeroDesign(hero), name);
    const saved = sanitizeSetting('hero_design', hero);
    assert.ok(saved);
    assert.deepEqual(normalizeContent(raw({ hero_design: JSON.parse(saved) }))?.settings.hero_design, hero);
  }
  assert.deepEqual(normalizeContent(raw())?.settings.hero_design, DEFAULT_HERO_DESIGN);
});
test('hero controls reject unsafe links, images, dimensions and invalid animation timing', () => {
  const d = structuredClone(DEFAULT_HERO_DESIGN);
  for (const patch of [
    { button_href: 'javascript:alert(1)' }, { secondary_href: '//evil.test' }, { media_image: 'data:text/html,x' },
    { heading_size: 999 }, { interval_ms: 50 }, { transition_ms: 2000, interval_ms: 3000 },
    { background: { ...d.background, background_image: 'javascript:alert(1)' } },
    { backgrounds: [{ id: 'a', image: '/images/logo-full.png' }, { id: 'a', image: '/images/hero-bg.jpg' }] },
  ]) assert.equal(sanitizeSetting('hero_design', { ...d, ...patch }), null);
  assert.ok(sanitizeSetting('hero_design', { ...d, button_href: '#services' }));
});

test('all removable admin lists remain empty; malformed lists never partially save', () => {
  const keys = ['payment_methods', 'faq_home', 'faq_page', 'approach_items', 'why_choose_us', 'footer_socials', 'contact_cards'] as const;
  for (const key of keys) {
    assert.equal(sanitizeSetting(key, []), '[]', key);
    assert.equal(sanitizeSetting(key, [null]), null, key);
    assert.deepEqual(normalizeContent(raw({ [key]: [] }))?.settings[key], [], key);
  }
});
test('legacy hero settings keep their layout when independent corners and guide actions are introduced', () => {
  const legacy = structuredClone(DEFAULT_HERO_DESIGN) as any;
  legacy.secondary_label = 'See our work'; legacy.secondary_href = '/projects/';
  legacy.layout = 'full_bleed'; legacy.heading_size = 88; legacy.headline = 'Existing custom title';
  for (const key of ['corner_mode', 'top_left_radius', 'top_right_radius', 'bottom_left_radius', 'bottom_right_radius', 'secondary_action']) delete legacy[key];
  const saved = sanitizeSetting('hero_design', legacy);
  assert.ok(saved); const updated = JSON.parse(saved);
  assert.equal(updated.heading_size, 88); assert.equal(updated.headline, 'Existing custom title'); assert.equal(updated.layout, 'full_bleed');
  assert.equal(updated.corner_mode, 'layout');
  assert.equal(updated.secondary_action, 'link');
  assert.equal(updated.secondary_href, '/projects/');
  const campaign = heroPreset('campaign');
  assert.equal(campaign.top_left_radius, 0); assert.equal(campaign.top_right_radius, 0); assert.equal(campaign.bottom_left_radius, 64); assert.equal(campaign.bottom_right_radius, 64);
});

test('legacy hero layout stays static and new service-word fields survive saves', () => {
  const legacy = { ...heroPreset('classic') } as any;
  for (const key of ['headline_mode', 'caption_gap', 'caption_size', 'caption_weight']) delete legacy[key];
  const saved = JSON.parse(sanitizeSetting('hero_design', legacy)!);
  assert.equal(saved.headline_mode, 'static'); assert.equal(saved.text_position, 'left');
  assert.equal(saved.caption_size, 16); assert.equal(saved.caption_gap, 20);
  const cycles = [{ headline_word: 'Our Custom Website Team', question: 'Classic question?', solution: 'Our service description.', image: '/images/hero-website-design.png', href: '/services/web-design/' }];
  const result = JSON.parse(sanitizeSetting('hero_cycles', cycles)!);
  assert.equal(result[0].headline_word, cycles[0].headline_word);
  assert.equal(normalizeContent(raw({ hero_cycles: result }))?.settings.hero_cycles[0].headline_word, cycles[0].headline_word);
});

test('reason accordion keeps administrator copy, links and payment controls', () => {
  const reasons = [{ title: 'Our own title', body: 'Our own details.', icon: '', show_payments: true, cta_label: 'Discuss this', cta_href: '/contact/' }];
  const saved = sanitizeSetting('why_choose_us', reasons); assert.ok(saved);
  assert.deepEqual(normalizeContent(raw({ why_choose_us: JSON.parse(saved) }))?.settings.why_choose_us, reasons);
  assert.equal(sanitizeSetting('why_choose_us', [{ ...reasons[0], cta_href: 'javascript:alert(1)' }]), null);
  assert.equal(sanitizeSetting('why_choose_us', [{ ...reasons[0], cta_href: {} }]), null);
  const legacy = JSON.parse(sanitizeSetting('why_choose_us', [{ title: 'Local Payments', body: 'Legacy copy' }])!);
  assert.equal(legacy[0].show_payments, true);
});
