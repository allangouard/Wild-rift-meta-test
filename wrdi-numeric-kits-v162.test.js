'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const kit=require('./wrdi-numeric-kits-v162.js');
const raw=require('./data/champion-ability-numeric-wiki-wr-v1.json');
const patch=require('./data/wr-champion-numeric-patch-overrides-v1.json');
const prepared=kit.prepare(raw,patch);
test('125 WR-only numeric sheets, all 625 spell slots and original source URLs',()=>{
 assert.equal(prepared.ok,true,prepared.reason);
 assert.equal(prepared.count,125);
 assert.equal(prepared.numericAbilityCoverage,625);
 assert.ok(raw.entries.every(e=>e.source.startsWith('https://wiki.leagueoflegends.com/en-us/WR%3A')));
 assert.ok(raw.entries.every(e=>['passive','q','w','e','r'].every(slot=>e.skills[slot]?.name)));
 assert.equal(raw.coverage.formulaEntries,1109);
 const facts=raw.entries.flatMap(e=>Object.values(e.skills)).flatMap(s=>s.descriptionNumericFacts||[]);
 assert.ok(facts.length>=2500,'inline passive and conditional numerical facts must be retained');
 assert.ok(raw.entries.find(e=>e.name==='Galio').skills.passive.descriptionNumericFacts.some(x=>x.value===45&&x.unit==='%'));
 const riot=require('./data/wr-riot-quantitative-patch-register-7.3d.json');
 assert.equal(riot.patches.reduce((n,p)=>n+p.count,0),653);
});
test('Galio Q verifies user-confirmed 11.5/10/8.5/7 and AP source formula',()=>{
 const galio=prepared.find('10099');
 const q=galio.skills.q;
 assert.deepEqual(q.stats.find(x=>x.label==='COOLDOWN').numericTokens,[11.5,10,8.5,7]);
 assert.deepEqual(kit.linearFormula(q.formulas[0].formula).bases,[70,115,160,205]);
 assert.equal(kit.linearFormula(q.formulas[0].formula).apRatio,.75);
 const model=kit.galioDirectModel(prepared);
 assert.ok(model);
 const result=model.directDamageAt({ap:200});
 assert.equal(result.total,905);
 assert.deepEqual(result.details.map(x=>x.amount),[355,150,400]);
 assert.equal(model.directDamageAt({ap:0}).total,485);
});
test('Riot 7.2d Syndra corrections applied only where Wiki has documented old values',()=>{
 const s=prepared.find('Syndra');
 assert.equal(s.skills.q.formulas.find(x=>x.label==='Magic Damage').formula,
  '80 / 130 / 180 / 230 (+ 65% AP)');
 assert.equal(s.skills.w.formulas.find(x=>x.label==='Magic Damage').formula,
  '60 / 100 / 140 / 180 (+ 60% AP)');
 assert.equal(s.skills.e.formulas.find(x=>x.label==='Magic Damage').formula,
  '70 / 110 / 150 / 190 (+ 50% AP)');
 assert.deepEqual(s.skills.e.stats.find(x=>x.label==='COOLDOWN').numericTokens,[15]);
 assert.equal(raw.entries.find(e=>e.name==='Syndra').skills.q.formulas[0].formula,
  '70 / 115 / 160 / 205 (+ 65% AP)','raw archive never overwritten');
});
test('Riot 7.3d Shyvana and Nasus obvious fields patched',()=>{
 const shy=prepared.find('Shyvana'),nas=prepared.find('Nasus');
 assert.deepEqual(shy.skills.q.stats.find(x=>x.label.trim()==='COOLDOWN').numericTokens,[7,6.5,6,5.5]);
 assert.deepEqual(shy.skills.w.stats.find(x=>x.label.trim()==='COOLDOWN').numericTokens,[12,11,10,9]);
 assert.equal(nas.skills.e.formulas.find(x=>x.label==='Magic Damage').formula,
  '50 / 90 / 130 / 170 (+ 40% AP)');
});
test('Riot 7.3d Lee Sin disparity is preserved as conflict, not overwritten',()=>{
 const lee=prepared.find('Lee Sin');
 assert.match(lee.skills.r.formulas.find(x=>x.label==='Physical Damage').formula,/100 \/ 250 \/ 400/);
 const conflict=prepared.patchOutcomes.find(x=>x.champion==='Lee Sin');
 assert.equal(conflict.status,'source_conflict');
 assert.ok(prepared.patchConflicts>=1);
 assert.equal(kit.damageForSkill(lee.skills.r).length,0,'conflicting formula excluded from calculations');
});
test('numeric build objective uses documented Galio AP direct coefficients',()=>{
 const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
 const items=require('./data/items-client-7.3d-v12.json').items;
 const picks=['ludens_echo','morellonomicon','riftmaker'].map(id=>items.find(x=>x.id===id));
 assert.ok(picks.every(Boolean));
 const needs={damageDuty:2,frontlineNeed:0,frontlineProvided:2,heal:1,ad:2,ap:2};
 const baseline=optimizer.calculate(picks,needs);
 const withNumbers=optimizer.calculate(picks,needs,kit.galioDirectModel(prepared));
 assert.ok(withNumbers.score>baseline.score);
});
test('numerical source validation refuses missing skills and PC URLs',()=>{
 const altered={...raw,entries:raw.entries.map((e,i)=>i?e:{...e,source:'https://wiki.leagueoflegends.com/en-us/Galio'})};
 assert.equal(kit.prepare(altered,patch).ok,false);
 assert.equal(kit.linearFormula('8% target max HP'),null);
 assert.equal(kit.linearFormula('50 / 80 (+ 10% AP) (+ 15% target health)'),null);
});
test('full pregame draft consumes 125 numerical kits and emits Galio numeric result',()=>{
 const engine=require('./wrdi-draft-engine-v15.js');
 const champions=require('./data/champions-picker-v151.json').champions;
 const names=['Ornn','Rammus','Galio','Ashe','Alistar','Aatrox','Kayn','Orianna','Miss Fortune','Leona'];
 const ids=names.map(n=>champions.find(x=>x.name===n)?.id);
 const result=engine.analyze({picks:ids,champions:Object.fromEntries(champions.map(x=>[x.id,x.name])),
  championMeta:champions,officialKits:require('./data/champion-ability-extract-official-v1.json'),
  reviewedKits:require('./data/champion-kits-official-fr-v1.json'),
  numericKits:raw,numericPatch:patch,
  catalog:require('./data/items-client-7.3d-v12.json'),
  rules:require('./data/item-restrictions-client-7.3d-v12.json'),
  runes:require('./data/rune-catalog-client-v14.json'),
  modules:{
   profiles:require('./wrdi-champion-profiles-v15.js'),
   team:require('./wrdi-galio-team-context-v1431.js'),
   guard:require('./wrdi-galio-item-guard-v1424.js'),
   core:require('./wrdi-core-v14.js'),
   optimizer:require('./wrdi-galio-five-item-optimizer-v1429.js'),
   order:require('./wrdi-galio-purchase-order-v1432.js'),
   contingency:require('./wrdi-galio-contingencies-v1433.js'),
   runeBridge:require('./wrdi-rune-bridge-v14.js'),
   runeAdvisor:require('./wrdi-galio-rune-advisor-v1411.js'),
   kitIntelligence:require('./wrdi-official-kit-intelligence-v158.js'),
   mechanicsCalculator:require('./wrdi-mechanics-calculator-v159.js'),
   numericEngine:kit
  }});
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.calculations.numericCoverage.abilities,625);
 assert.equal(result.calculations.numericDraft.numericChampionCoverage,10);
 assert.ok(result.calculations.numericGalio.total>0);
 assert.ok(result.draft.notes.some(x=>x.includes('Compétences chiffrées WR')));
});
