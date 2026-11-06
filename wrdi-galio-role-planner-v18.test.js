const test=require('node:test');
const assert=require('node:assert/strict');
const plan=require('./wrdi-galio-role-planner-v18.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const items=optimizer.eligible(prepared);
test('Galio role is selected from allied frontline before comparing items',()=>{
 assert.equal(plan.chooseRole({frontlineProvided:3,damageDuty:2,frontlineNeed:0}),'ap_burst');
 assert.equal(plan.chooseRole({frontlineProvided:0,frontlineNeed:2}),'tank_utility');
 assert.equal(plan.chooseRole({frontlineProvided:1,frontlineNeed:1}),'hybrid_offensive');
});
test('AP burst shortlist protects burst core, relevant shield counter, and legality',()=>{
 const t={frontlineProvided:3,damageDuty:2,shield:2,ad:2,ap:2,tank:0};
 const p=plan.plan({threats:t,items});
 assert.equal(p.ok,true);
 assert.equal(p.role,'ap_burst');
 assert.ok(p.shortlisted<p.evaluated);
 for(const id of p.coreReference)if(items.some(x=>x.id===id))assert.ok(p.candidateIds.includes(id),id);
 for(const item of items.filter(x=>x.feature.shieldCut))assert.ok(p.candidateIds.includes(item.id),item.id);
 const chosen=optimizer.optimize({prepared,threats:t,candidateIds:p.candidateIds});
 assert.equal(chosen.ok,true,chosen.reason);
 assert.equal(chosen.shortlistApplied,true);
 assert.equal(core.validateEquipment(chosen.main.items.map(x=>x.id),catalog,rules).valid,true);
});
test('healing and armor threats are retained conditionally, not hard-locked',()=>{
 const t={frontlineProvided:1,frontlineNeed:1,confirmedHeal:2,conditionalHeal:1,ad:4,ap:1};
 const p=plan.plan({threats:t,items});
 assert.equal(p.ok,true);
 for(const item of items.filter(x=>x.feature.antihealBySpell||x.feature.antihealByRetaliation))assert.ok(p.candidateIds.includes(item.id));
 assert.equal(p.coresAreReferences,true);
});
