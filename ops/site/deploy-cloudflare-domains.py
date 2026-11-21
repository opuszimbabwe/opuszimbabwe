"""Publish only the domain-provider logo and cache-busted public references.

Preserves the exact active backend, protected admin pages, checkout and Workers.
Default preflight is read-only. No migrations or provider requests.
"""
import argparse,base64,hashlib,importlib.util,json,mimetypes,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
RELEASE=pathlib.Path('/tmp/opus-cloudflare-domains-release')
spec=importlib.util.spec_from_file_location('release_api',ROOT/'ops/activation/deploy-opus-pay.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');args=p.parse_args()
current=json.loads((ROOT/'production/current-release.json').read_text());project=h.api(h.PREFIX)
assert project['canonical_deployment']['id']==current['deployment_id'],'Live release changed; review the current baseline'
assert all(project['source']['config'][k]is False for k in ['deployments_enabled','production_deployments_enabled'])
meta=json.loads((RELEASE/'changes.json').read_text());assert meta['baseline_deployment']==current['deployment_id']
manifest=json.loads((RELEASE/'manifest.json').read_text());before=json.loads((ROOT/current['artifact_directory']/'asset-manifest.json').read_text())
allowed={item['file'] for item in meta['changes']}
assert set(manifest)-set(before)=={meta['updated_chunk'],'/images/tools/cloudflare-domains.svg'}
assert set(before).issubset(manifest) and all(manifest[f]==v for f,v in before.items() if f not in allowed)
assert set(meta['widget_pages'])=={'/index.html','/domains/index.html','/services/domain-hosting/index.html','/services/domains-hosting/index.html'}
assert all(f.endswith(('.html','.txt')) and not f.startswith(('/admin/','/sysadmin/','/payments/')) for f in meta['reference_only_pages'])
for f in ['/admin/index.html','/admin/index.txt','/sysadmin/index.html','/sysadmin/index.txt','/payments/index.html','/payments/index.txt']:
 assert manifest[f]==before[f],'Protected/admin/payment content must be unchanged: '+f
bundle=(ROOT/current['artifact_directory']/'pages-worker.bundle').read_bytes();assert hashlib.sha256(bundle).hexdigest()==current['backend_bundle_sha256']==meta['backend_bundle_sha256']
def check_workers():
 for d in (ROOT/'production/workers').iterdir():
  e=json.loads((d/'deployment.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/{d.name}/deployments')['deployments'][0]['versions']==[{'version_id':e['active_version_id'],'percentage':100}]
 www=json.loads((ROOT/'ops/site/www-release.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/opus-www-redirect/deployments')['deployments'][0]['versions']==www['active_deployments'][0]['versions']
check_workers()
jwt=h.api(h.PREFIX+'/upload-token')['jwt'];hashes=list(set(manifest.values()));missing=set(h.api('/pages/assets/check-missing',{'hashes':hashes},token=jwt));files={v:f for f,v in manifest.items() if v in missing};assert set(files.values()).issubset(allowed),'An unrelated original asset is missing'
print(json.dumps({'preflight':'passed','baseline':current['deployment_id'],'widget_pages':meta['widget_pages'],'reference_only_pages':len(meta['reference_only_pages']),'backend_unchanged':True,'checkout_unchanged':True,'migrations':[],'supporting_workers_unchanged':True}),flush=True)
if not args.activate:raise SystemExit(0)
assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Commit the reviewed release first'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert commit==subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=ROOT,text=True).split()[0],'Push reviewed source to main first'
for key,f in files.items():
 h.api('/pages/assets/upload',[{'key':key,'value':base64.b64encode((RELEASE/'assets'/f.lstrip('/')).read_bytes()).decode(),'metadata':{'contentType':mimetypes.guess_type(f)[0]or'application/octet-stream'},'base64':True}],token=jwt)
h.api('/pages/assets/upsert-hashes',{'hashes':hashes},token=jwt);assert not h.api('/pages/assets/check-missing',{'hashes':hashes},token=jwt)
fields={'manifest':json.dumps(manifest),'branch':'main','commit_hash':commit,'commit_message':'Cloudflare logo credit for international domain search','commit_dirty':'false','_worker.bundle':('_worker.bundle',bundle),'functions-filepath-routing-config.json':('functions-filepath-routing-config.json',(ROOT/'production/state/pages-function-routes.json').read_bytes()),'_routes.json':('_routes.json',json.dumps({'version':1,'include':['/*'],'exclude':[]}).encode())}
body,content_type=h.multipart(fields);result=h.api(h.PREFIX+'/deployments',body,'POST',content_type=content_type);check_workers()
record={'deployment_id':result['id'],'url':result['url'],'environment':result['environment'],'commit':commit,'baseline':current['deployment_id'],'backend_bundle_sha256':current['backend_bundle_sha256'],'database_migrations_applied':[],'domain_branding':{'assets':sorted(allowed),'widget_pages':meta['widget_pages'],'reference_only_pages':meta['reference_only_pages'],'logo_source':meta['logo_source'],'logo_sha256':meta['logo_sha256'],'backend_unchanged':True,'checkout_unchanged':True,'supporting_workers_unchanged':True}}
pathlib.Path('/tmp/opus-cloudflare-domains-result.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'deployment_id':result['id'],'url':result['url']}))
