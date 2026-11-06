#!/usr/bin/env python3
"""Wild Rift-only structured numerical Wiki collector.

Retains sourced quantitative entries, not long-form copyrighted ability prose.
Never reads PC pages and does not change live build scoring.
"""
import concurrent.futures
import datetime
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
from bs4.element import Tag

ROOT=Path(__file__).resolve().parents[1]
ROSTER=json.loads((ROOT/'data/champions-picker-v151.json').read_text())['champions']
DEST=ROOT/'data/champion-ability-numeric-wiki-wr-v1.json'
HEADERS={'User-Agent':'WRDI-numeric-source-archive/1.0 (https://github.com/allangouard/Wild-rift-meta-test)'}
SLOTS=['passive','q','w','e','r']
def compact(s):
 s=re.sub(r'\s+',' ',str(s or '').replace('\xa0',' ')).strip()
 return re.sub(r'(?<=\d)\.\s+(?=\d)','.',s)
def text(element):
 return compact(element.get_text(' ',strip=True)) if element else ''
def numbers(s):
 # Preserve exact raw values; parsed numeric tokens are not inferred skill damage.
 return [float(n) for n in re.findall(r'(?<![\w.])(?:\d+(?:\.\d+)?|\.\d+)(?!\w)',s)]
def parse_html(content):
 soup=BeautifulSoup(content,'html.parser')
 heads=soup.select('div.skill_header.skill_wrapper')
 if len(heads)<5:
  # HTML entities in class names are parsed normally, but fallback may be needed.
  heads=soup.select('div[class*="skill_header"]')
 out=[]
 for header in heads:
  ability=header.select_one('div.ability-info-stats__ability')
  name=text(ability)
  if not name:continue
  # Preserve each complete official numeric stat section in machine-readable fields.
  stats=[]
  for block in header.select('div.ability-info-stats__stat'):
   label=text(block.select_one('.ability-info-stats__stat-label'))
   value=text(block.select_one('.ability-info-stats__stat-value'))
   if label and value:stats.append({'label':label.rstrip(':'),'value':value,'numericTokens':numbers(value)})
  # Formula sections are often adjacent siblings to skill header, not children.
  section=header.parent
  if not section:continue
  # The section ends at the following skill header (or its enclosing section).
  formulas=[]
  for dl in section.select('dl.skill-tabs'):
   for dt,dd in zip(dl.find_all('dt',recursive=False),dl.find_all('dd',recursive=False)):
    title=text(dt).rstrip(':'); value=text(dd)
    if title and value and re.search(r'\d',value):
     pair={'label':title[:150],'formula':value[:800],'numericTokens':numbers(value)}
     if pair not in formulas:formulas.append(pair)
  # For structure variants, inspect ability content in the immediate grandparent,
  # but do not mistakenly associate all five abilities together.
  if not formulas:
   for dl in header.select('dl.skill-tabs'):
    for dt,dd in zip(dl.find_all('dt',recursive=False),dl.find_all('dd',recursive=False)):
     title=text(dt).rstrip(':');value=text(dd)
     if title and value and re.search(r'\d',value):formulas.append({'label':title[:150],'formula':value[:800],'numericTokens':numbers(value)})
  # Capture quantitative tokens even when prose-style passives have no skill-tabs
  # (e.g. Galio passive scaling), without copying long-form Wiki descriptions.
  numericalEffects=[]
  dedup=set()
  # Descriptive subblocks often follow the header as siblings.
  # Stop at the next skill header to avoid mixing champion abilities.
  descriptions=[]
  for element in header.next_elements:
   if not isinstance(element,Tag):continue
   classes=element.get('class',[])
   if element is not header and 'skill_header' in classes:break
   if 'ability-info-description' in classes:descriptions.append(element)
  for desc in descriptions:
   plain=text(desc)
   for hit in re.finditer(r'(?<![\w.])\d+(?:\.\d+)?(?!\w)',plain):
    suffix=plain[hit.end():hit.end()+28]
    unit_match=re.match(r'\s*(%|seconds?|sec|s|AP|AD|bonus AD|bonus MR|mana|health|HP|per level|per 100 AP|per 100 bonus health)',suffix,re.I)
    unit=(unit_match.group(1) if unit_match else '').strip()
    label=(hit.group(),unit)
    if label in dedup:continue
    dedup.add(label)
    numericalEffects.append({'value':float(hit.group()),'unit':unit})
  out.append({'name':name,'stats':stats,'formulas':formulas,
    'descriptionNumericFacts':numericalEffects})
 # Only five actual ability sections, not patch history or embedded UI duplicates.
 seen=set();unique=[]
 for ability in out:
  if ability['name'].casefold() in seen:continue
  seen.add(ability['name'].casefold());unique.append(ability)
 return unique[:5]
def wiki_title(champion):
 key=champion['name']
 overrides={'Nunu et Willump':'Nunu & Willump','Wukong':'Wukong','Monkey King':'Wukong','Dr. Mundo':'Dr. Mundo'}
 return overrides.get(key,key)
def collect(champion):
 title=wiki_title(champion)
 uri='https://wiki.leagueoflegends.com/en-us/WR%3A'+urllib.parse.quote(title.replace(' ','_'),safe='')
 request=urllib.request.Request(uri,headers=HEADERS)
 try:
  with urllib.request.urlopen(request,timeout=28) as res: source=res.read().decode('utf-8','replace')
  skills=parse_html(source)
  if len(skills)!=5: return {'id':champion['id'],'name':champion['name'],'source':uri,'error':f'Expected five skills, got {len(skills)}','names':[x['name'] for x in skills]}
  return {'id':champion['id'],'name':champion['name'],'source':uri,'skills':dict(zip(SLOTS,skills)),
   'sourceStatus':'wiki_wr_unpatched','clientVerified':False}
 except Exception as e:return {'id':champion['id'],'name':champion['name'],'source':uri,'error':repr(e)[:200]}
def main():
 start=time.time()
 # The user-requested 7.3d changes are a separate reviewed overlay; never fake patch currency.
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  results=list(pool.map(collect,ROSTER))
 ok=[r for r in results if r.get('skills')]
 failed=[r for r in results if r.get('error')]
 record={'schema':'wrdi.wild_rift_numeric_source_catalog.v1','game':'Wild Rift mobile, NOT PC',
  'sourceName':'League of Legends Wiki / WR namespace','sourcePatchUnverified':True,
  'targetPatch':'7.3d','patchOverlayApplied':False,'approvedForDraftScoring':False,
  'collectedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
  'coverage':{'requested':len(ROSTER),'withFiveSkills':len(ok),'missing':len(failed),
    'abilityEntries':len(ok)*5,
    'statEntries':sum(len(s['stats']) for r in ok for s in r['skills'].values()),
    'formulaEntries':sum(len(s['formulas']) for r in ok for s in r['skills'].values())},
  'entries':results}
 DEST.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('COLLECT_RESULT',record['coverage'],'duration_seconds',round(time.time()-start,1),'file_bytes',DEST.stat().st_size,flush=True)
 print('COLLECT_MISSING',json.dumps(failed,ensure_ascii=False)[:18000],flush=True)
 for champ in ['Galio','Syndra','Brand']:
  hit=next((r for r in results if r['name']==champ),{})
  print('COLLECT_SAMPLE',champ,json.dumps(hit.get('skills',{}),ensure_ascii=False)[:5200],flush=True)
 # Exit nonzero on catastrophic failure; partial coverage remains archived with precise errors.
 if len(ok)<90:raise SystemExit('Critical source failure: fewer than 90 champion kits')
if __name__=='__main__':main()
