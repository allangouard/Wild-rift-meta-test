const {test}=require('node:test');
const assert=require('node:assert/strict');
const team=require('./wrdi-galio-team-context-v1431.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const base={
 allies:['Ornn','Rammus','Galio','Ashe','Alistar'],
 enemies:['Aatrox','Kayn','Orianna','Miss Fortune','Leona']
};
const lookup=name=>({
 Ornn:['tank'],Rammus:['tank'],Galio:['ap'],Ashe:['ad'],Alistar:['tank'],
 Aatrox:['ad','heal','sustain'],
 Kayn:['ad','heal','sustain','conditional_sustain'],
 Orianna:['ap','poke'], 'Miss Fortune':['ad'], Leona:['tank','cc']
}[name]||[]);
test('confirmed and conditional healing are separate evidence counters',()=>{
 const draft=team.make({...base,lookup});
 assert.equal(draft.ok,true);
 assert.equal(draft.threats.heal,2);
 assert.equal(draft.threats.confirmedHeal,1);
 assert.equal(draft.threats.conditionalHeal,1);
 assert.equal(draft.threats.conditionalSustain,1);
 assert.equal(optimizer.weights(draft.threats).heal,1.35);
});
test('a single uncertain heal is not scored like a guaranteed heal',()=>{
 const uncertain=optimizer.weights({heal:1,confirmedHeal:0,conditionalHeal:1});
 const certain=optimizer.weights({heal:1,confirmedHeal:1,conditionalHeal:0});
 assert.equal(uncertain.heal,0.35);
 assert.equal(certain.heal,1);
 assert.ok(uncertain.heal<certain.heal);
});
test('legacy threat data still uses the prior scoring fallback',()=>{
 assert.equal(optimizer.weights({heal:2}).heal,2);
});
