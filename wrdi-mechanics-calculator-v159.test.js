const {test}=require('node:test');
const assert=require('node:assert/strict');
const calc=require('./wrdi-mechanics-calculator-v159.js');
const official=require('./data/champion-ability-extract-official-v1.json');
const items=require('./data/items-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const engine=require('./wrdi-draft-engine-v15.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const lookup=name=>official.entries.find(c=>c.name===name);
test('all available champion/item/rune field families are inventoried',()=>{
 const a=calc.audit({officialKits:official,items,runes});
 assert.equal(a.ok,true);
 assert.equal(a.champions,125);
 assert.equal(a.abilities,625);
 assert.equal(a.items,items.items.length);
 assert.equal(a.runes,runes.fundamental.length+runes.minor.length);
 assert.equal(a.fullDescriptions,625);
 assert.equal(a.truncatedDescriptions,0);
 assert.ok(Object.keys(a.mechanics).length>=15);
 assert.ok(Object.keys(a.itemPassiveFields).length>20);
 assert.ok(Object.keys(a.runeEffectFields).length>20);
 assert.equal(a.completeCombatSimulation,false);
});
test('Morello and Thornmail use their distinct actual client passives',()=>{
 const a=calc.antihealComparison({items,galio:lookup('Galio'),threats:{confirmedHeal:1,conditionalHeal:1}});
 const morello=a.items.find(x=>x.itemId==='morellonomicon');
 const thorn=a.items.find(x=>x.itemId==='thornmail');
 assert.ok(morello&&thorn);
 assert.equal(morello.reductionPct,50);
 assert.equal(thorn.reductionPct,50);
 assert.equal(morello.durationSeconds,3);
 assert.equal(thorn.durationSeconds,3);
 assert.equal(morello.canTriggerOnOwnDamage,true);
 assert.equal(thorn.canTriggerWhenAttacked,true);
 assert.ok(morello.triggeredByDocumentedMagicSpells.length>0);
 assert.equal(a.rankingCertified,false);
});
test('Comet AP range is evaluated from the actual rune formula, not a fixed score',()=>{
 const comet=runes.fundamental.find(r=>r.name_fr==='Comète arcanique');
 const a=calc.runeProcRange({rune:comet,ap:200});
 assert.equal(a.ok,true);
 assert.equal(a.min,25);
 assert.equal(a.max,110);
 assert.equal(a.procNotGuaranteed,true);
 const other=calc.runeProcRange({rune:comet,ap:0});
 assert.equal(other.min,15);
});
test('optimizer recognizes different anti-heal trigger channels',()=>{
 const morello=items.items.find(x=>x.id==='morellonomicon');
 const thorn=items.items.find(x=>x.id==='thornmail');
 const m=optimizer.features(morello),t=optimizer.features(thorn);
 assert.equal(m.antihealBySpell,true);
 assert.equal(m.antihealByRetaliation,false);
 assert.equal(t.antihealBySpell,false);
 assert.equal(t.antihealByRetaliation,true);
 assert.equal(t.antihealByContact,true);
});
test('no fabricated numerical champion damage when no ratios are verified',()=>{
 const a=calc.audit({officialKits:official,items,runes});
 assert.equal(a.ratiosFromChampionSkillsVerified,false);
 assert.equal(calc.runeProcRange({rune:{name_fr:'test',effect:{}},ap:100}).ok,false);
});

test('full Galio draft delivers audit and item/rune calculations',()=>{
 const roster=require('./data/champions-picker-v151.json').champions;
 const names=['Ornn','Rammus','Galio','Ashe','Alistar','Aatrox','Kayn','Orianna','Miss Fortune','Leona'];
 const picks=names.map(n=>roster.find(r=>r.name===n)?.id);
 assert.ok(picks.every(Boolean));
 const result=engine.analyze({
  picks,champions:Object.fromEntries(roster.map(r=>[r.id,r.name])),
  championMeta:roster,officialKits:official,
  reviewedKits:require('./data/champion-kits-official-fr-v1.json'),
  catalog:items,rules:require('./data/item-restrictions-client-7.3d-v12.json'),runes,
  modules:{
   profiles:require('./wrdi-champion-profiles-v15.js'),
   team:require('./wrdi-galio-team-context-v1431.js'),
   guard:require('./wrdi-galio-item-guard-v1424.js'),
   core:require('./wrdi-core-v14.js'),
   optimizer,order:require('./wrdi-galio-purchase-order-v1432.js'),
   contingency:require('./wrdi-galio-contingencies-v1433.js'),
   runeBridge:require('./wrdi-rune-bridge-v14.js'),
   runeAdvisor:require('./wrdi-galio-rune-advisor-v1411.js'),
   kitIntelligence:require('./wrdi-official-kit-intelligence-v158.js'),
   mechanicsCalculator:calc
  }
 });
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.calculations.inputAudit.abilities,625);
 assert.equal(result.calculations.antiheal.items.some(x=>x.itemId==='morellonomicon'),true);
 assert.ok(result.draft.notes.some(x=>x.includes('Données inspectées')));
 assert.ok(result.draft.notes.some(x=>x.includes('Morellonomicon')));
});
