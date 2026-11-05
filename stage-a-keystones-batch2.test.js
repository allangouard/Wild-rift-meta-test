const {test}=require('node:test');const assert=require('node:assert/strict');
const d=require('./data/stage-a-keystones-batch2-2026-11-05.json');
const electrocution=require('./data/stage-a-rune-electrocution-2026-11-05.json');
const m=new Map(d.items.map(x=>[x.name_fr,x]));
test('13 rune fondamentales distinctes documentées entre les deux fichiers',()=>{
 assert.equal(m.size,12);assert.equal(new Set([...m.keys(),electrocution.name_fr]).size,13);
 assert.equal(d.items.every(x=>x.source_image && x.effect && x.trigger),true);
 assert.equal(d.policy.do_not_load_into_automated_recommendations,true);
});
test('Souverain des glaces: 650? aucune portée induite par confusion avec objets',()=>{
 const a=m.get('Souverain des glaces').effect;
 assert.equal(a.ice_rays,3);assert.equal(a.ice_zone_seconds,3);assert.equal(a.slow_linger_after_exit_seconds,1.5);
 assert.equal(a.cooldown_seconds,20);assert.equal(a.defenses_duration_seconds,2.5);
 assert.equal(Object.hasOwn(a,'radius_units'),false);
});
test('Premier coup et Rush phasique utilisent des fenêtres de déclenchement distinctes',()=>{
 assert.equal(m.get('Premier coup').effect.activation_window_seconds,0.25);
 assert.equal(m.get('Premier coup').effect.bonus_true_damage_pct,7);
 assert.equal(m.get('Premier coup').effect.extra_gold_ratio_of_extra_damage_melee_pct,60);
 assert.equal(m.get('Rush phasique').effect.hit_window_seconds,4);
 assert.equal(m.get('Rush phasique').effect.remaining_basic_ability_cooldown_reduction_pct,20);
});
test('Melee and ranged keystone differences',()=>{
 assert.equal(m.get("Poigne de l'immortel").effect.ranged_effect_reduction_pct,60);
 assert.equal(m.get('Conquérant').effect.omnivamp_at_max_stacks_melee_pct,9);
 assert.equal(m.get('Conquérant').effect.omnivamp_at_max_stacks_ranged_pct,5);
 assert.equal(m.get('Tempo mortel').effect.attack_speed_per_stack_melee_pct,6);
 assert.equal(m.get('Tempo mortel').effect.attack_speed_per_stack_ranged_pct,4.8);
});
test('Moisson noire et Renforcement: scalings et conditions',()=>{
 const h=m.get('Moisson noire').effect;assert.equal(h.target_hp_below_pct,50);
 assert.equal(h.damage_per_soul,11);assert.equal(h.cooldown_after_champion_takedown_seconds,1);
 const e=m.get('Renforcement').effect;assert.equal(e.required_consecutive_attacks,3);
 assert.equal(e.damage_amplification_vs_champions_pct,8);
});
