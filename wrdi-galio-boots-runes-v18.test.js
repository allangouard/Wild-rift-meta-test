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
test('Three rune pages max, all legal, with client Comet AP and Chinese Ice hybrid',()=>{
 const base={bridge,catalog:runes,advisor:templates};
 const ap=engine.chooseRune({...base,role:'ap_burst',needs:{laneAllIn:0,earlyDive:0}});
 assert.equal(ap.ok,true);assert.equal(ap.page.keystone,'Comète arcanique');
 assert.equal(ap.alternatives.length,2);
 for(const x of [ap,...ap.alternatives])assert.equal(bridge.validate(x.page,runes).valid,true);
 const hybrid=engine.chooseRune({...base,role:'hybrid_offensive',needs:{}});
 assert.equal(hybrid.page.keystone,'Souverain des glaces');
});
