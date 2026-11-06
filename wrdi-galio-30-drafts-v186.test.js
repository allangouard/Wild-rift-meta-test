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
 threatEvidence:require('./wrdi-galio-threat-evidence-v185.js')
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
test('Reference data contains thirty valid drafts and balanced roles',()=>{
 assert.equal(fixtures.scenarios.length,30);
 assert.equal(new Set(fixtures.scenarios.map(x=>x.id)).size,30);
 for(const expected of ['ap_burst','hybrid_offensive','tank_utility'])
  assert.equal(fixtures.scenarios.filter(x=>x.expectedRole===expected).length,10,expected);
 for(const scenario of fixtures.scenarios){
  const names=[...scenario.allies,...scenario.enemies];
  assert.equal(names.length,10,scenario.id);
  assert.equal(new Set(names).size,10,scenario.id+': duplicate');
  assert.equal(names[2],'Galio',scenario.id);
  for(const name of names)assert.ok(byName.has(name.toLowerCase()),scenario.id+' unknown '+name);
 }
});
for(const s of fixtures.scenarios){
 test(s.id+' · '+s.expectedRole+' · '+s.focus,()=>{
  const result=analyze(s);
  assert.equal(result.ok,true,s.id+' analysis failed: '+JSON.stringify(result).slice(0,650));
  assert.equal(result.build.strategy.role,s.expectedRole,
   s.id+' misidentified Galio job: '+JSON.stringify(result.draft.threats));
  assert.equal(result.draft.officialKitCoverage,10,s.id);
  assert.equal(result.dataReadiness.fullyDescribed,10,s.id);
  const ids=result.build.items.map(x=>x.id);
  assert.equal(ids.length,5,s.id);
  assert.equal(new Set(ids).size,5,s.id);
  assert.equal(modules.core.validateEquipment(ids,catalog,rules).valid,true,s.id+' illegal equipment');
  assert.equal(result.build.legal,true);
  assert.equal(result.build.lateSlots.ok,true,s.id);
  assert.equal(result.build.lateSlots.coreProtected,true,s.id);
  assert.deepEqual(ids.slice(0,3),result.build.lateSlots.coreIds,s.id+' core unexpectedly replaced');
  assert.ok(result.build.lateSlots.evaluatedPairs>4,s.id+' insufficient late pair comparison');
  assert.equal(result.runes.ok,true,s.id+' invalid rune result');
  assert.equal(modules.runeBridge.validate(result.runes.page,runes).valid,true,s.id);
  assert.equal(result.boots.ok,true,s.id);
  assert.ok(result.boots.candidates.length<=3,s.id);
  assert.equal(result.draft.threatEvidence.ok,true,s.id);
  if(result.build.strategy.role==='ap_burst'){
   assert.equal(result.runes.page.keystone,'Électrocution',s.id+' AP burst keystone');
   assert.ok(!ids.includes('unending_despair'),s.id+' should not waste burst slots on Despair');
  }else{
   assert.equal(result.runes.page.keystone,'Souverain des glaces',s.id+' control keystone');
  }
  if(result.draft.threats.shieldPressure<1.5){
   assert.ok(!ids.includes('oceanids_trident'),s.id+' Trident with isolated weak shielding');
  }
  assert.ok(result.build.alternatives.every(x=>
   x.protectedCorePreserved&&modules.core.validateEquipment(x.newIds,catalog,rules).valid),
   s.id+' illegal late conditional substitutions');
  const status={id:s.id,role:result.build.strategy.role,items:ids,
   boots:result.boots.recommended.name,rune:result.runes.page.keystone,
   shields:result.draft.threats.shieldPressure,healing:result.draft.threats.healPressure,
   latePairs:result.build.lateSlots.evaluatedPairs};
  console.log('WRDI_V186_DRAFT '+JSON.stringify(status));
 });
}
