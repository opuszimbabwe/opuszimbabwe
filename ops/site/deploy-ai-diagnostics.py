"""Backend-only AI diagnostics and inbox contract fixes. No migrations or live sends."""
import argparse,hashlib,importlib.util,json,pathlib,re,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('release_api',ROOT/'ops/activation/deploy-opus-pay.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');p.add_argument('--output',default='/tmp/opus-ai-diagnostics-release.json');args=p.parse_args()
current=json.loads((ROOT/'production/current-release.json').read_text());project=h.api(h.PREFIX);assert project['canonical_deployment']['id']==current['deployment_id'],'Live release changed'
assert all(project['source']['config'][k]is False for k in ['deployments_enabled','production_deployments_enabled'])
assert {'CF_ACCESS_TEAM_DOMAIN','CF_ACCESS_AUD'}.issubset(project['deployment_configs']['production']['env_vars']),'Strict admin authentication must be configured'
manifest=json.loads((ROOT/current['artifact_directory']/'asset-manifest.json').read_text());bundle=pathlib.Path('/tmp/opus-reconstructed-pages-worker.bundle').read_bytes();digest=hashlib.sha256(bundle).hexdigest();assert digest!=current['backend_bundle_sha256'],'Expected the tested tracker backend'
for d in (ROOT/'production/workers').iterdir():
 e=json.loads((d/'deployment.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/{d.name}/deployments')['deployments'][0]['versions']==[{'version_id':e['active_version_id'],'percentage':100}]
www=json.loads((ROOT/'ops/site/www-release.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/opus-www-redirect/deployments')['deployments'][0]['versions']==www['active_deployments'][0]['versions']
print(json.dumps({'preflight':'passed','baseline':current['deployment_id'],'frontend_assets_unchanged':len(manifest),'migration':None,'strict_admin_authentication_configured':True,'supporting_workers_unchanged':True,'no_whatsapp_messages_sent':True}),flush=True)
if not args.activate:raise SystemExit(0)
assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Commit reviewed changes first';commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert commit==subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=ROOT,text=True).split()[0],'Push reviewed changes first'
fields={'manifest':json.dumps(manifest),'branch':'main','commit_hash':commit,'commit_message':'AI provider diagnostics and chronological WhatsApp previews','commit_dirty':'false','_worker.bundle':('_worker.bundle',bundle),'functions-filepath-routing-config.json':('functions-filepath-routing-config.json',(ROOT/'production/state/pages-function-routes.json').read_bytes()),'_routes.json':('_routes.json',json.dumps({'version':1,'include':['/*'],'exclude':[]}).encode())};body,content_type=h.multipart(fields);result=h.api(h.PREFIX+'/deployments',body,'POST',content_type=content_type)
record={'deployment_id':result['id'],'url':result['url'],'environment':result['environment'],'commit':commit,'baseline':current['deployment_id'],'backend_bundle_sha256':digest,'database_migrations_applied':[],'ai_diagnostics':{'version':'wa-tracker-20261120-3','provider_metadata_only':True,'sender_configuration_contract_fixed':True,'chronological_preview_and_ai_supersession':True,'no_whatsapp_messages_sent':True}}
pathlib.Path(args.output).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'deployment_id':result['id'],'url':result['url']}))
