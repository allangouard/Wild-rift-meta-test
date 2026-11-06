#!/usr/bin/env python3
"""Archive quantitative Riot Wild Rift patch deltas without modifying numeric sources.

Stores terse numeric change bullets with source URLs. Never applies unknown deltas.
"""
import datetime,json,re,urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
from bs4.element import Tag
import unicodedata
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'data/wr-riot-quantitative-patch-register-7.3d.json'
VERSIONS=['7-2d','7-3','7-3a','7-3b','7-3c','7-3d']
BASE='https://wildrift.leagueoflegends.com/fr-fr/news/game-updates/wild-rift-patch-notes-'
def compact(s):return re.sub(r'\s+',' ',s or '').strip()
def get(url):
 req=urllib.request.Request(url,headers={'User-Agent':'WildRiftNumericPatchAudit/1.0'})
 with urllib.request.urlopen(req,timeout=24) as r:return r.read().decode('utf-8','replace')
def identity(s):
 s=unicodedata.normalize('NFD',s)
 return re.sub('[^a-z]','', ''.join(x for x in s if unicodedata.category(x)!='Mn').lower())
ROSTER=json.loads((ROOT/'data/champions-picker-v151.json').read_text())['champions']
NAMES={identity(x['name']):x['name'] for x in ROSTER}
NAMES.update({'nunuwillump':'Nunu et Willump','leesin':'Lee Sin','missfortune':'Miss Fortune'})
allpatches=[]
for version in VERSIONS:
 url=BASE+version+'/'
 try:
  soup=BeautifulSoup(get(url),'html.parser')
  records=[];recentHeadings=[];champion=None;skill=None
  # Riot page headings are not always semantic h2/h3. Detect uppercased
  # short champion labels in the rendered page, keeping mapping provisional.
  container=soup
  tags=container.find_all(['h2','h3','h4','h5','h6','strong','b','p','li'])
  for element in tags:
   if element.name=='li':
    line=compact(element.get_text(' ',strip=True)).replace('->','→')
    if '→' not in line or not re.search(r'\d',line):continue
    before,after=line.split('→',1)
    records.append({'championCandidate':champion,'abilityCandidate':skill,
      'before':before[-180:],'after':after[:180],
      'numericBefore':re.findall(r'\d+(?:[.,]\d+)?',before)[-20:],
      'numericAfter':re.findall(r'\d+(?:[.,]\d+)?',after)[:20]})
    continue
   title=compact(element.get_text(' ',strip=True))
   if not title or len(title)>85:continue
   if title.upper()==title and identity(title) in NAMES:
    champion=NAMES[identity(title)];skill=None
   elif champion and 3<len(title)<55 and '→' not in title and element.name in ('h3','h4','h5','strong'):
    skill=title
  allpatches.append({'version':version.replace('-','.',1),'source':url,'numericChanges':records,'count':len(records)})
  print('RIOT_PATCH',version,len(records),flush=True)
 except Exception as e:
  allpatches.append({'version':version,'source':url,'error':repr(e)[:180],'numericChanges':[],'count':0})
  print('RIOT_ERROR',version,repr(e),flush=True)
result={'schema':'wrdi.riot_wild_rift_patch_numeric_register.v1',
 'game':'Wild Rift mobile ONLY','targetPatch':'7.3d',
 'collectedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'automaticallyMappedToChampion':False,'approvedForScoring':False,
 'note':'Numeric patch bullets need a champion and ability mapping; only exact reviewed overrides are applied elsewhere.',
 'patches':allpatches}
DEST.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('RIOT_TOTAL',sum(x['count'] for x in allpatches),flush=True)
if sum(x['count'] for x in allpatches)<30:raise SystemExit('Not enough Riot patch numeric changes; inspect source markup')
