import urllib.request,re,html
from html.parser import HTMLParser
class P(HTMLParser):
 def __init__(self): super().__init__();self.path=[];self.sections=[];self.buffer=''
 def handle_starttag(self,t,a):
  if t in ('h1','h2','h3','h4','tr'):self.path.append([t,''])
 def handle_data(self,v):
  for p in self.path:p[1]+=v
 def handle_endtag(self,t):
  if self.path and self.path[-1][0]==t:
   x=self.path.pop()
   self.sections.append((x[0],re.sub(r'\\s+',' ',x[1]).strip()[:250]))
for url in ['https://hub-game.com/wildrift/en/champions/Galio','https://www.wildriftfire.com/guide/galio','https://hub-game.com/wildrift/en/champions']:
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 Wild Rift research'})
  with urllib.request.urlopen(req,timeout=20) as z: body=z.read().decode('utf-8','replace'); status=z.status
  p=P();p.feed(body)
  print('URL',url,'STATUS',status,'BYTES',len(body))
  print('HEADINGS',p.sections[:35])
  print('SKILLS',[(tag,v) for tag,v in p.sections if 'Damage' in v or 'Cooldown' in v][:8])
  print('LINKS',body.count('/wildrift/en/champions/'))
 except Exception as e:print('ERR',url,repr(e))
