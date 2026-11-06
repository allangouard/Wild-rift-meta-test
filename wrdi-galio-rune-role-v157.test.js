const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('./wrdi-draft-engine-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const champions=require('./data/champions-picker-v151.json').champions;
const meta=new Map(champions.map(x=>[x.name.toLowerCase(),x]));
const lookup=name=>profiles.lookup(name,meta.get(name.toLowerCase()));
const enemies=['Aatrox','Kayn','Orianna','Miss Fortune','Leona'];
function needs(allies){const result=team.make({allies,enemies,lookup});assert.equal(result.ok,true);return result.threats;}
const itemCatalog=require('./data/items-client-7.3d-v12.json').items;
const item=id=>itemCatalog.find(x=>x.id===id);
const fullAp=['ludens_echo','rabadons_deathcap','infinity_orb','void_staff','oceanids_trident'].map(item);
const choose=(t,items)=>engine.chooseRune({bridge,catalog,advisor,needs:t,items});
test('three allied tanks with high-AP Galio build prioritize buffed Electrocute against Orianna',()=>{
 const t=needs(['Ornn','Rammus','Galio','Ashe','Alistar']);
 assert.equal(t.damageDuty,2);
 assert.equal(t.frontlineNeed,0);
 assert.equal(t.lanePoke,1);
 const r=choose(t,fullAp);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.id,'burst');
 assert.equal(r.page.keystone,'Électrocution');
 assert.equal(r.alternatives[0].page.keystone,'Comète arcanique');
 assert.equal(bridge.validate(r.page,catalog).valid,true);
 assert.notEqual(r.page.keystone,'Gardien');
});
test('Comet is a tactical option, not an unconditional Galio lock',()=>{
 const t=needs(['Ornn','Rammus','Galio','Ashe','Alistar']);
 const r=choose({...t,lanePoke:0,laneMagic:0,laneAllIn:1,tank:1});
 assert.equal(r.ok,true);
 assert.equal(r.page.keystone,'Électrocution');
});
test('Galio missing frontline can still select a legal defensive page',()=>{
 const t=needs(['Akali','Lee Sin','Galio','Ashe','Lux']);
 assert.ok(t.frontlineNeed>=1);
 const r=choose(t);
 assert.equal(r.ok,true);
 assert.equal(r.page.keystone,'Souverain des glaces');
 assert.equal(bridge.validate(r.page,catalog).valid,true);
});
test('rune page always comes from client-validated templates without auto winrates',()=>{
 for(const id of ['poke','burst','engage']){
  const strategy=advisor.STRATEGIES.find(x=>x.id===id);
  assert.ok(strategy);
  assert.equal(bridge.validate({keystone:strategy.keystone,primaryTree:strategy.tree,
   primary:strategy.primary,secondary:strategy.secondary},catalog).valid,true);
 }
});
