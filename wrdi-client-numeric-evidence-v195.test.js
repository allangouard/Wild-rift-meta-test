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
const clientRankTables=require('./data/wild-rift-client-rank-tables-v195.json');
const clientTooltipFacts=require('./data/wild-rift-client-tooltip-facts-v195.json');
const clientModule=require('./wrdi-client-numeric-evidence-v195.js');
const modules={
 clientNumericEvidence:clientModule,
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
  clientRankTables,clientTooltipFacts,
  catalog,rules,runes,bootsCatalog,modules
 });
}

test('Exactly 14 client-screened champions have sourced rank tables and five tooltip slots each',()=>{
 const r=clientModule.prepare(clientRankTables,clientTooltipFacts);
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,500));
 assert.equal(r.count,14);
 assert.equal(r.rankRows,150);
 assert.equal(r.rankCells,564);
 assert.equal(r.tooltipSlots,70);
 assert.equal(r.observedCoefficients,70);
 assert.equal(r.patchConfirmed,false);
 assert.equal(r.approvedForNumericCombat,false);
 assert.equal(clientRankTables.sourceArchiveSha256,clientTooltipFacts.sourceArchiveSha256);
 assert.equal(clientRankTables.sourceArchiveSha256,'57d87f830d7955c9155d1bc00e8a43d66a375be55d9c78cb9b859222c7c7a505');
 assert.equal(clientRankTables.sourceScreenshotJpegs,122);
 const data=require('./data/champion-kit-coverage-v2.json');
 assert.equal(data.screenshotRankTableRowsCaptured,150);
 assert.equal(data.screenshotRankCellsCaptured,564);
 assert.equal(data.numericStatsVerified,0,'Full patch certification is still separate from source transcription');
});
test('Critical four-rank values are preserved exactly from client screenshots',()=>{
 const r=clientModule.prepare(clientRankTables,clientTooltipFacts);
 const vals=(name,slot,field)=>r.getChampion(name).rankTables[slot].statRows[field].values;
 assert.deepEqual(vals("Cho'Gath",'q','base_magic_damage'),[80,135,190,245]);
 assert.deepEqual(vals("Cho'Gath",'e','target_max_hp_magic_damage_pct'),[2.3,2.7,3.1,3.5]);
 assert.deepEqual(vals("K'Sante",'e','base_shield'),[75,120,165,210]);
 assert.deepEqual(vals("Kog'Maw",'w','target_max_hp_magic_damage_pct'),[1.5,2.5,3.5,4.5]);
 assert.deepEqual(vals('Mel','w','reflected_projectile_damage_pct'),[40,45,50,55]);
 assert.deepEqual(vals('Nocturne','e','fear_duration_s'),[1.2,1.5,1.8,2.1]);
 assert.deepEqual(vals('Rell','q','base_magic_damage'),[70,130,190,250]);
 assert.deepEqual(vals('Skarner','q','cooldown_s'),[6.8,5.5,4.3,3]);
 assert.deepEqual(vals('Smolder','r','self_healing_base'),[100,135,170]);
 assert.deepEqual(vals('Taliyah','q','base_magic_damage_worked_ground'),[100,140,180,220]);
 assert.deepEqual(vals('Taliyah','r','cooldown_s'),[100,90,80]);
 assert.deepEqual(vals("Vel'Koz",'r','total_base_magic_damage'),[450,625,800]);
 assert.deepEqual(vals('Yunara','e','movement_speed_toward_visible_champions_pct'),[45,52.5,60,67.5]);
 assert.deepEqual(vals('Zilean','r','revive_base_heal'),[600,850,1100]);
});
test('Numeric input failures are rejected, no 3-rank ultimate expanded to four',()=>{
 const mutated=structuredClone(clientRankTables);
 mutated.champions.find(x=>x.name==="Cho'Gath").abilities.r.statRows.cooldown_s.values.push(40);
 const failed=clientModule.prepare(mutated,clientTooltipFacts);
 assert.equal(failed.ok,false);
 const r=clientModule.prepare(clientRankTables,clientTooltipFacts);
 assert.equal(r.getChampion("Cho'Gath").rankTables.r.rankCount,3);
 const nid=r.getChampion('Nidalee');
 assert.equal(Object.keys(nid.rankTables).length,1);
 assert.equal(nid.rankTables.q.rankCount,4);
 assert.equal(nid.tooltipFacts.r.approvedForNumericCombat,false);
});
test('New client data enriches a complete Galio draft but never fabricates damage',()=>{
 const r=analyze({id:'V195-validation',
  allies:['Ornn','Amumu','Galio','Caitlyn','Leona'],
  enemies:["Cho'Gath",'Skarner','Mel',"Kog'Maw",'Zilean']});
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,900));
 assert.equal(r.build.legal,true);
 assert.equal(r.calculations.clientNumericEvidence.ok,true);
 assert.equal(r.calculations.clientNumericEvidence.count,5);
 assert.ok(r.calculations.clientNumericEvidence.observedCoefficients>=12);
 assert.ok(r.calculations.clientNumericEvidence.rankRows>=15);
 assert.ok(r.calculations.clientNumericEvidence.rankValues>60);
 assert.equal(r.methods.clientRankTablesPatchCertified,false);
 assert.equal(r.methods.clientRankTablesUsedForDamage,false);
 assert.equal(r.releaseAudit.status,'experimental');
 assert.equal(r.runes.ok,true);
 assert.equal(r.boots.ok,true);
});
test('Old 125-champion Wiki source does not block the 142-champion current client picker',()=>{
 const fs=require('node:fs');
 const app=fs.readFileSync('./wrdi-app-v15.js','utf8');
 assert.ok(app.includes('numericCheck.count<100||numericCheck.count>list.length'));
 assert.ok(!app.includes('numericCheck.count!==list.length'));
 assert.ok(app.includes('WRDI_ClientNumericEvidenceV195'));
});

test('No observed AP/AD/PV coefficient is promoted to certified combat input',()=>{
 const x=clientModule.prepare(clientRankTables,clientTooltipFacts);
 assert.equal(x.ok,true);
 let count=0;
 for(const champ of clientTooltipFacts.champions)
  for(const ability of Object.values(champ.abilities))
   for(const coefficient of ability.observedCoefficients){
    assert.equal(coefficient.verifiedAtRank,'rank_1_tooltip_only');
    assert.equal(coefficient.confirmedConstantAcrossRanks,false);
    assert.equal(coefficient.enabledForCombat,false);
    count++;
   }
 assert.equal(count,70);
 assert.deepEqual(x.getChampion("Vel'Koz").tooltipFacts.r.observedCoefficients[0].coefficient,1.25);
});
