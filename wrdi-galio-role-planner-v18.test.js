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
 assert.equal(plan.chooseRole({frontlineProvided:0,frontlineNeed:1}),'tank_utility');
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

test('Every eligible AP item enters comparison unless its special mechanic is disproven by the draft',()=>{
 const noShield={frontlineProvided:3,damageDuty:2,shieldPressure:0.5,tank:0};
 const a=plan.plan({threats:noShield,items});
 assert.equal(a.ok,true);
 assert.equal(a.allRelevantApIncluded,true);
 const expected=items.filter(x=>x.stats.ap>=40&&!['oceanids_trident','cosmic_drive'].includes(x.id));
 assert.ok(expected.length>=20,'Full AP candidate catalogue must be available');
 for(const x of expected)assert.ok(a.candidateIds.includes(x.id),'Missing AP candidate: '+x.id);
 assert.ok(a.candidateIds.includes('stormsurge'));
 assert.ok(a.candidateIds.includes('lich_bane'));
 assert.ok(a.candidateIds.includes('banshees_veil'));
 assert.ok(a.candidateIds.includes('horizon_focus'));
 assert.ok(a.candidateIds.includes('blackfire_torch'));
 assert.ok(a.candidateIds.includes('void_staff'));
 assert.ok(a.candidateIds.includes('cryptbloom'));
 assert.equal(a.apCandidatesConsidered,expected.length);
 const shieldDraft=plan.plan({threats:{...noShield,shieldPressure:2},items});
 assert.ok(shieldDraft.candidateIds.includes('oceanids_trident'));
 const kitingDraft=plan.plan({threats:{...noShield,kitePressureConfirmed:1},items});
 assert.ok(kitingDraft.candidateIds.includes('cosmic_drive'));
});
test('Pene items receive a contextual rather than mandatory AP burst shortlist bonus',()=>{
 const light={tank:0},heavy={tank:3};
 const staff=items.find(x=>x.id==='void_staff');
 const other=items.find(x=>x.id==='stormsurge');
 assert.ok(staff&&other);
 const low=plan.evaluate(staff,'ap_burst',light);
 const high=plan.evaluate(staff,'ap_burst',heavy);
 assert.ok(high.score>low.score,'Magic penetration should gain value when durable targets exist');
 const result=plan.plan({threats:{frontlineProvided:3,damageDuty:2},items});
 assert.equal(result.penetrationNotForced,true);
});
