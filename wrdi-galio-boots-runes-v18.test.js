const test=require('node:test');
const assert=require('node:assert/strict');
const advisor=require('./wrdi-galio-boots-v18.js');
const bootsCatalog=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const bridge=require('./wrdi-rune-bridge-v14.js');
const runes=require('./data/rune-catalog-client-v14.json');
const engine=require('./wrdi-draft-engine-v15.js');
const templates=require('./wrdi-galio-rune-advisor-v1411.js');
test('Three boots from direct client evidence, not made-up Chinese shoe identity',()=>{
 const r=advisor.select({bootsCatalog,role:'ap_burst',threats:{damageDuty:2}});
 assert.equal(r.ok,true);assert.equal(r.recommended.name,'Bottes de mana');
 assert.equal(r.candidates.length,3);
 assert.ok(r.candidates.every(x=>x.clientSource));
});
test('Mercury and Steelcaps win against their respective concentrated threats',()=>{
 const magic=advisor.select({bootsCatalog,role:'hybrid_offensive',threats:{ap:5,laneMagic:1,cc:3}});
 assert.equal(magic.recommended.name,'Sandales de Mercure');
 const physical=advisor.select({bootsCatalog,role:'hybrid_offensive',threats:{ad:5,lanePhysical:1,critPotential:2}});
 assert.equal(physical.recommended.name,'Coques en acier');
});
test('Three rune pages max, all legal, with buffed Electrocute AP and Chinese Ice hybrid',()=>{
 const base={bridge,catalog:runes,advisor:templates};
 const ap=engine.chooseRune({...base,role:'ap_burst',needs:{laneAllIn:0,earlyDive:0}});
 assert.equal(ap.ok,true);assert.equal(ap.page.keystone,'Électrocution');
 assert.equal(ap.alternatives[0].page.keystone,'Comète arcanique');
 assert.equal(ap.keystonePatchEvidence,'riot_wild_rift_7_3b_electrocute_40_to_60_minimum_base_damage');
 assert.equal(ap.alternatives.length,2);
 for(const x of [ap,...ap.alternatives])assert.equal(bridge.validate(x.page,runes).valid,true);
 const hybrid=engine.chooseRune({...base,role:'hybrid_offensive',needs:{}});
 assert.equal(hybrid.page.keystone,'Souverain des glaces');
});

test('Rune page changes minor slot only when mid matchup warrants it',()=>{
 const base={bridge,catalog:runes,advisor:templates,role:'ap_burst'};
 const poke=engine.chooseRune({...base,needs:{lanePoke:1,laneAllIn:0}});
 const allIn=engine.chooseRune({...base,needs:{lanePoke:0,laneAllIn:1,earlyDive:1}});
 assert.equal(poke.page.secondary,'Second souffle');
 assert.equal(allIn.page.secondary,"Plaque d'os");
 for(const x of [poke,allIn])assert.equal(bridge.validate(x.page,runes).valid,true);
 const engage=engine.chooseRune({...base,role:'hybrid_offensive',needs:{lanePoke:0,laneAllIn:1,frontlineNeed:1}});
 assert.equal(engage.page.primary[1],"Plaque d'os");
 assert.equal(bridge.validate(engage.page,runes).valid,true);
});

test('Specialized sustained poke can select Comet without replacing Electrocute burst priority',()=>{
 const base={bridge,catalog:runes,advisor:templates,role:'ap_burst'};
 const burst=engine.chooseRune({...base,needs:{lanePoke:1,laneAllIn:0}});
 assert.equal(burst.page.keystone,'Électrocution');
 const poke=engine.chooseRune({...base,needs:{lanePoke:2,laneAllIn:0}});
 assert.equal(poke.page.keystone,'Comète arcanique');
 assert.equal(poke.alternatives[0].page.keystone,'Électrocution');
 assert.equal(bridge.validate(poke.page,runes).valid,true);
 const clientElectrocute=runes.fundamental.find(x=>x.name_fr==='Électrocution');
 assert.deepEqual(clientElectrocute.effect.damage_base_range,{min:60,max:210});
});
