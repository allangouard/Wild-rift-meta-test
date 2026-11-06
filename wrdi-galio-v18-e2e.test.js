const test=require('node:test'),assert=require('node:assert/strict');
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
 conditionAudit:require('./wrdi-galio-condition-audit-v187.js')
};
function draft(names){
 const byName=new Map(champs.map(c=>[c.name.toLowerCase(),c]));
 const chosen=names.map(name=>{
  const c=byName.get(name.toLowerCase());assert.ok(c,'Missing champion '+name);return c;
 });
 return engine.analyze({
  picks:chosen.map(c=>String(c.id)),
  champions:Object.fromEntries(chosen.map(c=>[String(c.id),c.name])),
  championMeta:champs,officialKits,reviewedKits,numericKits,numericPatch,numericClient,
  catalog,rules,runes,bootsCatalog,modules
 });
}
test('V18 end-to-end: three allied frontliners -> Galio AP burst, legal five items, boots and runes',()=>{
 const r=draft(['Dr. Mundo','Amumu','Galio','Ashe','Leona','Camille','Jarvan IV','Akali',"Kai'Sa",'Janna']);
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,1000));
 assert.equal(r.build.strategy.role,'ap_burst');
 assert.equal(r.build.items.length,5);
 assert.equal(r.boots.ok,true);
 assert.equal(r.build.conditionAudit.ok,true);
 assert.equal(r.build.conditionAudit.guaranteedProcs,false);
 assert.ok(r.boots.candidates.length<=3);
 assert.ok(r.runes.alternatives.length<=2);
 assert.equal(r.dataReadiness.fullyDescribed,10);
 assert.equal(r.build.lateSlots.ok,true);
 assert.ok(r.build.lateSlots.evaluatedPairs>10);
 assert.deepEqual(r.build.items.slice(0,3).map(x=>x.id),r.build.lateSlots.coreIds);
 assert.ok(r.build.strategy.candidateIds.includes('oceanids_trident'));
 assert.ok(!r.build.items.some(x=>x.id==='unending_despair'),'Burst must not waste a slot on prolonged sustain');
});

test('V18.1: isolated Annie shield does not warrant Trident, Cosmic Drive is situational, penetration remains a candidate',()=>{
 const r=draft(['Aatrox','Nunu et Willump','Galio','Caitlyn','Alistar','Ambessa','Amumu','Annie','Ezreal','Swain']);
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,1200));
 assert.equal(r.build.strategy.role,'ap_burst');
 assert.equal(r.draft.threats.alliedShieldSources,0,'No team shield from enemy draft');
 assert.equal(r.draft.threats.personalShieldSources,2,'Annie and Ambessa personal shields');
 assert.ok(r.draft.threats.shieldPressure<1.5,'A lone shield must not trigger shield-cut');
 assert.ok(!r.build.strategy.candidateIds.includes('oceanids_trident'),'No Trident in low-shield candidate list');
 assert.ok(!r.build.strategy.candidateIds.includes('cosmic_drive'),'Cosmic Drive must be conditional');
 assert.ok(r.build.strategy.candidateIds.includes('void_staff'),'Void Staff must remain eligible');
 assert.ok(r.build.strategy.candidateIds.includes('cryptbloom'),'Cryptbloom must remain eligible');
 assert.ok(!r.build.items.some(i=>['oceanids_trident','cosmic_drive'].includes(i.id)));
 assert.equal(r.build.strategy.allRelevantApIncluded,true,
  'Magic penetration is evaluated alongside all viable AP alternatives, not preselected');
 assert.ok(r.build.strategy.apCandidatesConsidered>=20,
  'At least twenty AP item options must be evaluated in this patch catalogue');
});

test('V18.5 healing evidence is sourced and used by Galio optimizer on real drafts',()=>{
 const r=draft(['Dr. Mundo','Amumu','Galio','Ashe','Leona','Aatrox','Kayn','Annie','Ezreal','Soraka']);
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,1200));
 const e=r.draft.threatEvidence;
 assert.equal(e.ok,true);
 assert.ok(e.alliedHealers>=1);
 assert.ok(e.personalHealers>=1);
 assert.ok(r.draft.threats.healPressure>0);
 assert.ok(r.build.strategy.candidateIds.includes('morellonomicon'));
 assert.equal(r.build.items.length,5);
 assert.equal(r.build.legal,true);
});
test('V18.5 personal shields still do not trigger Trident in screenshot regression',()=>{
 const r=draft(['Aatrox','Nunu et Willump','Galio','Caitlyn','Alistar','Ambessa','Amumu','Annie','Ezreal','Swain']);
 assert.equal(r.ok,true,JSON.stringify(r).slice(0,900));
 assert.equal(r.draft.threatEvidence.alliedHealers,0);
 assert.ok(r.draft.threats.shieldPressure<1.5);
 assert.ok(!r.build.strategy.candidateIds.includes('oceanids_trident'));
});
