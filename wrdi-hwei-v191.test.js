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

const hweiSheet=officialKits.entries.find(x=>x.name==='Hwei');
const hwei=champs.find(x=>x.name==='Hwei');
const screenshot=require('./data/hwei-client-abilities-7.3d-v191.json');
test('Hwei has one unique local picker ID, a verified Riot key and Wild Rift screenshot provenance',()=>{
 assert.ok(hwei);
 assert.equal(hwei.id,'10910');
 assert.equal(hwei.riotKey,910);
 assert.ok(hwei.idOrigin.includes('internal'));
 assert.equal(champs.length,141);
 assert.equal(officialKits.entries.length,141);
 assert.equal(officialKits.coverage.extracted,141);
 assert.equal(hweiSheet.source_type,'player_client_tooltips_not_official_website_extraction');
 assert.equal(hweiSheet.allowedForScoring,false);
 assert.deepEqual(Object.keys(hweiSheet.skills).sort(),['e','passive','q','r','w']);
 for(const slot of ['passive','q','w','e','r'])
  assert.ok(hweiSheet.skills[slot].description_fr.length>50);
 assert.equal(screenshot.approvedForNumericalCombatSimulation,false);
 assert.equal(Object.keys(screenshot.slots.q.choices).length,3);
 assert.equal(Object.keys(screenshot.slots.w.choices).length,3);
 assert.equal(Object.keys(screenshot.slots.e.choices).length,3);
 assert.equal(screenshot.slots.w.choices.ww.affectsAllies,true);
 assert.deepEqual(screenshot.slots.r.explosionBase,[200,300,400]);
});
test('Hwei shield is an actual ally shield while max-health damage and control remain independently detectable',()=>{
 const ev=modules.threatEvidence.evaluate(hweiSheet);
 assert.equal(ev.ok,true);
 assert.equal(ev.shielding.ally,true,'WW must be counted as ally shield');
 assert.equal(ev.mechanics.maxHpDamage,true,'QQ deals target max HP damage');
 assert.equal(ev.mechanics.hardControl,true,'EQ fear or EW root counts as hard CC');
 assert.equal(ev.healing.ally,false,'Hwei mana recovery must not be classified as ally healing');
 const n=modules.kitIntelligence.prepare(officialKits);
 assert.equal(n.ok,true,n.reason);
 assert.equal(n.count,141);
 const x=n.find(hwei.id);assert.ok(x);
 const derived=modules.kitIntelligence.analyze(x);
 assert.equal(derived.ok,true);
 assert.equal(derived.confidence,'player_client_full_descriptions_patch_not_exhaustively_verified');
});
test('A real Galio draft versus Hwei mid yields a full legal build, rune page and three boots at most',()=>{
 const result=analyze({id:'HWEI01',
 allies:['Ornn','Amumu','Galio','Caitlyn','Leona'],
 enemies:['Aatrox','Lee Sin','Hwei','Jinx','Janna']});
 assert.equal(result.ok,true,JSON.stringify(result).slice(0,1300));
 assert.equal(result.draft.officialKitCoverage,10);
 assert.equal(result.dataReadiness.fullyDescribed,10);
 assert.equal(result.draft.threatEvidence.ok,true);
 assert.ok(result.draft.threats.shieldPressure>=1.5,
  'Hwei and Janna have ally shields');
 assert.equal(result.build.items.length,5);
 assert.equal(result.build.legal,true);
 assert.equal(result.runes.ok,true);
 assert.equal(result.boots.ok,true);
 assert.ok(result.boots.candidates.length<=3);
 assert.equal(result.releaseAudit.status,'experimental');
 assert.equal(result.releaseAudit.knownMissingChampionNames.includes('Hwei'),false);
 assert.ok(result.dataReadiness.warnings.some(x=>x.includes('Hwei')),
  'Numeric Hwei missing must be flagged, never supplied from PC numbers');
});
test('Hwei support is also selectable in a legal ten-champion draft',()=>{
 const result=analyze({id:'HWEI02',
 allies:['Dr. Mundo','Rammus','Galio','Ashe','Braum'],
 enemies:['Garen','Kayn','Annie','Ezreal','Hwei']});
 assert.equal(result.ok,true,JSON.stringify(result).slice(0,1200));
 assert.equal(result.draft.officialKitCoverage,10);
 assert.equal(result.draft.threatEvidence.ok,true);
 assert.equal(result.build.legal,true);
 assert.equal(result.releaseAudit.status,'experimental');
});

test('Official current Wild Rift roster gap ledger remains honest after integrating Hwei',()=>{
 const gaps=require('./data/wild-rift-roster-gaps-v191.json');
 assert.equal(gaps.localPickerCountAfterHwei,126);
 assert.equal(gaps.localPickerCountAfterAurora,127);
 assert.equal(gaps.officialDirectoryChampionCountAtCheck,142);
 assert.equal(gaps.missingCount,1);
 assert.ok(!gaps.missingChampions.some(x=>x.name==='Hwei'));
 assert.ok(gaps.missingChampions.every(x=>!champs.some(c=>c.name===x.name)));
 assert.ok(gaps.missingChampions.every(x=>x.pcLeagueDataAllowed===false));
});
test('Hwei screenshot/Riot patch conflict is exposed and excluded from numerical scoring',()=>{
 assert.equal(hweiSheet.numericRatiosVerified,false);
 assert.ok(hweiSheet.unresolvedPatchConflicts.includes('e.ee.damageBase'));
 assert.equal(screenshot.sourcePatchVerified,false);
 const ee=screenshot.slots.e.choices.ee;
 assert.deepEqual(ee.damageBaseClientScreenshot,[70,120,170,220]);
 assert.deepEqual(ee.damageBaseRiotPatch73b,[60,110,160,210]);
 assert.equal(ee.damageBase,null);
 assert.equal(ee.excludedFromNumericalScoring,true);
});
