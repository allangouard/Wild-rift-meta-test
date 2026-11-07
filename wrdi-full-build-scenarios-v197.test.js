'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const sim=require('./wrdi-full-build-scenarios-v197.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const byId=new Map(catalog.items.map(x=>[x.id,x]));
const items=(...ids)=>ids.map(id=>{const x=byId.get(id);assert.ok(x,id);return x;});
const spell={directDamageAt:({ap})=>({total:300+1.5*ap})};
const burst=items('ludens_echo','rabadons_deathcap','infinity_orb','void_staff','morellonomicon');
const frontline=items('hollow_radiance','unending_despair','riftmaker','thornmail','amaranths_twinguard');
test('all full builds expose three repeatable hypothetical fights',()=>{
 const r=sim.compare({primaryItems:burst,candidateBuilds:[frontline],combatModel:spell,threats:{damageDuty:2,frontlineProvided:3}});
 assert.equal(r.ok,true);assert.equal(r.totalCompared,2);
 assert.equal(r.candidates[0].scenarios.length,3);
 assert.equal(r.role,'ap_burst');
 assert.equal(r.includesAllFiveItems,true);
 assert.equal(r.profilesHypothetical,true);
});
test('rabadon amplifies full AP and magic penetration reduces target MR',()=>{
 const s=sim.stats(burst);
 assert.equal(s.ap,(100+130+110+95+75)*1.3);
 const a=sim.evaluate(burst,sim.PROFILES[0],spell);
 assert.equal(a.ok,true);
 assert.equal(a.damage.targetMrAfterPenetration,Math.max(0,45*.6-15));
 assert.ok(a.damage.magicDamageToHpIfAllConditions>0);
 assert.ok(a.damage.rawGalioQWE>0);
});
test('Luden proc and Orb only activate when their client conditions are met',()=>{
 const short=sim.evaluate(burst,sim.PROFILES[0],spell);
 const long=sim.evaluate(burst,sim.PROFILES[2],spell);
 const luden=short.procs.find(x=>x.id==='ludens_echo');
 assert.equal(luden.eligible,true);
 assert.ok(luden.countedDamage>75);
 assert.equal(short.procs.find(x=>x.id==='infinity_orb').eligible,false);
 assert.equal(long.procs.find(x=>x.id==='infinity_orb').eligible,true);
});
test('despair cannot trigger in a 2.5-second burst but can at 8 seconds',()=>{
 const early=sim.evaluate(frontline,sim.PROFILES[0],spell);
 const late=sim.evaluate(frontline,sim.PROFILES[2],spell);
 assert.equal(early.procs.find(x=>x.id==='unending_despair').eligible,false);
 assert.equal(late.procs.find(x=>x.id==='unending_despair').eligible,true);
 assert.equal(early.survival.conditionalHealNotCounted,0);
 assert.ok(late.survival.conditionalHealNotCounted>0);
 assert.ok(late.survival.hpBeforeDamage>early.survival.incomingTotal);
});
test('offense/defense tradeoff is explicit and not mislabeled as win rate',()=>{
 const a=sim.evaluate(burst,sim.PROFILES[2],spell);
 const b=sim.evaluate(frontline,sim.PROFILES[2],spell);
 assert.ok(b.survival.hpRemainingWithoutHealing>a.survival.hpRemainingWithoutHealing);
 assert.equal(a.modelStatus,'illustrative_conditions_not_predicted_winrate');
 assert.equal(a.damage.excludes.includes('Galio passive'),true);
 assert.equal(a.damage.galioUltimateAssumedHit,true);
});
test('Trident shield reduction is tracked separately from champion HP damage',()=>{
 const antiShield=items('ludens_echo','rabadons_deathcap','infinity_orb','void_staff','oceanids_trident');
 const long=sim.evaluate(antiShield,sim.PROFILES[2],spell);
 const short=sim.evaluate(antiShield,sim.PROFILES[0],spell);
 assert.ok(long.damage.shieldReduction>0);
 assert.equal(short.damage.shieldReduction,0);
 assert.equal(long.procs.find(x=>x.id==='oceanids_trident').eligible,true);
});
test('Morello antiheal and Thornmail attacks never become fictitious healing damage',()=>{
 const m=sim.evaluate(burst,sim.PROFILES[2],spell);
 assert.equal(m.procs.find(x=>x.id==='morellonomicon_grievous').healingReductionNotDamage,true);
 const t=sim.evaluate(frontline,sim.PROFILES[0],spell);
 assert.equal(t.procs.find(x=>x.id==='thornmail').eligible,false);
});
test('invalid and duplicate five-item sets are rejected',()=>{
 assert.equal(sim.evaluate(burst.slice(0,4),sim.PROFILES[0],spell).ok,false);
 assert.equal(sim.evaluate([...burst.slice(0,4),burst[0]],sim.PROFILES[0],spell).ok,false);
});

