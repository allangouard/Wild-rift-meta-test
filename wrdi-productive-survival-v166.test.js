'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const survival=require('./wrdi-productive-survival-v166.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const contingency=require('./wrdi-galio-contingencies-v1433.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const find=id=>{const x=catalog.items.find(i=>i.id===id);assert.ok(x,'missing '+id);return x};
const items=ids=>ids.map(find);
const draft=team.make({allies:['Fiora','Lillia','Galio','Samira','Alistar'],
 enemies:['Gnar','Vi','Lux','Lucian','Lulu'],lookup:n=>profiles.lookup(n)});
const t=draft.threats;
const hybrid=items(['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard']);
test('Despair is mechanically hybrid and Frozen Heart has no independent damage proc',()=>{
 const despair=survival.itemProfile(find('unending_despair'));
 const heart=survival.itemProfile(find('frozen_heart'));
 assert.equal(despair.contactDamage,true);
 assert.equal(despair.sustainFromDamage,true);
 assert.equal(despair.offensive,true);
 assert.equal(heart.attackSpeedAura,true);
 assert.equal(heart.passiveDamage,false);
 assert.equal(heart.offensive,false);
});
test('productive survival cares about four-second trigger and five-second ramp',()=>{
 const close=survival.evaluate(hybrid,t,{duration:2.5,engageContact:.35});
 const extended=survival.evaluate(hybrid,t,{duration:8,engageContact:.65});
 const d1=close.details.find(x=>x.itemId==='unending_despair');
 const d2=extended.details.find(x=>x.itemId==='unending_despair');
 assert.equal(close.ok,true);assert.equal(extended.ok,true);
 assert.ok(d2.productive>d1.productive);
 assert.ok(extended.pressure>close.pressure);
});
test('Despair outvalues Frozen Heart pressure absent confirmed attack speed while both give defense',()=>{
 const opening=items(['hollow_radiance']);
 const despair=survival.compare([...opening,find('unending_despair')],t);
 const heart=survival.compare([...opening,find('frozen_heart')],t);
 assert.ok(despair.score>heart.score,JSON.stringify({despair:despair.score,heart:heart.score}));
 assert.ok(heart.long.stats.armor>despair.long.stats.armor);
});
test('confirmed sustained attack-speed threat makes Frozen Heart more useful than without it',()=>{
 const two=items(['hollow_radiance','frozen_heart']);
 const normal=survival.compare(two,t),urgent=survival.compare(two,{...t,attackSpeedPressureConfirmed:3,physicalThreatSevere:2});
 assert.ok(urgent.score>normal.score+5,JSON.stringify({normal:normal.score,urgent:urgent.score}));
 const pure=survival.itemProfile(find('frozen_heart'));
 assert.equal(pure.attackSpeedAura,true);
});
test('five-item result compares all competing builds, preserving legality',()=>{
 const result=optimizer.optimize({prepared,threats:t,beamWidth:150});
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.main.items.length,5);
 assert.ok(result.main.productivity?.ok);
 assert.equal(core.validateEquipment(result.main.items.map(x=>x.id),catalog,rules).valid,true);
 const ref=optimizer.calculate(hybrid,t);
 const selected=optimizer.calculate(items(result.main.items.map(x=>x.id)),t);
 console.log('V166_REFERENCE',JSON.stringify({recommended:result.main.items.map(x=>x.id),recommendedScore:selected.score,
  referenceScore:ref.score,referencePressure:ref.productivity.score,recommendedPressure:selected.productivity.score,
  firstTwo:order.order({prepared,items:hybrid,threats:t}).items.slice(0,3).map(x=>x.id)}));
 assert.ok(ref.productivity.score>0);
 assert.ok(Number.isFinite(selected.score));
});
test('purchase-order model scores survival pressure at acquisition, not only full set',()=>{
 const r=order.order({prepared,items:hybrid,threats:t});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.items.length,5);
 assert.equal(r.checkedPermutations,120);
 assert.deepEqual(new Set(r.items.map(x=>x.id)),new Set(hybrid.map(x=>x.id)));
});
test('late attack speed contingency proposes a legal replacement without assuming pregame enemy items',()=>{
 const current=optimizer.optimize({prepared,threats:t});
 const plan=contingency.plan({prepared,optimizer,items:current.main.items,threats:t,max:5});
 assert.equal(plan.ok,true);
 const counter=plan.options.find(x=>x.conditionId==='attack_speed');
 if(counter){
  assert.equal(counter.verifiedLegal,true);
  assert.equal(core.validateEquipment(counter.newIds,catalog,rules).valid,true);
  assert.equal(counter.scenario.attackSpeedPressureConfirmed,2);
 }
 const significant=survival.compare(items(['hollow_radiance','frozen_heart']),{...t,attackSpeedPressureConfirmed:2});
 assert.ok(significant.ok);
});
test('original 7.3d client passive facts still source numeric scores',()=>{
 const source=find('unending_despair').passives.find(x=>x.mechanics?.heal_multiplier_of_damage_dealt);
 assert.equal(source.mechanics.damage_formula,'0.03 * own_max_hp');
 assert.equal(source.mechanics.tick_s,4);
 assert.equal(source.mechanics.heal_multiplier_of_damage_dealt,2.5);
 const heart=find('frozen_heart').passives.find(x=>x.mechanics?.enemy_attack_speed_reduction_pct);
 assert.equal(heart.mechanics.enemy_attack_speed_reduction_pct,25);
});
