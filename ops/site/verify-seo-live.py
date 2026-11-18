"""Read-only verification of published SEO artifacts. No payments or messages."""
import argparse,importlib.util,json,pathlib,subprocess,xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('release',ROOT/'ops/activation/deploy-opus-pay.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)
p=argparse.ArgumentParser();p.add_argument('--result',default='/tmp/opus-seo-release-result.json');p.add_argument('--output',default='/tmp/opus-seo-live-verification.json');args=p.parse_args()
record=json.loads(pathlib.Path(args.result).read_text());config=json.loads((ROOT/'ops/site/seo-routes.json').read_text())
project=h.api(h.PREFIX);assert project['canonical_deployment']['id']==record['deployment_id'];assert project['canonical_deployment']['latest_stage']['status']=='success'
assert all(project['source']['config'][k]is False for k in ['deployments_enabled','production_deployments_enabled'])
def fetch(path):
 r=subprocess.run(['curl','-sS','--retry','2','--max-time','25','-D','-','https://opuszim.co.zw'+path],capture_output=True,check=True);header,body=r.stdout.split(b'\r\n\r\n',1)
 # The inherited proxy adds its own CONNECT response header.
 if b'200 Connection established'in header or b'server: envoy'in header.lower()and b'HTTP/'in body[:12]:header,body=body.split(b'\r\n\r\n',1)
 lines=header.decode().splitlines();status=int(lines[0].split()[1]);headers={line.split(':',1)[0].lower():line.split(':',1)[1].strip()for line in lines[1:]if ':'in line};return status,headers,body.decode(errors='replace')
checks=[]
for route in config['routes']:
 status,headers,html=fetch(route);assert status==200,(route,status);url=config['origin']+route;assert html.count('<link rel="canonical" href="'+url+'"/>')==1,route;assert headers.get('link')=='<'+url+'>; rel="canonical"',route;assert 'noindex'not in headers.get('x-robots-tag',''),route
 if route=='/care/':assert 'Ongoing care for websites, software and digital systems.'in html and 'Discuss monthly care'in html
 checks.append(route)
for a,b in config['aliases'].items():
 status,headers,_=fetch(a+'?opus_seo_check=1');assert status==308,(a,status);assert headers['location']==config['origin']+b+'?opus_seo_check=1'
for path in ['/404/','/opus-seo-nonexistent-verification/']:
 status,_,html=fetch(path);assert status==404,(path,status);assert 'noindex'in html
status,_,xml=fetch('/sitemap.xml');assert status==200;urls=[e.text for e in ET.fromstring(xml).iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')];assert urls==[config['origin']+r for r in config['routes']]
status,_,robots=fetch('/robots.txt');assert status==200;assert all(x in robots for x in ['Disallow: /admin/','Disallow: /sysadmin/','Disallow: /api/','Sitemap: '+config['origin']+'/sitemap.xml'])
status,_,pay=fetch('/payments/');assert status==200;assert 'noindex, nofollow'in pay
for directory in (ROOT/'production/workers').iterdir():
 expected=json.loads((directory/'deployment.json').read_text());active=h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/{directory.name}/deployments')['deployments'][0]['versions'];assert active==[{'version_id':expected['active_version_id'],'percentage':100}]
www=json.loads((ROOT/'ops/site/www-release.json').read_text());active=h.api(f'/accounts/{h.ACCOUNT}/workers/scripts/opus-www-redirect/deployments')['deployments'][0]['versions'];assert active==www['active_deployments'][0]['versions']
result={'active_deployment':record['deployment_id'],'public_urls_verified':checks,'sitemap_urls':len(urls),'aliases_redirect_correctly':3,'unknown_and_explicit_404_correct':True,'care_initial_content_verified':True,'private_exclusions_retained':True,'checkout_noindex_retained':True,'supporting_workers_unchanged':True,'google_indexing_not_yet_verified':True};pathlib.Path(args.output).write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
