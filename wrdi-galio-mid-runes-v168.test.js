'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('./wrdi-draft-engine-v15.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const runes=require('./data/rune-catalog-client-v14.json');
const items=require('./data/items-client-7.3d-v12.json').items;
const byId=(id)=>{const i=items.find(x=>x.id===id);assert.ok(i,id);return i;};
test('Galio MID hybrid control selects Glacial, not Grasp or Electrocute',()=>{
 const build=['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard'].map(byId);
 const x=engine.chooseRune({bridge,catalog:runes,advisor,items:build,laneOpponent:'Ahri'});
 assert.equal(x.ok,true);
 assert.equal(x.mode,'hybrid_control');
 assert.equal(x.page.keystone,'Souverain des glaces');
 assert.equal(x.alternatives[0].page.keystone,'Comète arcanique');
 assert.match(x.reason,/Poigne/);
 assert.match(x.reason,/Électrocution/);
});
test('Galio MID high-AP build selects Comet with spell-based poke',()=>{
 const build=['ludens_echo','rabadons_deathcap','infinity_orb','void_staff','oceanids_trident'].map(byId);
 const x=engine.chooseRune({bridge,catalog:runes,advisor,items:build,laneOpponent:'Ahri'});
 assert.equal(x.ok,true);
 assert.equal(x.mode,'ap_poke');
 assert.equal(x.page.keystone,'Comète arcanique');
 assert.equal(x.alternatives[0].page.keystone,'Souverain des glaces');
 assert.match(x.reason,/Comète/);
});
test('Galio MID damage-hybrid with just two AP pieces does not become burst rune',()=>{
 const build=['hollow_radiance','riftmaker','unending_despair','oceanids_trident','liandrys_torment'].map(byId);
 const x=engine.chooseRune({bridge,catalog:runes,advisor,items:build,laneOpponent:'Lux'});
 assert.equal(x.ok,true);
 assert.equal(x.page.keystone,'Souverain des glaces');
});
test('Glacial allowed into melee Galio mid and even high CC without forcing Grasp',()=>{
 const x=engine.chooseRune({bridge,catalog:runes,advisor,needs:{laneAllIn:3,frontlineNeed:3},laneOpponent:'Darius'});
 assert.equal(x.ok,true);
 assert.equal(x.page.keystone,'Souverain des glaces');
});
test('rune page remains valid according to Wild Rift user client rune catalogue',()=>{
 for(const b of [
  ['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard'],
  ['ludens_echo','rabadons_deathcap','infinity_orb','void_staff','oceanids_trident']
 ]){
  const x=engine.chooseRune({bridge,catalog:runes,advisor,items:b.map(byId),laneOpponent:'Ahri'});
  assert.equal(bridge.validate(x.page,runes).valid,true);
 }
});
