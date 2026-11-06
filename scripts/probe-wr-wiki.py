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
