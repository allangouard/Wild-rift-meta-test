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


const auroraSheet=officialKits.entries.find(x=>x.name==='Aurora');
const aurora=champs.find(x=>x.name==='Aurora');
const screenshot=require('./data/aurora-client-abilities-v192.json');
test('Aurora is included in 142 valid Wild Rift champion identities, not as a PC import',()=>{
 assert.ok(aurora);assert.equal(aurora.id,'10893');
 assert.equal(aurora.riotKey,893);
 assert.ok(aurora.idOrigin.includes('internal'));
 assert.equal(champs.length,142);
 assert.equal(officialKits.entries.length,142);
 assert.equal(officialKits.coverage.extracted,142);
 assert.equal(auroraSheet.source_type,'player_client_tooltips_not_official_website_extraction');
 assert.equal(auroraSheet.allowedForScoring,false);
 assert.deepEqual(Object.keys(auroraSheet.skills).sort(),['e','passive','q','r','w']);
 for(const slot of ['passive','q','w','e','r'])
  assert.ok(auroraSheet.skills[slot].description_fr.length>50);
 assert.equal(screenshot.approvedForNumericalCombatSimulation,false);
 assert.equal(screenshot.sourcePatchVerified,false);
 assert.equal(screenshot.slots.w.shield,false);
});
test('Aurora has conditional personal healing, not allied healing, shield or a hard stun',()=>{
 const ev=modules.threatEvidence.evaluate(auroraSheet);
 assert.equal(ev.ok,true);
 assert.equal(ev.healing.self,true,'Three-hit passive heals Aurora');
 assert.equal(ev.healing.ally,false,'Passive does not heal an ally');
 assert.equal(ev.shielding.ally,false);
 assert.equal(ev.shielding.self,false);
 assert.equal(ev.mechanics.maxHpDamage,true);
 assert.equal(ev.mechanics.hardControl,false,'Slow does not count as a hard stun');
 const ready=modules.kitIntelligence.prepare(officialKits);
 assert.equal(ready.ok,true,ready.reason);
 assert.equal(ready.count,142);
 const intel=modules.kitIntelligence.analyze(ready.find(aurora.id));
 assert.equal(intel.confidence,'player_client_full_descriptions_patch_not_exhaustively_verified');
 assert.equal(intel.patchVerified,false);
});
test('Aurora client screenshots preserve five rank-dependent skills without inventing full sim',()=>{
 assert.deepEqual(screenshot.slots.q.cooldownSeconds,[8,7.5,7,6.5]);
 assert.deepEqual(screenshot.slots.e.damageBase,[80,130,180,230]);
 assert.deepEqual(screenshot.slots.w.invisibilityDurationSeconds,[1,1.2,1.4,1.6]);
 assert.deepEqual(screenshot.slots.r.realmZoneDurationSeconds,[2.5,3.25,4]);
 assert.equal(screenshot.slots.passive.requiresHitCount,3);
 assert.equal(screenshot.slots.passive.healsAllies,false);
 assert.equal(screenshot.slots.r.hardCrowdControl,false);
 assert.equal(screenshot.approvedForNumericalCombatSimulation,false);
});
test('Galio versus Aurora mid generates complete legal build without claimed verified damage',()=>{
 const result=analyze({id:'AURORA01',
 allies:['Ornn','Amumu','Galio','Caitlyn','Leona'],
 enemies:['Aatrox','Lee Sin','Aurora','Jinx','Janna']});
 assert.equal(result.ok,true,JSON.stringify(result).slice(0,1000));
 assert.equal(result.draft.officialKitCoverage,10);
 assert.equal(result.dataReadiness.fullyDescribed,10);
 assert.equal(result.draft.threatEvidence.ok,true);
 assert.equal(result.build.legal,true);
 assert.equal(result.build.items.length,5);
 assert.equal(result.runes.ok,true);
 assert.equal(result.boots.ok,true);
 assert.ok(result.boots.candidates.length<=3);
 assert.equal(result.releaseAudit.status,'experimental');
 assert.ok(result.dataReadiness.warnings.some(x=>x.includes('Aurora')),
  'Aurora numeric wiki coverage absent is disclosed, not invented from PC');
});
test('Aurora top versus Galio also works as one of five enemies',()=>{
 const result=analyze({id:'AURORA02',
 allies:['Dr. Mundo','Rammus','Galio','Ashe','Braum'],
 enemies:['Aurora','Kayn','Annie','Ezreal','Janna']});
 assert.equal(result.ok,true,JSON.stringify(result).slice(0,1000));
 assert.equal(result.draft.officialKitCoverage,10);
 assert.equal(result.build.legal,true);
 assert.equal(result.draft.threatEvidence.ok,true);
});
test('Aurora removed from missing Wild Rift roster; only Bard remains pending',()=>{
 const gap=require('./data/wild-rift-roster-gaps-v191.json');
 assert.equal(gap.localPickerCountAfterAurora,127);
 assert.equal(gap.missingCount,0);
 assert.ok(!gap.missingChampions.some(x=>x.name==='Aurora'));
 assert.ok(gap.missingChampions.every(x=>!champs.some(c=>c.name===x.name)));
 const audit=modules.releaseAudit.inspect({championMeta:champs});
 assert.equal(audit.knownMissingChampionNames.length,1);
});
