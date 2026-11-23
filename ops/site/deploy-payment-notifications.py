"""Verified-payment admin alerts. Additive migration 0031 only; no real test sends."""
import argparse,hashlib,importlib.util,json,pathlib,re,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('release_api',ROOT/'ops/activation/deploy-opus-pay.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');p.add_argument('--output',default='/tmp/opus-payment-notifications-release.json');args=p.parse_args()
current=json.loads((ROOT/'production/current-release.json').read_text());project=h.api(h.PREFIX);assert project['canonical_deployment']['id']==current['deployment_id'],'Live release changed'
assert all(project['source']['config'][k]is False for k in ['deployments_enabled','production_deployments_enabled'])
assert {'CF_ACCESS_TEAM_DOMAIN','CF_ACCESS_AUD'}.issubset(project['deployment_configs']['production']['env_vars']),'Strict admin authentication must be configured'
manifest=json.loads((ROOT/current['artifact_directory']/'asset-manifest.json').read_text());bundle=pathlib.Path('/tmp/opus-reconstructed-pages-worker.bundle').read_bytes();digest=hashlib.sha256(bundle).hexdigest();assert digest!=current['backend_bundle_sha256'],'Expected the tested tracker backend'
for d in (ROOT/'production/workers').iterdir():
 e=json.loads((d/'deployment.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/{d.name}/deployments')['deployments'][0]['versions']==[{'version_id':e['active_version_id'],'percentage':100}]
www=json.loads((ROOT/'ops/site/www-release.json').read_text());assert h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/opus-www-redirect/deployments')['deployments'][0]['versions']==www['active_deployments'][0]['versions']
print(json.dumps({'preflight':'passed','baseline':current['deployment_id'],'frontend_assets_unchanged':len(manifest),'migration':'0031_payment_admin_notifications.sql','strict_admin_authentication_configured':True,'supporting_workers_unchanged':True,'no_whatsapp_messages_sent':True}),flush=True)
if not args.activate:raise SystemExit(0)
assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Commit reviewed changes first';commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();assert commit==subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=ROOT,text=True).split()[0],'Push reviewed changes first'
# Single reviewed additive migration; do not apply any old migration backlog.
sql=(ROOT/'migrations/0031_payment_admin_notifications.sql').read_text();statements=[x.strip()for x in re.sub(r'^--.*$','',sql,flags=re.M).split(';')if x.strip()];assert len(statements)==1 and statements[0].startswith('CREATE TABLE IF NOT EXISTS payment_admin_notifications (')
h.api(f'/accounts/{h.ACCOUNT}/d1/database/{h.DATABASE}/query',{'sql':statements[0]})
keys=set(project['deployment_configs']['production']['env_vars']);assert {'RESEND_API_KEY','RECEIPT_FROM_EMAIL'}.issubset(keys)
h.api(h.PREFIX,{'deployment_configs':{'production':{'env_vars':{'PAYMENT_ADMIN_NOTIFY_TO':{'type':'plain_text','value':'admin@opuszim.co.zw'}}}}},'PATCH')
updated=h.api(h.PREFIX);assert keys.issubset(updated['deployment_configs']['production']['env_vars']);assert updated['deployment_configs']['production']['env_vars']['PAYMENT_ADMIN_NOTIFY_TO']['value']=='admin@opuszim.co.zw'
fields={'manifest':json.dumps(manifest),'branch':'main','commit_hash':commit,'commit_message':'Verified payment notifications to admin@opuszim.co.zw','commit_dirty':'false','_worker.bundle':('_worker.bundle',bundle),'functions-filepath-routing-config.json':('functions-filepath-routing-config.json',(ROOT/'production/state/pages-function-routes.json').read_bytes()),'_routes.json':('_routes.json',json.dumps({'version':1,'include':['/*'],'exclude':[]}).encode())};body,content_type=h.multipart(fields);result=h.api(h.PREFIX+'/deployments',body,'POST',content_type=content_type)
record={'deployment_id':result['id'],'url':result['url'],'environment':result['environment'],'commit':commit,'baseline':current['deployment_id'],'backend_bundle_sha256':digest,'database_migrations_applied':['0031_payment_admin_notifications.sql'],'payment_admin_notifications':{'recipient':'admin@opuszim.co.zw','new_verified_success_only':True,'atomic_outbox':True,'duplicates_suppressed':True,'no_real_test_payments_or_emails':True}}
pathlib.Path(args.output).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps({'deployment_id':result['id'],'url':result['url']}))
