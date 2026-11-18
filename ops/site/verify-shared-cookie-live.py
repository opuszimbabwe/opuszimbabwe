"""Read-only live verification; never requests a payment or chat session."""
import hashlib,json,os,pathlib,subprocess,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2];RELEASE=pathlib.Path('/tmp/opus-pay-release');ACCOUNT='bfdd1ae2b409f941958f78ea99348c2e';ZONE='d240c0475f8d4a2897707d247568a8ea'
expected=json.loads((RELEASE/'changes.json').read_text());result=json.loads(pathlib.Path('/tmp/opus-shared-cookie-release-result.json').read_text())
def api(path):
 with urllib.request.urlopen(urllib.request.Request('https://api.cloudflare.com/client/v4'+path,headers={'Authorization':'Bearer '+os.environ['CF_TOKEN_INFO_OPUSZIM']}),timeout=30)as r:return json.load(r)['result']
def fetch(path):
 r=subprocess.run(['curl','-fsSL','--retry','3','--retry-all-errors','--retry-delay','2','--max-time','25','https://opuszim.co.zw'+path],capture_output=True,check=True);return r.stdout
p=api('/accounts/'+ACCOUNT+'/pages/projects/opuszimbabwe');assert p['canonical_deployment']['id']==result['deployment_id'];assert p['canonical_deployment']['latest_stage']['status']=='success';assert p['source']['config']['deployments_enabled'] is False;assert p['source']['config']['production_deployments_enabled'] is False
script=expected['shared_cookie_consent']['script'];checks=[]
for path in ['/','/privacy/','/payments/','/cookie-policy/','/contact/']:
 html=fetch(path).decode();assert html.count('data-opus-cookie-consent="v1"')==1,path;assert script in html,path;checks.append(path)
js=fetch(script);assert js==(RELEASE/'assets'/script.lstrip('/')).read_bytes();assert hashlib.sha256(js).hexdigest()[:16]in script
policy=fetch('/cookie-policy/').decode();assert all(text in policy for text in ['cookieless','180 days','shared preference'])
for directory in (ROOT/'production/workers').iterdir():
 e=json.loads((directory/'deployment.json').read_text());active=api('/accounts/'+ACCOUNT+'/workers/scripts/'+directory.name+'/deployments')['deployments'][0]['versions'];assert active==[{'version_id':e['active_version_id'],'percentage':100}]
routes=api('/zones/'+ZONE+'/workers/routes');before=json.loads((ROOT/'ops/site/www-before.json').read_text())['routes'];assert all(r in routes for r in before);assert any(r['pattern']=='www.opuszim.co.zw/*'and r['script']=='opus-www-redirect'for r in routes)
print(json.dumps({'active_deployment':result['deployment_id'],'public_pages_verified':checks,'shared_script_matches_tested_build':True,'original_workers_unchanged':True,'original_routes_preserved':True,'automatic_deployment_disabled':True}))
