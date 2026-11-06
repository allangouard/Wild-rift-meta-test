'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const advisor=require('./wrdi-galio-condition-audit-v187.js');
const boots=require('./wrdi-galio-boots-v18.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const engine=require('./wrdi-draft-engine-v15.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const bootCatalog=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const runes=require('./data/rune-catalog-client-v14.json');
const templates=require('./wrdi-galio-rune-advisor-v1411.js');
const items=id=>{const x=catalog.items.find(o=>o.id===id);assert.ok(x,id);return {...x,feature:optimizer.features(x)}};
test('One shielding support makes Trident conditional, not a guaranteed high-impact counter',()=>{
 const x=advisor.inspect({items:[items('oceanids_trident')],threats:{alliedShieldSources:1,shieldPressure:2}});
 assert.equal(x.ok,true);
 assert.equal(x.entries[0].status,'conditional');
 assert.match(x.entries[0].reason,/Une seule source/);
 const multiple=advisor.inspect({items:[items('oceanids_trident')],threats:{alliedShieldSources:2,shieldPressure:4}});
 assert.equal(multiple.entries[0].status,'relevant');
 const none=advisor.inspect({items:[items('oceanids_trident')],threats:{alliedShieldSources:0,conditionalShieldSources:1,shieldPressure:0.35}});
 assert.equal(none.entries[0].status,'weak');
});
test('Heal reduction needs practical triggers; Thornmail cannot pretend to work from Galio spells',()=>{
 const candidates=[items('morellonomicon'),items('thornmail')];
 const isolated=advisor.inspect({items:candidates,threats:{allyHealerCount:0,healPressure:0.9,lanePhysical:0}});
 assert.equal(isolated.entries.find(x=>x.id==='morellonomicon').status,'conditional');
 assert.equal(isolated.entries.find(x=>x.id==='thornmail').status,'weak');
 const ally=advisor.inspect({items:candidates,threats:{allyHealerCount:2,healPressure:4,lanePhysical:1}});
 assert.equal(ally.entries.find(x=>x.id==='morellonomicon').status,'relevant');
 assert.match(ally.entries.find(x=>x.id==='thornmail').trigger,/reçus|attaques/);
});
test('Void Staff penetration does not assume that enemies bought magic resist',()=>{
 const x=advisor.inspect({items:[items('void_staff')],threats:{tank:0}});
 assert.equal(x.entries[0].status,'unknown_enemy_items');
 assert.equal(x.unknownEnemyItems,true);
 assert.equal(x.guaranteedProcs,false);
});
test('Three client boots retain correct scope and match lane/team danger',()=>{
 const c={bootsCatalog:bootCatalog,role:'hybrid_offensive'};
 const physical=boots.select({...c,threats:{ad:5,lanePhysical:1,cc:1}});
 const magic=boots.select({...c,threats:{ap:5,laneMagic:1,cc:3}});
 const burst=boots.select({...c,role:'ap_burst',threats:{ad:1,ap:1,damageDuty:2}});
 assert.equal(physical.recommended.name,'Coques en acier');
 assert.match(physical.recommended.caveat,/attaques/);
 assert.equal(magic.recommended.name,'Sandales de Mercure');
 assert.match(magic.recommended.caveat,/ténacité/);
 assert.equal(burst.recommended.name,'Bottes de mana');
 for(const r of [physical,magic,burst])assert.equal(r.candidates.length,3);
});
test('Electrocute minor rune adapts to enemy mid, keeping three legal pages at most',()=>{
 const base={bridge,catalog:runes,advisor:templates,role:'ap_burst'};
 const clear=engine.chooseRune({...base,needs:{laneAllIn:0,lanePoke:0}});
 const poke=engine.chooseRune({...base,needs:{laneAllIn:0,lanePoke:1}});
 const allin=engine.chooseRune({...base,needs:{laneAllIn:1,lanePoke:0}});
 for(const r of [clear,poke,allin]){
  assert.equal(r.ok,true);
  assert.equal(r.page.keystone,'Électrocution');
  assert.ok(r.alternatives.length<=2);
  assert.equal(bridge.validate(r.page,runes).valid,true);
 }
 assert.equal(clear.page.secondary,'Transcendance');
 assert.equal(poke.page.secondary,'Second souffle');
 assert.equal(allin.page.secondary,"Plaque d'os");
});

test('The optimizer penalizes buying Trident prematurely against one shield provider',()=>{
 const selected=['ludens_echo','rabadons_deathcap','infinity_orb','morellonomicon','oceanids_trident'].map(items);
 const base={frontlineProvided:3,damageDuty:2,shieldPressure:2,ad:2,ap:2,tank:0};
 const lone=optimizer.calculate(selected,{...base,alliedShieldSources:1});
 const multiple=optimizer.calculate(selected,{...base,alliedShieldSources:2});
 assert.ok(multiple.score-lone.score>=7,
  'Trident should require stronger evidence for a core-slot purchase: '+lone.score+' vs '+multiple.score);
});
