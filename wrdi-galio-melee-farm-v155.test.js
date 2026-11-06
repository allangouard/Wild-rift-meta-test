const {test}=require('node:test');
const assert=require('node:assert/strict');
const team=require('./wrdi-galio-team-context-v1431.js');
const profile=require('./wrdi-champion-profiles-v15.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const champions=require('./data/champions-picker-v151.json').champions;
const byName=new Map(champions.map(x=>[x.name.toLowerCase(),x]));
const lookup=x=>profile.lookup(x,byName.get(x.toLowerCase()));
const allies=['Ambessa','Pantheon','Galio','Ezreal','Blitzcrank'];
const enemy=mid=>['Aatrox','Kindred',mid,'Jhin','Alistar'];
const needs=mid=>team.make({allies,enemies:enemy(mid),lookup}).threats;
const byId=id=>catalog.items.find(x=>x.id===id);
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
test('melee Galio values defensive waveclear for farming, not a fixed item name',()=>{
 const akali=needs('Akali');
 assert.equal(akali.laneMagic,1);
 assert.equal(akali.lanePoke,0);
 const hollow=order.stageScore(byId('hollow_radiance'),akali,0);
 const sunfire=order.stageScore(byId('sunfire_aegis'),akali,0);
 const despair=order.stageScore(byId('unending_despair'),akali,0);
 assert.ok(hollow.score>sunfire.score);
 assert.ok(hollow.score>despair.score);
 assert.ok(hollow.factors.some(x=>x.message.includes('corps à corps')));
 assert.ok(hollow.factors.some(x=>x.message.includes('proche')));
});
test('documented spell splash can provide a ranged farm option via Galio Q',()=>{
 const ludens=byId('ludens_echo');
 const p=order.features(ludens);
 assert.equal(p.spellClear,true);
 const score=order.stageScore(ludens,needs('Orianna'),0);
 assert.ok(score.factors.some(x=>x.message.includes('sans rester au contact')));
 assert.ok(score.factors.some(x=>x.message.includes('avec le A')));
});
test('poke pressure changes close-clear vs spell-clear comparison, not a hard coded core',()=>{
 const akali=needs('Akali'),orianna=needs('Orianna');
 assert.equal(akali.lanePoke,0);
 assert.equal(orianna.lanePoke,1);
 const hollow=byId('hollow_radiance'),luden=byId('ludens_echo');
 const gap=t=>order.stageScore(hollow,t,0).score-order.stageScore(luden,t,0).score;
 assert.ok(gap(orianna)<gap(akali),'Against poke, spell-clear should gain relative value over proximity clear');
 const zed=needs('Zed');
 assert.ok(order.stageScore(byId('sunfire_aegis'),zed,0).score>order.stageScore(hollow,zed,0).score);
});
test('complete five-item builds remain legal, lane then teamfight without forced object selection',()=>{
 for(const mid of ['Akali','Orianna','Zed','Syndra']){
  const t=needs(mid);
  const build=optimizer.optimize({prepared,threats:t});
  assert.equal(build.ok,true,build.reason);
  const seq=order.order({prepared,items:build.main.items,threats:t});
  assert.equal(seq.ok,true,seq.reason);
  assert.equal(seq.items[0].phase,'lane');
  assert.equal(seq.items[1].phase,'transition');
  assert.equal(seq.items[3].phase,'teamfights');
  assert.deepEqual(new Set(seq.items.map(x=>x.id)),new Set(build.main.items.map(x=>x.id)));
  assert.equal(core.validateEquipment(seq.items.map(x=>x.id),catalog,rules).valid,true);
 }
});
