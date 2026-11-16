"""Deploy the preserved frontend and tested Pages backend, without rebuilding Next.

Default is read-only preflight. Explicit --preview or --activate uploads a release.
Never exports credential values, customer records or private object contents.
"""
import argparse, base64, hashlib, json, mimetypes, os, pathlib, subprocess, urllib.request, urllib.error, uuid
ROOT = pathlib.Path(__file__).resolve().parents[2]
ACCOUNT = 'bfdd1ae2b409f941958f78ea99348c2e'
PROJECT = 'opuszimbabwe'
DATABASE = '885cb934-939a-4080-a48f-40901a111cc2'
BASELINE = '18a7f56e-775d-4ac4-a15f-91083eebd122'
API = 'https://api.cloudflare.com/client/v4'
PREFIX = f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}'
RELEASE = pathlib.Path('/tmp/opus-mastercard-release')

def api(path, body=None, method=None, token=None, content_type='application/json'):
    headers = {'Authorization':'Bearer '+(token or os.environ['CLOUDFLARE_API_TOKEN']), 'Content-Type':content_type}
    data = body if isinstance(body,bytes) else json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(urllib.request.Request(API+path,data=data,method=method,headers=headers),timeout=60) as r:
            result=json.load(r)
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'Cloudflare request failed: HTTP {e.code} at {path}') from None
    if not result.get('success'):
        raise RuntimeError('Cloudflare API error codes: '+str([e.get('code') for e in result.get('errors',[])]))
    return result.get('result')

def multipart(fields):
    boundary='opus-release-'+uuid.uuid4().hex
    parts=[]
    for name,value in fields.items():
        filename=None
        if isinstance(value,tuple):filename,value=value
        disposition=f'Content-Disposition: form-data; name="{name}"'+(f'; filename="{filename}"' if filename else '')
        parts.extend([f'--{boundary}\r\n{disposition}\r\n\r\n'.encode(),value if isinstance(value,bytes) else str(value).encode(),b'\r\n'])
    parts.append(f'--{boundary}--\r\n'.encode())
    return b''.join(parts),'multipart/form-data; boundary='+boundary

