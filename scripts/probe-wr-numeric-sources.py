"""Only Hub Game Wild Rift: non-invasive diagnostics for public pages.
Never tries to evade site access restrictions. Never accesses other game data sites.
"""
import urllib.request
import urllib.error
from datetime import datetime, timezone

URLS=[
 "https://hub-game.com/wildrift/en/champions/Galio",
 "https://hub-game.com/wildrift/en/champions/Galio/",
 "https://hub-game.com/wildrift/en/champions",
 "https://hub-game.com/wildrift/en",
]

for url in URLS:
 try:
  request=urllib.request.Request(url,headers={"User-Agent":"Wild Rift Draft Intelligence Source Audit/1.0"})
  with urllib.request.urlopen(request,timeout=15) as response:
   body=response.read()
   print({"url":url,"http":response.status,"bytes":len(body),"time":datetime.now(timezone.utc).isoformat()})
 except urllib.error.HTTPError as err:
  print({"url":url,"http":err.code,"reason":err.reason,"time":datetime.now(timezone.utc).isoformat()})
 except Exception as err:
  print({"url":url,"error":str(err)[:160]})
