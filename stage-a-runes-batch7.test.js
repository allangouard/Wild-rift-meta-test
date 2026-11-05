const {test}=require('node:test');
const assert=require('node:assert/strict');
const current=require('./data/stage-a-runes-client-batch7-2026-11-05.json');
const previous=[
require('./data/stage-a-runes-client-batch5-2026-11-05.json'),
require('./data/stage-a-runes-client-batch6-2026-11-05.json')
];
const byId=Object.fromEntries(current.entries.map(e=>[e.id,e]));
test('Quatre nouvelles runes Domination, sans doublon avec lots 5/6',()=>{
 assert.equal(current.entries.length,4);
 assert.equal(Object.keys(byId).length,4);
 const existing=new Set(previous.flatMap(x=>x.entries.map(e=>e.name_fr.toLocaleLowerCase('fr'))));
 for(const rune of current.entries){
  assert.equal(rune.tree,'Domination');
  assert.ok(!existing.has(rune.name_fr.toLocaleLowerCase('fr')));
  assert.match(rune.screenshot,/^1000010\d{3}\.jpg$/);
 }
 assert.equal(current.policy.not_enabled_for_automatic_recommendation,true);
});
test('Ruée offensive : dégâts bruts, bonus niveaux et mobilité',()=>{
 const s=byId.sudden_impact.stats;
 assert.deepEqual([s.activation_window_s,s.true_damage_min,s.true_damage_max,s.cooldown_s],[4,10,65,15]);
 assert.deepEqual([s.level_5_flat_true_damage_bonus,s.level_9_additional_flat_true_damage_bonus,s.level_9_move_speed_pct,s.level_9_move_speed_duration_s],[5,5,10,1.5]);
});
test('Arracheur d’œil : accumulation adaptative',()=>{
 assert.deepEqual(byId.eyeball_collector.stats,{adaptive_ad_per_stack:1.5,adaptive_ap_per_stack:3,max_stacks:8});
});
test('Assaut enchaîné : deux coups sur marque, ratios et délai',()=>{
 assert.deepEqual(byId.chain_assault.stats,{marked_followup_hits:2,adaptive_damage_per_hit_min:12,adaptive_damage_per_hit_max:38,bonus_ad_ratio_pct:3,ap_ratio_pct:1.5,cooldown_s:15});
});
test('Coup bas : ennemis entravés, dégâts bruts et délai',()=>{
 assert.deepEqual(byId.cheap_shot.stats,{true_damage_min:10,true_damage_max:45,cooldown_s:5});
 assert.equal(byId.cheap_shot.trigger,'damage_enemy_with_impaired_movement');
});
