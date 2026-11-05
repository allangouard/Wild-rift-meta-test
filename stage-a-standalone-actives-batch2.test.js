const {test}=require('node:test');const assert=require('node:assert/strict');
const data=require('./data/stage-a-standalone-actives-batch2-2026-11-05.json');
const shopSupport=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const shopFighter=require('./data/stage-a-fighter-shop-evidence-2026-11-05.json');
const shopAssassin=require('./data/stage-a-assassin-shop-evidence-2026-11-05.json');
const shopMarksman=require('./data/stage-a-marksman-shop-evidence-2026-11-05.json');
const byName=new Map(data.records.map(x=>[x.name_fr,x]));
test('trois objets actifs documentés et prix identiques aux listes',()=>{
 assert.equal(byName.size,3);
 for(const [name,cat] of [['Chant de guerre de Shurelya',shopSupport],['Bénédiction de Mikael',shopSupport],['Cimeterre mercuriel',shopFighter],['Cimeterre mercuriel',shopAssassin],['Cimeterre mercuriel',shopMarksman]]){
  assert.equal(byName.get(name).price_gold,cat.entries.find(x=>x.name_fr===name).price_gold);
  assert.equal(cat.entries.find(x=>x.name_fr===name).client_full_details_newly_verified,true);
 }
 assert.equal(data.policy.external_numeric_ids_verified,false);
 assert.equal(data.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Shurelya : 55 AP, bonus 30% vitesse 4s, 60s récupération',()=>{
 const x=byName.get('Chant de guerre de Shurelya');
 assert.deepEqual(x.stats,{ap:55,mana_regen_pct:50,ability_haste:20,movement_speed_pct:4});
 assert.equal(x.active.movement_speed_bonus_pct,30);
 assert.equal(x.active.duration_seconds,4);
 assert.equal(x.active.cooldown_seconds,60);
 assert.equal(x.active.self_inclusion,'not_explicitly_stated_in_client_text');
});
test('Mikael : exception projection et neutralisation et soin 150-250',()=>{
 const x=byName.get('Bénédiction de Mikael');
 assert.deepEqual(x.stats,{hp:300,mana_regen_pct:50,ability_haste:15,heal_shield_power_pct:9});
 assert.deepEqual(x.active.exclusions,['airborne_knockup','suppression_neutralisation']);
 assert.equal(x.active.grants_crowd_control_immunity_seconds,0.2);
 assert.deepEqual([x.active.healing_hp_min,x.active.healing_hp_max],[150,250]);
 assert.equal(x.active.cooldown_seconds,75);
});
test('Cimeterre mercuriel : impossible pendant projection ou repoussement',()=>{
 const x=byName.get('Cimeterre mercuriel');
 assert.deepEqual(x.stats,{attack_damage:45,magic_resistance:40,lifesteal_pct:12});
 assert.deepEqual(x.active.activation_restrictions,['cannot_activate_while_airborne_knockup','cannot_activate_while_knocked_back']);
 assert.equal(x.active.grants_crowd_control_immunity_seconds,0.25);
 assert.equal(x.active.cooldown_seconds,60);
 const p=x.passives_visible[0];
 assert.equal(p.tenacity_pct,30);
 assert.equal(p.slow_resistance_pct,30);
 assert.equal(p.duration_seconds,1.5);
});
