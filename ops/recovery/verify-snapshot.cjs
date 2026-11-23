const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const blake3=require(process.env.BLAKE3_MODULE_PATH||'blake3-wasm');
const root=path.resolve(__dirname,'../..');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file)));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
let workerModules=0,assets=0,sourceFiles=0;
for(const name of fs.readdirSync(path.join(root,'production/workers'))){
 const directory='production/workers/'+name;
 const deployment=read(directory+'/deployment.json');
 assert.equal(deployment.secret_values_included,false);
 for(const module of deployment.modules){
  const bytes=fs.readFileSync(path.join(root,directory,module.file));
  assert.equal(bytes.length,module.bytes);assert.equal(sha(bytes),module.sha256);workerModules++;
 }
}
const recovery=read('production/state/pages-asset-recovery.json');
for(const file of recovery.files){
 if(file.status!=='verified_exact')continue;
 const bytes=fs.readFileSync(path.join(root,'production/pages-assets',file.file));
 const originalHash=blake3.hash(bytes.toString('base64')+path.extname(file.file).slice(1)).toString('hex').slice(0,32);
 assert.equal(originalHash,file.expectedHash,file.file);assert.equal(sha(bytes),file.sha256,file.file);assets++;
}
for(const file of read('production/state/workspace-source-inventory.json').files){
 const bytes=fs.readFileSync(path.join(root,file.file));assert.equal(sha(bytes),file.sha256,file.file);sourceFiles++;
}
assert.equal(assets,recovery.summary.recovered_exact_assets);
const schema=read('production/state/database-schema.json');
assert.ok(schema.every(row=>['table','index','trigger','view'].includes(row.type)&&/^CREATE\s/i.test(row.sql)));
const state=read('production/state/recovery-status.json');
assert.equal(state.pages_functions_source_complete,false);
const currentPath=path.join(root,'production/current-release.json');
if(fs.existsSync(currentPath)){
 const current=JSON.parse(fs.readFileSync(currentPath));
 const folder=path.join(root,current.artifact_directory),manifest=JSON.parse(fs.readFileSync(path.join(folder,'asset-manifest.json')));
 assert.equal(sha(fs.readFileSync(path.join(folder,'pages-worker.bundle'))),current.backend_bundle_sha256);
 const changed=new Set(current.checkout_changes.map(item=>item.file));
 const baseline=read('production/state/pages-asset-manifest.json');
 const retained=current.opus_pay_restoration?.preserved_non_payment_hashes||{};
 if(current.opus_pay_restoration){const previous=JSON.parse(fs.readFileSync(path.join(folder,'previous-live-asset-manifest.json')));for(const[file,hash]of Object.entries(retained)){assert.equal(previous[file],hash);assert.equal(manifest[file],hash);}}
 for(const file of ['/admin/index.html','/admin/index.txt','/sysadmin/index.html','/sysadmin/index.txt'])assert.equal(manifest[file],retained[file]||baseline[file],'Protected admin hash: '+file);
 for(const [file,hash] of Object.entries(baseline))if(!changed.has(file))assert.equal(manifest[file],retained[file]||hash,file);
 for(const item of current.checkout_changes){const bytes=fs.readFileSync(path.join(folder,'assets',item.file));assert.equal(bytes.length,item.bytes);assert.equal(blake3.hash(bytes.toString('base64')+path.extname(item.file).slice(1)).toString('hex').slice(0,32),manifest[item.file]);}
 assert.equal(changed.size,current.checkout_changes.length,'Duplicate release artifact paths');
 assert.ok(changed.size>=4);
 const seoConfig=read('ops/site/seo-routes.json');
 const seoFiles=new Set([...seoConfig.routes,...Object.keys(seoConfig.aliases)].map(r=>r==='/'?'/index.html':r+'index.html').concat(['/sitemap.xml','/care/index.txt']));
 for(const file of changed)assert.ok((current.opus_pay_restoration&&manifest[file]===read('ops/activation/opus-pay-lock.json').assets[file])||(current.domain_branding?.assets||[]).includes(file)||(current.public_content_release&&['/about/index.html','/about/index.txt','/privacy/index.html','/privacy/index.txt','/terms/index.html','/terms/index.txt','/documents/opus-privacy-policy-2026-11-19.pdf','/documents/opus-terms-of-service-2026-11-19.pdf'].includes(file))||(current.seo_release&&(seoFiles.has(file)||/^\/_next\/static\/chunks\/app\/care\/page-[a-f0-9]+\.js$/.test(file)))||(current.shared_cookie_consent?.public_html||[]).includes(file)||file==='/cookie-policy/index.html'||file.startsWith('/shared-privacy/consent-')||(current.opus_pay_restoration&&file.startsWith('/_next/'))||/^\/payments\/index\.(html|txt)$|^\/_next\/static\/(chunks\/app\/payments\/|css\/opus-pay-)|^\/images\/(payments|opus-pay)\/|^\/fonts\/(poppins-latin-|OFL\.txt$)/.test(file),'Non-checkout release artifact: '+file);
 assert.equal(current.automatic_github_next_deployment_enabled,false);
 console.log('Verified current release bundle, '+changed.size+' release artifacts and preserved baseline asset hashes.');
}
console.log(JSON.stringify({worker_modules_verified:workerModules,exact_pages_assets_verified:assets,source_files_verified:sourceFiles,database_schema_objects:schema.length,pages_function_source_complete:false}));
