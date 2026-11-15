// The root Next application is an older baseline, not the deployed Pages source.
// Prevent a repository push/build from silently replacing working APIs.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const statusPath=path.join(root,'production/state/recovery-status.json');
const missingPath=path.join(root,'production/state/missing-pages-functions.json');
const status=fs.existsSync(statusPath)?JSON.parse(fs.readFileSync(statusPath)):null;
const expected=fs.existsSync(missingPath)?JSON.parse(fs.readFileSync(missingPath)):[];
const missing=expected.filter(file=>!fs.existsSync(path.join(root,file)));
if(!status?.pages_functions_source_complete||missing.length){
 console.error('Production build blocked: the published Pages Functions source has not been fully recovered and verified.');
 console.error('The original live website is preserved in Cloudflare. See production/README.md.');
 if(missing.length)console.error('Missing server source files: '+missing.length);
 process.exitCode=2;
}
