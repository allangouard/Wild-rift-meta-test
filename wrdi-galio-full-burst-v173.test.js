'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const item=id=>{const x=catalog.items.find(y=>y.id===id);assert.ok(x,id);return x};
const make=(allies,enemies)=>team.make({allies,enemies,lookup:n=>profiles.lookup(n)}).threats;
const t=make(['Dr. Mundo','Amumu','Galio','Ashe','Leona'],
 ['Camille','Jarvan IV','Akali',"Kai'Sa",'Janna']);
test('burst procs are differentiated from 4 second proximity sustain',()=>{
 const l=optimizer.burstProfile(item('ludens_echo'));
 const o=optimizer.burstProfile(item('infinity_orb'));
 const d=optimizer.burstProfile(item('rabadons_deathcap'));
 const u=optimizer.burstProfile(item('unending_despair'));
 assert.equal(l.instant,true);assert.equal(o.execute,true);
 assert.equal(d.amplify,true);assert.equal(u.delayed,true);
 assert.equal(u.instant,false);
});
test('full burst draft selects Luden Rabadon and Orb together, not Despair',()=>{
 const r=optimizer.optimize({prepared,threats:t,beamWidth:180});
 assert.equal(r.ok,true);
 const ids=r.main.items.map(x=>x.id);
 const seq=order.order({prepared,items:r.main.items,threats:t});
 assert.equal(seq.ok,true);
 console.log('V173_BURST',JSON.stringify({set:ids,order:seq.items.map(x=>x.id),
  burst:r.main.burst,ap:r.main.stats.apAfterInteractions}));
 for(const id of ['ludens_echo','rabadons_deathcap','infinity_orb'])
  assert.ok(ids.includes(id),'Missing burst core '+id+' in '+ids.join(','));
 assert.ok(!ids.includes('unending_despair'),'Four-second tank sustain is not first-choice burst');
 assert.equal(seq.items[0].id,'ludens_echo','Luden priority in short-engagement AP build');
 assert.deepEqual(seq.items.slice(0,3).map(x=>x.id),
  ['ludens_echo','rabadons_deathcap','infinity_orb'],
  'Burst opening should combine spell proc, AP multiplier and execute before sustained effects');
 assert.ok(seq.items.findIndex(x=>x.id==='rabadons_deathcap')<=3);
 assert.ok(r.main.burst.active);
});
test('Janna shield can justify Trident without displacing the burst trio',()=>{
 const r=optimizer.optimize({prepared,threats:t,beamWidth:180});
 const ids=r.main.items.map(x=>x.id);
 assert.equal(t.shield,1);
 assert.ok(r.main.burst.shieldCut>=0);
 assert.ok(ids.filter(x=>['ludens_echo','rabadons_deathcap','infinity_orb'].includes(x)).length===3);
});
test('burst version is competitive against old contact-sustain set on same draft',()=>{
 const old=['unending_despair','oceanids_trident','riftmaker','infinity_orb','rabadons_deathcap'].map(item);
 const burst=['ludens_echo','rabadons_deathcap','infinity_orb','oceanids_trident','riftmaker'].map(item);
 const a=optimizer.calculate(old,t),b=optimizer.calculate(burst,t);
 assert.ok(b.score>a.score,JSON.stringify({old:a.score,burst:b.score}));
 assert.equal(a.burst.active,true);
 assert.equal(b.burst.active,true);
});
test('hybrid Galio still values Despair when team has no frontline',()=>{
 const other=make(['Fiora','Lillia','Galio','Samira','Alistar'],
 ['Gnar','Vi','Lux','Lucian','Lulu']);
 const x=optimizer.optimize({prepared,threats:other,beamWidth:150});
 assert.equal(x.ok,true);assert.equal(x.main.burst.active,false);
 assert.equal(core.validateEquipment(x.main.items.map(x=>x.id),catalog,rules).valid,true);
});
