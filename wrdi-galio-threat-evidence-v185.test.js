'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const evidence=require('./wrdi-galio-threat-evidence-v185.js');
const official=require('./data/champion-ability-extract-official-v1.json');
const byName=new Map(official.entries.map(x=>[x.name.toLowerCase(),x]));
const get=name=>{const x=byName.get(name.toLowerCase());assert.ok(x,name);return x;};
test('Enemy with an ally heal contributes materially more than a self-healing bruiser',()=>{
 const soraka=evidence.evaluate(get('Soraka'));
 const aatrox=evidence.evaluate(get('Aatrox'));
 assert.equal(soraka.ok,true);assert.equal(aatrox.ok,true);
 assert.equal(soraka.healing.ally,true);
 assert.equal(aatrox.healing.self,true);
 assert.ok(soraka.healing.pressure>aatrox.healing.pressure);
 assert.ok(soraka.healing.evidence.every(x=>x.source==='riot_wild_rift_official_description'));
});
test('Kayn Darkin sustain remains conditional and no specific transformed state is invented',()=>{
 const kayn=evidence.evaluate(get('Kayn'));
 assert.equal(kayn.healing.ally,false);
 assert.equal(kayn.healing.self,true);
 assert.equal(kayn.healing.conditionalFormOnly,true);
 assert.ok(kayn.healing.pressure<1);
 assert.match(kayn.caveat,/no enemy builds/);
});
test('Annie and Ambessa have personal shields; Janna can shield an ally',()=>{
 const annie=evidence.evaluate(get('Annie'));
 const ambessa=evidence.evaluate(get('Ambessa'));
 const janna=evidence.evaluate(get('Janna'));
 for(const x of [annie,ambessa]){
  assert.equal(x.shielding.self,true);
  assert.equal(x.shielding.ally,false);
 }
 assert.equal(janna.shielding.ally,true);
});
test('No false damage or heals from basic damage-only spell text',()=>{
 const brand=evidence.evaluate(get('Brand'));
 assert.equal(brand.healing.pressure,0);
 assert.equal(brand.shielding.pressure,0);
});
test('Enemy composition summary differentiates multiple self-heals from allied protection',()=>{
 const solo=evidence.summarize({enemies:['Aatrox','Kayn','Annie','Ezreal','Ambessa'],byName:get});
 const support=evidence.summarize({enemies:['Aatrox','Kayn','Annie','Ezreal','Soraka'],byName:get});
 assert.equal(solo.ok,true);assert.equal(support.ok,true);
 assert.equal(solo.alliedHealers,0);
 assert.equal(support.alliedHealers,1);
 assert.ok(support.healingPressure>solo.healingPressure);
 assert.ok(solo.profiles.every(x=>x.details.ok));
});
test('Full patch catalog can be analyzed without inventing claims about unknown conditions',()=>{
 const r=official.entries.map(evidence.evaluate);
 assert.equal(r.length,126);
 assert.equal(r.filter(x=>x.ok).length,126);
 assert.ok(r.every(x=>Number.isFinite(x.healing.pressure)&&x.healing.pressure>=0&&x.healing.pressure<=2));
});
