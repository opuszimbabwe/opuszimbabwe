import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware';
import { requireAdmin } from '../functions/_lib/auth';
import type { Env } from '../functions/_lib/types';
const env = {} as Env;
const headers = { 'Cf-Access-Authenticated-User-Email': 'info.opuszim@gmail.com', 'Cf-Access-Jwt-Assertion': 'forged-test-header' };
function context(path: string, origin = 'https://opuszim.co.zw', identity?: Record<string,string>) {
 let served = false;
 return { request: new Request(origin + path, { headers: identity }), env, params: {}, data: {}, next: async () => { served = true; return new Response('PRIVATE DASHBOARD MARKUP', { headers: { 'content-type': 'text/html' } }); }, wasServed: () => served };
}
test('every admin alias redirects before dashboard data can be served', async () => {
 for (const path of ['/admin', '/admin/', '/admin/index.html', '/admin/index.txt', '/admin.html', '/%61dmin/', '/admin%2Findex.txt']) {
  const ctx = context(path);const response=await onRequest(ctx);
  assert.equal(response.status,308,path);assert.equal(response.headers.get('location'),'https://opuszim.co.zw/sysadmin/');assert.equal(ctx.wasServed(),false);
 }
});
test('unauthenticated or forged production requests cannot read admin pages or route data on any hostname', async () => {
 for (const origin of ['https://opuszim.co.zw','https://opuszimbabwe.pages.dev','https://example.opuszimbabwe.pages.dev']) {
  for(const path of ['/sysadmin/','/sysadmin/index.html','/sysadmin/index.txt','/sysadmin.html','/%73ysadmin%2Findex.txt']) {
   for (const identity of [undefined,headers]) {
    const ctx=context(path,origin,identity);const r=await onRequest(ctx);assert.equal(r.status,401);assert.equal(ctx.wasServed(),false);assert.doesNotMatch(await r.text(),/PRIVATE/);assert.match(r.headers.get('cache-control') || '',/no-store/);
   }
  }
 }
});
test('forged production API identity fails closed; local simulator behavior remains available',async()=>{
 const production=await requireAdmin(context('/api/admin/settings','https://opuszim.co.zw',headers));assert.ok(production instanceof Response);assert.equal(production.status,401);
 const local=await requireAdmin(context('/api/admin/settings','http://127.0.0.1:8788',headers));assert.equal(local,'info.opuszim@gmail.com');
});
