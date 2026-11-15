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
console.log(JSON.stringify({worker_modules_verified:workerModules,exact_pages_assets_verified:assets,source_files_verified:sourceFiles,database_schema_objects:schema.length,pages_function_source_complete:false}));
