from pathlib import Path
import subprocess,json,hashlib,concurrent.futures
root=Path(__file__).parent;exe=root/'windows/dist/OpusChat-Windows-Setup-1.0.4.exe';apk=root/'android/OpusChat-Android-1.0.3.apk';size=5242880
subprocess.run(['/home/agent/.cache/electron-builder/7zip@1.0.0/7zip-linux-x64-16wjr/bin/7zz','t',str(exe)],check=True,stdout=subprocess.DEVNULL)
raw=exe.read_bytes();files=[apk]
for i,start in enumerate(range(0,len(raw),size)):
 p=Path(str(exe)+'.part-'+str(i));p.write_bytes(raw[start:start+size]);files.append(p)
meta={'windows_version':'1.0.4','android_version':'1.0.3','windows_size':len(raw),'part_size':size,'parts':len(files)-1,'windows_sha256':hashlib.sha256(raw).hexdigest(),'android_sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'windows_signed':False};(root/'native-release-1.0.4.json').write_text(json.dumps(meta,indent=2)+'\n');print('Final installer archive verified; private upload starting',flush=True)
def upload(p):
 result=subprocess.run(['/workspace/opuszimbabwe/node_modules/.bin/wrangler','r2','object','put','opus-inbox-private/app-releases/'+p.name,'--file',str(p),'--remote','--config',str(root/'wrangler.jsonc')],capture_output=True,text=True)
 if result.returncode:raise RuntimeError('Upload failed: '+p.name+' '+result.stderr[-800:])
 return p.name
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for name in pool.map(upload,files):print('Uploaded:',name,flush=True)
print('All OpusChat release objects uploaded; historical releases preserved',flush=True)
