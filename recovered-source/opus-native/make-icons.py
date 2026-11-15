from PIL import Image
from pathlib import Path
import math
root=Path(__file__).parent
# Generate package resources from existing clean transparent wordmark assets; preserve their alpha.
light=Image.open(root.parent/'opus-inbox-app/wordmark-light-v7.png').convert('RGBA')
dark=Image.open(root.parent/'opus-inbox-app/wordmark-dark-v7.png').convert('RGBA')
light=light.crop(light.getchannel('A').getbbox());dark=dark.crop(dark.getchannel('A').getbbox())

def contain(image,size,width,bg=(0,0,0,0)):
 out=Image.new('RGBA',(size,size),bg);art=image.resize((width,round(width*image.height/image.width)),Image.Resampling.LANCZOS);out.alpha_composite(art,((size-art.width)//2,(size-art.height)//2));return out
for theme,art in [('light',light),('dark',dark)]:
 icon=contain(art,512,480);icon.save(root/f'windows/icons/icon-{theme}.png');icon.save(root/f'windows/icons/icon-{theme}.ico',sizes=[(s,s) for s in [16,24,32,48,64,128,256]])
# Executable and shortcut default use the unboxed transparent dark-ink wordmark.
contain(light,512,480).save(root/'windows/icon.ico',sizes=[(s,s) for s in [16,24,32,48,64,128,256]])
# Android adaptive layer: artwork itself, rather than a square white image with an extra inset.
# All nontransparent pixels fit in the guaranteed central 66dp safe circle on a 108dp canvas.
foreground=contain(light,432,232);foreground.save(root/'android/res/drawable/icon_foreground.png')
# Separate monochrome small notification silhouette: Android tints this resource itself.
small=contain(light,96,88);small.putdata([(255,255,255,a) for r,g,b,a in small.getdata()]);small.save(root/'android/res/drawable/notification_small.png')
for folder,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
 contain(light,size,round(size*.70),(255,255,255,255)).convert('RGB').save(root/f'android/res/mipmap-{folder}/ic_launcher.png')
for size in [192,512]:
 contain(light,size,round(size*.70),(255,255,255,255)).convert('RGB').save(root.parent/f'opus-inbox-app/icon-{size}-v6.png')
for name in ['icon-light.png','icon-dark.png']:
 im=Image.open(root/'windows/icons'/name);assert im.getpixel((0,0))[3]==0
fg=Image.open(root/'android/res/drawable/icon_foreground.png');assert all(math.hypot(x-216,y-216)<132 for y in range(432) for x in range(432) if fg.getpixel((x,y))[3]>0)
print('Generated clean transparent Windows resources and Android circle/squircle-safe adaptive artwork')
