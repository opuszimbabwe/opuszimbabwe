"""Deploy only the separate Deolume preview; verify production is untouched."""
import json, os, pathlib, subprocess, urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[1]
REPOSITORY=ROOT.parents[1]
ACCOUNT='bfdd1ae2b409f941958f78ea99348c2e'
PREVIEW='opus-zimbabwe-redesign'
API='https://api.cloudflare.com/client/v4'
def api(path):
    with urllib.request.urlopen(urllib.request.Request(API+path,headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN']}),timeout=40) as response:
        result=json.load(response)
    assert result.get('success'),'Cloudflare read failed'
    return result['result']
def snapshot():
    project=api(f'/accounts/{ACCOUNT}/pages/projects/opuszimbabwe')
    workers={}
    for name in ['opus-content-first-paint','opus-inbox-notifications','opus-care-renderer','opus-care-scheduler']:
        workers[name]=api(f'/accounts/{ACCOUNT}/workers/scripts/{name}/deployments')['deployments'][0]['versions']
    return {'deployment':project['canonical_deployment']['id'],'domains':sorted(project['domains']),'workers':workers}
expected=json.loads((REPOSITORY/'production/current-release.json').read_text())['deployment_id']
before=snapshot();assert before['deployment']==expected,'Production changed; review the deployment boundary first'
preview=api(f'/accounts/{ACCOUNT}/pages/projects/{PREVIEW}')
assert preview['domains']==['opus-zimbabwe-redesign.pages.dev'],'Unexpected preview domains'
for config in preview.get('deployment_configs',{}).values():
    assert not config.get('d1_databases') and not config.get('r2_buckets') and not config.get('services'),'Preview must not connect production resources'
assert not subprocess.check_output(['git','status','--porcelain','--','experiments/deolume'],cwd=REPOSITORY).strip(),'Commit preview source first'
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPOSITORY,text=True).strip()
subprocess.run(['node','scripts/build.mjs'],cwd=ROOT,check=True)
try:
    subprocess.run([str(REPOSITORY/'node_modules/.bin/wrangler'),'pages','deploy','dist','--project-name',PREVIEW,'--branch','main','--commit-hash',sha,'--commit-dirty=false'],cwd=ROOT,env={**os.environ,'CLOUDFLARE_ACCOUNT_ID':ACCOUNT,'WRANGLER_SEND_METRICS':'false'},check=True)
finally:
    assert snapshot()==before,'Production changed during preview deployment; investigate before continuing'
result=api(f'/accounts/{ACCOUNT}/pages/projects/{PREVIEW}')['canonical_deployment']
assert result['deployment_trigger']['metadata']['commit_hash']==sha,'Unexpected preview source commit'
record={'preview_project':PREVIEW,'preview_url':'https://opus-zimbabwe-redesign.pages.dev','preview_deployment':result['id'],'source_commit':sha,'production_unchanged':True,'production_deployment':before['deployment'],'supporting_workers_unchanged':True,'no_production_bindings':True}
(ROOT/'artifacts').mkdir(exist_ok=True);(ROOT/'artifacts/deployment.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
