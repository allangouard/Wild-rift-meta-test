'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fixtures=require('./data/galio-draft-reference-v186.json');
const engine=require('./wrdi-draft-engine-v15.js');
const championData=require('./data/champions-picker-v151.json');
const champs=championData.champions;
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const bootsCatalog=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const officialKits=require('./data/champion-ability-extract-official-v1.json');
const reviewedKits=require('./data/champion-kits-official-fr-v1.json');
const numericKits=require('./data/champion-ability-numeric-wiki-wr-v1.json');
const numericPatch=require('./data/wr-champion-numeric-patch-overrides-v1.json');
const numericClient=require('./data/wr-client-verified-abilities-7.3d.json');
const modules={
 profiles:require('./wrdi-champion-profiles-v15.js'),
 team:require('./wrdi-galio-team-context-v1431.js'),
 guard:require('./wrdi-galio-item-guard-v1424.js'),
 core:require('./wrdi-core-v14.js'),
 optimizer:require('./wrdi-galio-five-item-optimizer-v1429.js'),
 order:require('./wrdi-galio-purchase-order-v1432.js'),
 contingency:require('./wrdi-galio-contingencies-v1433.js'),
 antihealOrder:require('./wrdi-antiheal-order-v169.js'),
 runeBridge:require('./wrdi-rune-bridge-v14.js'),
 runeAdvisor:require('./wrdi-galio-rune-advisor-v1411.js'),
 kitIntelligence:require('./wrdi-official-kit-intelligence-v158.js'),
 numericEngine:require('./wrdi-numeric-kits-v162.js'),
 mechanicsCalculator:require('./wrdi-mechanics-calculator-v159.js'),
 rolePlanner:require('./wrdi-galio-role-planner-v18.js'),
 readiness:require('./wrdi-galio-data-readiness-v18.js'),
 bootAdvisor:require('./wrdi-galio-boots-v18.js'),
 lateSlots:require('./wrdi-galio-late-slots-v184.js'),
 threatEvidence:require('./wrdi-galio-threat-evidence-v185.js'),
 conditionAudit:require('./wrdi-galio-condition-audit-v187.js'),
 releaseAudit:require('./wrdi-galio-release-audit-v19.js')
};
const byName=new Map(champs.map(x=>[x.name.toLowerCase(),x]));
function analyze(scenario){
 const chosen=[...scenario.allies,...scenario.enemies].map(name=>{
  const c=byName.get(name.toLowerCase());
  assert.ok(c,scenario.id+': champion not in Wild Rift client: '+name);
  return c;
 });
 return engine.analyze({
  picks:chosen.map(x=>String(x.id)),
  champions:Object.fromEntries(chosen.map(x=>[String(x.id),x.name])),
  championMeta:champs,officialKits,reviewedKits,numericKits,numericPatch,numericClient,
  catalog,rules,runes,bootsCatalog,modules
 });
}

const batch=require('./data/wild-rift-screenshot-batch-v193.json');
const coverage=require('./data/champion-kit-coverage-v2.json');
const gaps=require('./data/wild-rift-roster-gaps-v191.json');
const lookup=new Map(officialKits.entries.map(x=>[x.name,x]));
test('141 champion records are mapped uniquely to 705 sourced descriptions, with Bard still missing',()=>{
 assert.equal(champs.length,141);
 assert.equal(officialKits.entries.length,141);
 assert.equal(officialKits.coverage.extracted,141);
 assert.equal(gaps.missingCount,1);
 assert.deepEqual(gaps.missingChampions.map(x=>x.name),['Bard']);
 assert.equal(new Set(champs.map(x=>x.id)).size,141);
 assert.equal(batch.champions.length,14);
 assert.equal(batch.screenshotsTotal,122);
 assert.equal(coverage.catalogueCount,141);
 assert.equal(coverage.clientScreenshotDescriptions,16);
 assert.equal(coverage.fullActiveDescriptionsValidated,15);
 for(const champ of batch.champions){
  const source=lookup.get(champ.name),picker=byName.get(champ.name.toLowerCase());
  assert.ok(picker&&source,'Missing champion '+champ.name);
  assert.equal(source.source_type,'player_client_tooltips_not_official_website_extraction');
  assert.equal(source.numericRatiosVerified,false);
  assert.equal(source.allowedForScoring,false);
  assert.deepEqual(Object.keys(source.skills),['passive','q','w','e','r']);
  for(const item of Object.values(source.skills)){
   assert.ok(item.description_fr.length>50,champ.name);
   assert.ok(item.excerpt_fr.length>0);
   assert.ok(item.description_fr.startsWith(item.excerpt_fr));
   assert.ok(item.excerpt_fr.split(/\\s+/).length<=24);
  }
 }
});
const enemySlots={ "Cho'Gath":0,"K'Sante":0,"Kog'Maw":3,Mel:2,Nidalee:1,
 Nocturne:1,Norra:2,Rell:4,Skarner:1,Smolder:3,Taliyah:2,"Vel'Koz":2,Yunara:3,Zilean:4};
for(const champ of batch.champions){
 test('Galio draft with '+champ.name+' is mechanically described and equipment is legal',()=>{
  const enemies=['Garen','Lee Sin','Orianna','Jinx','Janna'];
  enemies[enemySlots[champ.name]]=champ.name;
  const r=analyze({id:'V193-'+champ.name,allies:['Ornn','Amumu','Galio','Caitlyn','Leona'],enemies});
  assert.equal(r.ok,true,champ.name+': '+JSON.stringify(r).slice(0,1100));
  assert.equal(r.draft.officialKitCoverage,10,champ.name);
  assert.equal(r.dataReadiness.fullyDescribed,10,champ.name);
  assert.equal(r.build.legal,true,champ.name);
  assert.equal(r.build.items.length,5);
  assert.equal(new Set(r.build.items.map(x=>x.id)).size,5);
  assert.equal(r.boots.ok,true);
  assert.ok(r.boots.candidates.length<=3);
  assert.equal(r.runes.ok,true);
  assert.equal(modules.runeBridge.validate(r.runes.page,runes).valid,true);
  assert.equal(r.releaseAudit.status,'experimental');
  assert.ok(r.dataReadiness.warnings.some(x=>x.includes(champ.name)),
    'Never invent numeric values for '+champ.name);
 });
}
test('Screenshot skills distinguish shields, damage types, crowd control and self sustain',()=>{
 const audit=modules.threatEvidence;
 const find=n=>audit.evaluate(lookup.get(n));
 assert.equal(find("Cho'Gath").mechanics.trueDamage,true);
 assert.equal(find("Vel'Koz").mechanics.trueDamage,true);
 assert.equal(find("K'Sante").shielding.ally,true);
 assert.equal(find('Zilean').shielding.ally,true);
 assert.equal(find('Mel').shielding.ally,false);
 assert.equal(find('Skarner').mechanics.maxHpDamage,true);
 assert.equal(find('Nidalee').healing.ally,true);
 assert.equal(find('Nocturne').healing.self,true);
});
test('Nidalee dual-form numeric coverage remains explicitly incomplete',()=>{
 const nid=lookup.get('Nidalee');
 assert.deepEqual(nid.incompleteVariants,['cougar_subabilities']);
 assert.equal(nid.allowedForScoring,false);
 assert.equal(nid.numericRatiosVerified,false);
});
