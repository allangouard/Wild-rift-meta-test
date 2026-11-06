'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const contingencies=require('./wrdi-galio-contingencies-v1433.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const fetch=id=>{const i=catalog.items.find(x=>x.id===id);assert.ok(i,'missing '+id);return i;};
const group=ids=>ids.map(fetch);
const make=(allies,enemies)=>team.make({allies,enemies,lookup:n=>profiles.lookup(n)}).threats;
const allies=['Aatrox','Master Yi','Galio','Caitlyn','Brand'];
const enemies=['Darius','Jarvan IV','Ahri','Jhin','Karma'];
test('core is tactical rather than a compulsory Riftmaker identity',()=>{
 const t=make(allies,enemies);
 const rift=optimizer.coreFit(group(['hollow_radiance','unending_despair','riftmaker']),t);
 const thorn=optimizer.coreFit(group(['hollow_radiance','unending_despair','thornmail']),t);
 assert.ok(Number.isFinite(rift.score)&&Number.isFinite(thorn.score));
 assert.ok(thorn.hybrid&&rift.hybrid);
 const base=group(['hollow_radiance','unending_despair','thornmail','oceanids_trident','amaranths_twinguard']);
 const withRift=group(['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard']);
 assert.ok(Number.isFinite(optimizer.calculate(base,t).score));
 assert.ok(Number.isFinite(optimizer.calculate(withRift,t).score));
});
test('Iceborn is a lower-value Galio hybrid late slot than a fit-based tank counter when the passive is redundant',()=>{
 const t=make(allies,enemies);
 const a=optimizer.coreFit(group(['hollow_radiance','unending_despair','riftmaker','oceanids_trident','iceborn_gauntlet']),t);
 const b=optimizer.coreFit(group(['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard']),t);
 assert.ok(b.score>a.score+10,JSON.stringify({a,b}));
 assert.match(a.reasons.join(' '),/Gantelet/);
});
test('actual player draft has no forced Iceborn if the optimizer finds matching alternatives',()=>{
 const t=make(allies,enemies);
 const best=optimizer.optimize({prepared,threats:t,beamWidth:200});
 const sequence=order.order({prepared,items:best.main.items,threats:t});
 assert.ok(best.ok&&sequence.ok);
 assert.equal(best.main.items.length,5);
 assert.ok(!best.main.items.some(x=>x.id==='iceborn_gauntlet'),
  JSON.stringify(best.main.items.map(x=>x.id)));
 const alternatives=contingencies.plan({prepared,optimizer,items:best.main.items,
  threats:t,orderedItems:sequence.items,
  enemyNames:enemies,profileLookup:n=>profiles.lookup(n)});
 assert.ok(alternatives.ok);
 assert.deepEqual(new Set(alternatives.protectedCoreIds),
  new Set(sequence.items.slice(0,3).map(x=>x.id)));
 assert.ok(alternatives.options.every(x=>!alternatives.protectedCoreIds.includes(x.remove.id)));
 console.log('V171_PLAYER',JSON.stringify({set:best.main.items.map(x=>x.id),
  order:sequence.items.map(x=>x.id),
  substitutions:alternatives.options.map(x=>({out:x.remove.id,in:x.add.id,when:x.conditionId}))}));
});
test('against physical mid, first item is recalculated and Hollow is not made mandatory',()=>{
 const t=make(['Fiora','Lee Sin','Galio','Jinx','Lulu'],
  ['Darius','Vi','Yasuo','Jhin','Karma']);
 assert.equal(t.lanePhysical,1);
 const best=optimizer.optimize({prepared,threats:t,beamWidth:200});
 const sequence=order.order({prepared,items:best.main.items,threats:t});
 assert.ok(best.ok&&sequence.ok);
 const first=sequence.items[0];
 assert.ok(first&&first.id);
 assert.ok(!best.main.items.some(x=>x.id==='iceborn_gauntlet'));
 console.log('V171_PHYSICAL_MID',JSON.stringify({first:first.id,sequence:sequence.items.map(x=>x.id)}));
});
test('Cotte third and Riftmaker third both valid; order can respond to urgency',()=>{
 const t=make(allies,enemies);
 const set=group(['hollow_radiance','unending_despair','thornmail','riftmaker','amaranths_twinguard']);
 const calm=order.order({prepared,items:set,threats:t});
 const urgent=order.order({prepared,items:set,
  threats:{...t,observedHealingSeverity:4,beingAutoAttacked:true}});
 assert.ok(calm.ok&&urgent.ok);
 assert.equal(new Set(calm.items.map(x=>x.id)).size,5);
 assert.equal(new Set(urgent.items.map(x=>x.id)).size,5);
 console.log('V171_THIRD',JSON.stringify({calm:calm.items.map(x=>x.id),urgent:urgent.items.map(x=>x.id)}));
});
