from pathlib import Path
import subprocess,zipfile
root=Path(__file__).parent;app=root/'android';downloads=root/'downloads';bt=downloads/'buildtools/android-15';platform=downloads/'platform/android-35/android.jar'
def run(args):subprocess.run([str(a) for a in args],cwd=app,check=True)
classpath=':'.join(map(str,[platform,*sorted((app/'libs').glob('*.jar'))]))
run(['java','-jar',downloads/'ecj.jar','-1.8','-proc:none','-classpath',classpath,'-d',app/'classes',*sorted((app/'src').rglob('*.java'))])
with zipfile.ZipFile(app/'own-classes.jar','w') as z:
 for f in (app/'classes').rglob('*.class'):z.write(f,f.relative_to(app/'classes'))
run([bt/'d8','--min-api','23','--lib',platform,'--output',app/'dex',app/'own-classes.jar',*sorted((app/'libs').glob('*.jar'))])
run([bt/'aapt','package','-f','-M',app/'AndroidManifest.xml','-S',app/'res','-A',app/'assets','-I',platform,'-F',app/'unsigned-1.0.3.apk'])
with zipfile.ZipFile(app/'unsigned-1.0.3.apk','a') as z:
 for f in (app/'dex').glob('*.dex'):z.write(f,f.name)
run([bt/'zipalign','-f','4',app/'unsigned-1.0.3.apk',app/'aligned-1.0.3.apk'])
run([bt/'apksigner','sign','--ks',app/'release-signing.p12','--ks-key-alias','opus-inbox','--ks-pass','file:'+str(app/'signing-password'),'--out',app/'OpusChat-Android-1.0.3.apk',app/'aligned-1.0.3.apk'])
run([bt/'apksigner','verify','--verbose',app/'OpusChat-Android-1.0.3.apk'])
print('Android 1.0.3 package signed with preserved release identity')
