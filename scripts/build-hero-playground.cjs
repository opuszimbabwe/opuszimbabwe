// Generate a browser-only design playground inside the isolated preview staging output.
// This does not add an editor route to production or expose an admin write API.
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const { createHash } = require('node:crypto');
const repo = path.resolve(__dirname, '..');
const staging = '/workspace/scratch/opus-visual-preview';
const entry = path.join(staging, 'hero-playground-entry.tsx');
fs.mkdirSync(staging, { recursive: true });
fs.writeFileSync(entry, `
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import HeroDesignEditor from '${repo}/components/admin/HeroDesignEditor';
import { HomeHeroView } from '${repo}/components/HomeHero';
import { DEFAULT_HERO_DESIGN, upgradeHeroDesign } from '${repo}/lib/hero-design';
import { DEFAULT_HOME_SECTIONS, DEFAULT_HERO_CYCLES } from '${repo}/lib/content';
const storageKey = 'opus-hero-playground-service-words-draft';
function App() {
 const [draft, setDraft] = useState(() => { try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); return upgradeHeroDesign(saved) || structuredClone(DEFAULT_HERO_DESIGN); } catch { return structuredClone(DEFAULT_HERO_DESIGN); } });
 const [message, setMessage] = useState('');
 const demo = new URLSearchParams(location.search).get('view') === 'hero';
 if (demo) return <><div className="bg-white px-6 py-4 text-sm"><a className="underline" href="hero-playground.html">Back to hero controls</a><span className="ml-6 text-black/60">Browser-only draft. Main site unchanged.</span></div><HomeHeroView design={draft} sections={DEFAULT_HOME_SECTIONS} cycles={DEFAULT_HERO_CYCLES} /></>;
 return <main className="mx-auto max-w-[1440px] p-6 sm:p-10"><a href="/" className="text-sm underline">Back to website preview</a><h1 className="mt-6 text-3xl font-bold">Try the hero controls</h1><p className="mt-4 mb-3 text-sm text-black/65">This playground changes only this browser’s draft. It cannot edit the live site. File uploads and publishing belong to the authenticated admin; here you can try presets, copy, colours, image URLs and layout controls.</p><a href="hero-playground.html?view=hero" className="mb-8 inline-flex rounded-full bg-[#0d0d0d] px-5 py-3 text-sm font-semibold text-white">View saved draft at full width</a><p role="status" className="mb-4 text-sm font-medium">{message}</p><HeroDesignEditor value={draft} onChange={setDraft} onUpload={() => setMessage('File uploads are available in the authenticated admin. Use a /images/… or HTTPS image URL in this playground.')} onSave={() => { try { localStorage.setItem(storageKey, JSON.stringify(draft)); setMessage('Draft saved in this browser only. Open the full-width view above to try rotation.'); } catch { setMessage('Browser storage is unavailable; the layout preview still works.'); } }} busy={false} sections={DEFAULT_HOME_SECTIONS} cycles={DEFAULT_HERO_CYCLES} /></main>;
}
createRoot(document.getElementById('hero-studio-root')!).render(<App />);
`);
(async () => {
 const output = path.join(staging, 'out');
 const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
 const fontsClass = (html.match(/<html[^>]*class="([^"]+)"/) || [])[1] || '';
 const styles = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)].map(m => m[0]).join('\n');
 await esbuild.build({ entryPoints: [entry], outfile: path.join(output, 'hero-playground.js'), bundle: true, minify: true, platform: 'browser', format: 'esm', jsx: 'automatic', tsconfig: path.join(repo, 'tsconfig.json'), nodePaths: [path.join(repo, 'node_modules')], define: { 'process.env': JSON.stringify({ NODE_ENV: 'production' }) } });
 const revision = createHash('sha256').update(fs.readFileSync(path.join(output, 'hero-playground.js'))).digest('hex').slice(0, 12);
 fs.writeFileSync(path.join(output, 'hero-playground.html'), '<!doctype html><html lang="en" class="' + fontsClass + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Opus — Hero design playground</title>' + styles + '</head><body class="font-poppins bg-[#f8f8f6] text-[#0d0d0d]"><div id="hero-studio-root"></div><script type="module" src="/hero-playground.js?v=' + revision + '"></script></body></html>');
 console.log('Built preview-only hero playground; no production routes or admin write access added.');
})().catch(error => { console.error(error); process.exit(1); });
