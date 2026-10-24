import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet } from '../functions/api/favicon';
const response = (value: string | null) => onRequestGet({ request: new Request('https://opuszim.co.zw/api/favicon'), env: { DB: { prepare: () => ({ first: async () => value ? { value } : null }) } } } as any);
test('favicon resolves the current admin image with an uncached redirect', async () => {
 const r = await response('/api/media/img_abc.png');
 assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://opuszim.co.zw/api/media/img_abc.png');assert.equal(r.headers.get('cache-control'),'no-store');
});
test('missing or invalid favicon settings use the transparent original',async()=>{
 for(const value of [null,'javascript:alert(1)']){
  const r=await response(value);assert.equal(r.headers.get('location'),'https://opuszim.co.zw/images/opus-favicon-transparent.png');
 }
});
