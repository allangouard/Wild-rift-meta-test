'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('./wrdi-draft-engine-v15.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const bridge=require('./wrdi-rune-bridge-v14.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const names=['Garen','Lee Sin','Galio','Jinx','Lulu','Darius','Gwen','Ahri','Jhin','Seraphine'];
const threat=team.make({allies:names.slice(0,5),enemies:names.slice(5),lookup:n=>profiles.lookup(n)}).threats;
test('Grasp cannot auto-win in a ranged Ahri lane based only on tank/laning traits',()=>{
 const r=engine.chooseRune({bridge,catalog:runes,advisor,needs:threat,laneOpponent:'Ahri'});
 assert.equal(r.ok,true);
 assert.notEqual(r.page.keystone,"Poigne de l'immortel");
 assert.ok(r.reason.includes('attaque de base'),JSON.stringify(r));
});
test('Galio MID still prefers control over Grasp even in melee lanes',()=>{
 const r=engine.chooseRune({bridge,catalog:runes,advisor,needs:{laneAllIn:1,frontlineNeed:0},laneOpponent:'Darius'});
 assert.equal(r.ok,true);
 assert.equal(r.page.keystone,'Souverain des glaces');
 const grasp=runes.fundamental.find(x=>x.name_fr==="Poigne de l'immortel");
 assert.deepEqual([grasp.effect.bonus_magic_damage_max_hp_pct,grasp.effect.heal_max_hp_pct,grasp.effect.permanent_max_hp_gain],[3,1.3,8]);
});
test('Amaranth purchase order takes scaling and prior resistances into account',()=>{
 const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
 const set=['hollow_radiance','amaranths_twinguard','riftmaker','unending_despair','oceanids_trident'];
 const selected=order.order({prepared,items:set,threats:threat});
 assert.equal(selected.ok,true,JSON.stringify(selected));
 assert.ok(selected.items.findIndex(x=>x.id==='amaranths_twinguard')>=3,
  JSON.stringify(selected.items.map(x=>x.id)));
});
test('extreme mixed damage still allows early Amaranth if other effects justify it',()=>{
 const am=catalog.items.find(x=>x.id==='amaranths_twinguard');
 const extreme={ad:5,ap:5,cc:5,frontlineNeed:5,laneMagic:3};
 assert.ok(order.stageScore(am,extreme,1).score>order.stageScore(am,threat,1).score);
});
test('full draft uses ranged lane rune gate, supports legal five-item build and reports uncertainty',()=>{
 const roster=require('./data/champions-picker-v151.json').champions;
 const picks=names.map(n=>roster.find(x=>x.name===n)?.id);
 assert.ok(picks.every(Boolean));
 const a=engine.analyze({
  picks,champions:Object.fromEntries(roster.map(x=>[x.id,x.name])),championMeta:roster,
  officialKits:require('./data/champion-ability-extract-official-v1.json'),
  reviewedKits:require('./data/champion-kits-official-fr-v1.json'),
  numericKits:require('./data/champion-ability-numeric-wiki-wr-v1.json'),
  numericPatch:require('./data/wr-champion-numeric-patch-overrides-v1.json'),
  numericClient:require('./data/wr-client-verified-abilities-7.3d.json'),
  catalog,rules,runes,
  modules:{profiles,team,guard,core,optimizer:require('./wrdi-galio-five-item-optimizer-v1429.js'),
  order,contingency:require('./wrdi-galio-contingencies-v1433.js'),
  runeBridge:bridge,runeAdvisor:advisor,
  kitIntelligence:require('./wrdi-official-kit-intelligence-v158.js'),
  mechanicsCalculator:require('./wrdi-mechanics-calculator-v159.js'),
  numericEngine:require('./wrdi-numeric-kits-v162.js')}
 });
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.notEqual(a.runes.page.keystone,"Poigne de l'immortel");
 assert.equal(core.validateEquipment(a.build.items.map(x=>x.id),catalog,rules).valid,true);
 console.log('DRAFT_V167',JSON.stringify({rune:a.runes.page.keystone,
  five:a.build.items.map(x=>x.id),order:a.build.items.map(x=>x.id)}));
});
