"""Read-only public checks. A User-Agent test does not verify a crawler's real IP."""
import concurrent.futures,json,subprocess,urllib.parse,urllib.robotparser
from html.parser import HTMLParser
HOSTS=['property.opuszim.co.zw','hospitality.opuszim.co.zw','e-commerce.opuszim.co.zw','solar.opuszim.co.zw']
class Head(HTMLParser):
 def __init__(self):super().__init__();self.robots=[];self.canonicals=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if t=='meta'and d.get('name','').lower()in ['robots','googlebot']:self.robots.append(d.get('content'))
  if t=='link'and d.get('rel')=='canonical':self.canonicals.append(d.get('href'))
def get(url,agent):
 r=subprocess.run(['curl','-sS','--max-time','20','-L','--max-redirs','3','-A',agent,'-w','\n%{http_code}\n%{url_effective}',url],capture_output=True,text=True)
 if r.returncode:return {'transport_error':r.stderr.strip(),'http_status':None},''
 body,status,final=r.stdout.rsplit('\n',2);return {'http_status':int(status),'final_url':final},body
def check(host):
 base='https://'+host;root,body=get(base+'/','Mozilla/5.0 Opus crawlability check');head=Head();head.feed(body);result={'host':host,'root':root,'robots_meta':head.robots,'canonical':head.canonicals}
 robots,text=get(base+'/robots.txt','Mozilla/5.0 Opus crawlability check');result['robots_file']=robots
 if robots.get('http_status')==200:
  parser=urllib.robotparser.RobotFileParser();parser.parse(text.splitlines());result['robots_root_access']={agent:parser.can_fetch(agent,base+'/')for agent in ['Googlebot','OAI-SearchBot','ChatGPT-User','Claude-User','Claude-SearchBot','Google-Extended']}
 result['agent_http_checks']={agent:get(base+'/',agent)[0]for agent in ['Googlebot','OAI-SearchBot','ChatGPT-User']}
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=2)as pool:results=list(pool.map(check,HOSTS))
print(json.dumps({'checks':results,'limitations':'Requires live environment host grants. User-Agent responses do not prove verified crawler access or grant AI training rights.'},indent=2))
