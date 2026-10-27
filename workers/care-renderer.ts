import puppeteer from '@cloudflare/puppeteer';
import {Buffer} from 'node:buffer';
type RenderEnv={BROWSER:Parameters<typeof puppeteer.launch>[0];CARE_RENDER_SECRET:string};
export default {async fetch(request:Request,env:RenderEnv){
 if(request.method!=='POST'||!env.CARE_RENDER_SECRET||request.headers.get('authorization')!==`Bearer ${env.CARE_RENDER_SECRET}`)return new Response('Unauthorized',{status:401});
 const declared=Number(request.headers.get('content-length')||0);if(declared>120000)return new Response('Too large',{status:413});
 let input:{html?:string};try{const text=await request.text();if(text.length>120000)return new Response('Too large',{status:413});input=JSON.parse(text);}catch{return new Response('Invalid request',{status:400});}
 if(typeof input.html!=='string'||input.html.length>100000)return new Response('Invalid document',{status:400});
 let stage='assets';
 let browser:Awaited<ReturnType<typeof puppeteer.launch>>|undefined;
 try{
  let html=input.html;
  const assets=[['https://opuszim.co.zw/fonts/Poppins-Regular.ttf','font/ttf'],['https://opuszim.co.zw/fonts/Poppins-Bold.ttf','font/ttf'],['https://opuszim.co.zw/images/logo-full.png','image/png']];
  const embedded=await Promise.all(assets.map(async([url,type])=>{const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Brand asset unavailable');const bytes=await response.arrayBuffer();if(bytes.byteLength>1000000)throw Error('Brand asset too large');return {url,data:`data:${type};base64,${Buffer.from(bytes).toString('base64')}`};}));
  for(const asset of embedded)html=html.split(asset.url).join(asset.data);
  stage='launch';browser=await puppeteer.launch(env.BROWSER);const page=await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request',r=>{let allowed=false;try{const u=new URL(r.url());allowed=u.origin==='https://opuszim.co.zw'&&(/^\/fonts\/Poppins-(Regular|Bold)\.ttf$/.test(u.pathname)||u.pathname==='/images/logo-full.png');}catch{}if(r.url()==='about:blank'||r.url().startsWith('data:'))allowed=true;void(allowed?r.continue():r.abort());});
  stage='html';await page.setContent(html,{waitUntil:'domcontentloaded',timeout:20000});
  stage='images';await page.evaluate(async()=>{await document.fonts.ready;if(!document.fonts.check('12px Poppins'))throw Error('Poppins font was not available');for(const image of Array.from(document.images)){await image.decode();const canvas=document.createElement('canvas');const scale=Math.min(1,720/image.naturalWidth,240/image.naturalHeight);canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const c=canvas.getContext('2d');if(!c)throw Error('Image rendering unavailable');c.fillStyle='#ffffff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(image,0,0,canvas.width,canvas.height);image.src=canvas.toDataURL('image/jpeg',.9);await image.decode();}});
  stage='pdf';const bytes=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
  if(bytes.byteLength>250000)return new Response('Document exceeds the safe attachment size',{status:422});
  return new Response(bytes as unknown as BodyInit,{headers:{'content-type':'application/pdf','cache-control':'no-store','x-content-type-options':'nosniff'}});
 }catch(error){let message=error instanceof Error?error.message:'Unknown rendering error';if(env.CARE_RENDER_SECRET)message=message.split(env.CARE_RENDER_SECRET).join('[redacted]');message=message.replace(/https?:\/\/\S+/g,'[url]').replace(/[a-zA-Z0-9_-]{40,}/g,'[identifier]').slice(0,300);console.error('Care render failure',{stage,message});return new Response('Background renderer is temporarily unavailable or its free allowance is exhausted.',{status:503,headers:{'retry-after':'3600','x-render-stage':stage,'x-render-error':encodeURIComponent(message)}});}
 finally{if(browser)await browser.close().catch(()=>{});}
}};
