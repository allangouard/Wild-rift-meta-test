const {test}=require('node:test');
const assert=require('node:assert/strict');
const profiles=require('./wrdi-champion-profiles-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const balance=require('./wrdi-galio-defense-balance-v153.js');
const core=require('./wrdi-core-v14.js');
const cat=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const champions=require('./data/champions-picker-v151.json').champions;
const meta=new Map(champions.map(x=>[x.name.toLowerCase(),x]));
const lookup=name=>profiles.lookup(name,meta.get(name.toLowerCase()));
const prepared=guard.prepare({catalog:cat,rules,core,livePatch:'7.3d'});
const enemies=['Aatrox','Kayn','Orianna','Miss Fortune','Leona'];
const tankAllies=['Ornn','Rammus','Galio','Ashe','Alistar'];
const squishyAllies=['Akali','Lee Sin','Galio','Ashe','Lux'];
const context=allies=>team.make({allies,enemies,lookup});
const item=id=>cat.items.find(x=>x.id===id);
test('team needs correctly distinguish three allied tanks from no tank',()=>{
 const tank=context(tankAllies),fragile=context(squishyAllies);
 assert.equal(tank.ok,true);
 assert.equal(fragile.ok,true);
 assert.equal(tank.threats.teamTank,3);
 assert.equal(tank.threats.frontlineNeed,0);
 assert.equal(tank.threats.damageDuty,2);
 assert.equal(tank.threats.midAssassin,0);
 assert.ok(tank.threats.earlyStasisPriority<=1);
 assert.ok(fragile.threats.frontlineNeed>=1);
 assert.equal(fragile.threats.damageDuty,0);
});
test('single jungle assassin cannot make Zhonya the best second item by itself',()=>{
 const t=context(tankAllies).threats;
 const stasis=order.stageScore(item('zhonyas_hourglass'),t,1);
 const ap=order.stageScore(item('cosmic_drive'),t,1);
 assert.ok(ap.score>stasis.score,'AP contribution should outrank unnecessary second-item stasis');
 const overlap=context(squishyAllies).threats;
 const danger={...overlap,earlyStasisPriority:2,midAssassin:1,jungleAssassin:1};
 assert.ok(order.stageScore(item('zhonyas_hourglass'),danger,1).score>stasis.score);
});
test('optimizer responds with more AP when allied frontline can carry engages',()=>{
 const heavy=context(tankAllies),light=context(squishyAllies);
 assert.equal(heavy.ok,true);assert.equal(light.ok,true);
 const h=optimizer.optimize({prepared,threats:heavy.threats});
 const l=optimizer.optimize({prepared,threats:light.threats});
 assert.equal(h.ok,true,h.reason);assert.equal(l.ok,true,l.reason);
 const totalAP=x=>x.main.items.reduce((sum,i)=>sum+(item(i.id).stats?.ap||0),0);
 assert.ok(totalAP(h)>=140,'should provide meaningful AP with three tank allies');
 assert.ok(totalAP(h)>totalAP(l),'should be more AP-focused than a team lacking frontline');
 assert.equal(core.validateEquipment(h.main.items.map(x=>x.id),cat,rules).valid,true);
 const seq=order.order({prepared,items:h.main.items,threats:heavy.threats});
 assert.equal(seq.ok,true,seq.reason);
 assert.notEqual(seq.items[1].id,'zhonyas_hourglass','Zhonya is not an automatic second item against a lone jungler');
 assert.ok(seq.items.slice(1,4).some(x=>(item(x.id).stats?.ap||0)>=65),'early AP must have teamfight impact');
});
test('AP synergy and max-HP damage can be preferred without assuming two tanks are mandatory',()=>{
 const t=context(tankAllies).threats;
 assert.ok(t.tank>=1);
 assert.ok(t.sustain>=1);
 const five=[item('hollow_radiance'),item('riftmaker'),item('cosmic_drive'),item('rabadons_deathcap'),item('liandrys_torment')];
 assert.ok(optimizer.calculate(five,t).score>optimizer.calculate([
  item('hollow_radiance'),item('iceborn_gauntlet'),item('unending_despair'),
  item('kaenic_rookern'),item('thornmail')
 ],t).score);
 const a=balance.evaluate(five,t);
 assert.ok(a.targets.armor<balance.evaluate(five,{...t,frontlineProvided:0,frontlineNeed:2}).targets.armor);
});
