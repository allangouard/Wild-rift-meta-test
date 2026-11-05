const {test}=require('node:test');const assert=require('node:assert/strict');
const data=require('./data/stage-a-support-passives-batch4-2026-11-05.json');
const support=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const items=new Map(data.items.map(x=>[x.name_fr,x]));
test('Trois fiches Support et prix correspondent aux captures de boutique',()=>{
 assert.equal(items.size,3);
 for(const [name,item] of items){
  const entry=support.entries.find(x=>x.name_fr===name);
  assert.ok(entry);
  assert.equal(entry.price_gold,item.price_gold);
  assert.equal(entry.client_full_details_newly_verified,true);
  assert.equal(item.external_numeric_id_verified,false);
 }
 assert.equal(data.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Encensoir : 30% vitesse d attaque et 25 dégâts magiques pendant 6 s aux deux alliés',()=>{
 const x=items.get('Encensoir ardent');
 assert.deepEqual(x.stats,{ability_power:50,mana_regeneration_pct:50,heal_shield_power_pct:8,movement_speed_pct:4});
 const p=x.passives[0];
 assert.equal(p.self_only_trigger_allowed,false);
 assert.deepEqual(p.beneficiaries,['caster','healed_or_shielded_allied_champion']);
 assert.equal(p.duration_seconds,6);
 assert.equal(p.attack_speed_pct,30);
 assert.equal(p.bonus_magic_damage_on_each_attack_flat,25);
});
test('Helia : 30% dégâts pré-mitigation, plafond 80–250, fragments consommés en soin',()=>{
 const x=items.get("Échos d'Helia");
 assert.deepEqual(x.stats,{hp:200,ability_power:40,mana_regeneration_pct:50,ability_haste:20});
 const p=x.passives[0];assert.equal(p.soul_fragments.capture_pct,30);
 assert.equal(p.soul_fragments.cap_min,80);
 assert.equal(p.soul_fragments.cap_max,250);
 assert.equal(p.consumption.consume,'all_stored_fragments');
 assert.equal(p.consumption.healing_amount_equals_stored_fragments,true);
});
test('Écho harmonieux : copie 30% du soin, 35% du bouclier dans 800 unités avec repli sur cible initiale',()=>{
 const x=items.get('Écho harmonieux');
 assert.deepEqual(x.stats,{hp:200,ability_power:40,mana_regeneration_pct:50,ability_haste:20});
 const p=x.passives[0];assert.equal(p.extra_target.range_units,800);
 assert.equal(p.heal_replication_pct,30);assert.equal(p.shield_replication_pct,35);
 assert.equal(p.no_eligible_other_allied_champion_fallback,'initial_target_receives_additional_healing_or_shield');
 assert.equal(p.extra_target.selection_algorithm,'ambiguous_nearest_vs_lowest_hp_interaction_not_calibrated');
});
