'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const late=require('./wrdi-galio-late-slots-v184.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const all=optimizer.eligible(prepared);
const five=['ludens_echo','rabadons_deathcap','infinity_orb','riftmaker','bloodletters_curse'];
test('Checks each legal pair of 4th and 5th items without changing the core',()=>{
 const t={frontlineProvided:3,damageDuty:2,ad:2,ap:2,shieldPressure:0.5,tank:0};
 const r=late.compare({prepared,optimizer,orderedItems:five,candidateIds:all.map(x=>x.id),threats:t});
 assert.equal(r.ok,true,r.reason);
 assert.deepEqual(r.coreIds,five.slice(0,3));
 assert.deepEqual(r.selectedIds.slice(0,3),five.slice(0,3));
 assert.ok(r.evaluatedPairs>20);
 assert.equal(r.legal,true);
 assert.equal(core.validateEquipment(r.selectedIds,catalog,rules).valid,true);
 assert.equal(r.exactOptimalityProven,false);
 for(const alt of r.alternatives)
  assert.equal(core.validateEquipment([...r.coreIds,...alt.lastTwo],catalog,rules).valid,true);
});
test('Does not force Void Staff, Cryptbloom or Trident and respects incompatible penetration',()=>{
 const t={frontlineProvided:3,damageDuty:2,ad:2,ap:2,tank:0,shieldPressure:0.5};
 const p=late.compare({prepared,optimizer,orderedItems:five,candidateIds:all.map(x=>x.id),threats:t,minGain:100000});
 assert.equal(p.ok,true);
 assert.equal(p.applied,false,'Insignificant or unproven upgrade should not change the current build');
 assert.deepEqual(p.selectedIds,five);
 assert.equal(p.alternatives.every(alt=>!alt.lastTwo.includes('oceanids_trident')||alt.score<=p.topScore),true);
 const clash=core.validateEquipment([...five.slice(0,3),'void_staff','cryptbloom'],catalog,rules);
 assert.equal(clash.valid,false);
});
test('Ignores other three-item cores and applies a legal improvement only if the gain is meaningful',()=>{
 const t={frontlineProvided:3,damageDuty:2,ad:2,ap:2,tank:0,shieldPressure:0.5};
 const initial=['ludens_echo','rabadons_deathcap','infinity_orb','redemption','thornmail'];
 assert.equal(core.validateEquipment(initial,catalog,rules).valid,true);
 const r=late.compare({prepared,optimizer,orderedItems:initial,candidateIds:all.map(x=>x.id),threats:t,minGain:2});
 assert.equal(r.ok,true,r.reason);
 assert.deepEqual(r.selectedIds.slice(0,3),initial.slice(0,3));
 assert.equal(r.applied,true,'Meaningfully better AP pair should supersede weak supportive end items');
 assert.ok(r.rawGain>2);
 assert.ok(r.selectedIds.every((id,i)=>i<3||!['redemption','thornmail'].includes(id)));
});
