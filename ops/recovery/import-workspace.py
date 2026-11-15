"""Preserve available source without keys, customer screenshots or old builds."""
import argparse, hashlib, json, pathlib, shutil

ROOT = pathlib.Path(__file__).resolve().parents[2]
SOURCE_SUFFIXES = {'.js','.mjs','.cjs','.ts','.tsx','.py','.json','.jsonc','.toml','.md','.css','.html','.java','.kt','.xml','.gradle','.pro','.txt','.svg','.woff','.woff2','.ttf','.otf'}
IGNORE_PARTS = {'node_modules','.git','.wrangler','.gradle','.next','build','dist','out','backups','downloads','classes','dex','libs','__pycache__'}
IGNORE_NAMES = {'vapid-private','vapid-public','signing-password','SHA256SUMS','release-signing.p12','deploy.py','live-worker.mjs','native-release-1.0.1.json','native-release-1.0.2.json','native-release-1.0.3.json','native-release-1.0.4.json'}
BRAND_PREFIXES = ('icon','wordmark','notify-logo','admin-app-icon','admin-small-icon','admin-square-icon')

def selected(relative):
    if any(part in IGNORE_PARTS or part.startswith('.') for part in relative.parts): return False
    if relative.name in IGNORE_NAMES or relative.name.startswith(('worker-before-','mastercard-live-backup')): return False
    if relative.suffix in {'.p12','.jks','.keystore','.pem','.key','.apk','.exe','.idsig','.jar','.class','.dex','.bin','.map','.sqlite'}: return False
    if relative.suffix in {'.png','.ico','.webp'}:
        return relative.name.startswith(BRAND_PREFIXES) or 'res' in relative.parts or 'icons' in relative.parts
    # Include just the vendored browser library and its license, not package caches.
    if 'vendor' in relative.parts:
        return relative.as_posix() in {'vendor/package/dist/katex.min.js','vendor/package/LICENSE'}
    return relative.suffix in SOURCE_SUFFIXES or relative.name=='LICENSE'

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--scratch',required=True)
    args=parser.parse_args()
    inventory=[]
    for name in ['opus-first-paint','opus-inbox-app','opus-notifications','opus-native']:
        source=pathlib.Path(args.scratch)/name
        for path in sorted(source.rglob('*')):
            if not path.is_file(): continue
            relative=path.relative_to(source)
            if not selected(relative): continue
            target=ROOT/'recovered-source'/name/relative
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(path,target)
            content=target.read_bytes()
            inventory.append({'file':str(target.relative_to(ROOT)),'bytes':len(content),'sha256':hashlib.sha256(content).hexdigest()})
    (ROOT/'production/state/workspace-source-inventory.json').write_text(json.dumps({
        'status':'Recovered workspace source; some files predate the active compiled Workers and native Android 1.0.5.',
        'authoritative_runtime':'production/workers/*/deployment.json',
        'excluded':'Credentials, signing keys, customer screenshots/data, dependencies, caches, installers, superseded Worker backups and the unsafe original deployment script.',
        'files':inventory},indent=2)+'\n')
    print(json.dumps({'source_files_preserved':len(inventory),'bytes':sum(file['bytes'] for file in inventory)}))

if __name__=='__main__': main()
