const http=require('node:http'),fs=require('node:fs'),path=require('node:path');const root=path.resolve(__dirname,'../production/pages-assets'),patch='/tmp/opus-pay-release/assets';
const mime={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.html':'text/html','.txt':'text/x-component'};
http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname;
 if(name==='/'){res.writeHead(302,{location:'/payments/'}).end();return}
 if(name==='/api/payments/config'){
  const names=['Visa','MasterCard','Zimswitch USD','Ecocash USD','InnBucks USD','Omari USD','OneMoney','POS2U','Telecash'];
  res.setHeader('content-type','application/json');res.end(JSON.stringify({configured:true,demo:true,currencies:[{code:'USD',name:'US Dollar'}],methods:names.map((name,i)=>({name,code:i>5?'PAYNOW_'+name.toUpperCase():['PZW204','PZW205','PZW215','PZW211','PZW212','PZW216'][i],minimumAmount:.1,maximumAmount:20000,redirectRequired:i>5,provider:i>5?'paynow':'pesepay'}))}));return
 }
 if(name.startsWith('/api/')){res.writeHead(400,{'content-type':'application/json'}).end(JSON.stringify({error:'This is a design preview. No payment has been initiated.'}));return}
if(name.endsWith('/'))name+='index.html';if(name.includes('..')){res.writeHead(400).end();return}const f=[patch,root].map(p=>path.join(p,name)).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!f){res.writeHead(404).end();return}res.setHeader('content-type',mime[path.extname(f)]||'application/octet-stream');
 if(path.extname(f)==='.html'){res.end(fs.readFileSync(f,'utf8').replace('</head>','<style>body::after{content:"Design preview · no payments";position:fixed;bottom:8px;left:12px;font:10px sans-serif;color:#4b4d55;z-index:99}</style></head>'));return}
 fs.createReadStream(f).pipe(res)}).listen(Number(process.env.PORT||8788),'0.0.0.0',()=>console.log('Opus Pay local design preview started. All payment requests are disabled.'));
