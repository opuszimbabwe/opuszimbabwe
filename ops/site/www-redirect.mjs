// Dedicated canonical redirect. No origin fetch, bindings, cookies or logging.
export default {
 async fetch(request) {
  const url=new URL(request.url);
  if(url.hostname!=='www.opuszim.co.zw')return new Response('Not found',{status:404});
  url.protocol='https:';url.hostname='opuszim.co.zw';url.port='';
  return new Response(null,{status:308,headers:{location:url.href,'cache-control':'public, max-age=300','x-content-type-options':'nosniff'}});
 }
};
