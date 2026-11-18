"""Deploy reviewed SEO changes over the active frontend; no DB/security/Worker edits."""
import argparse,base64,hashlib,importlib.util,json,mimetypes,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('release_api',ROOT/'ops/activation/deploy-opus-pay.py');helper=importlib.util.module_from_spec(spec);spec.loader.exec_module(helper)
api=helper.api;PREFIX=helper.PREFIX;ACCOUNT=helper.ACCOUNT;RELEASE=pathlib.Path('/tmp/opus-seo-release')
def main():
 p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');p.add_argument('--output',default='/tmp/opus-seo-release-result.json');args=p.parse_args()
 current=json.loads((ROOT/'production/current-release.json').read_text());project=api(PREFIX);assert project['canonical_deployment']['id']==current['deployment_id'],'Active release changed'
 assert all(project['source']['config'][k] is False for k in ['deployments_enabled','production_deployments_enabled'])
 changes=json.loads((RELEASE/'changes.json').read_text());assert changes['baseline_deployment']==current['deployment_id']
 manifest=json.loads((RELEASE/'manifest.json').read_text());before=json.loads((ROOT/current['artifact_directory']/'asset-manifest.json').read_text());assert set(before).issubset(manifest)
 config=json.loads((ROOT/'ops/site/seo-routes.json').read_text());allowed={'/index.html'if r=='/'else r+'index.html'for r in config['routes']+list(config['aliases'])}|{'/sitemap.xml','/care/index.txt',changes['care_chunk']}
 assert set(changes['seo_assets'])==allowed
 assert all(manifest[f]==h for f,h in before.items()if f not in allowed)
 for directory in (ROOT/'production/workers').iterdir():
  expected=json.loads((directory/'deployment.json').read_text());active=api(f'/accounts/{ACCOUNT}/workers/scripts/{directory.name}/deployments')['deployments'][0]['versions'];assert active==[{'version_id':expected['active_version_id'],'percentage':100}]
 bundle=pathlib.Path('/tmp/opus-reconstructed-pages-worker.bundle');assert bundle.is_file()
 jwt=api(PREFIX+'/upload-token')['jwt'];hashes=list(set(manifest.values()));missing=set(api('/pages/assets/check-missing',{'hashes':hashes},token=jwt))
 files={}
 for f,h in manifest.items():
  if h not in missing:continue
  assert f in allowed,'Unexpected missing existing asset: '+f
  file=RELEASE/'assets'/f.lstrip('/');assert file.is_file();files[h]=(f,file)
 print(json.dumps({'preflight':'passed','baseline':current['deployment_id'],'seo_assets':len(allowed),'upload_count':len(files),'existing_workers_unchanged':True,'no_database_migrations':True}),flush=True)
 if not args.activate:return
 assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Commit first'
 commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert commit==subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=ROOT,text=True).split()[0],'Push first'
 for h,(f,file)in files.items():api('/pages/assets/upload',[{'key':h,'value':base64.b64encode(file.read_bytes()).decode(),'metadata':{'contentType':mimetypes.guess_type(f)[0]or'application/octet-stream'},'base64':True}],token=jwt)
 api('/pages/assets/upsert-hashes',{'hashes':hashes},token=jwt);assert not api('/pages/assets/check-missing',{'hashes':hashes},token=jwt)
 fields={'manifest':json.dumps(manifest),'branch':'main','commit_hash':commit,'commit_message':'Public canonical URLs, sitemap and correct error status','commit_dirty':'false','_worker.bundle':('_worker.bundle',bundle.read_bytes()),'functions-filepath-routing-config.json':('functions-filepath-routing-config.json',(ROOT/'production/state/pages-function-routes.json').read_bytes()),'_routes.json':('_routes.json',json.dumps({'version':1,'include':['/*'],'exclude':[]}).encode())}
 body,content_type=helper.multipart(fields);result=api(PREFIX+'/deployments',body,'POST',content_type=content_type)
 record={'deployment_id':result['id'],'url':result['url'],'environment':result['environment'],'commit':commit,'baseline':current['deployment_id'],'checkout_changes':changes['changes'],'seo_release':{'assets':changes['seo_assets'],'care_chunk':changes['care_chunk']},'backend_bundle_sha256':hashlib.sha256(bundle.read_bytes()).hexdigest(),'database_migrations_applied':[]}
 pathlib.Path(args.output).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'deployment_id':result['id'],'url':result['url']}))
if __name__=='__main__':main()
