import pathlib,json,re,base64
root=pathlib.Path(__file__).parent
html=(root/'app.html').read_text().replace('__APP_CSS__',(root/'app.css').read_text()+(root/'rich-message.css').read_text()+(root/'composer-tools.css').read_text()).replace('__APP_JS__',(root/'rich-message.js').read_text()+(root/'composer-tools.js').read_text()+(root/'../opus-notifications/client.js').read_text()+(root/'app.js').read_text()+(root/'viewport.js').read_text())
paths={'SETTINGS':'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2','LOCK':'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4','REFRESH':'M20 7v5h-5 M4 17v-5h5 M5 8a8 8 0 0 1 13-3l2 3 M4 16l2 3a8 8 0 0 0 13-3','EXTERNAL':'M14 3h7v7M21 3 10 14 M10 3H3v18h18v-7','SEARCH':'M21 21l-6-6 M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14','BELL':'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M9 21h6','CHAT':'M21 11a9 9 0 0 1-9 9H4l-3 2 2-7a9 9 0 1 1 18-4','BACK':'M19 12H5m7-7-7 7 7 7','PIN':'M8 3h8l-1 7 4 4H5l4-4-1-7 M12 14v8','CLOSE':'M6 6l12 12M6 18 18 6','SEND':'m3 3 19 9-19 9 4-9-4-9Zm4 9h15','THEME':'M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9','DATA':'M5 19V9m7 10V3m7 16v-6'}
paths['CHAT']='M5 3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9l-6 3V6a3 3 0 0 1 2-3Z M7 8h10 M7 12h7'
for key,path in paths.items():html=html.replace('__'+key+'_ICON__','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+path+'"/></svg>')
html=html.replace('/images/icon-192.png','/opus-inbox-assets/icon-192-v6.png')
manifest={'id':'/sysadmin/mobile/','name':'OpusChat','short_name':'OpusChat','description':'Your private Opus Zimbabwe website inbox and phone alerts.','start_url':'/sysadmin/mobile/','scope':'/sysadmin/','display':'standalone','background_color':'#000000','theme_color':'#000000','lang':'en','icons':[{'src':'/opus-inbox-assets/icon-192-v6.png','sizes':'192x192','type':'image/png','purpose':'any maskable'},{'src':'/opus-inbox-assets/icon-512-v6.png','sizes':'512x512','type':'image/png','purpose':'any maskable'}]}
sw=(root/'notification-worker.js').read_text()+(root/'sw-additions.js').read_text()
assets={f'/opus-inbox-assets/icon-{size}-v4.png':base64.b64encode((root/f'icon-{size}-v4.png').read_bytes()).decode() for size in [192,512]}
assets.update({f'/opus-inbox-assets/icon-{size}-v6.png':base64.b64encode((root/f'icon-{size}-v6.png').read_bytes()).decode() for size in [192,512]})
assets.update({f'/opus-inbox-assets/icon-{size}-v5.png':base64.b64encode((root/f'icon-{size}-v5.png').read_bytes()).decode() for size in [192,512]})
assets.update({f'/opus-inbox-assets/wordmark-{theme}-v7.png':base64.b64encode((root/f'wordmark-{theme}-v7.png').read_bytes()).decode() for theme in ['dark','light']})
assets.update({f'/opus-inbox-assets/notify-logo-{theme}-v19.png':base64.b64encode((root/f'../opus-native/windows/icons/icon-{theme}.png').read_bytes()).decode() for theme in ['dark','light']})
assets.update({f'/opus-inbox-assets/notify-logo-{theme}-v18.png':base64.b64encode((root/f'../opus-native/windows/icons/icon-{theme}.png').read_bytes()).decode() for theme in ['dark','light']})
fontAssets={'/opus-inbox-assets/'+p.name:{'type':'font/woff2' if p.suffix=='.woff2' else 'text/css' if p.suffix=='.css' else 'text/plain','data':base64.b64encode(p.read_bytes()).decode()} for p in (root/'fonts').iterdir() if p.is_file()}
module='const fontAssets='+json.dumps(fontAssets)+';\n'+'const katexSource='+json.dumps((root/'vendor/package/dist/katex.min.js').read_text())+';\n'+'const iconAssets='+json.dumps(assets)+';\n'+'const appHTML='+json.dumps(html)+';\nconst manifest='+json.dumps(manifest)+';\nconst serviceWorker='+json.dumps(sw)+';\n'
module+='''export async function adminAppResponse(request,upstream=fetch){
 const url=new URL(request.url);
 if(fontAssets[url.pathname]&&request.method==='GET'){const asset=fontAssets[url.pathname];return new Response(Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers:{'content-type':asset.type,'cache-control':'public,max-age=31536000,immutable'}});}
 if(url.pathname==='/opus-inbox-assets/katex-0.19.1.min.js'&&request.method==='GET')return new Response(katexSource,{headers:{'content-type':'application/javascript','cache-control':'public,max-age=31536000,immutable'}});
 if(iconAssets[url.pathname]&&request.method==='GET')return new Response(Uint8Array.from(atob(iconAssets[url.pathname]),c=>c.charCodeAt(0)),{headers:{'content-type':'image/png','cache-control':'public,max-age=31536000,immutable'}});
 if(url.pathname==='/opus-inbox.webmanifest'&&request.method==='GET')return Response.json(manifest,{headers:{'content-type':'application/manifest+json','cache-control':'public,max-age=300'}});
 if(['/opus-notifications-sw.js','/opus-inbox-alerts-sw.js'].includes(url.pathname)&&request.method==='GET')return new Response(serviceWorker,{headers:{'content-type':'application/javascript','cache-control':'no-cache','service-worker-allowed':'/'}});
 if(!['/sysadmin/mobile','/sysadmin/mobile/'].includes(url.pathname))return null;
 if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{allow:'GET'}});
 const check=await upstream(new Request(new URL('/api/admin/session',url),{method:'GET',headers:request.headers,redirect:'manual'}));
 if(!check.ok||!check.headers.get('content-type')?.includes('application/json'))return new Response('Sign in to your authorised Opus account to open this inbox.',{status:401,headers:{'content-type':'text/plain','cache-control':'no-store'}});
 const session=await check.json().catch(()=>null);
 if(!session||typeof session.email!=='string')return new Response('Administrator sign-in required.',{status:401,headers:{'cache-control':'no-store'}});
 if(url.pathname==='/sysadmin/mobile')return Response.redirect(new URL('/sysadmin/mobile/',url),308);
 return new Response(appHTML,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-opus-inbox-app':'1','x-opus-inbox-version':'21','x-content-type-options':'nosniff','referrer-policy':'no-referrer','x-frame-options':'DENY','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss://opuszim.co.zw; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"}});
}
'''
(root/'admin-app.mjs').write_text(module)
print('App shell bytes:',len(html.encode()),'; assets reuse existing Opus icons; no customer messages cached.')
