const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const context=require('./wrdi-galio-team-context-v1431.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules:restrictions,core,livePatch:'7.3d'});
const roles={Brawler:['ad','engage'],Tank:['tank','cc'],Mage:['ap','poke'],Protector:['shield','cc'],
 Carry:['ad','crit'],Diver:['ad','assassin'],Hunter:['ad','assassin'],Control:['ap','cc']};
const ctx=(allies,enemies)=>context.make({allies,enemies,lookup:name=>roles[name]||null});
const item=id=>({...catalog.items.find(x=>x.id===id),feature:optimizer.features(catalog.items.find(x=>x.id===id))});
test('enemy crit archetype is potential only, never invented crit item build',()=>{
 const r=ctx(['Brawler','Brawler','Galio','Carry','Protector'],
  ['Tank','Hunter','Diver','Carry','Control']);
 assert.equal(r.ok,true);
 assert.equal(r.threats.critPotential,1);
 assert.equal(r.threats.crit,0);
 assert.equal(r.confirmedCritBuilds,false);
});
test('one allied engager shares frontline workload; actual allied tank reduces it',()=>{
 const enemy=['Tank','Diver','Mage','Carry','Protector'];
 const without=ctx(['Mage','Mage','Galio','Carry','Protector'],enemy);
 const withEngager=ctx(['Brawler','Mage','Galio','Carry','Protector'],enemy);
 const withTank=ctx(['Tank','Mage','Galio','Carry','Protector'],enemy);
 assert.equal(without.threats.frontlineNeed,2);
 assert.equal(withEngager.threats.frontlineNeed,1);
 assert.equal(withTank.threats.frontlineNeed,0);
});
test('mid lane physical all-in and magic control are distinct situations',()=>{
 const allies=['Tank','Brawler','Galio','Carry','Protector'];
 const p=ctx(allies,['Tank','Hunter','Diver','Carry','Control']);
 const m=ctx(allies,['Tank','Hunter','Control','Carry','Protector']);
 assert.equal(p.threats.lanePhysical,1);
 assert.equal(p.threats.laneAllIn,1);
 assert.equal(m.threats.lanePhysical,0);
 assert.equal(m.threats.laneMagic,1);
 assert.equal(m.threats.laneAllIn,0);
});
test('unknown allies do not create a fabricated lack of tanks',()=>{
 const r=ctx(['Unknown','Unknown','Galio','Carry','Protector'],['Tank','Hunter','Diver','Carry','Control']);
 assert.equal(r.threats.alliesProfileComplete,false);
 assert.equal(r.threats.frontlineNeed,0);
});
test('anti crit conditional utility only triggers from explicitly confirmed need',()=>{
 const two=[item('randuins_omen'),item('riftmaker')];
 const inferred=ctx(['Brawler','Mage','Galio','Carry','Protector'],['Tank','Hunter','Diver','Carry','Control']);
 const a=optimizer.calculate(two,inferred.threats);
 const b=optimizer.calculate(two,{...inferred.threats,crit:2});
 assert.ok(!a.reasons.some(x=>x.includes('critiques documentée')));
 assert.ok(b.reasons.some(x=>x.includes('critiques documentée')));
 assert.ok(b.score>a.score);
});
test('early physical lane threat increases value of armor without fixed champion matchup',()=>{
 const two=[item('unending_despair'),item('riftmaker')];
 const neutral=optimizer.calculate(two,{ad:2,assassin:1});
 const pressure=optimizer.calculate(two,{ad:2,assassin:1,lanePhysical:1,laneAllIn:1});
 assert.ok(pressure.score>neutral.score);
 assert.ok(pressure.reasons.some(x=>x.includes('Tenue de lane')));
});
test('different full-team needs produce legal five item combinations from client only',()=>{
 for(const needs of [
  {ad:4,ap:1,assassin:2,lanePhysical:1,laneAllIn:1,frontlineNeed:2,peelNeed:2,crit:0},
  {ad:1,ap:4,tank:2,laneMagic:1,frontlineNeed:0,heal:1},
  {ad:2,ap:2,tank:3,shield:2,frontlineNeed:1}
 ]){
  const r=optimizer.optimize({prepared,threats:needs});
  assert.equal(r.ok,true,r.reason);
  assert.equal(r.main.items.length,5);
  assert.equal(new Set(r.main.items.map(i=>i.id)).size,5);
  assert.equal(core.validateEquipment(r.main.items.map(i=>i.id),catalog,restrictions).valid,true);
  assert.equal(r.noPopularityData,true);assert.equal(r.noDamageForecast,true);
 }
});
test('integration uses team-context output; no special champion hardcoded',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const block=app.slice(app.indexOf('async function wrdiGalioFiveCatalogAnalyze('),app.indexOf('async function simpleAnalyze(){'));
 assert.ok(block.includes('WRDI_GalioTeamContextV1431?.make'));
 assert.ok(block.includes('teamContext.threats'));
 assert.ok(!block.includes('/api/build/'));
 assert.ok(!block.includes("if(enemyNames.includes("));
});