def main():
    p=argparse.ArgumentParser()
    action=p.add_mutually_exclusive_group()
    action.add_argument('--preview',action='store_true')
    action.add_argument('--activate',action='store_true')
    action.add_argument('--rollback',metavar='DEPLOYMENT_ID')
    p.add_argument('--apply-migration',action='store_true',help='Apply only additive migration 0027 during activation')
    p.add_argument('--output',default='/tmp/opus-release-result.json')
    args=p.parse_args()
    project=api(PREFIX)
    if args.rollback:
        assert args.rollback==BASELINE,'Only the preserved baseline rollback is allowed'
        result=api(PREFIX+f'/deployments/{BASELINE}/rollback',{},'POST')
        print(json.dumps({'rollback_deployment':result['id']}));return
    assert project['canonical_deployment']['id']==BASELINE,'Live deployment changed: review before replacing it'
    source=project['source']['config']
    assert source.get('deployments_enabled') is False and source.get('production_deployments_enabled') is False,'Automatic legacy deployment must remain paused'
    required={'PESEPAY_INTEGRATION_KEY','PESEPAY_ENCRYPTION_KEY'}
    assert required.issubset(project['deployment_configs']['production']['env_vars']),'Missing production payment bindings'
    manifest=json.loads((RELEASE/'manifest.json').read_text())
    original=json.loads((ROOT/'production/state/pages-asset-manifest.json').read_text())
    changes=json.loads((RELEASE/'changes.json').read_text())
    assert set(original).issubset(manifest)
    changed={x['file'] for x in changes['changes']}
    assert len(changed)==4 and changed=={changes['checkout_chunk'],'/images/payments/mastercard.svg','/payments/index.html','/payments/index.txt'}
    assert all(manifest[f]==h for f,h in original.items() if f not in changed)
    for directory in (ROOT/'production/workers').iterdir():
        expected=json.loads((directory/'deployment.json').read_text())
        active=api(f'/accounts/{ACCOUNT}/workers/scripts/{directory.name}/deployments')['deployments'][0]['versions']
        assert active==[{'version_id':expected['active_version_id'],'percentage':100}],f'Supporting Worker changed: {directory.name}'
    jwt=api(PREFIX+'/upload-token')['jwt']
    hashes=list(set(manifest.values()))
    missing=set(api('/pages/assets/check-missing',{'hashes':hashes},token=jwt))
    files={}
    for filename,digest in manifest.items():
        if digest not in missing:continue
        candidate=(RELEASE/'assets'/filename.lstrip('/')) if filename in changed else (ROOT/'production/pages-assets'/filename.lstrip('/'))
        assert candidate.is_file(),f'Original asset hash no longer available: {filename}'
        files[digest]=(filename,candidate)
    print(json.dumps({'preflight':'passed','original_assets_retained':len(original),'checkout_only_changes':len(changed),'assets_to_upload':len(files),'secret_values_exported':False,'supporting_workers_unchanged':True}),flush=True)
    if not (args.preview or args.activate):return
    assert not subprocess.check_output(['git','status','--porcelain'],cwd=ROOT).strip(),'Commit all release changes first'
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    remote=subprocess.check_output(['git','ls-remote','origin','refs/heads/main'],cwd=ROOT,text=True).split()[0]
    assert commit==remote,'Release commit must already be pushed to GitHub main'
    for digest,(filename,candidate) in files.items():
        payload=[{'key':digest,'value':base64.b64encode(candidate.read_bytes()).decode(),'metadata':{'contentType':mimetypes.guess_type(filename)[0] or 'application/octet-stream'},'base64':True}]
        api('/pages/assets/upload',payload,token=jwt)
    # Match Wrangler's upload protocol: associate uploaded content hashes with
    # this project's asset index before checking availability or deploying.
    api('/pages/assets/upsert-hashes',{'hashes':hashes},token=jwt)
    assert not api('/pages/assets/check-missing',{'hashes':hashes},token=jwt),'Not all asset hashes are present'
    if args.activate:
        assert args.apply_migration,'Activation requires the explicit additive migration flag'
        pending=api(f'/accounts/{ACCOUNT}/d1/database/{DATABASE}/query',{'sql':"SELECT COUNT(*) AS n FROM whatsapp_messages WHERE direction='OUT' AND state IN ('QUEUED','SENDING')"})[0]['results'][0]['n']
        assert pending==0,'Reconcile queued WhatsApp work before activation'
        sql=(ROOT/'migrations/0027_reconstructed_pages_features.sql').read_text()
        api(f'/accounts/{ACCOUNT}/d1/database/{DATABASE}/query',{'sql':sql})
        print('Applied only additive migration 0027; no customer records changed.',flush=True)
    fields={
        'manifest':json.dumps(manifest),'branch':'main' if args.activate else 'mastercard-preserved-preview',
        'commit_hash':commit,'commit_message':'Enable Mastercard on preserved current checkout','commit_dirty':'false',
        '_worker.bundle':('_worker.bundle',pathlib.Path('/tmp/opus-reconstructed-pages-worker.bundle').read_bytes()),
        'functions-filepath-routing-config.json':('functions-filepath-routing-config.json',(ROOT/'production/state/pages-function-routes.json').read_bytes()),
        '_routes.json':('_routes.json',json.dumps({'version':1,'include':['/*'],'exclude':[]}).encode()),
    }
    body,content_type=multipart(fields)
    result=api(PREFIX+'/deployments',body,'POST',content_type=content_type)
    safe={'deployment_id':result['id'],'url':result['url'],'environment':result['environment'],'commit':commit,'baseline':BASELINE,'checkout_changes':changes['changes'],'migration_0027_applied':bool(args.activate)}
    pathlib.Path(args.output).write_text(json.dumps(safe,indent=2)+'\n')
    print(json.dumps(safe),flush=True)

if __name__=='__main__':main()
