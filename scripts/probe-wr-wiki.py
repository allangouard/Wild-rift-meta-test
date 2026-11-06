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
