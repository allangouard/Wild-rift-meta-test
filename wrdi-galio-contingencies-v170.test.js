'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('./wrdi-galio-contingencies-v1433.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const prepared=guard.prepare({catalog,rules:restrictions,core,livePatch:'7.3d'});
const draft={allies:['Aatrox','Master Yi','Galio','Caitlyn','Brand'],
 enemies:['Darius','Jarvan IV','Ahri','Jhin','Karma']};
function actual(){
 const context=team.make({...draft,lookup:x=>profiles.lookup(x)});
 assert.equal(context.ok,true);
 const best=optimizer.optimize({prepared,threats:context.threats});
 assert.equal(best.ok,true);
 const sequence=order.order({prepared,items:best.main.items,threats:context.threats});
 assert.equal(sequence.ok,true);
 const r=engine.plan({prepared,optimizer,items:best.main.items,
  orderedItems:sequence.items,threats:context.threats,
  enemyNames:draft.enemies,profileLookup:x=>profiles.lookup(x)});
 return {r,context,best,sequence};
}
test('exact player draft: no Lucian/Gnar in any conditional explanation',()=>{
 const {r,best,sequence}=actual();
 assert.equal(r.ok,true);
 assert.equal(r.applicableEnemyNames.join(','),draft.enemies.join(','));
 assert.ok(r.options.every(x=>!/(lucian|gnar)/i.test(x.condition)));
 assert.ok(!r.options.some(x=>x.conditionId==='attack_speed'));
 console.log('V170_PLAYER_DRAFT',JSON.stringify({
  five:best.main.items.map(x=>x.id),purchase:sequence.items.map(x=>x.id),
  protected:r.protectedCoreIds,
  alternatives:r.options.map(x=>({condition:x.conditionId,from:x.remove.id,to:x.add.id}))
 }));
});
test('situational replacements never remove first three purchased items',()=>{
 const {r,sequence}=actual();
 const protect=new Set(sequence.items.slice(0,3).map(x=>x.id));
 for(const x of r.options){
  assert.ok(!protect.has(x.remove.id),'illegally removed '+x.remove.id);
  assert.equal(x.replacementPhase,'late_game');
  assert.ok(x.protectedCorePreserved);
  assert.equal(core.validateEquipment(x.newIds,catalog,restrictions).valid,true);
 }
});
test('Jhin in draft does not imply onhit/high attack speed just because he can crit',()=>{
 const r=engine.plan({prepared,optimizer,items:[
  'hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard'],
  enemyNames:draft.enemies,profileLookup:x=>profiles.lookup(x),
  threats:{critPotential:1,crit:0,ad:3,ap:1}});
 assert.ok(r.ok);
 assert.ok(!r.options.some(x=>x.conditionId==='attack_speed'));
});
test('only real enemy autoattack champions are named in scenario, not stale matchups',()=>{
 const en=['Gnar','Vi','Lux','Lucian','Lulu'];
 const r=engine.plan({prepared,optimizer,
  items:['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard'],
  enemyNames:en,profileLookup:x=>profiles.lookup(x),
  threats:{ad:3,ap:1,crit:0,attackSpeedPressureConfirmed:0}});
 assert.equal(r.ok,true);
 for(const x of r.options)if(x.conditionId==='attack_speed'){
  assert.ok(x.condition.includes('Lucian')||x.condition.includes('Gnar'));
  assert.ok(!x.condition.includes('Master Yi'));
  assert.equal(x.remove.id==='riftmaker',false);
 }
});
test('only actual first three purchases are protected even if Riftmaker is fourth',()=>{
 const items=['hollow_radiance','unending_despair','riftmaker','liandrys_torment','oceanids_trident'];
 const reordered=[items[0],items[1],items[3],items[2],items[4]];
 const r=engine.plan({prepared,optimizer,items,
  orderedItems:reordered,threats:{ad:3,ap:2,heal:1}});
 assert.equal(r.ok,true);
 for(const id of [items[0],items[1],items[3]])
  assert.ok(r.protectedCoreIds.includes(id));
 assert.equal(r.protectedCoreIds.includes('riftmaker'),false);
 for(const x of r.options)
  assert.ok(!r.protectedCoreIds.includes(x.remove.id));
});
