#!/usr/bin/env python3
"""Read-only Registrar extension/standard-price import. No domain purchases.
Writes a private JSON snapshot and SQL file; apply SQL via Wrangler after review.
Requires CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
"""
import os,json,urllib.request,urllib.error,urllib.parse,time,secrets,concurrent.futures,decimal
base='https://api.cloudflare.com/client/v4/accounts/'+os.environ['CLOUDFLARE_ACCOUNT_ID']+'/registrar'
headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json'}
def call(path,body=None):
 req=urllib.request.Request(base+path,headers=headers,data=json.dumps(body).encode() if body is not None else None,method='POST' if body is not None else 'GET')
 with urllib.request.urlopen(req,timeout=35) as response:
  result=json.load(response)
 if not result.get('success'):raise RuntimeError('Registrar lookup failed')
 return result
items=[];cursor='';seen=set()
while True:
 r=call('/extensions?per_page=50'+('&cursor='+urllib.parse.quote(cursor,safe='') if cursor else ''))
 items.extend(r['result']);cursor=r.get('result_info',{}).get('cursor') or ''
 print('Extensions fetched:',len(items),flush=True)
 if not cursor or cursor in seen:break
 seen.add(cursor)
 if len(seen)>100:raise RuntimeError('Pagination limit')
probe='opus-price-check-'+secrets.token_hex(5)
names=[probe+'.'+x['metadata']['name'] for x in items]
batches=[names[i:i+20] for i in range(0,len(names),20)];checks=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for result in pool.map(lambda group:call('/domain-check',{'domains':group}),batches):
  checks.extend(result['result']['domains']);print('Prices checked:',len(checks),flush=True)
by_name={x['name']:x for x in checks}
def minor(value):return int((decimal.Decimal(str(value))*100).to_integral_value(rounding=decimal.ROUND_CEILING))
rows=[]
for item in items:
 extension=item['metadata']['name'];check=by_name.get(probe+'.'+extension,{})
 pricing=check.get('pricing') or {};valid=check.get('registrable') is True and check.get('tier','standard')=='standard' and pricing.get('currency')=='USD'
 rows.append({'extension':extension,'registration_cost_minor':minor(pricing['registration_cost']) if valid and 'registration_cost' in pricing else None,'renewal_cost_minor':minor(pricing['renewal_cost']) if valid and 'renewal_cost' in pricing else None,'availability': 'standard' if valid else 'enquiry','reason':check.get('reason') or ('standard' if valid else 'quote_required'),'updated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())})
open('/tmp/opus-domain-catalogue-rows.json','w').write(json.dumps(rows))
print('Catalogue complete:',len(rows),'priced:',sum(x['registration_cost_minor'] is not None for x in rows),flush=True)
sql='INSERT INTO domain_catalogue(extension,registration_cost_minor,renewal_cost_minor,availability,reason,updated_at) VALUES\n'+',\n'.join('('+','.join('NULL' if v is None else str(v) if isinstance(v,int) else "'"+v.replace("'","''")+"'" for v in r.values())+')' for r in rows)+'\nON CONFLICT(extension) DO UPDATE SET registration_cost_minor=excluded.registration_cost_minor,renewal_cost_minor=excluded.renewal_cost_minor,availability=excluded.availability,reason=excluded.reason,updated_at=excluded.updated_at;\n'
open('/tmp/opus-domain-import.sql','w').write(sql)
print('Import SQL: /tmp/opus-domain-import.sql',flush=True)
