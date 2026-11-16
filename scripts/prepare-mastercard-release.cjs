// Preserve the published frontend; patch only its existing checkout module.
const fs=require('node:fs'),path=require('node:path'),blake3=require('blake3-wasm');
const root=path.resolve(__dirname,'..'),out='/tmp/opus-mastercard-release';
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
const original=JSON.parse(fs.readFileSync(path.join(root,'production/state/pages-asset-manifest.json'))),manifest={...original},changes=[];
const hash=(bytes,file)=>blake3.hash(bytes.toString('base64')+path.extname(file).slice(1)).toString('hex').slice(0,32);
function save(file,bytes){const target=path.join(out,'assets',file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);manifest[file]=hash(bytes,file);changes.push({file,hash:manifest[file],bytes:bytes.length});}
const old='/_next/static/chunks/app/payments/page-fec90863f26d70c5.js';
let script=fs.readFileSync(path.join(root,'production/pages-assets',old),'utf8');
function replace(before,after){if(script.split(before).length!==2)throw Error('Published checkout anchor changed: '+before);script=script.replace(before,after);}
replace('["PayPal","Visa","Mastercard"]','["PayPal","Visa"]');
replace('r=[[/ecocash/i,','r=[[/^master\\s?card$/i,"/images/payments/mastercard.svg",72,44,0,0,72,44],[/ecocash/i,');
replace('International payments are currently unavailable. Please use a local payment method.','This payment method is currently unavailable. Please choose one of the available methods above.');
replace('Use a local payment method','Choose an available payment method');
replace('Choose local payments','Choose payment method');
replace('children:"International payments"','children:"Other payment methods"');
const content=Buffer.from(script),updated=old.replace(/page-[a-f0-9]+\.js$/,'page-'+hash(content,old).slice(0,16)+'.js');save(updated,content);
save('/images/payments/mastercard.svg',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 44"><circle cx="26" cy="22" r="21" fill="#eb001b"/><circle cx="46" cy="22" r="21" fill="#f79e1b"/><path d="M36 3.5a21 21 0 0 1 0 37 21 21 0 0 1 0-37" fill="#ff5f00"/></svg>'));
for(const file of ['/payments/index.html','/payments/index.txt']){
 const source=fs.readFileSync(path.join(root,'production/pages-assets',file),'utf8');
 if(!source.includes(path.basename(old)))throw Error('Missing published checkout reference: '+file);
 let patched=source.replaceAll(path.basename(old),path.basename(updated));
 if(file.endsWith('.html')){
  const section=/<div class="payment-international">[\s\S]*?<\/div><\/div>/.exec(patched);
  if(!section)throw Error('Published international-payment markup changed');
  const button=/<button\b[^>]*>(?:(?!<\/button>)[\s\S])*?Mastercard<\/button>/.exec(section[0]);
  if(!button)throw Error('Published Mastercard placeholder markup changed');
  patched=patched.replace(section[0],section[0].replace(button[0],'').replace('International payments','Other payment methods'));
  for(const [before,after] of [
   ['Use a local payment method','Choose an available payment method'],
   ['International payments are currently unavailable. Please use a local payment method.','This payment method is currently unavailable. Please choose one of the available methods above.'],
   ['Choose local payments','Choose payment method']
  ])patched=patched.replaceAll(before,after);
 }
 save(file,Buffer.from(patched));
}
for(const [file,digest] of Object.entries(original))if(!changes.some(c=>c.file===file)&&manifest[file]!==digest)throw Error('Unexpected non-checkout asset change');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(out,'changes.json'),JSON.stringify({baseline_deployment:'18a7f56e-775d-4ac4-a15f-91083eebd122',checkout_chunk:updated,changes,original_asset_paths_retained:Object.keys(original).length,protected_admin_assets_reused:true},null,2));
console.log(JSON.stringify({manifest_assets:Object.keys(manifest).length,checkout_only_changes:changes.map(x=>x.file),original_asset_paths_retained:Object.keys(original).length}));
