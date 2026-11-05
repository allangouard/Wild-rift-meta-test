const assert=require('node:assert/strict');const {test}=require('node:test');
const source=require('./data/stage-a-support-passives-batch5-2026-11-05.json');
const support=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const defense=require('./data/stage-a-defense-shop-evidence-2026-11-05.json');
const map=new Map(source.items.map(x=>[x.name_fr,x]));
test('Trois objets distincts gardent les prix boutique et fiches détaillées',()=>{
 assert.equal(map.size,3);
 for(const [name,item] of map){
  const row=support.entries.find(x=>x.name_fr===name);
  assert.ok(row);
  assert.equal(row.price_gold,item.price_gold);
  assert.equal(row.client_full_details_newly_verified,true);
  assert.equal(item.external_numeric_id_verified,false);
 }
 for(const name of ['Piège à yordles','Vœu du chevalier'])assert.equal(defense.entries.find(x=>x.name_fr===name).price_gold,map.get(name).price_gold);
 assert.equal(source.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Bâton des flots : 50 AP, 10 AH de base, 15 AH et 40 AP aux deux pendant 6 secondes',()=>{
 const x=map.get('Bâton des flots');
 assert.deepEqual(x.stats,{ability_power:50,mana_regeneration_pct:50,ability_haste:10,heal_shield_power_pct:8});
 const p=x.passives[0];
 assert.equal(p.granted_ability_haste,15);
 assert.equal(p.granted_ability_power,40);
 assert.deepEqual(p.beneficiaries,['caster','target_allied_champion']);
 assert.equal(p.duration_seconds,6);
});
test('Piège à yordles : CC + vitesse distincte mêlée/distance, fin tronquée',()=>{
 const x=map.get('Piège à yordles');
 assert.deepEqual(x.stats,{hp:200,armor:20,magic_resistance:20,ability_haste:15});
 const p=x.passives[0];
 assert.equal(p.empower_duration_melee_seconds,8);
 assert.equal(p.empower_duration_ranged_seconds,4);
 assert.equal(p.bonus_movement_speed_flat,20);
 assert.equal(p.empowered_effect.attack_speed_bonus_melee_pct,30);
 assert.equal(p.empowered_effect.attack_speed_bonus_ranged_pct,20);
 assert.equal(p.visible_additional_gold.bonus_gold,20);
 assert.equal(p.visible_additional_gold.condition_or_additional_text_truncated,true);
 assert.equal(x.full_description_visible,false);
});
test('Vœu du chevalier : 12% redirection et 10% soin, désignation à achat ou rachat',()=>{
 const x=map.get('Vœu du chevalier');
 assert.deepEqual(x.stats,{hp:200,hp_regeneration_pct:100,armor:40,ability_haste:10});
 assert.equal(x.passives[0].damage_redirect_pct,12);
 assert.equal(x.passives[0].healing_pct_of_designated_ally_damage_to_champions,10);
 assert.equal(x.passives[1].trigger,'on_item_purchase_or_repurchase');
});
