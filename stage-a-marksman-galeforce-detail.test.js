const {test}=require('node:test');const assert=require('node:assert/strict');
const data=require('./data/stage-a-marksman-galeforce-detail-2026-11-05.json');
const shop=require('./data/stage-a-marksman-shop-evidence-2026-11-05.json');
test('Force du vent : prix de la boutique et détails clients concordants',()=>{
 const x=data.item, listed=shop.entries.find(i=>i.name_fr===x.name_fr);
 assert.ok(listed);
 assert.equal(x.price_gold,3100);
 assert.equal(listed.price_gold,x.price_gold);
 assert.equal(listed.client_full_details_newly_verified,true);
 assert.deepEqual(x.stats,{attack_damage:60,critical_strike_chance_pct:25,movement_speed_pct:4});
});
test('Averse : dash et trois projectiles, 60 s de récupération',()=>{
 const a=data.item.active;
 assert.equal(a.name_fr,'Averse');
 assert.equal(a.projectile_count,3);
 assert.ok(a.effect.includes('dash_toward_targeted_direction'));
 assert.equal(a.displayed_damage_min,40);
 assert.equal(a.displayed_damage_max,125);
 assert.equal(a.damage_scaling_bonus_ad_pct,35);
 assert.equal(a.cooldown_seconds,60);
 assert.equal(a.targeting_priority,'champions_first');
});
test('Aucune supposition sur les dégâts par projectile ni compatibilité avec Galio',()=>{
 assert.equal(data.item.active.damage_per_projectile_or_total,'unknown_from_screenshot');
 assert.equal(data.item.active.damage_aggregation_model_verified,false);
 assert.equal(data.item.external_numeric_id_verified,false);
 assert.equal(data.policy.do_not_automatically_load_into_build_recommendations,true);
});
