// Add only the shared preference script and a factual notice to public HTML.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function({root,out,original,changes,save}){
 const bytes=fs.readFileSync(path.join(root,'public/shared-privacy/consent.js'));
 const digest=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16),script='/shared-privacy/consent-'+digest+'.js';
 const tag='<script data-opus-cookie-consent="v1" src="'+script+'" defer></script>';
 save(script,bytes);const touched=[];
 for(const file of Object.keys(original).filter(f=>f.endsWith('.html')&&!/^\/(?:admin|sysadmin|templates\/previews)\//.test(f))){
  const generated=path.join(out,'assets',file),source=fs.existsSync(generated)?generated:path.join(root,'production/pages-assets',file);
  const html=fs.readFileSync(source,'utf8');if(!html.includes('</head>'))continue;
  const index=changes.findIndex(c=>c.file===file);if(index>=0)changes.splice(index,1);
  save(file,Buffer.from(html.replace('</head>',tag+'</head>')));touched.push(file);
 }
 save('/cookie-policy/index.html',Buffer.from(fs.readFileSync(path.join(root,'public/shared-privacy/cookie-policy.html'),'utf8').replace('<!--OPUS_CONSENT-->',tag)));
 return{script,public_html:touched,preference_cookie:'__Secure-opus_cookie_choice',days:180};
};
