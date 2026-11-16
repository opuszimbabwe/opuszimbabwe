// Local compilation only. Never uploads or deploys a Pages version.
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),esbuild=require('esbuild');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const files=JSON.parse(fs.readFileSync(path.join(root,'production/state/missing-pages-functions.json')));
 await esbuild.build({entryPoints:files.map(file=>path.join(root,file)),outbase:path.join(root,'functions'),outdir:'/tmp/opus-reconstructed-test',bundle:true,platform:'node',format:'cjs',logLevel:'warning'});
 const bundle='/tmp/opus-reconstructed-pages-worker.bundle';
 execFileSync(path.join(root,'node_modules/.bin/wrangler'),['pages','functions','build','functions','--outfile',bundle,'--compatibility-date','2026-09-01','--compatibility-flags','nodejs_compat'],{cwd:root,env:{...process.env,WRANGLER_SEND_METRICS:'false'},stdio:'pipe'});
 // Wrangler's --outfile is a multipart upload artifact, not a raw ES module.
 const bytes=fs.readFileSync(bundle),boundary=bytes.subarray(0,bytes.indexOf('\r\n')).toString().slice(2);
 const parts=await new Response(bytes,{headers:{'content-type':'multipart/form-data; boundary='+boundary}}).formData();
 const metadata=JSON.parse(parts.get('metadata'));
 const output='/tmp/opus-reconstructed-pages-runtime';fs.mkdirSync(output,{recursive:true});
 for(const [name,value] of parts){
  if(name==='metadata')continue;
  if(path.isAbsolute(name)||name.split('/').includes('..'))throw Error('Unsafe generated module path');
  const target=path.join(output,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,Buffer.from(await value.arrayBuffer()));
 }
 fs.writeFileSync(path.join(output,'entry.js'),fs.readFileSync(path.join(output,metadata.main_module)));
 console.log('PASS: compiled all 16 handlers and the complete Pages router; unpacked local workerd artifact. No deployment.');
})().catch(error=>{console.error(error);process.exitCode=1});
