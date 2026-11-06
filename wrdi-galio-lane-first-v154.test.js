const {test}=require('node:test');
const assert=require('node:assert/strict');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const purchasing=require('./wrdi-galio-purchase-order-v1432.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const champions=require('./data/champions-picker-v151.json').champions;
const items=Object.fromEntries(catalog.items.map(x=>[x.id,x]));
const prep=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const byName=new Map(champions.map(x=>[x.name.toLowerCase(),x]));
const lookup=name=>profiles.lookup(name,byName.get(name.toLowerCase()));
function draft(allies,enemies){return team.make({allies,enemies,lookup}).threats;}
const allies=['Ambessa','Pantheon','Galio','Ezreal','Blitzcrank'];
const enemies=['Aatrox','Kindred','Akali','Jhin','Alistar'];
test('magic lane waveclear beats only mixed resistance when first buying into a magic assassin',()=>{
 const t=draft(allies,enemies);
 const hollow=purchasing.stageScore(items.hollow_radiance,t,0);
 const despair=purchasing.stageScore(items.unending_despair,t,0);
 assert.ok(hollow.score>despair.score,'waveclear + MR should outperform mixed defensive stats during isolated magic lane');
 assert.ok(hollow.factors.some(x=>x.message.includes('vagues')));
});
test('first item is optimized for Akali lane before selecting teamfight defenses',()=>{
 const t=draft(allies,enemies);
 const outcome=optimizer.optimize({prepared:prep,threats:t});
 assert.equal(outcome.ok,true,outcome.reason);
 const plan=purchasing.order({prepared:prep,items:outcome.main.items,threats:t});
 assert.equal(plan.ok,true,plan.reason);
 assert.equal(plan.items[0].id,'hollow_radiance',
  'Need documented MR + minion waveclear for first item against isolated magic all-in lane');
 assert.equal(plan.items[0].phase,'lane');
 assert.equal(plan.items[1].phase,'transition');
 assert.ok(outcome.main.stats.armor>=40);
 assert.ok(outcome.main.stats.mr>=40);
 assert.equal(core.validateEquipment(plan.items.map(x=>x.id),catalog,rules).valid,true);
});
test('physical lane offers physical armor + waveclear rather than copying magic opener',()=>{
 const t=draft(allies,['Aatrox','Kindred','Zed','Jhin','Alistar']);
 const sunfire=purchasing.stageScore(items.sunfire_aegis,t,0);
 const hollow=purchasing.stageScore(items.hollow_radiance,t,0);
 assert.ok(sunfire.score>hollow.score);
 const outcome=optimizer.optimize({prepared:prep,threats:t});
 assert.equal(outcome.ok,true,outcome.reason);
 const plan=purchasing.order({prepared:prep,items:outcome.main.items,threats:t});
 assert.equal(plan.ok,true,plan.reason);
 assert.notEqual(plan.items[0].id,'hollow_radiance','do not force Akali-oriented first item against Zed');
});
test('physical-vs-magic lane change does not alter five-item compatibility rules',()=>{
 for(const mid of ['Akali','Zed','Syndra','Yasuo']){
  const t=draft(allies,['Aatrox','Kindred',mid,'Jhin','Alistar']);
  const build=optimizer.optimize({prepared:prep,threats:t});
  assert.equal(build.ok,true,mid);
  const ordered=purchasing.order({prepared:prep,items:build.main.items,threats:t});
  assert.equal(ordered.ok,true,mid);
  assert.deepEqual(new Set(ordered.items.map(x=>x.id)),new Set(build.main.items.map(x=>x.id)));
  assert.equal(ordered.checkedPermutations,120);
  assert.equal(core.validateEquipment(ordered.items.map(x=>x.id),catalog,rules).valid,true);
 }
});

test('published app explains purchase phases instead of unlabeled item order',()=>{
 const fs=require('node:fs');
 const html=fs.readFileSync('index-v154.html','utf8');
 const app=fs.readFileSync('wrdi-app-v15.js','utf8');
 assert.ok(html.includes('wrdi-buy-phase'));
 assert.ok(html.indexOf('wrdi-galio-purchase-order-v1432.js')<
  html.indexOf('wrdi-galio-five-item-optimizer-v1429.js'));
 for(const phase of ['Phase de lane','Sortie de lane','Escarmouches','Combats d’équipe'])
  assert.ok(app.includes(phase),phase);
});
