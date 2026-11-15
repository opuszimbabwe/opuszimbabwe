// Cache identifiers only, never authenticated responses or private message bodies.
const knownCodes=new Map();const TTL=30*60*1000;
export async function codedInboxResponse(request,env){
 const response=await fetch(request);if(!response.ok||!env.OPUS_CUSTOMER_CODES||!response.headers.get('content-type')?.includes('application/json'))return response;
 const preserved=response.clone();try{const data=await response.json();if(!Array.isArray(data.sessions)||!data.sessions.length)return preserved;
 const rows=[...data.sessions].sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))||String(a.id).localeCompare(String(b.id)));const now=Date.now(),map=new Map();
 const missing=rows.filter(row=>{const cached=knownCodes.get(row.id);if(cached&&cached.until>now){map.set(row.id,cached.code);return false;}return true;});
 async function read(group){if(!group.length)return;const result=await env.OPUS_CUSTOMER_CODES.prepare('SELECT session_id,number FROM opus_customer_codes WHERE session_id IN ('+group.map(()=>'?').join(',')+')').bind(...group.map(row=>row.id)).all();for(const row of result.results){const code='Customer-'+String(row.number).padStart(3,'0');map.set(row.session_id,code);knownCodes.set(row.session_id,{code,until:now+TTL});}}
 for(let i=0;i<missing.length;i+=80)await read(missing.slice(i,i+80));const allocate=missing.filter(row=>!map.has(row.id));
 // Only new sessions write. Uniqueness and conditional inserts keep allocation stable under concurrency.
 for(let i=0;i<allocate.length;i+=40)await env.OPUS_CUSTOMER_CODES.batch(allocate.slice(i,i+40).map(row=>env.OPUS_CUSTOMER_CODES.prepare('INSERT INTO opus_customer_codes(session_id) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM opus_customer_codes WHERE session_id=?)').bind(row.id,row.id)));
 for(let i=0;i<allocate.length;i+=80)await read(allocate.slice(i,i+80));if(knownCodes.size>2000)for(const key of [...knownCodes.keys()].slice(0,knownCodes.size-1500))knownCodes.delete(key);
 data.sessions=data.sessions.map(row=>({...row,customer_code:map.get(row.id)}));const headers=new Headers(response.headers);headers.delete('content-length');headers.delete('content-encoding');headers.delete('etag');headers.set('cache-control','no-store');return Response.json(data,{status:response.status,headers});
 }catch{return preserved;}
}
