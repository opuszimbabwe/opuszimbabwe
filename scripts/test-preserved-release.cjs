// Artifact integrity checks. No provider requests or production writes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),blake3=require('blake3-wasm');
const root=path.resolve(__dirname,'..'),release='/tmp/opus-mastercard-release';
const original=JSON.parse(fs.readFileSync(path.join(root,'production/state/pages-asset-manifest.json'))),manifest=JSON.parse(fs.readFileSync(release+'/manifest.json')),metadata=JSON.parse(fs.readFileSync(release+'/changes.json'));
assert.equal(Object.keys(original).length,459);assert.equal(Object.keys(manifest).length,461);
const changed=new Set(metadata.changes.map(x=>x.file));assert.equal(changed.size,4);
for(const [file,hash] of Object.entries(original))if(!changed.has(file))assert.equal(manifest[file],hash,file);
for(const file of ['/admin/index.html','/admin/index.txt','/sysadmin/index.html','/sysadmin/index.txt'])assert.equal(manifest[file],original[file]);
for(const item of metadata.changes){const bytes=fs.readFileSync(path.join(release,'assets',item.file));assert.equal(bytes.length,item.bytes);assert.equal(blake3.hash(bytes.toString('base64')+path.extname(item.file).slice(1)).toString('hex').slice(0,32),manifest[item.file]);}
const js=fs.readFileSync(path.join(release,'assets',metadata.checkout_chunk),'utf8');assert.ok(js.includes('[/^master\\s?card$/i,"/images/payments/mastercard.svg"'));assert.ok(js.includes('["PayPal","Visa"]'));assert.ok(!js.includes('["PayPal","Visa","Mastercard"]'));
for(const file of ['/payments/index.html','/payments/index.txt']){const contents=fs.readFileSync(path.join(release,'assets',file),'utf8');assert.ok(contents.includes(path.basename(metadata.checkout_chunk)));assert.ok(!contents.includes('page-fec90863f26d70c5.js'));}
const html=fs.readFileSync(release+'/assets/payments/index.html','utf8');const section=/<div class="payment-international">[\s\S]*?<\/div><\/div>/.exec(html)[0];assert.ok(!section.includes('Mastercard'));assert.ok(section.includes('Other payment methods'));assert.equal((section.match(/<button\b/g)||[]).length,2);
console.log('PASS: all 459 original paths retained; four protected admin assets unchanged; only checkout changes, matching SSR and client chunk, content hashes and Mastercard branding.');
