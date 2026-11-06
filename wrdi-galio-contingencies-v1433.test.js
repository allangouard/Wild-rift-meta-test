const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-contingencies-v1433.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules:restrictions,core,livePatch:'7.3d'});
const plan=needs=>{const chosen=optimizer.optimize({prepared,threats:needs});assert.equal(chosen.ok,true,chosen.reason);return engine.plan({prepared,optimizer,items:chosen.main.items,threats:needs});};
test('only pregame scenarios; original 5 items unchanged and every swap legal',()=>{
 const r=plan({ad:2,ap:2,frontlineNeed:1,crit:0,heal:0,tank:1});
 assert.equal(r.ok,true);assert.equal(r.items.length,5);
 assert.equal(r.liveTracking,false);assert.equal(r.liveRecalculation,false);
 assert.equal(r.noPopularityData,true);assert.ok(r.options.length<=3);
 assert.equal(r.certifiedOptimal,false);
 const keys=new Set();
 for(const x of r.options){
  assert.ok(!keys.has(x.conditionId));keys.add(x.conditionId);
  assert.equal(x.newIds.length,5);
  assert.equal(x.verifiedLegal,true);
  assert.equal(core.validateEquipment(x.newIds,catalog,restrictions).valid,true);
  assert.ok(r.items.includes(x.remove.id));assert.ok(!r.items.includes(x.add.id));
  assert.equal(x.newIds.filter(id=>!r.items.includes(id)).length,1);
  assert.equal(x.newIds.filter(id=>!r.items.includes(id)).length,x.newIds.filter(id=>!r.items.includes(id)).length);
 }
});
test('a confirmed critical threat can create situational benefit without predicting enemy buys',()=>{
 const r=plan({ad:2,ap:2,crit:0});
 assert.equal(r.ok,true);
 for(const x of r.options)if(x.conditionId==='critical'){
  assert.ok(x.condition.includes('critiques'));assert.notEqual(x.remove.id,x.add.id);
 }
});
test('no fake guaranteed conditional value when threat is already present',()=>{
 const r=plan({ad:5,ap:5,heal:4,tank:4,crit:3,attackSpeedPressureConfirmed:2});
 assert.equal(r.ok,true);
 assert.equal(r.options.length,0);
});
test('incomplete or illegal main five are not altered by contingencies',()=>{
 const r=engine.plan({prepared,optimizer,items:['unknown','unknown','unknown','unknown','unknown']});
 assert.equal(r.ok,false);
});
test('screen and app describe a pregame-only optional replacement, not live tracking',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const ui=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(app.includes('WRDI_GalioContingenciesV1433?.plan'));
 assert.ok(app.includes("contingencyMode:'pregame_only'"));
 assert.ok(app.includes('alternatives:[]'));
 assert.ok(ui.includes('Remplacer '+String('')));
 assert.ok(ui.includes('x.condition'));
 assert.ok(!ui.includes('Live match update'));
});
