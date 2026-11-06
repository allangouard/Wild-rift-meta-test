'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const kits=require('./wrdi-numeric-kits-v162.js');
const raw=require('./data/champion-ability-numeric-wiki-wr-v1.json');
const patch=require('./data/wr-champion-numeric-patch-overrides-v1.json');
const client=require('./data/wr-client-verified-samira-leesin-7.3d.json');
const solved=kits.prepare(raw,patch,client);
test('player screenshots resolve three numeric disputes without silently rewriting Wiki archive',()=>{
 assert.equal(solved.ok,true);
 assert.equal(solved.clientVerificationsCount,3);
 assert.equal(solved.patchConflicts,0);
 assert.equal(solved.patchOutcomes.filter(x=>x.status==='resolved_by_client').length,3);
 assert.equal(raw.entries.find(x=>x.name==='Lee Sin').skills.r.formulas.find(x=>x.label==='Physical Damage').formula.includes('100 / 250 / 400'),true);
});
test('Samira Q client rank one only, no invented rank 2-4 AD coefficients',()=>{
 const s=solved.find('Samira').skills.q;
 assert.deepEqual(s.clientVerified.base_damage_by_rank,[15,20,25,30]);
 assert.deepEqual(s.clientVerified.cooldown_s_by_rank,[6.5,5,3.5,2]);
 assert.equal(s.clientVerified.rank1_total_ad_ratio_pct,115);
 assert.match(s.clientVerified.notVerified.join(' '),/ranks 2,3,4/);
 assert.deepEqual(kits.damageForSkill(s,{ad:100})[0].rankValues,[130,null,null,null]);
});
test('Samira R ten bullets and 45 percent rank-one AD from client',()=>{
 const s=solved.find('Samira').skills.r;
 assert.deepEqual(s.clientVerified.base_damage_by_rank,[20,40,60]);
 assert.equal(s.clientVerified.rank1_total_ad_ratio_pct,45);
 assert.equal(s.clientVerified.bullets_per_cast,10);
 assert.equal(s.clientVerified.duration_s,2.23);
 assert.equal(s.clientVerified.minion_damage_multiplier_pct,25);
 assert.equal(s.clientVerified.requires_style_rank,'S');
 assert.deepEqual(kits.damageForSkill(s,{ad:100})[0].rankValues,[65,null,null]);
});
test('Lee Sin R client bonus HP and 190% bonus AD do not mislabel target HP',()=>{
 const s=solved.find('Lee Sin').skills.r;
 assert.deepEqual(s.clientVerified.base_damage_by_rank,[150,375,600]);
 assert.equal(s.clientVerified.bonus_ad_ratio_pct,190);
 assert.deepEqual(s.clientVerified.bonus_health_percent_by_rank,[12,15,18]);
 assert.equal(s.clientVerified.bonus_health_owner,'not explicit in screenshot');
 assert.equal(s.clientVerified.rank1_collateral_displayed_damage,150);
 assert.equal(s.clientVerified.rank1_collateral_tooltip_formula_base,125);
 assert.equal(kits.damageForSkill(s,{bonusAd:100}).length,0);
});
