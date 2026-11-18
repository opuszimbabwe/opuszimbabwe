// Patch the active snapshot only. Never rebuild the legacy Next website.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),blake3=require('blake3-wasm');
const root=path.resolve(__dirname,'..'),current=require('../production/current-release.json'),config=require('../ops/site/seo-routes.json');
const active=path.join(root,current.artifact_directory),out='/tmp/opus-seo-release';
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(active,'assets'),path.join(out,'assets'),{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(active,'asset-manifest.json'))),changes=new Map(current.checkout_changes.map(c=>[c.file,c]));
const seo=[];function read(file){const a=path.join(out,'assets',file);return fs.readFileSync(fs.existsSync(a)?a:path.join(root,'production/pages-assets',file),'utf8');}
function save(file,text){const bytes=Buffer.from(text),p=path.join(out,'assets',file);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);manifest[file]=blake3.hash(bytes.toString('base64')+path.extname(file).slice(1)).toString('hex').slice(0,32);changes.set(file,{file,hash:manifest[file],bytes:bytes.length});if(!seo.includes(file))seo.push(file);}
const {care_chunk:newChunk}=require('./seo-assets.cjs')({read,save});
fs.writeFileSync(out+'/manifest.json',JSON.stringify(manifest));fs.writeFileSync(out+'/changes.json',JSON.stringify({baseline_deployment:current.deployment_id,changes:[...changes.values()],seo_assets:seo,care_chunk:newChunk,shared_cookie_consent:current.shared_cookie_consent},null,2));console.log(JSON.stringify({out,seo_assets:seo.length,retained_assets:Object.keys(manifest).length}));
