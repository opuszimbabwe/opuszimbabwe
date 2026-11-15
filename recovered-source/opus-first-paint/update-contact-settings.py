import os,json,urllib.request,pathlib
api='https://api.cloudflare.com/client/v4/accounts/bfdd1ae2b409f941958f78ea99348c2e/d1/database/885cb934-939a-4080-a48f-40901a111cc2/query'
def query(sql,params=None):
 req=urllib.request.Request(api,data=json.dumps({'sql':sql,'params':params or []}).encode(),headers={'Authorization':'Bearer '+os.environ['CLOUDFLARE_API_TOKEN'],'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=20) as r:d=json.load(r)
 assert d.get('success'),d.get('errors')
 return d['result']
rows=query("SELECT key,value FROM settings WHERE key IN ('service_pages','footer_socials','contact_cards','content_revision')")[0]['results'];old={r['key']:r['value'] for r in rows};assert len(old)==4
backup=pathlib.Path('/workspace/scratch/opus-first-paint/contact-settings-before-number-change.json');assert not backup.exists(),'Review existing backup before repeating number update';backup.write_text(json.dumps(old,indent=2))
new={}
for key in ['service_pages','footer_socials','contact_cards']:
 value=old[key].replace('263710740387','263776396530').replace('0710 740 387','0776 396 530').replace('0710740387','0776396530')
 if key=='contact_cards':
  cards=json.loads(value)
  for card in cards:
   if card.get('href')=='tel:+263776396530':card.update(title='Customer enquiries',line='0776 396 530',note='Main contact for customers and project enquiries')
   elif card.get('href')=='tel:+263773979162':card.update(title='Primary business line',line='0773 979 162',note='Primary Opus business number')
  value=json.dumps(cards,separators=(',',':'),ensure_ascii=False)
 new[key]=value
hextext=lambda value:"CAST(X'"+value.encode().hex()+"' AS TEXT)"
cases=' '.join('WHEN '+"'"+k+"' THEN "+hextext(v) for k,v in new.items())
conditions=' OR '.join("(key='"+k+"' AND value="+hextext(v)+')' for k,v in old.items())
sql="UPDATE settings SET value=CASE key "+cases+" WHEN 'content_revision' THEN CAST(CAST(value AS INTEGER)+1 AS TEXT) ELSE value END,updated_at=datetime('now') WHERE key IN ('service_pages','footer_socials','contact_cards','content_revision') AND (SELECT COUNT(*) FROM settings WHERE "+conditions+")=4"
r=query(sql)[0];assert r.get('meta',{}).get('changes')==4,'Settings changed concurrently; no overwrite applied'
print(json.dumps({'updated_settings':list(new),'revision_incremented':True,'backup_saved':True}))
