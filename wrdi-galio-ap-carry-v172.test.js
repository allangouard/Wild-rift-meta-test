'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
const core=require('./wrdi-core-v14.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const prepared=guard.prepare({catalog,rules:restrictions,core,livePatch:'7.3d'});
const all=['Dr. Mundo','Amumu','Galio','Ashe','Leona'];
const enemies=['Camille','Jarvan IV','Akali',"Kai'Sa",'Janna'];
const threat=team.make({allies:all,enemies,lookup:n=>profiles.lookup(n)}).threats;
const get=id=>{const x=catalog.items.find(y=>y.id===id);assert.ok(x,'item '+id);return x;};
const ids=a=>a.map(get);
test('3 tanks and no other magic carry are recognized as AP carry duty, not enemy tanks',()=>{
 assert.equal(threat.frontlineProvided,3);
 assert.equal(threat.damageDuty,2);
 assert.equal(threat.tank,0);
 assert.equal(threat.alliedApCarry,0);
});
test('Rabadon 30 percent multiplier is counted as AP power, not only its 130 base AP',()=>{
 const build=ids(['ludens_echo','rabadons_deathcap','infinity_orb','oceanids_trident','hollow_radiance']);
 const r=optimizer.calculate(build,threat);
 assert.ok(r.stats.apAfterInteractions>r.stats.ap*1.2,JSON.stringify(r.stats));
 assert.ok(r.offenseRole&&r.offenseRole.active);
 assert.ok(r.offenseRole.effectiveAp>=r.stats.apAfterInteractions);
});
test('AP burst is favored over hybrid burn with 3 frontline allies against squishier draft',()=>{
 const chosen=optimizer.optimize({prepared,threats:threat,beamWidth:180});
 assert.equal(chosen.ok,true,JSON.stringify(chosen));
 const set=chosen.main.items.map(x=>x.id);
 const ap=chosen.main.stats.apAfterInteractions;
 const rabadon=set.includes('rabadons_deathcap');
 const burst=set.includes('infinity_orb')||set.includes('ludens_echo');
 const defense=set.filter(x=>['hollow_radiance','unending_despair','thornmail','force_of_nature','amaranths_twinguard','kaenic_rookern'].includes(x)).length;
 console.log('V172_TANK_ALLIES',JSON.stringify({set,ap,rawAp:chosen.main.stats.ap,rabadon,burst,defense,score:chosen.main.suitability,needs:threat}));
 assert.ok(rabadon,'AP carry selection should consider Deathcap as a power spike');
 assert.ok(burst,'AP carry needs meaningful immediate damage, not all sustained burn');
 assert.ok(defense<=1,'three allied tanks cover frontline; avoid double defensive core');
 const ordered=order.order({prepared,items:chosen.main.items,threats:threat});
 assert.equal(ordered.ok,true);
});
test('Rabadon beats Liandry against non-tanks when both builds have same other pieces',()=>{
 const common=['hollow_radiance','ludens_echo','infinity_orb','oceanids_trident'];
 const cap=optimizer.calculate(ids([...common,'rabadons_deathcap']),threat);
 const burn=optimizer.calculate(ids([...common,'liandrys_torment']),threat);
 assert.ok(cap.score>burn.score,JSON.stringify({cap:cap.score,burn:burn.score,capRole:cap.offenseRole,burnRole:burn.offenseRole}));
});
test('hybrid remains available when team lacks allied tanks; no universal AP lock',()=>{
 const alt=team.make({allies:['Fiora','Lee Sin','Galio','Jinx','Lulu'],
  enemies:['Darius','Vi','Ahri','Jhin','Seraphine'],lookup:n=>profiles.lookup(n)}).threats;
 const chosen=optimizer.optimize({prepared,threats:alt,beamWidth:100});
 assert.ok(chosen.ok);
 assert.equal(alt.damageDuty,0);
 assert.ok(chosen.main.items.length===5);
 assert.equal(core.validateEquipment(chosen.main.items.map(x=>x.id),catalog,restrictions).valid,true);
});
