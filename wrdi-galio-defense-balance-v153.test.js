const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const profiles=require('./wrdi-champion-profiles-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const balance=require('./wrdi-galio-defense-balance-v153.js');
const engine=require('./wrdi-draft-engine-v15.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const contingencies=require('./wrdi-galio-contingencies-v1433.js');
const core=require('./wrdi-core-v14.js');
const runeBridge=require('./wrdi-rune-bridge-v14.js');
const runeAdvisor=require('./wrdi-galio-rune-advisor-v1411.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const champions=require('./data/champions-picker-v151.json').champions;
const byName=new Map(champions.map(x=>[x.name.toLocaleLowerCase('fr'),x]));
const lookup=name=>profiles.lookup(name,byName.get(name.toLocaleLowerCase('fr')));
const ally=['Ambessa','Pantheon','Galio','Ezreal','Blitzcrank'];
const enemy=['Aatrox','Kindred','Akali','Jhin','Alistar'];
const needs=team.make({allies:ally,enemies:enemy,lookup});
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
test('missing marksmen are recognized from local class evidence without assuming crit builds',()=>{
 assert.deepEqual(lookup('Kindred'),['ad']);
 assert.deepEqual(lookup('Jhin'),['ad']);
 assert.deepEqual(lookup('Akali'),['ap','assassin']);
 assert.equal(lookup('No matching champion'),null);
 assert.equal(needs.ok,true);
 assert.equal(needs.threats.ad,3);
 assert.equal(needs.threats.ap,1);
 assert.equal(needs.threats.laneMagic,1);
 assert.equal(needs.threats.crit,0);
 assert.deepEqual(needs.missingEnemyRoles,[]);
});
test('full-build physical coverage is higher priority than stacking excess MR',()=>{
 const item=id=>catalog.items.find(x=>x.id===id);
 const excessive=[
  item('hollow_radiance'),item('banshees_veil'),item('kaenic_rookern'),
  item('riftmaker'),item('cosmic_drive')];
 const balanced=[
  item('hollow_radiance'),item('iceborn_gauntlet'),item('riftmaker'),
  item('cosmic_drive'),item('amaranths_twinguard')];
 const bad=balance.evaluate(excessive,needs.threats);
 const good=balance.evaluate(balanced,needs.threats);
 assert.ok(good.score>bad.score,'Balanced armor must outrank excess magic defense');
 assert.ok(good.stats.armor>=80);
 assert.ok(good.stats.mr>=40);
 assert.equal(bad.stats.armor,0);
 assert.ok(bad.targets.armor>=75);
});
test('a magic-heavy draft may still legitimately justify several MR items',()=>{
 const item=id=>catalog.items.find(x=>x.id===id);
 const mr=[item('hollow_radiance'),item('banshees_veil'),item('kaenic_rookern'),item('riftmaker'),item('cosmic_drive')];
 const antiMagic=balance.evaluate(mr,{ad:1,ap:4,laneMagic:1});
 const antiPhysical=balance.evaluate(mr,{ad:4,ap:1,laneMagic:1});
 assert.ok(antiMagic.score>antiPhysical.score);
});
test('five-item optimization responds to the actual draft with both types of defenses',()=>{
 assert.equal(prepared.ok,true);
 const r=optimizer.optimize({prepared,threats:needs.threats});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.main.items.length,5);
 assert.equal(core.validateEquipment(r.main.items.map(x=>x.id),catalog,rules).valid,true);
 assert.ok(r.main.stats.armor>=40,'Galio needs physical defense against three AD enemies');
 assert.ok(r.main.stats.mr>=40,'Galio can still cover magical lane');
 assert.equal(r.noPopularityData,true);
});
test('full V15 analysis receives local class catalogue and preserves legal five items',()=>{
 const all=[...ally,...enemy];
 const ids=all.map(name=>champions.find(x=>x.name===name)?.id);
 assert.ok(ids.every(Boolean),JSON.stringify(ids));
 const result=engine.analyze({picks:ids,champions:Object.fromEntries(champions.map(x=>[x.id,x.name])),
  championMeta:champions,catalog,rules,runes,modules:{
   profiles,team,guard,core,optimizer,order,contingency:contingencies,runeBridge,runeAdvisor
  }});
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.draft.threats.ad,3);
 assert.equal(result.draft.threats.ap,1);
 assert.equal(result.build.items.length,5);
 const stats=result.build.items.reduce((x,it)=>{
  const s=catalog.items.find(v=>v.id===it.id).stats;
  return {armor:x.armor+(s.armor||0),mr:x.mr+(s.mr||0)};
 },{armor:0,mr:0});
 assert.ok(stats.armor>=40);assert.ok(stats.mr>=40);
});
test('V15.3 page loads defense scoring before five-item optimizer',()=>{
 const html=fs.readFileSync('index-v153.html','utf8');
 assert.ok(html.includes('wrdi-galio-defense-balance-v153.js'));
 assert.ok(html.indexOf('wrdi-galio-defense-balance-v153.js')<html.indexOf('wrdi-galio-five-item-optimizer-v1429.js'));
 const app=fs.readFileSync('wrdi-app-v15.js','utf8');
 assert.ok(app.includes('championMeta:data.championList'));
});
