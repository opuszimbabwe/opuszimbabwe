// Idempotent SEO metadata/Care fallback transform against preserved assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const config=require('../ops/site/seo-routes.json');
module.exports=function({read,save}){
// The published Care component renders null until its API responds. Give that
// exact module a non-price fallback; SSR and the first client render match.
const intro='Ongoing care for websites, software and digital systems. Clear monthly limits. A report you can understand.';
const fallback='(0,n.jsxs)("section",{id:"care",className:"care-public-band",children:[(0,n.jsx)(o.d,{}),(0,n.jsx)(o.Z,{}),(0,n.jsxs)("div",{className:"site-frame care-public",children:[(0,n.jsxs)("div",{className:"care-public-heading",children:[(0,n.jsxs)("h2",{children:["Keep your business",(0,n.jsx)("br",{}),(0,n.jsx)("span",{className:"textured-accent",children:"moving."})]}),(0,n.jsx)("p",{children:'+JSON.stringify(intro)+'})]}),(0,n.jsx)("p",{children:(0,n.jsx)(a.default,{href:"/contact/?service=Monthly%20care",children:"Discuss monthly care"})})]}),(0,n.jsx)(o.d,{bottom:!0})]})';
const old='/_next/static/chunks/app/care/page-63c0f9d2f3e0056a.js';let chunk=read(old);const anchor='}):null}},8030:';if(chunk.split(anchor).length!==2)throw Error('Care fallback anchor changed');chunk=chunk.replace(anchor,'}):'+fallback+'}},8030:');
const newChunk=old.replace('63c0f9d2f3e0056a',crypto.createHash('sha256').update(chunk).digest('hex').slice(0,16));save(newChunk,chunk);
// Reuse the preserved component's JSX and shared runtime for exact SSR output.
let mods;new Function('self',chunk)({webpackChunk_N_E:{push:([,m])=>{mods=m}}});const React=require('react'),jsx=require('react/jsx-runtime'),ssr=require('react-dom/server');
let component;
const cache={};function req(id){if(id===7437)return jsx;if(id===2265)return React;if(id===7138)return {default:({href,children,...props})=>jsx.jsx('a',{href,...props,children})};if(cache[id])return cache[id].exports;const m=cache[id]={exports:{}};mods[id](m,m.exports,req);return m.exports;}req.d=(obj,defs)=>{for(const [k,v]of Object.entries(defs))Object.defineProperty(obj,k,{get:v})};
component=req(6149).default;const markup=ssr.renderToString(React.createElement(component));
for(const file of ['/care/index.html','/care/index.txt']){let text=read(file).replaceAll(path.basename(old),path.basename(newChunk));if(file.endsWith('.html')){const anchor='<main class="bg-white pt-24 text-[#0f0928]"></main>';if(text.includes(anchor))text=text.replace(anchor,anchor.replace('</main>',markup+'</main>'));else if(!text.includes(markup))throw Error('Care SSR anchor changed');}save(file,text);}
for(const route of [...config.routes,...Object.keys(config.aliases)]){
 const file=route==='/'?'/index.html':route+'index.html';let html=read(file);html=html.replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/g,'');
 save(file,html.replace('</head>','<link rel="canonical" href="'+config.origin+(config.aliases[route]||route)+'"/></head>'));
}
save('/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+config.routes.map(r=>'<url><loc>'+config.origin+r+'</loc></url>').join('\n')+'\n</urlset>\n');
return {care_chunk:newChunk};
};
