'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('./wrdi-antiheal-order-v169.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const item=id=>catalog.items.find(x=>x.id===id);
const threat=team.make({allies:['Garen','Lee Sin','Galio','Jinx','Lulu'],
 enemies:['Darius','Gwen','Ahri','Jhin','Seraphine'],lookup:x=>profiles.lookup(x)}).threats;
test('source fact verification: Thornmail and Morello apply healing cuts via different triggers',()=>{
 const thorn=engine.classify(item('thornmail')),morello=engine.classify(item('morellonomicon'));
 const rift=engine.classify(item('riftmaker'));
 assert.equal(thorn.grievousPct,50);
 assert.equal(morello.grievousPct,50);
 assert.equal(thorn.contact,true);
 assert.equal(thorn.retaliation,true);
 assert.equal(thorn.reflect,true);
 assert.equal(morello.spell,true);
 assert.equal(morello.armor,0);
 assert.equal(morello.ap,75);
 assert.equal(rift.grievousPct,0);
 assert.equal(rift.ap,70);
});
test('healing in champion kits is not equivalent to urgent observed healing',()=>{
 const baseline=engine.compareCandidates({catalog,threats:threat});
 assert.equal(baseline.ok,true);
 assert.equal(baseline.antihealNeed,false);
 assert.equal(baseline.actualMatchNotObserved,true);
 assert.equal(baseline.byId.thornmail.urgent,false);
 assert.ok(baseline.byId.riftmaker.score>0);
});
test('observed severe healing increases relative value of real 50 percent grievous wounds',()=>{
 const baseline=engine.compareCandidates({catalog,threats:threat});
 const observed=engine.compareCandidates({catalog,threats:threat,
  observedHealingSeverity:4,beingAutoAttacked:true});
 assert.equal(observed.antihealNeed,true);
 assert.ok(observed.byId.thornmail.score>baseline.byId.thornmail.score);
 assert.ok(observed.byId.morellonomicon.score>baseline.byId.morellonomicon.score);
 assert.ok(observed.byId.thornmail.mechanics.reflect);
 assert.ok(!baseline.byId.riftmaker.mechanics.grievousPct);
});
test('Thornmail vs Morello changes with physical pressure and actual incoming auto-attacks',()=>{
 const mixed=engine.compareCandidates({catalog,threats:{...threat,ad:4,ap:1,damageDuty:0},
  observedHealingSeverity:4,beingAutoAttacked:true});
 const magic=engine.compareCandidates({catalog,threats:{...threat,ad:0,ap:5,damageDuty:2},
  observedHealingSeverity:4,beingAutoAttacked:false});
 assert.ok(mixed.byId.thornmail.score>mixed.byId.morellonomicon.score,JSON.stringify(mixed.options));
 assert.ok(magic.byId.morellonomicon.score>magic.byId.thornmail.score,JSON.stringify(magic.options));
});
test('third and fourth purchases are real legal candidate scenarios, not forced core additions',()=>{
 const baseline=engine.candidates({prepared,optimizer,order,threats:threat,observedHealingSeverity:0});
 const urgent=engine.candidates({prepared,optimizer,order,threats:threat,
  observedHealingSeverity:4,beingAutoAttacked:true});
 assert.equal(baseline.ok,true,JSON.stringify(baseline));
 assert.equal(urgent.ok,true,JSON.stringify(urgent));
 for(const result of [baseline,urgent]){
  assert.equal(result.core.join(','),'hollow_radiance,unending_despair');
  assert.ok(result.scenarios.length>=2);
  assert.ok(result.scenarios.every(x=>x.legal&&
    prepared.core.validateEquipment(x.items,catalog,rules).valid));
  assert.ok(result.scenarios.every(x=>x.items.length===4));
  assert.ok(result.scenarios.some(x=>x.third==='riftmaker'&&x.fourth==='oceanids_trident'),
   'third Riftmaker can be followed by shield cut instead of forced antiheal');
  assert.ok(result.scenarios.some(x=>x.third==='thornmail'&&x.fourth==='riftmaker'),
   'urgent armor/heal choice can delay Riftmaker to fourth');
 }
 console.log('V169_PATHS',JSON.stringify({
  baseline:baseline.scenarios.map(x=>({third:x.third,fourth:x.fourth,score:x.score})),
  urgent:urgent.scenarios.map(x=>({third:x.third,fourth:x.fourth,score:x.score}))
 }));
});
test('stage score considers observed healing but does not assume it from champion traits',()=>{
 const thorn=item('thornmail'),rift=item('riftmaker'),morello=item('morellonomicon');
 const kitOnly=order.stageScore(thorn,threat,2).score;
 const urgent={...threat,observedHealingSeverity:4,beingAutoAttacked:true};
 const urgentScore=order.stageScore(thorn,urgent,2).score;
 assert.ok(urgentScore>kitOnly+2,{kitOnly,urgentScore});
 assert.ok(order.stageScore(morello,urgent,2).score>order.stageScore(morello,threat,2).score);
 assert.ok(order.stageScore(rift,urgent,2).score>0);
});
test('no imported Chinese ranking percentages or unaudited item components used',()=>{
 const x=engine.candidates({prepared,optimizer,order,threats:threat});
 assert.equal(x.ok,true);
 assert.equal(x.noClaimThatThirdItemIsUniversallyOptimal,true);
 assert.ok(x.note.includes('Scenarios'));
});
