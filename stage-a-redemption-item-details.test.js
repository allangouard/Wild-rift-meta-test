const {test}=require('node:test');const assert=require('node:assert/strict');
const item=require('./data/stage-a-redemption-item-details-2026-11-05.json');
const shop=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
test('Rédemption : prix et statistiques du client',()=>{
 assert.equal(item.price_gold,2450);
 assert.equal(item.price_gold,shop.entries.find(x=>x.name_fr==='Rédemption').price_gold);
 assert.deepEqual(item.stats,{ap:40,mana_regeneration_pct:50,ability_haste:10,heal_shield_power_pct:8});
});
test('Rédemption : Intervention cible une zone après 2.5 secondes',()=>{
 const a=item.active;
 assert.equal(a.delay_seconds,2.5);
 assert.equal(a.healing.min_hp,150);
 assert.equal(a.healing.max_hp,350);
 assert.equal(a.healing.scaling_basis,'ally_level');
 assert.equal(a.healing.exact_level_formula,'not_stated');
 assert.equal(a.enemy_damage.type,'true');
 assert.equal(a.enemy_damage.value_pct_target_max_hp,10);
 assert.equal(a.enemy_damage.target,'enemy_champions');
 assert.equal(a.cooldown_seconds,60);
 assert.equal(a.can_cast_while_dead,true);
});
test('Rédemption : pas de formule extrapolée ni activation automatique',()=>{
 assert.equal(item.external_numeric_id_verified,false);
 assert.equal(item.mechanical_simulation_validated,false);
 assert.equal(item.policy.do_not_automatically_load_into_build_recommendations,true);
});
