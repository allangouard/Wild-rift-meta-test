'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const interactions=require('./wrdi-item-interactions-v165.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profile=require('./wrdi-champion-profiles-v15.js');
const core=require('./wrdi-core-v14.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const get=id=>{const x=catalog.items.find(i=>i.id===id);assert.ok(x,'missing '+id);return x;};
const chosen=ids=>ids.map(get);
const sample=team.make({
 allies:['Fiora','Lillia','Galio','Samira','Alistar'],
 enemies:['Gnar','Vi','Lux','Lucian','Lulu'],
 lookup:name=>profile.lookup(name)
});
const tested=chosen(['hollow_radiance','unending_despair','riftmaker','oceanids_trident','amaranths_twinguard']);
test('user draft is analyzed without falsely inferring enemy crit build or major healing',()=>{
 assert.equal(sample.ok,true);
 assert.equal(sample.threats.heal,0);
 assert.equal(sample.threats.shield,1);
 assert.equal(sample.threats.crit,0);
 assert.equal(sample.threats.critPotential,1);
 assert.equal(sample.threats.alliedApCarry,1);
 assert.equal(sample.threats.frontlineNeed,0);
 assert.equal(sample.threats.teamEngage>=1,true);
});
test('full defensive/sustained build receives exact item-only stats and AP conversion',()=>{
 const s=interactions.stats(tested);
 assert.equal(s.hp,1550);
 assert.equal(s.armor,90);
 assert.equal(s.mr,130);
 assert.equal(s.ap,150);
 assert.equal(s.riftBonusAp,31);
 assert.equal(s.apAfterInteractions,181);
});
test('two durations distinguish 4s Despair activation and 5s Amaranth stacks',()=>{
 const r=interactions.compare(tested,sample.threats);
 assert.equal(r.ok,true);
 assert.equal(r.short.values.unendingDespair.possibleTriggersIfContinuousCombat,0);
 assert.equal(r.long.values.unendingDespair.possibleTriggersIfContinuousCombat,2);
 assert.equal(r.short.values.amaranth.activeInScenario,false);
 assert.equal(r.long.values.amaranth.activeInScenario,true);
 assert.equal(r.long.values.amaranth.additionalBonusArmorIfActive,27);
 assert.equal(r.long.values.amaranth.additionalBonusMrIfActive,39);
 assert.deepEqual(r.long.values.hollowRadiance.damagePerSecondRawRange,[35.5,45.5]);
 assert.ok(r.combinations.some(x=>x.includes('Rayonnement + Désespoir')));
 assert.ok(r.combinations.some(x=>x.includes('Amaranth')));
});
test('Despair must not pretend 3% own max HP is target max HP nor invent base Galio HP',()=>{
 const v=interactions.scenario(tested,sample.threats,{duration:8}).values.unendingDespair;
 assert.equal(v.hpOwner,'Galio / own_max_hp according to client catalogue mechanics');
 assert.equal(v.fullDamageUnknownBaseHp,true);
 assert.equal(v.bonusHpOnlyDamageContributionPerTrigger,46.5);
 assert.equal(v.actualHealsUnknownBeforeResistances,true);
});
test('confirmed shield supports Trident, but no antiheal or unproven Randuin critical proc',()=>{
 const base=chosen(['hollow_radiance','unending_despair','riftmaker','oceanids_trident']);
 const w=interactions.compare(base,sample.threats);
 const thorn=interactions.compare([...base,get('thornmail')],sample.threats);
 const randuin=interactions.compare([...base,get('randuins_omen')],sample.threats);
 const amaranth=interactions.compare([...base,get('amaranths_twinguard')],sample.threats);
 assert.ok(thorn.long.notes.some(x=>x.includes('aucun soin')));
 assert.equal(randuin.long.values.randuin.confirmedCriticalSources,0);
 assert.equal(w.long.values.trident.requiresAbilityDamageToChampion,true);
 assert.ok(amaranth.long.values.amaranth.activeInScenario);
 assert.ok(amaranth.score>thorn.score);
 const withHeal={...sample.threats,confirmedHeal:3,heal:3};
 assert.ok(interactions.compare([...base,get('thornmail')],withHeal).score>thorn.score);
});
test('attack-gated Gauntlet effect is not assumed guaranteed; CC overlap reduces utility',()=>{
 const r=interactions.compare(chosen(['hollow_radiance','iceborn_gauntlet']),sample.threats);
 assert.equal(r.short.values.iceborn.requiresMeleeAttackAfterSpell,true);
 assert.ok(r.short.notes.some(x=>x.includes('ralentissement moins précieux')));
});
test('legacy five item optimizer remains legal and has timed interaction comparison',()=>{
 const r=optimizer.optimize({prepared,threats:sample.threats,beamWidth:90});
 assert.equal(r.ok,true,JSON.stringify(r));
 console.log('REFERENCE_V165',JSON.stringify({build:r.main.items.map(x=>x.id),score:r.main.suitability,alternatives:r.alternatives.map(a=>a.items.map(x=>x.id))}));
 assert.equal(r.main.items.length,5);
 assert.ok(r.main.interaction?.ok);
 assert.equal(r.main.interaction.short.duration,2.5);
 assert.equal(r.main.interaction.long.duration,8);
 assert.equal(core.validateEquipment(r.main.items.map(x=>x.id),catalog,rules).valid,true);
});
test('known five-item scenario can be compared to a no-purpose antiheal set',()=>{
 const alternative=chosen(['hollow_radiance','unending_despair','riftmaker','oceanids_trident','thornmail']);
 const a=optimizer.calculate(tested,sample.threats);
 const b=optimizer.calculate(alternative,sample.threats);
 assert.ok(a.interaction?.ok&&b.interaction?.ok);
 assert.ok(a.interaction.score>b.interaction.score);
 assert.equal(a.stats.apAfterInteractions,181);
});
