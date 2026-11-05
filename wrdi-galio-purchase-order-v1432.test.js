const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
const core=require('./wrdi-core-v14.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const prepared=guard.prepare({catalog,rules:restrictions,core,livePatch:'7.3d'});
const id=x=>catalog.items.find(i=>i.id===x);
const choices=['sunfire_aegis','hollow_radiance','riftmaker','zhonyas_hourglass','rabadons_deathcap'];
const run=(threats,items=choices)=>order.order({prepared,items,threats});
test('uses five verified items, same composition, 120 permutations, no popularity',()=>{
 const r=run({ad:3,ap:2,lanePhysical:1,laneAllIn:1,jungleAllIn:1,frontlineNeed:2});
 assert.equal(r.ok,true,r.reason);assert.equal(r.items.length,5);
 assert.equal(r.checkedPermutations,120);
 assert.deepEqual(new Set(r.items.map(x=>x.id)),new Set(choices));
 assert.equal(r.sameFiveItems,true);assert.equal(r.noPopularityData,true);
 assert.equal(r.noDamageForecast,true);assert.equal(r.purchaseOrderCertified,false);
 assert.equal(core.validateEquipment(r.items.map(x=>x.id),catalog,restrictions).valid,true);
});
test('lane physical threat gives early value to armor and waveclear together',()=>{
 const a=order.stageScore(id('sunfire_aegis'),{lanePhysical:1,laneAllIn:1},0);
 const b=order.stageScore(id('rabadons_deathcap'),{lanePhysical:1,laneAllIn:1},0);
 assert.ok(a.score>b.score);
 assert.match(a.reason,/Armure/);
 const result=run({lanePhysical:1,laneAllIn:1,jungleAllIn:1,ad:3});
 assert.equal(result.items[0].id,'sunfire_aegis');
});
test('lane magic threat gives early value to verified magic defense',()=>{
 const a=order.stageScore(id('hollow_radiance'),{laneMagic:1,laneAllIn:1},0);
 const b=order.stageScore(id('sunfire_aegis'),{laneMagic:1,laneAllIn:1},0);
 assert.ok(a.score>b.score);
});
test('stasis is higher priority against assassins in midgame but not forced first',()=>{
 const stasis=id('zhonyas_hourglass');
 const low=order.stageScore(stasis,{assassin:0},1);
 const high=order.stageScore(stasis,{assassin:2},1);
 assert.ok(high.score>low.score);
 assert.match(high.reason,/Stase/);
});
test('crit passive needs confirmed crit threat, not only champion potential',()=>{
 const item=id('randuins_omen');
 assert.ok(order.stageScore(item,{crit:3},1).score>order.stageScore(item,{crit:0,critPotential:3},1).score);
});
test('unknown, duplicated or transformed items are rejected',()=>{
 assert.equal(run({},['sunfire_aegis','sunfire_aegis','riftmaker','zhonyas_hourglass','rabadons_deathcap']).ok,false);
 assert.equal(run({},['sunfire_aegis','unknown','riftmaker','zhonyas_hourglass','rabadons_deathcap']).ok,false);
});
test('all legal final five-item combinations can be sequenced independently',()=>{
 const r=optimizer.optimize({prepared,threats:{ad:3,ap:2,tank:2}});
 assert.equal(r.ok,true,r.reason);
 const ordered=run({ad:3,ap:2,tank:2},r.main.items);
 assert.equal(ordered.ok,true,ordered.reason);
 assert.deepEqual(new Set(ordered.items.map(x=>x.id)),new Set(r.main.items.map(x=>x.id)));
});
test('mobile app consumes ordering without using winrates or changing five-item identity',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const ui=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(app.includes('WRDI_GalioPurchaseOrderV1432?.order'));
 assert.ok(app.includes('core:orderedItems.map'));
 assert.ok(app.includes('purchaseOrderEstablished:ordering?.ok===true'));
 assert.ok(ui.includes('(i+1)+\'. \'+x.name'));
});
