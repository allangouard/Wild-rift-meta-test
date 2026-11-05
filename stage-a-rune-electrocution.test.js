const {test}=require('node:test');const assert=require('node:assert/strict');
const rune=require('./data/stage-a-rune-electrocution-2026-11-05.json');
const layout=require('./data/stage-a-galio-runes-layout-2026-11-05.json');
test('Électrocution: 3 touches sur le même champion en 3 secondes',()=>{
 assert.equal(rune.name_fr,'Électrocution');
 assert.equal(rune.effect.required_hits,3);
 assert.equal(rune.effect.window_seconds,3);
 assert.equal(rune.effect.target,'same_enemy_champion');
 assert.equal(rune.effect.damage_type,'adaptive');
});
test('Électrocution: dégâts 60–210 +10% bonus AD +5% AP, cooldown 20–13',()=>{
 assert.deepEqual(rune.effect.damage_base_range,{min:60,max:210});
 assert.equal(rune.effect.bonus_ad_ratio_pct,10);
 assert.equal(rune.effect.ap_ratio_pct,5);
 assert.deepEqual(rune.effect.cooldown_seconds,{min:13,max:20});
});
test('Page Galio: rune principale nommée, autres icônes toujours non vérifiées',()=>{
 assert.equal(layout.observed.keystone_row.selected_name_fr,rune.name_fr);
 assert.equal(layout.observed.keystone_row.names_not_readable,true);
 assert.equal(rune.policy.never_use_lol_pc_values,true);
 assert.equal(rune.policy.no_automatic_rune_build_recommendations_yet,true);
});
