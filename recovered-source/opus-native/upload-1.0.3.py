from pathlib import Path
import subprocess,concurrent.futures,json
root=Path(__file__).parent;meta=json.loads((root/'native-release-1.0.3.json').read_text());files=[root/'android/Opus-Inbox-Android-1.0.2.apk',*[root/f'windows/dist/Opus-Inbox-Windows-Setup-1.0.3.exe.part-{i}' for i in range(meta['parts'])]]
def upload(p):
 result=subprocess.run(['/workspace/opuszimbabwe/node_modules/.bin/wrangler','r2','object','put','opus-inbox-private/app-releases/'+p.name,'--file',str(p),'--remote','--config',str(root/'wrangler.jsonc')],capture_output=True,text=True)
 if result.returncode:raise RuntimeError('Upload failed: '+p.name+' '+result.stderr[-800:])
 return p.name
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for name in pool.map(upload,files):print('Uploaded private release object:',name,flush=True)
print('All release objects uploaded; existing versions preserved',flush=True)
