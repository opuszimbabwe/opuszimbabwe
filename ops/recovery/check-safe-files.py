"""Inspect tracked recovery files for accidental credential/private-data commits."""
import pathlib, re, subprocess, sys

ROOT=pathlib.Path(__file__).resolve().parents[2]
forbidden={'.p12','.pfx','.jks','.keystore','.key','.pem','.apk','.exe','.idsig','.class','.dex','.sqlite','.sqlite-wal','.sqlite-shm'}
patterns={
    'private_key_material':re.compile(rb'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----(?:\\n|\s)+[A-Za-z0-9+/]{64,}'),
    'live_api_key':re.compile(rb'(?<![A-Za-z0-9_])(?:sk_live_|re_)[A-Za-z0-9_-]{25,}'),
    'google_authorization_code':re.compile(rb'(?<![A-Za-z0-9+/])4/0[A-Za-z0-9_-]{30,}(?=[\s\"\'])'),
    'receipt_capability_url':re.compile(rb'[?&](?:token|care_token|domain_token)=[a-f0-9]{64}(?=[\s\"\'&])'),
}
paths=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).split(b'\0')
findings=[];count=0
for raw in paths:
    if not raw:continue
    relative=pathlib.Path(raw.decode());path=ROOT/relative
    if not path.is_file():continue
    count+=1
    if path.suffix in forbidden or path.name in {'vapid-private','signing-password'} or (path.name.startswith('.env') and path.name!='.env.example'):
        findings.append((str(relative),'forbidden_sensitive_or_build_file'));continue
    if not any(relative.parts[0]==part for part in ['production','recovered-source','ops','functions','scripts','migrations']):continue
    content=path.read_bytes()
    for name,pattern in patterns.items():
        if pattern.search(content):findings.append((str(relative),name))
if findings:
    # Only paths and finding categories: never print the matched secret value.
    for filename,kind in findings:print(filename,kind,file=sys.stderr)
    sys.exit(1)
print(f'PASS: {count} tracked files checked; no credential/private-key/capability matches or forbidden outputs.')
