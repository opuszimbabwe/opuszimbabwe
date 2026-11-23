// Build only the checkout module against the preserved Next runtime.
// Never run a legacy full-site Next build for production.
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild'),blake3=require('blake3-wasm');
const root=path.resolve(__dirname,'..'),out='/tmp/opus-pay-release';
const original=JSON.parse(fs.readFileSync(path.join(root,'production/state/pages-asset-manifest.json'))),manifest={...original},changes=[];
const hash=(bytes,file)=>blake3.hash(bytes.toString('base64')+path.extname(file).slice(1)).toString('hex').slice(0,32);
function save(file,bytes){const target=path.join(out,'assets',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);manifest[file]=hash(bytes,file);changes.push({file,hash:manifest[file],bytes:bytes.length});}
async function main(){
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const options={entryPoints:[path.join(root,'components/PaymentCheckout.tsx')],bundle:true,format:'cjs',platform:'browser',jsx:'automatic',external:['react','react/jsx-runtime'],write:false,define:{'process.env.NODE_ENV':'"production"'},tsconfig:path.join(root,'tsconfig.json'),logLevel:'warning',minify:true};
 const built=await esbuild.build(options),body=built.outputFiles[0].text;
 const chunk=`(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3074],{1840:function(e,t,n){Promise.resolve().then(n.bind(n,3196))},3196:function(e,t,n){"use strict";var m={exports:{}};(function(module,exports,require){${body}\n})(m,m.exports,function(name){if(name==='react')return n(2265);if(name==='react/jsx-runtime')return n(7437);throw Error('Unexpected checkout dependency: '+name)});n.d(t,{default:function(){return m.exports.default}})}},function(e){e.O(0,[2971,7023,1744],function(){return e(e.s=1840)});_N_E=e.O()}]);`;
 const old='/_next/static/chunks/app/payments/page-fec90863f26d70c5.js',newChunk='/_next/static/chunks/app/payments/page-'+hash(Buffer.from(chunk),old).slice(0,16)+'.js';save(newChunk,Buffer.from(chunk));
 const css=fs.readFileSync(path.join(root,'components/opus-pay.css'));const cssPath='/_next/static/css/opus-pay-'+hash(css,'.css').slice(0,16)+'.css';save(cssPath,css);
 const ssr=await esbuild.build({...options,platform:'node',external:['react','react/jsx-runtime'],minify:false});
 const Module=require('node:module'),serverModule=new Module(path.join(root,'components/.opus-pay-ssr.cjs'),module);serverModule.filename=path.join(root,'components/.opus-pay-ssr.cjs');serverModule.paths=Module._nodeModulePaths(root);serverModule._compile(ssr.outputFiles[0].text,serverModule.filename);
 const React=require('react'),{renderToString}=require('react-dom/server');const markup=renderToString(React.createElement(serverModule.exports.default));
 for(const file of ['/payments/index.html','/payments/index.txt']){
  let source=fs.readFileSync(path.join(root,'production/pages-assets',file),'utf8');if(!source.includes(path.basename(old)))throw Error('Published runtime anchor changed');
  source=source.replaceAll(path.basename(old),path.basename(newChunk));
  if(file.endsWith('.html')){
   if(!/<main class="payment-page"[\s\S]*?<\/main>/.test(source))throw Error('Published checkout HTML anchor changed');
   source=source.replace(/<main class="payment-page"[\s\S]*?<\/main>/,markup);
   source=source.replace('</head>',`<link rel="stylesheet" href="${cssPath}"/><link rel="preload" href="/fonts/poppins-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin="anonymous"/><meta property="og:title" content="Opus Pay | Secure Payments"/><meta property="og:description" content="Pay Opus Zimbabwe securely by card or mobile wallet."/><meta property="og:url" content="https://payments.opuszim.co.zw/"/><meta property="og:image" content="https://payments.opuszim.co.zw/images/opus-pay/social-preview.png"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:card" content="summary_large_image"/></head>`);
  }
  save(file,Buffer.from(source));
 }
 const publicFiles=['images/logo-full.png','images/ecocash-logo.png',...fs.readdirSync(path.join(root,'public/images/opus-pay')).map(f=>'images/opus-pay/'+f),...['zimswitch.png','innbucks.png','omari.webp','onemoney.png','telecash.png'].map(f=>'images/payments/'+f),...fs.readdirSync(path.join(root,'public/fonts')).map(f=>'fonts/'+f)];
 for(const file of publicFiles){const bytes=fs.readFileSync(path.join(root,'public',file)),url='/'+file;if(manifest[url]!==hash(bytes,url))save(url,bytes)}
 for(const [file,digest] of Object.entries(original))if(!changes.some(c=>c.file===file)&&manifest[file]!==digest)throw Error('Unexpected non-checkout asset change');
 const current=JSON.parse(fs.readFileSync(path.join(root,'production/current-release.json')));
 const consentEnabled=process.argv.includes('--shared-cookie-choice')||Boolean(current.shared_cookie_consent);
 const sharedConsent=consentEnabled?require('./shared-cookie-assets.cjs')({root,out,original,changes,save}):undefined;
 let seoRelease;
 if(current.seo_release){
  const seoAssets=[];const saveSeo=(file,bytes)=>{const index=changes.findIndex(c=>c.file===file);if(index>=0)changes.splice(index,1);save(file,Buffer.from(bytes));seoAssets.push(file)};
  const readSeo=file=>fs.readFileSync(fs.existsSync(path.join(out,'assets',file))?path.join(out,'assets',file):path.join(root,'production/pages-assets',file),'utf8');
  seoRelease={...require('./seo-assets.cjs')({read:readSeo,save:saveSeo}),assets:seoAssets};
 }
 let publicContent;
 if(current.public_content_release){
  const readPublic=file=>fs.readFileSync(fs.existsSync(path.join(out,'assets',file))?path.join(out,'assets',file):path.join(root,'production/pages-assets',file),'utf8');
  const savePublic=(file,text)=>{const index=changes.findIndex(c=>c.file===file);if(index>=0)changes.splice(index,1);save(file,Buffer.from(text))};
  publicContent=await require('./content/site-content.cjs')({root,read:readPublic,save:savePublic});
 }
 const metadata={public_content_release:publicContent,seo_release:seoRelease,shared_cookie_consent:sharedConsent,baseline_deployment:JSON.parse(fs.readFileSync(path.join(root,'production/current-release.json'))).deployment_id,checkout_chunk:newChunk,checkout_css:cssPath,changes,original_asset_paths_retained:Object.keys(original).length,protected_admin_assets_reused:true};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));fs.writeFileSync(path.join(out,'changes.json'),JSON.stringify(metadata,null,2));console.log(JSON.stringify({directory:out,assets:Object.keys(manifest).length,changes:changes.map(c=>c.file)}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
