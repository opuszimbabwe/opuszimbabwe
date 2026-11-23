"""Restore payment assets/backend, retaining all current non-payment asset hashes."""
import argparse,base64,hashlib,importlib.util,json,mimetypes,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
s=importlib.util.spec_from_file_location('h',ROOT/'ops/activation/deploy-opus-pay.py');h=importlib.util.module_from_spec(s);s.loader.exec_module(h)
p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');args=p.parse_args()
out=pathlib.Path('/tmp/opus-pay-restore');out.mkdir(exist_ok=True)
known=json.loads((ROOT/'production/current-release.json').read_text());source=ROOT/known['artifact_directory'];good=json.loads((source/'asset-manifest.json').read_text());lock=json.loads((ROOT/'ops/activation/opus-pay-lock.json').read_text())
project=h.api(h.PREFIX);active=project['canonical_deployment']['id'];baseline=h.api(h.PREFIX+'/deployments/'+active)['files'];assert active==lock['restore_baseline'],'Production changed; review before restoring'
assert all(project['source']['config'][k]is False for k in ['deployments_enabled','production_deployments_enabled'])
manifest={**baseline,**lock['assets']}
# Add absent dependencies only. Existing non-payment paths remain byte-identical.
for k,v in good.items():
 if k not in manifest and k.startswith(('/_next/','/fonts/','/shared-privacy/')):manifest[k]=v
allowed=set(lock['assets']);assert all(manifest[k]==v for k,v in baseline.items() if k not in allowed)
for f in ['/admin/index.html','/admin/index.txt','/sysadmin/index.html','/sysadmin/index.txt']:assert manifest[f]==baseline[f]
bundle=(source/'pages-worker.bundle').read_bytes();assert hashlib.sha256(bundle).hexdigest()==lock['backend_bundle_sha256']
def workers():
 for d in (ROOT/'production/workers').iterdir():
  e=json.loads((d/'deployment.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/{d.name}/deployments')['deployments'][0]['versions']==[{'version_id':e['active_version_id'],'percentage':100}]
 e=json.loads((ROOT/'ops/site/www-release.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/opus-www-redirect/deployments')['deployments'][0]['versions']==e['active_deployments'][0]['versions']
workers()
for table in ['payment_wallet_state','whatsapp_audit_events','whatsapp_contact_preferences']:
 # Read-only schema check; no migrations or payment/customer rows.
 rows=h.api(f'/accounts/{h.ACCOUNT}/d1/database/{h.DATABASE}/query',{'sql':'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?','params':[table]})[0]['results'];assert rows,'Required schema missing: '+table
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(out/'baseline-manifest.json').write_text(json.dumps(baseline,indent=2)+'\n')
print(json.dumps({'preflight':'passed','baseline':active,'payment_assets_pinned':len(lock['assets']),'non_payment_asset_hashes_preserved':True,'no_migrations':True,'no_payments_initiated':True}),flush=True)
if not args.activate:raise SystemExit(0)
assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Commit reviewed restoration first'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert commit==subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=ROOT,text=True).split()[0]
jwt=h.api(h.PREFIX+'/upload-token')['jwt'];hashes=list(set(manifest.values()));missing=set(h.api('/pages/assets/check-missing',{'hashes':hashes},token=jwt))
for key in missing:
 f=next(k for k,v in manifest.items() if v==key);candidates=[source/'assets'/f.lstrip('/'),ROOT/'production/pages-assets'/f.lstrip('/')];file=next((x for x in candidates if x.is_file()),None);assert file,'Missing archive dependency: '+f
 h.api('/pages/assets/upload',[{'key':key,'value':base64.b64encode(file.read_bytes()).decode(),'metadata':{'contentType':mimetypes.guess_type(f)[0]or'application/octet-stream'},'base64':True}],token=jwt)
h.api('/pages/assets/upsert-hashes',{'hashes':hashes},token=jwt)
assert not h.api('/pages/assets/check-missing',{'hashes':hashes},token=jwt)
fields={'manifest':json.dumps(manifest),'branch':'main','commit_hash':commit,'commit_message':'Restore and lock Opus Pay; preserve current non-payment frontend','commit_dirty':'false','_worker.bundle':('_worker.bundle',bundle),'functions-filepath-routing-config.json':('functions-filepath-routing-config.json',(ROOT/'production/state/pages-function-routes.json').read_bytes()),'_routes.json':('_routes.json',json.dumps({'version':1,'include':['/*'],'exclude':[]}).encode())}
body,ct=h.multipart(fields);deployment=h.api(h.PREFIX+'/deployments',body,'POST',content_type=ct);workers();record={'deployment_id':deployment['id'],'url':deployment['url'],'environment':'production','commit':commit,'baseline':active,'backend_bundle_sha256':lock['backend_bundle_sha256'],'database_migrations_applied':[],'opus_pay_restoration':{'pinned_asset_count':len(lock['assets']),'non_payment_frontend_preserved':True,'backend_source_deployment':known['deployment_id'],'no_payments_initiated':True}}
(out/'result.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
