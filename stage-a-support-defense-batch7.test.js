const {test}=require('node:test'), assert=require('node:assert/strict');
const d=require('./data/stage-a-support-defense-batch7-2026-11-05.json');
const support=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const defense=require('./data/stage-a-defense-shop-evidence-2026-11-05.json');
const items=new Map(d.items.map(x=>[x.name_fr,x]));
test('Trois prix et fiches correspondent aux relevés client',()=>{
 assert.equal(items.size,3);
 for(const [name,x] of items){
  const row=support.entries.find(y=>y.name_fr===name);
  assert.ok(row);assert.equal(row.price_gold,x.price_gold);
  assert.equal(row.client_full_details_newly_verified,true);
  assert.equal(x.external_numeric_id_verified,false);
 }
 for(const name of ['Cœur gelé','Convergence de Zeke']){
  assert.equal(defense.entries.find(x=>x.name_fr===name).price_gold,items.get(name).price_gold);
 }
 assert.equal(d.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Cœur gelé: 80 armure +400 mana, aura -25% vitesse attaque à 650 unités',()=>{
 const x=items.get('Cœur gelé');assert.deepEqual(x.stats,{armor:80,mana:400,ability_haste:20});
 assert.equal(x.passives[0].radius_units,650);
 assert.equal(x.passives[0].enemy_attack_speed_reduction_pct,25);
});
test('Diadème: 200 PV 500 mana, harmonie, 14 mana par charge et transformation musicale',()=>{
 const x=items.get('Diadème des murmures');
 assert.deepEqual(x.stats,{hp:200,mana:500,mana_regeneration_pct:50,heal_shield_power_pct:6});
 assert.equal(x.passives[0].bonus_heal_shield_power_from_max_mana.pct_per_point_of_mana,0.25);
 assert.equal(x.passives[0].mana_refund_pct_of_ability_mana_spent,25);
 assert.equal(x.passives[1].mana_per_trigger,14);
 assert.equal(x.passives[1].max_triggers_per_10_seconds,3);
 assert.equal(x.passives[1].max_bonus_mana,700);
 assert.equal(x.passives[1].transform_into_name_fr,'Diadème musical');
});
test('Zeke: PV 300 directement confirmés par le joueur',()=>{
 const x=items.get('Convergence de Zeke');
 assert.deepEqual(x.stats,{hp:300,armor:25,magic_resistance:25,ability_haste:10});
 assert.match(x.confirmation,/user/i);
});
