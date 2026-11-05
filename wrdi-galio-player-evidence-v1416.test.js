const {test}=require('node:test');
const assert=require('node:assert/strict');
const adapter=require('./wrdi-galio-player-evidence-v1416.js');
const data=require('./data/galio-rune-training-observations-v1415.json');
test('player-confirmed tests are valid under tested conditions',()=>{
 const r=adapter.summarize(data);
 assert.equal(r.ok,true);
 assert.equal(r.validatedCount,11);
 assert.equal(r.positiveCount,7);
 assert.equal(r.negativeCount,4);
 assert.equal(r.unvalidatedCount,1);
 assert.equal(r.automaticOptimalBuildClaim,false);
});
test('Q alone is negative for both proc runes, without overgeneralizing',()=>{
 const r=adapter.summarize(data);
 for(const id of ['phase-q-ticks','electrocute-q-ticks']){
  const x=r.entries.find(x=>x.testId===id);
  assert.equal(x.status,'validated_in_game_negative');
  assert.equal(x.triggered,false);
  assert.equal(x.scope,'tested_conditions_only');
 }
});
test('R protection never becomes verified Revitalize amplification',()=>{
 const r=adapter.summarize(data);
 assert.equal(r.entries.find(x=>x.testId==='revitalize-r').status,'not_yet_validated');
 assert.equal(r.entries.find(x=>x.testId==='guardian-r').triggered,false);
});
test('No fabricated validation without explicit player source',()=>{
 const x=adapter.evaluate({test_id:'phase-combo',rune:'Rush phasique',result:'observed_yes'});
 assert.equal(x.status,'not_yet_validated');
 assert.equal(adapter.summarize({game:'League of Legends PC',champion:{id:'10099'},observations:[]}).ok,false);
});
