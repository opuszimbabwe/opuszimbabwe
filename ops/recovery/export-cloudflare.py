"""Read-only production export. No secret values or customer rows are exported."""
import argparse, email.parser, email.policy, hashlib, json, os, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
ACCOUNT = 'bfdd1ae2b409f941958f78ea99348c2e'
PROJECT = 'opuszimbabwe'
API = 'https://api.cloudflare.com/client/v4'
WORKERS = ['opus-content-first-paint', 'opus-inbox-notifications', 'opus-care-renderer', 'opus-care-scheduler']

def api(path, body=None, raw=False):
    request = urllib.request.Request(API+path, headers={
        'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'], 'Content-Type':'application/json'},
        data=json.dumps(body).encode() if body is not None else None)
    with urllib.request.urlopen(request, timeout=40) as response:
        data = response.read()
        if raw: return data, response.headers['content-type']
    parsed = json.loads(data)
    if not parsed.get('success'): raise RuntimeError(str(parsed.get('errors')))
    return parsed['result']

def save(path, data):
    target = ROOT/path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2)+'\n')

def public_binding(binding):
    # Plain-text variables may also contain sensitive values. Export only
    # binding identity/topology, never text, JSON values or secret contents.
    allowed = {'name','type','database_id','database_name','bucket_name','jurisdiction',
               'class_name','script_name','environment','service','namespace_id'}
    return {key:value for key,value in binding.items() if key in allowed}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--active-root-bundle', required=True,
        help='Previously backed-up exact native-v25 bundle; API script GET returns the latest upload, not necessarily the deployed version.')
    args = parser.parse_args()
    project = api(f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}')
    deployment_id = project['canonical_deployment']['id']
    assert deployment_id=='18a7f56e-775d-4ac4-a15f-91083eebd122', 'Review changed live Pages deployment'
    deployment = api(f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments/{deployment_id}')
    save('production/state/pages-asset-manifest.json', deployment['files'])
    functions = api(f'/accounts/{ACCOUNT}/pages/projects/{PROJECT}/deployments/{deployment["id"]}/functions')
    save('production/state/pages-function-routes.json', json.loads(functions['config']))
    save('production/state/pages-deployment.json', {
        'account_id':ACCOUNT, 'project':PROJECT, 'deployment_id':deployment['id'],
        'created_on':deployment['created_on'], 'deployment_trigger':deployment['deployment_trigger'],
        'domains':project.get('domains',[]), 'compatibility_date':deployment.get('compatibility_date'),
        'compatibility_flags':deployment.get('compatibility_flags',[]),
        'environment_variable_names':sorted(deployment.get('env_vars',{})),
        'source_complete':False, 'missing_source_manifest':'missing-pages-functions.json'})
    route_config = json.loads(functions['config'])
    names = sorted({module.split(':')[0] for route in route_config['routes'] for module in route.get('module',[])})
    missing = ['functions/'+name for name in names if not (ROOT/'functions'/name).exists()]
    save('production/state/missing-pages-functions.json', missing)
    for name in WORKERS:
        base = f'/accounts/{ACCOUNT}/workers/scripts/{name}'
        active = api(base+'/deployments')['deployments'][0]
        assert len(active['versions'])==1 and active['versions'][0]['percentage']==100, 'Review split deployment'
        active_id = active['versions'][0]['version_id']
        versions = api(base+'/versions')['items']
        settings = api(base+'/settings')
        directory = ROOT/'production/workers'/name
        directory.mkdir(parents=True, exist_ok=True)
        modules = []
        if name == 'opus-content-first-paint':
            assert active_id=='2ddd36f5-0fb5-4693-b665-78c50ceadf81', 'Review changed root Worker'
            content = pathlib.Path(args.active_root_bundle).read_bytes()
            assert hashlib.sha256(content).hexdigest()=='181923dad5694a348f821d63c0c9c62441629891ecb2f96e661f5adf1d8dcc50'
            modules = [('worker.js',content)]
        else:
            assert versions[0]['id']==active_id, 'Latest uploaded version differs from active; retrieve matching backup'
            raw, content_type = api(base, raw=True)
            if 'multipart' in content_type:
                message = email.parser.BytesParser(policy=email.policy.default).parsebytes(('Content-Type: '+content_type+'\r\n\r\n').encode()+raw)
                modules = [(part.get_param('name',header='content-disposition'),part.get_payload(decode=True)) for part in message.iter_parts()]
            else: modules = [('worker.js',raw)]
        manifest = []
        for filename, content in modules:
            relative = pathlib.PurePosixPath(filename)
            assert not relative.is_absolute() and '..' not in relative.parts
            path = directory.joinpath(*relative.parts)
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_bytes(content)
            manifest.append({'file':filename,'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
        version = api(base+'/versions/'+active_id)
        runtime = version.get('resources',{}).get('script_runtime',{})
        save(f'production/workers/{name}/deployment.json',{
            'worker':name,'active_version_id':active_id,'active_deployment_id':active['id'],
            'compatibility_date':runtime.get('compatibility_date',settings.get('compatibility_date')),
            # Absent flags in version metadata mean an empty list. Falling back
            # to script settings would select flags from a newer inactive upload.
            'compatibility_flags':runtime.get('compatibility_flags',[]),
            'bindings':[public_binding(binding) for binding in version.get('resources',{}).get('bindings',settings.get('bindings',[]))],
            'secret_values_included':False,'modules':manifest})
        print(json.dumps({'worker':name,'active_version':active_id,'module_count':len(manifest)}),flush=True)
    routes = api('/zones/d240c0475f8d4a2897707d247568a8ea/workers/routes')
    save('production/state/worker-routes.json',routes)
    schema = api(f'/accounts/{ACCOUNT}/d1/database/885cb934-939a-4080-a48f-40901a111cc2/query',
        {'sql':"SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type,name"})
    save('production/state/database-schema.json',schema[0]['results'])
    print(json.dumps({'pages_assets':len(deployment['files']),'missing_pages_function_files':len(missing),'customer_rows_exported':0}),flush=True)

if __name__=='__main__': main()
