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


const bard=require('./data/bard-client-abilities-v194.json');
const bardSheet=officialKits.entries.find(x=>x.name==='Bard');
test('Bard brings Wild Rift screenshot-sourced descriptions for all five skill slots',()=>{
 const pick=champs.find(x=>x.name==='Bard');
 assert.equal(champs.length,142);
 assert.equal(officialKits.entries.length,142);
 assert.equal(pick.id,'11115');
 assert.equal(pick.riotKey,432);
 assert.deepEqual(pick.lanes,['Support']);
 assert.deepEqual(Object.keys(bardSheet.skills),['passive','q','w','e','r']);
 assert.equal(bardSheet.source_type,'player_client_tooltips_not_official_website_extraction');
 assert.equal(bardSheet.allowedForScoring,false);
 assert.equal(bard.numericSimulationApproved,false);
 assert.equal(bard.sourcePatchVerified,false);
 assert.deepEqual(bard.skills.q.cooldownSec,[10,9,8,7]);
 assert.deepEqual(bard.skills.w.baseHeal,[50,80,110,140]);
 assert.equal(bard.skills.w.maxActiveSanctuaries,3);
 assert.equal(bard.skills.r.stasisDurationSec,2.5);
});
test('Bard offers ally healing and conditional stun but NOT shields, true damage or max-HP damage',()=>{
 const e=modules.threatEvidence.evaluate(bardSheet);
 assert.equal(e.ok,true);
 assert.equal(e.healing.ally,true);
 assert.equal(e.shielding.ally,false);
 assert.equal(e.shielding.self,false);
 assert.equal(e.mechanics.trueDamage,false);
 assert.equal(e.mechanics.maxHpDamage,false);
 assert.equal(e.mechanics.hardControl,true);
 const entry=modules.kitIntelligence.prepare(officialKits);
 assert.equal(entry.ok,true);
 assert.equal(entry.count,142);
});
test('Bard enemy support fits a complete Galio draft with legal build/runes/boots',()=>{
 const r=analyze({id:'BARD-v194',allies:['Ornn','Amumu','Galio','Caitlyn','Leona'],
 enemies:['Garen','Lee Sin','Orianna','Jinx','Bard']});
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,1200));
 assert.equal(r.draft.officialKitCoverage,10);
 assert.equal(r.dataReadiness.fullyDescribed,10);
 assert.equal(r.draft.threatEvidence.ok,true);
 assert.equal(r.build.items.length,5);
 assert.equal(r.build.legal,true);
 assert.equal(r.runes.ok,true);
 assert.equal(modules.runeBridge.validate(r.runes.page,runes).valid,true);
 assert.equal(r.boots.ok,true);
 assert.ok(r.boots.candidates.length<=3);
 assert.equal(r.releaseAudit.status,'experimental');
 assert.deepEqual(r.releaseAudit.knownMissingChampionNames,[]);
});
