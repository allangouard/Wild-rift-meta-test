const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('./data/stage-a-fighter-active-details-batch3-2026-11-05.json');
const fighter=require('./data/stage-a-fighter-shop-evidence-2026-11-05.json');
const items=new Map(data.records.map(x=>[x.name_fr,x]));
test('Deux fiches Combattant entièrement visibles avec prix conservés',()=>{
 assert.equal(items.size,2);
 for(const [name,x] of items){
  const listed=fighter.entries.find(r=>r.name_fr===name);
  assert.ok(listed);
  assert.equal(listed.price_gold,x.price_gold);
  assert.equal(listed.details_verified,true);
  assert.equal(x.external_numeric_id_verified,false);
 }
 assert.equal(data.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Estropieur : HP AD AS, 100% AD, slow 40% pendant 3 sec et 25 sec CD',()=>{
 const x=items.get('Estropieur');
 assert.deepEqual(x.stats,{hp:400,attack_damage:40,attack_speed_pct:25});
 assert.equal(x.active.damage_physical_total_ad_pct,100);
 assert.equal(x.active.slow_pct,40);
 assert.equal(x.active.slow_duration_seconds,3);
 assert.equal(x.active.cooldown_seconds,25);
 assert.deepEqual(x.passives,[{name_fr:'Foulée',trigger:'deal_physical_damage',movement_speed_flat:20,duration_seconds:2}]);
});
test('Éviscérateur : 175% AD de base, soin par ennemi et 12 sec CD',()=>{
 const x=items.get('Éviscérateur');
 assert.deepEqual(x.stats,{hp:350,attack_damage:40,ability_haste:15});
 assert.equal(x.passives[0].omnivamp_pct,8);
 assert.equal(x.active.damage_physical_base_ad_pct,175);
 assert.equal(x.active.healing_per_enemy_hit.base_attack_damage_pct,20);
 assert.equal(x.active.healing_per_enemy_hit.missing_hp_pct,10);
 assert.equal(x.active.cooldown_seconds,12);
});
