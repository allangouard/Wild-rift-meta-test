const {test}=require('node:test');
const assert=require('node:assert/strict');
const evidence=require('./data/stage-a-support-defense-batch6-2026-11-05.json');
const shop=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const original=require('./data/items-client-7.3d-v12.json');
const byName=new Map(evidence.items.map(x=>[x.name_fr,x]));
test('Trois objets identifiés aux prix catalogue sans certifier les simulations',()=>{
 assert.equal(byName.size,3);
 for(const [name,item] of byName){
  assert.equal(item.price_gold,shop.entries.find(x=>x.name_fr===name).price_gold);
  assert.equal(shop.entries.find(x=>x.name_fr===name).client_full_details_newly_verified,true);
 }
 assert.equal(evidence.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Linceul: conditions de proximité, dégâts et résistances, 3 s cooldown',()=>{
 const x=byName.get("Linceul de l'aube");
 assert.deepEqual(x.stats,{hp:250,armor:50,magic_resistance:30});
 const p=x.passives[0];
 assert.equal(p.requires_enemy_champion_within_units,400);
 assert.equal(p.reveal_nearby_enemy_champions_seconds,3);
 assert.equal(p.damage_base,40);
 assert.equal(p.damage_scaling_bonus_hp_pct,2.5);
 assert.equal(p.bonus_armor_pct,20);
 assert.equal(p.bonus_magic_resistance_pct,20);
 assert.equal(p.bonus_resistances_duration_seconds,'not_stated');
 assert.equal(p.cooldown_seconds,3);
});
test('Manteau: seuil 30%, 600 PV, soins non interpolés, 70 s cooldown',()=>{
 const x=byName.get("Manteau de l'heure ultime");
 assert.deepEqual(x.stats,{hp:600,ability_haste:20});
 const p=x.passives[0];
 assert.equal(p.threshold_health_pct,30);
 assert.deepEqual([p.bonus_max_hp.min,p.bonus_max_hp.max],[200,300]);
 assert.equal(p.movement_speed_pct,10);
 assert.equal(p.tenacity_pct,20);
 assert.equal(p.size_increase_pct,10);
 assert.equal(p.buff_duration_seconds,5);
 assert.equal(p.healing_during_buff.bonus_armor_multiplier_pct,120);
 assert.equal(p.healing_during_buff.bonus_magic_resistance_multiplier_pct,120);
 assert.equal(p.healing_during_buff.max_hp_multiplier_pct,15);
 assert.equal(p.cooldown_seconds,70);
});
test('Zeke: 300 PV confirmés directement par le joueur depuis le client',()=>{
 const x=byName.get('Convergence de Zeke');
 assert.equal(x.stats.hp,300);
 assert.equal(x.complete_visible_description,true);
 assert.deepEqual(x.stats,{hp:300,armor:25,magic_resistance:25,ability_haste:10});
 const old=original.items.find(z=>z.name_fr===x.name_fr);
 assert.equal(old.stats.hp,300);
 assert.equal(x.passives[0].ultimate_haste,10);
 assert.equal(x.passives[1].storm_damage_magic_per_second,150);
 assert.equal(x.passives[1].storm_effect_radius_units,350);
 assert.equal(x.passives[1].storm_slow_pct,30);
 assert.equal(x.passives[1].storm_duration_seconds,5);
 assert.equal(x.passives[1].cooldown_seconds,30);
});
