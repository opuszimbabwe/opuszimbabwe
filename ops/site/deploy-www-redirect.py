"""Repair only www.opuszim.co.zw; never edits DNS or existing Workers/routes."""
import argparse,hashlib,json,os,pathlib,urllib.request,urllib.error,uuid
ROOT=pathlib.Path(__file__).resolve().parents[2]
ACCOUNT='bfdd1ae2b409f941958f78ea99348c2e';ZONE='d240c0475f8d4a2897707d247568a8ea';NAME='opus-www-redirect';PATTERN='www.opuszim.co.zw/*'
def api(path,body=None,method=None,content_type='application/json'):
 data=body if isinstance(body,bytes) else json.dumps(body).encode() if body is not None else None
 request=urllib.request.Request('https://api.cloudflare.com/client/v4'+path,data=data,method=method,headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':content_type})
 try:
  with urllib.request.urlopen(request,timeout=30)as r:result=json.load(r)
 except urllib.error.HTTPError as e:
  try:details=json.load(e).get('errors',[])
  except:details=[]
  raise RuntimeError('Cloudflare HTTP '+str(e.code)+': '+str(details))from None
 if not result.get('success'):raise RuntimeError('Cloudflare rejected the request')
 return result.get('result')
p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');args=p.parse_args()
routes=api('/zones/'+ZONE+'/workers/routes');assert not any(r['pattern']==PATTERN for r in routes),'www already has a Worker route; review it before changing'
(root:=ROOT/'ops/site/www-before.json').write_text(json.dumps({'routes':routes},indent=2)+'\n')
print(json.dumps({'preflight':'passed','route':PATTERN,'existing_routes_preserved':len(routes)}),flush=True)
if not args.activate:raise SystemExit(0)
assert not any(s['id']==NAME for s in api('/accounts/'+ACCOUNT+'/workers/scripts')),'Named redirect Worker already exists; review before replacing'
code=(ROOT/'ops/site/www-redirect.mjs').read_bytes();boundary='opus-www-'+uuid.uuid4().hex
fields=[('metadata',None,json.dumps({'main_module':'www-redirect.mjs','compatibility_date':'2026-09-01'}).encode(),'application/json'),('www-redirect.mjs','www-redirect.mjs',code,'application/javascript+module')]
parts=[]
for key,filename,value,kind in fields:
 disposition='Content-Disposition: form-data; name="'+key+'"'+('; filename="'+filename+'"'if filename else'')
 parts.append(('--'+boundary+'\r\n'+disposition+'\r\nContent-Type: '+kind+'\r\n\r\n').encode()+value+b'\r\n')
parts.append(('--'+boundary+'--\r\n').encode())
api('/accounts/'+ACCOUNT+'/workers/scripts/'+NAME,b''.join(parts),'PUT','multipart/form-data; boundary='+boundary)
try:route=api('/zones/'+ZONE+'/workers/routes',{'pattern':PATTERN,'script':NAME},'POST')
except Exception:
 api('/accounts/'+ACCOUNT+'/workers/scripts/'+NAME,method='DELETE');raise
current=api('/zones/'+ZONE+'/workers/routes');assert all(r in current for r in routes)
deployments=api('/accounts/'+ACCOUNT+'/workers/scripts/'+NAME+'/deployments')
record={'active_deployments':deployments['deployments'],'worker':NAME,'route':route,'source_sha256':hashlib.sha256(code).hexdigest(),'existing_routes_preserved':True,'dns_records_changed':False}
(ROOT/'ops/site/www-release.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record))