test('Amaranth defense activates after five seconds and is applied to incoming hits',()=>{
 const short=sim.evaluate(frontline,sim.PROFILES[0],spell);
 const long=sim.evaluate(frontline,sim.PROFILES[2],spell);
 assert.equal(short.procs.find(x=>x.id==='amaranths_twinguard').eligible,false);
 assert.equal(long.procs.find(x=>x.id==='amaranths_twinguard').eligible,true);
 assert.ok(long.procs.find(x=>x.id==='amaranths_twinguard').bonusArmor>0);
});
test('Sunfire and Blackfire magic ticks need an active contact or spell',()=>{
 const core=['ludens_echo','rabadons_deathcap','infinity_orb','void_staff'];
 const sun=sim.evaluate(items(...core,'sunfire_aegis'),sim.PROFILES[2],spell);
 const fire=sim.evaluate(items(...core,'blackfire_torch'),sim.PROFILES[0],spell);
 assert.ok(sun.procs.find(x=>x.id==='sunfire_aegis').countedDamage>0);
 assert.ok(fire.procs.find(x=>x.id==='blackfire_torch').countedDamage>0);
});
test('non-simulated client passives remain explicitly reported',()=>{
 const build=items('lich_bane','rabadons_deathcap','infinity_orb','void_staff','morellonomicon');
 const result=sim.evaluate(build,sim.PROFILES[0],spell);
 assert.equal(result.procs.some(x=>x.id==='lich_bane_missing_base_ad'),true);
 assert.equal(result.procs.find(x=>x.id==='lich_bane').eligible,false);
});

test('enemy AD/AP composition changes incoming damage mix without inventing total damage',()=>{
 const ad=sim.compare({primaryItems:frontline,combatModel:spell,threats:{ad:4,ap:1,frontlineNeed:2}});
 const ap=sim.compare({primaryItems:frontline,combatModel:spell,threats:{ad:1,ap:4,frontlineNeed:2}});
 const x=ad.winner.scenarios[0],y=ap.winner.scenarios[0];
 assert.ok(x.assumptions.incomingPhysical>y.assumptions.incomingPhysical);
 assert.ok(x.assumptions.incomingMagic<y.assumptions.incomingMagic);
 assert.equal(x.assumptions.incomingPhysical+x.assumptions.incomingMagic,
  y.assumptions.incomingPhysical+y.assumptions.incomingMagic);
});

