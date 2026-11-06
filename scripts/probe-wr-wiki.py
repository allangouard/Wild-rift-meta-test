"""Check public Wild Rift-only League Wiki endpoints. No game data is changed."""
import urllib.request, urllib.error
urls=[
'https://wiki.leagueoflegends.com/en-us/WR%3AGalio',
'https://wiki.leagueoflegends.com/en-us/WR:Galio?action=raw',
'https://wiki.leagueoflegends.com/en-us/api.php?action=parse&page=WR%3AGalio&prop=wikitext&format=json',
'https://wiki.leagueoflegends.com/en-us/api.php?action=parse&page=WR%3AGalio&prop=text&format=json',
'https://wiki.leagueoflegends.com/en-us/WR%3ASyndra'
]
for url in urls:
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'WRDIResearch/1.0 (+https://github.com/allangouard/Wild-rift-meta-test)'})
  with urllib.request.urlopen(req,timeout=18) as r: content=r.read()
  print('SOURCE_STATUS',r.status,len(content),r.url,repr(content[:220]))
 except urllib.error.HTTPError as e:print('SOURCE_HTTP',e.code,url,repr(e.read(150)))
 except Exception as e:print('SOURCE_ERROR',url,str(e)[:180])

import re, html
url='https://wiki.leagueoflegends.com/en-us/WR%3AGalio'
req=urllib.request.Request(url,headers={'User-Agent':'WRDIResearch/1.0'})
with urllib.request.urlopen(req,timeout=25) as r: source=r.read().decode('utf-8','replace')
for key in ('Winds_of_War','Shield_of_Durand','Colossal_Smash','Magic Damage:', '11.5 / 10 / 8.5 / 7'):
 p=source.find(key)
 print('HTML_FRAGMENT',key,p,re.sub(r'\\s+',' ',source[max(0,p-260):p+950])[:1200])

from bs4 import BeautifulSoup
from bs4.element import Tag
request=urllib.request.Request('https://wiki.leagueoflegends.com/en-us/WR%3AGalio',headers={'User-Agent':'WRDIResearch/1.0'})
with urllib.request.urlopen(request,timeout=25) as response:
 source=response.read().decode('utf-8','replace')
soup=BeautifulSoup(source,'html.parser')
headings=soup.select('div.skill_header.skill_wrapper')
print('DOM_HEADERS',len(headings))
for header in headings[:2]:
 print('DOM_HEADER',header.select_one('.ability-info-stats__ability').get_text(' ',strip=True))
 print('DOM_PARENT',header.parent.name,header.parent.get('class'),len(header.parent.select('.ability-info-description')))
 print('DOM_DESCRIPTIONS_NEXT',[(e.name,e.get('class'),e.get_text(' ',strip=True)[:100]) for e in header.find_all_next('div',class_='ability-info-description',limit=3)])
 for el in list(header.next_elements)[:500]:
  if isinstance(el,Tag) and 'ability-info-description' in el.get('class',[]):
   print('DOM_DESC_FOUND',el.get_text(' ',strip=True)[:220]);break
 else:print('DOM_NO_DESC_IN_500')
url='https://wiki.leagueoflegends.com/en-us/Template:WR_Data_Galio/Colossal_Smash?action=raw'
try:
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'WRDIResearch/1.0'}),timeout=20) as response: raw=response.read().decode('utf-8','replace')
 print('RAW_PASSIVE_TEMPLATE',len(raw),raw[:1000].replace('\\n',' '))
except Exception as e:print('RAW_PASSIVE_ERROR',repr(e))
