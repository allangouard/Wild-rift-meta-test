'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const quality=require('./wrdi-decision-quality-v20.js');
const fixtures=require('./data/galio-draft-reference-v186.json');
const engine=require('./wrdi-draft-engine-v15.js');
const champs=require('./data/champions-picker-v151.json').champions;
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
const lookup=new Map(champs.map(x=>[x.name,x]));
function selectUnused(s,candidates){
 const present=new Set([...s.allies,...s.enemies]);
 const name=candidates.find(x=>!present.has(x)&&lookup.has(x));
 assert.ok(name,'No alternative available in Wild Rift roster for '+s.id);
 return name;
}
function variants(refs){
 const all=[...refs];
 // Three independent, deterministic enemy-draft perturbations per baseline.
 // Allied composition remains unchanged -> role ground truth remains stable.
 for(const base of refs)for(const [suffix,slot,candidates] of [
  ['mid',2,['Syndra','Yasuo','Orianna','Zed','Akali','Veigar']],
  ['support',4,['Janna','Nami','Lulu','Soraka','Braum','Leona','Milio']]
 ]){
  const updated={...base,enemies:[...base.enemies],id:base.id+'-'+suffix,
   focus:base.focus+' — changement '+suffix};
  updated.enemies[slot]=selectUnused(base,candidates);
  all.push(updated);
 }
 // Add ten extra high-contrast mid-lane variants using one alternate pool,
 // balanced across burst, hybrid and frontline cases.
 for(const base of refs.filter(x=>['B01','B02','B09','B10','H01','H04','H06','T01','T05','T10'].includes(x.id))){
  const updated={...base,enemies:[...base.enemies],id:base.id+'-hard-mid'};
  updated.enemies[2]=selectUnused(base,['Fizz','Kassadin','Lucian','Vladimir','Ahri','Talon']);
  all.push(updated);
 }
 return all;
}
function analyze(s){
 const chosen=[...s.allies,...s.enemies].map(name=>{
  const c=lookup.get(name);assert.ok(c,'Unknown client champion: '+name);return c;
 });
 assert.equal(new Set(chosen.map(x=>x.id)).size,10,'Duplicate champions: '+s.id);
 return engine.analyze({
  picks:chosen.map(x=>String(x.id)),
  champions:Object.fromEntries(chosen.map(x=>[String(x.id),x.name])),
  championMeta:champs,officialKits,reviewedKits,numericKits,numericPatch,numericClient,
  catalog,rules,runes,bootsCatalog,modules
 });
}
test('V20: exactly 100 realistic champion combinations, with no duplicate picks',()=>{
 const cases=variants(fixtures.scenarios);
 assert.equal(cases.length,100);
 assert.equal(new Set(cases.map(x=>x.id)).size,100);
 for(const c of cases)assert.equal(new Set([...c.allies,...c.enemies]).size,10,c.id);
});
test('V20: benchmark 100 real engine drafts, report actionable purchase decisions',()=>{
 const cases=variants(fixtures.scenarios),out=[];
 for(const c of cases){
  const result=analyze(c);
  assert.equal(result.ok,true,c.id+': '+JSON.stringify(result).slice(0,500));
  const check=quality.review({result,reference:c});
  assert.equal(check.ok,true,c.id);
  out.push(check);
 }
 const report=quality.summarize(out);
 console.log('WRDI_V20_TRAINING '+JSON.stringify(report));
 const base=out.filter(x=>!x.scenarioId.includes('-'));
 console.log('WRDI_V20_REFERENCE '+JSON.stringify(base.map(x=>({
  id:x.scenarioId,score:x.score,items:x.items,diagnostics:x.diagnostics
 }))));
 assert.equal(report.count,100);
 assert.deepEqual(report.blockers,[],'Failed critical core/order legality/role tests');
 assert.ok(report.avgScore>=92,'Draft quality baseline below 92 points');
});
test('V20: a weak-healing burst build gets a review flag, not an invented absolute ban',()=>{
 const base=fixtures.scenarios.find(x=>x.id==='B09');
 const r=analyze(base);
 const check=quality.review({result:r,reference:base});
 assert.equal(check.ok,true);
 assert.equal(check.scoreMax,100);
 assert.equal(check.dimensions.coreOrder.total,40);
 assert.equal(check.dimensions.lateItems.total,30);
 assert.equal(check.dimensions.situational.total,15);
 assert.equal(check.dimensions.runesBoots.total,15);
 assert.equal(check.weakHealing,r.build.items.some(x=>x.id==='morellonomicon'));
 assert.ok(!r.build.items.some(x=>x.id==='morellonomicon'),
  'B09: Galio burst must not default to Morellonomicon against weak healing');
 assert.deepEqual(r.build.items.slice(0,3).map(x=>x.id),
  ['ludens_echo','rabadons_deathcap','infinity_orb']);
});
test('V20: strong team healing remains actionable after weak-heal calibration',()=>{
 const base=fixtures.scenarios.find(x=>x.id==='B02');
 const r=analyze(base);
 assert.equal(r.ok,true);
 assert.ok(r.draft.threats.healPressure>=2.5);
 const antiheal=['morellonomicon','thornmail'];
 const alternatives=(r.build.alternatives||[]).flatMap(x=>x.newIds||[]);
 assert.ok(r.build.items.some(x=>antiheal.includes(x.id))||
  alternatives.some(x=>antiheal.includes(x)),
  'B02: Soraka/Aatrox/Kayn healing must keep at least one legal antiheal choice');
});