test('boots add AP before Rabadon and magic penetration, or resistances for survival',()=>{
 const boots=require('./data/stage-a-boots-details-batch1-2026-11-05.json').records;
 const mana=boots.find(x=>x.name_fr==='Bottes de mana');
 const steel=boots.find(x=>x.name_fr==='Coques en acier');
 const baseline=sim.evaluate(burst,sim.PROFILES[0],spell);
 const apBoots=sim.evaluate(burst,sim.PROFILES[0],spell,{boots:mana});
 assert.equal(apBoots.stats.ap,baseline.stats.ap+25*1.3);
 assert.equal(apBoots.damage.targetMrAfterPenetration,Math.max(0,45*.6-15-8));
 const tankBase=sim.evaluate(frontline,sim.PROFILES[1],spell);
 const tankBoots=sim.evaluate(frontline,sim.PROFILES[1],spell,{boots:steel});
 assert.ok(tankBoots.survival.hpRemainingWithoutHealing>tankBase.survival.hpRemainingWithoutHealing);
});
test('Electrocution only fires on three timely hits; Comet is a separate conditional effect',()=>{
 const runes=require('./data/rune-catalog-client-v14.json').fundamental;
 const electrocute=runes.find(x=>x.name_fr==='Électrocution');
 const comet=runes.find(x=>x.name_fr==='Comète arcanique');
 const e=sim.evaluate(burst,sim.PROFILES[0],spell,{keystone:electrocute});
 assert.equal(e.procs.find(x=>x.id==='rune_electrocute').eligible,true);
 const noHits=sim.evaluate(burst,{...sim.PROFILES[0],spellHits:2},spell,{keystone:electrocute});
 assert.equal(noHits.procs.find(x=>x.id==='rune_electrocute').eligible,false);
 const c=sim.evaluate(burst,sim.PROFILES[0],spell,{keystone:comet});
 assert.ok(c.procs.find(x=>x.id==='rune_comet').countedDamage>0);
});
test('Galio ultimate is conditional and added only when the WR source model exists',()=>{
 const model={...spell,ultimateDamageAt:({ap,rank})=>({rawDamage:(rank===2?250:150)+.7*ap})};
 const a=sim.evaluate(burst,sim.PROFILES[0],model);
 const b=sim.evaluate(burst,sim.PROFILES[2],model);
 assert.equal(a.procs.find(x=>x.id==='galio_ultimate').eligible,false);
 assert.equal(b.procs.find(x=>x.id==='galio_ultimate').eligible,true);
 assert.equal(b.damage.galioUltimateIfHit,250+.7*sim.stats(burst).ap);
});
test('A build comparison explicitly includes chosen boots and keystone',()=>{
 const boots=require('./data/stage-a-boots-details-batch1-2026-11-05.json').records[1];
 const rune=require('./data/rune-catalog-client-v14.json').fundamental.find(x=>x.name_fr==='Électrocution');
 const c=sim.compare({primaryItems:burst,combatModel:spell,boots,keystone:rune});
 assert.equal(c.bootsIncluded,true);
 assert.equal(c.keystoneIncluded,true);
 assert.equal(c.winner.scenarios.length,3);
});

test('selected minor runes are included and affect eligible conditional damage only',()=>{
 const minor=require('./data/rune-catalog-client-v14.json').minor;
 const coup=minor.find(x=>x.name_fr==='Coup de grâce');
 const abat=minor.find(x=>x.name_fr==='Abattage');
 const transcend=minor.find(x=>x.name_fr==='Transcendance');
 const a=sim.evaluate(burst,sim.PROFILES[2],spell,{minorRunes:[coup,abat,transcend]});
 assert.equal(a.procs.find(x=>x.id==='minor_rune_Coup de grâce').eligible,true);
 assert.equal(a.procs.find(x=>x.id==='minor_rune_Abattage').eligible,false);
 assert.equal(a.procs.find(x=>x.id==='minor_rune_Transcendance').unmodeled,true);
 const b=sim.evaluate(burst,sim.PROFILES[0],spell,{minorRunes:[coup,abat]});
 assert.equal(b.procs.find(x=>x.id==='minor_rune_Coup de grâce').eligible,false);
 assert.equal(b.procs.find(x=>x.id==='minor_rune_Abattage').eligible,true);
});
test('CC-dependent shield does not become guaranteed survival',()=>{
 const minor=require('./data/rune-catalog-client-v14.json').minor;
 const courage=minor.find(x=>x.name_fr==='Courage du colosse');
 const without=sim.evaluate(frontline,sim.PROFILES[1],spell,{minorRunes:[courage]});
 const withCc=sim.evaluate(frontline,{...sim.PROFILES[1],ccTriggersRune:true},spell,{minorRunes:[courage]});
 assert.equal(without.survival.conditionalRuneShieldNotCounted,0);
 assert.ok(withCc.survival.conditionalRuneShieldNotCounted>0);
 assert.equal(withCc.survival.hpRemainingWithoutHealing,without.survival.hpRemainingWithoutHealing);
});
