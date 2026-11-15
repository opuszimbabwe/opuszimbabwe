from pathlib import Path
from PIL import Image
import subprocess,re,json,math,zipfile
r=Path(__file__).parent;bt=r/'downloads/buildtools/android-15';apk=r/'android/OpusChat-Android-1.0.3.apk'
def output(*args):return subprocess.check_output([str(bt/args[0]),*map(str,args[1:])],text=True)
manifest=output('aapt','dump','xmltree',apk,'AndroidManifest.xml');assert 'android.permission.POST_NOTIFICATIONS' in manifest;assert '.InboxNotificationService' in manifest;assert 'android.support.customtabs.trusted.TRUSTED_WEB_ACTIVITY_SERVICE' in manifest;assert 'asset_statements' in manifest
badging=output('aapt','dump','badging',apk);assert "versionCode='4'" in badging and "versionName='1.0.3'" in badging
assert "application-label:'OpusChat'" in badging
resources=output('aapt','dump','--values','resources',apk);line=next(l for l in resources.splitlines() if 'delegate_permission/common.handle_all_urls' in l);statement=json.loads(json.loads(line.strip().split('(string8) ',1)[1]));assert statement[0]['target']['site']=='https://opuszim.co.zw'
cert=output('apksigner','verify','--print-certs',apk);sha=re.search(r'certificate SHA-256 digest: ([a-f0-9]+)',cert).group(1).upper();links=json.loads((r/'android/assetlinks.json').read_text());assert sha==links[0]['target']['sha256_cert_fingerprints'][0].replace(':','')
with zipfile.ZipFile(apk) as z:
 dex=z.read('classes.dex');assert b'Lzw/co/opuszim/inbox/InboxNotificationService;' in dex and b'Landroidx/browser/trusted/TrustedWebActivityService;' in dex
 assert b'requestPermissions' in dex and b'createNotificationChannel' in dex
im=Image.open(r/'android/res/drawable/icon_foreground.png');assert im.mode=='RGBA';assert all(math.hypot(x-216,y-216)<132 for y in range(432) for x in range(432) if im.getpixel((x,y))[3])
assert '<inset' not in (r/'android/res/mipmap-anydpi-v26/ic_launcher.xml').read_text()
print('PASS actual Android APK: notification permission, runtime request, initial channel, browser delegation service, valid app-to-site statement, preserved signing certificate and full wordmark within adaptive circle/squircle safe bounds')
