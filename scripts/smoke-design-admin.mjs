// Mutates LOCAL test content and restores it. Never run against production.
import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:8788';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local test servers only.');
const headers = { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'local-design-test', 'Content-Type': 'application/json' };
const get = async () => { const r = await fetch(base + '/api/content'); assert.equal(r.status, 200); return r.json(); };
async function put(path, body, status = 200) {
  const r = await fetch(base + path, { method: 'PUT', headers, body: JSON.stringify(body) });
  assert.equal(r.status, status, `${path}: ${await r.text()}`);
}
const before = await get();
const defaults = { background_color: '#0d0d0d', background_image: '', overlay_kind: 'solid', overlay_color: '#0d0d0d', overlay_gradient: '160deg,#0d0d0d,#E85D2A', overlay_opacity: 0.65 };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
let passed = 0;
try {
  const logos = [];
  for (let i = 0; i < 7; i++) {
    const form = new FormData(); form.append('file', new Blob([png], { type: 'image/png' }), `logo-${i}.png`);
    const response = await fetch(base + '/api/admin/upload', { method: 'POST', headers: { 'Cf-Access-Authenticated-User-Email': headers['Cf-Access-Authenticated-User-Email'], 'Cf-Access-Jwt-Assertion': headers['Cf-Access-Jwt-Assertion'] }, body: form });
    assert.equal(response.status, 200); const upload = await response.json();
    const media = await fetch(base + upload.url); assert.equal(media.status, 200); assert.deepEqual(Buffer.from(await media.arrayBuffer()), png);
    logos.push(upload.url);
  }
  console.log('PASS: 7 new logos uploaded and served byte-for-byte from R2'); passed++;
  const methods = logos.map((logo, i) => ({ id: `design-test-${i}`, name: `Replacement ${i}`, logo, visible: true }));
  const partners = logos.map((logo, i) => ({ id: `design-partner-${i}`, name: `Partner ${i}`, logo, url: '', bg_color: '#ffffff', visible: true }));
  await put('/api/admin/settings', { payment_methods: methods });
  await put('/api/admin/partners', { partners });
  let content = await get();
  assert.deepEqual(content.settings.payment_methods, methods);
  assert.deepEqual(content.partners.map(p => p.logo), logos);
  console.log('PASS: every old payment/partner logo replaced; all 7 survive public reads'); passed++;
  await put('/api/admin/settings', { payment_methods: methods.map((m, i) => i === 2 ? { ...m, logo: 'broken-relative-logo.png' } : m) }, 400);
  await put('/api/admin/partners', { partners: [...partners, partners[0]] }, 400);
  content = await get(); assert.deepEqual(content.settings.payment_methods, methods); assert.equal(content.partners.length, 7);
  console.log('PASS: invalid saves rejected atomically without reducing either list'); passed++;
  await put('/api/admin/settings', { payment_methods: [] }); await put('/api/admin/partners', { partners: [] });
  content = await get(); assert.deepEqual(content.settings.payment_methods, []); assert.deepEqual(content.partners, []);
  console.log('PASS: intentional empty lists stay empty'); passed++;
  const cta = { ...defaults, background_image: logos[0], overlay_kind: 'gradient', overlay_gradient: '90deg,#0d0d0d,#E85D2A', overlay_opacity: 0.75 };
  const contact = { ...defaults, background_color: '#E85D2A', background_image: logos[1], overlay_opacity: 0.4 };
  await put('/api/admin/settings', { cta_design: cta, contact_hero_design: contact });
  content = await get(); assert.deepEqual(content.settings.cta_design, cta); assert.deepEqual(content.settings.contact_hero_design, contact);
  await put('/api/admin/settings', { cta_design: { ...cta, background_image: 'javascript:alert(1)' } }, 400);
  await put('/api/admin/settings', { contact_hero_design: { ...contact, overlay_opacity: 3 } }, 400);
  content = await get(); assert.deepEqual(content.settings.cta_design, cta); assert.deepEqual(content.settings.contact_hero_design, contact);
  console.log('PASS: CTA/contact backgrounds persist and reject unsafe values'); passed++;
} finally {
  await put('/api/admin/partners', { partners: before.partners });
  await put('/api/admin/settings', { payment_methods: before.settings.payment_methods, cta_design: before.settings.cta_design || defaults, contact_hero_design: before.settings.contact_hero_design || { ...defaults, background_color: '#E85D2A', overlay_opacity: 0 } });
}
console.log(`${passed} design/admin API checks passed; original content restored.`);
