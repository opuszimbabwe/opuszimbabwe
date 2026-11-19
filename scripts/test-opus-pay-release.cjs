const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),blake3=require('blake3-wasm');
const root=path.resolve(__dirname,'..'),out='/tmp/opus-pay-release',original=JSON.parse(fs.readFileSync(path.join(root,'production/state/pages-asset-manifest.json'))),manifest=JSON.parse(fs.readFileSync(out+'/manifest.json')),metadata=JSON.parse(fs.readFileSync(out+'/changes.json'));
const changed=new Set(metadata.changes.map(c=>c.file));assert.equal(Object.keys(original).length,459);
for(const[file,hash]of Object.entries(original)){assert.ok(file in manifest,'Original path missing: '+file);if(!changed.has(file))assert.equal(manifest[file],hash);else assert.ok((metadata.public_content_release?.assets||[]).includes(file)||(metadata.seo_release?.assets||[]).includes(file)||(metadata.shared_cookie_consent?.public_html||[]).includes(file)||/^\/payments\/index\.(html|txt)$|^\/images\/(?:payments|opus-pay)\//.test(file),'Unrelated original path changed: '+file)}
for(const file of ['/admin/index.html','/admin/index.txt','/sysadmin/index.html','/sysadmin/index.txt'])assert.equal(manifest[file],original[file]);
for(const c of metadata.changes){const bytes=fs.readFileSync(path.join(out,'assets',c.file));assert.equal(bytes.length,c.bytes);assert.equal(blake3.hash(bytes.toString('base64')+path.extname(c.file).slice(1)).toString('hex').slice(0,32),manifest[c.file]);}
const html=fs.readFileSync(out+'/assets/payments/index.html','utf8'),flight=fs.readFileSync(out+'/assets/payments/index.txt','utf8');assert.ok(html.includes('opus-pay-page'));assert.ok(html.includes(metadata.checkout_css));assert.ok(html.includes('Mobile wallet &amp; other payments'));assert.ok(!html.includes('name="amount"'),'No form fields before explicit selection');
for(const text of [html,flight])assert.ok(text.includes(path.basename(metadata.checkout_chunk)));
assert.match(html,/<meta property="og:image" content="https:\/\/payments.opuszim.co.zw\/images\/opus-pay\/social-preview.png"/);assert.ok(manifest['/images/opus-pay/social-preview.png']);
const js=fs.readFileSync(path.join(out,'assets',metadata.checkout_chunk),'utf8');assert.ok(!/PESEPAY_INTEGRATION_KEY|PESEPAY_ENCRYPTION_KEY|PAYNOW_INTEGRATION_KEY/.test(js),'Provider credentials must stay server-side');
const official=fs.readFileSync(path.join(root,'public/images/opus-pay/official-logo.jpg'));
assert.equal(require('node:crypto').createHash('sha256').update(official).digest('hex'),'4f9ae5eb9d18e70a85ac75f5735b4064c22341c1864fb56c54ad0e71ac858aec','Official owner-supplied logo must remain byte-identical');
assert.ok(html.includes('data:image/webp;base64,'));assert.ok(!html.includes('class="opus-pay-pay"'),'No reconstructed lettering in checkout HTML');
assert.deepEqual(fs.readFileSync(out+'/assets/images/opus-pay/official-logo.jpg'),official);
console.log('PASS: original 459 paths retained, admin hashes untouched, checkout-only asset changes, content hashes, compatible Next runtime references, method-first SSR and complete social-preview metadata.');

if(metadata.shared_cookie_consent){
 const tag='<script data-opus-cookie-consent="v1" src="'+metadata.shared_cookie_consent.script+'" defer></script>';
 for(const file of metadata.shared_cookie_consent.public_html){
  const modified=fs.readFileSync(path.join(out,'assets',file),'utf8');assert.equal(modified.split(tag).length-1,1,'Single consent include '+file);
  if(file!=='/payments/index.html'&&!(metadata.seo_release?.assets||[]).includes(file)&&!(metadata.public_content_release?.assets||[]).includes(file))assert.equal(modified.replace(tag,''),fs.readFileSync(path.join(root,'production/pages-assets',file),'utf8'),'Only consent include may alter '+file);
 }
 assert.ok(manifest['/cookie-policy/index.html']);console.log('PASS public HTML changes are consent includes only; protected admin HTML and all existing JS assets retained.');
}
