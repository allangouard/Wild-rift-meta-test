const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('./wrdi-galio-item-duel-v14.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const base={hp:2400,armor:90,mr:60};
const run=(overrides={})=>api.evaluate({core,catalog,rules,base,...overrides});
test('Catalogue courant produit deux objets, pas de recommandation',()=>{
 const x=run();
 assert.equal(x.ok,true);
 assert.equal(x.status,'scenario-only');
 assert.equal(x.recommendationEligible,false);
 assert.deepEqual(x.items.map(i=>i.id),['thornmail','unending_despair']);
});
test('Valeurs fixes client Wild Rift 7.3d',()=>{
 const x=run();
 const [t,d]=x.items;
 assert.equal(t.priceGold,2850);
 assert.deepEqual(t.bonus,{hp:200,armor:75,mr:0,ah:0});
 assert.equal(d.priceGold,3000);
 assert.deepEqual(d.bonus,{hp:300,armor:40,mr:40,ah:10});
});
test('Armure et EHP physiques calcules independamment',()=>{
 const x=run();
 assert.equal(x.items[0].post.armor,165);
 assert.equal(x.items[0].ehp.physical,2600*2.65);
 assert.equal(x.items[1].ehp.physical,2700*2.30);
 assert.ok(x.items[0].ehp.physical>x.items[1].ehp.physical);
});
test('RM et EHP magiques calcules independamment',()=>{
 const x=run();
 assert.equal(x.items[0].ehp.magic,2600*1.6);
 assert.equal(x.items[1].ehp.magic,2700*2);
 assert.ok(x.items[1].ehp.magic>x.items[0].ehp.magic);
});
test('Épines utilise uniquement les bonus de l objet dans cette demonstration',()=>{
 const x=run();
 assert.equal(x.items[0].mechanics.onAttackReturnRaw,26.5);
 assert.equal(x.items[0].mechanics.healingReductionPct,50);
});
test('Affliction : dégâts bruts par proc, pas DPS et soin conditionnel',()=>{
 const x=run();
 assert.equal(x.items[1].mechanics.oneProcRaw,81);
 assert.equal(x.items[1].mechanics.tickSeconds,4);
 assert.equal(x.items[1].mechanics.healMultiplier,2.5);
 assert.equal('actualHealing' in x.items[1].mechanics,false);
});
test('Variation des PV de depart impacte la formule Affliction',()=>{
 const a=run().items[1].mechanics.oneProcRaw;
 const b=run({base:{hp:3000,armor:90,mr:60}}).items[1].mechanics.oneProcRaw;
 assert.equal(b-a,18);
});
test('Protege les hypotheses invalides',()=>{
 for(const bad of [{hp:-1,armor:0,mr:0},{hp:2400,armor:NaN,mr:60},{hp:2400,armor:90,mr:'60'},{hp:Infinity,armor:90,mr:60}]){
  assert.equal(run({base:bad}).ok,false);
 }
});
test('Rejette le mauvais patch sans declasser les donnees',()=>{
 const altered={...catalog,patch_claimed_by_client_user:'7.4'};
 assert.equal(run({catalog:altered}).ok,false);
});
test('Rejette un passif qui a change',()=>{
 const changed=structuredClone(catalog);
 const item=changed.items.find(x=>x.id==='thornmail');
 item.passives.find(x=>x.name==='Épines').mechanics.damage_formula='nouvelle formule';
 const x=run({catalog:changed});
 assert.equal(x.ok,false);
 assert.ok(x.errors[0].includes('Épines'));
});
test('Rejette une statistique manquante plutot que supposer zero PV',()=>{
 const changed=structuredClone(catalog);
 delete changed.items.find(x=>x.id==='unending_despair').stats.hp;
 assert.equal(run({catalog:changed}).ok,false);
});
test('Aucune surestimation explicite du soin et aucun ordre de build',()=>{
 const x=run();
 assert.equal('build' in x,false);
 assert.equal('winner' in x,false);
 assert.equal('dps' in x.items[1].mechanics,false);
 assert.ok(x.assumptions.some(s=>s.includes('Aucun soin ou DPS réel')));
});
