"""Local positive/negative deployment-guard checks; no network calls."""
import hashlib,importlib.util,json,pathlib
root=pathlib.Path(__file__).resolve().parents[2]
s=importlib.util.spec_from_file_location('guard',root/'ops/activation/checkout-guard.py');g=importlib.util.module_from_spec(s);s.loader.exec_module(g)
s=importlib.util.spec_from_file_location('h',root/'ops/activation/deploy-opus-pay.py');h=importlib.util.module_from_spec(s);s.loader.exec_module(h)
lock={'assets':{'/payments/index.html':'pinned'},'backend_bundle_sha256':hashlib.sha256(b'tested backend').hexdigest()}
def check(manifest,bundle,valid):
 body,ct=h.multipart({'manifest':json.dumps(manifest),'_worker.bundle':('_worker.bundle',bundle)})
 try:g.verify_upload(body,ct,lock)
 except AssertionError:
  assert not valid;return
 assert valid
check({'/payments/index.html':'pinned','/index.html':'new homepage'},b'tested backend',True)
check({},b'tested backend',False)
check({'/payments/index.html':'old checkout'},b'tested backend',False)
check({'/payments/index.html':'pinned'},b'old backend',False)
print('PASS: unrelated frontend updates allowed; missing/changed checkout and unreviewed backend rejected.')
