const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('./data/stage-a-runes-client-batch4-2026-11-05.json');
const rune=Object.fromEntries(data.entries.map(entry=>[entry.name_fr,entry]));
test('cinq runes Volonté distinctes, issues du client',()=>{
 assert.equal(data.entries.length,5);assert.equal(Object.keys(rune).length,5);
 for(const value of data.entries){assert.equal(value.tree,'Volonté');assert.ok(value.screenshot);}
 assert.equal(data.policy.not_enabled_for_automatic_recommendation,true);
});
test('Revitalisation: seuil et bonus distincts',()=>{
 const x=rune['Revitalisation'].stats;assert.equal(x.healing_and_shielding_effect_increase_pct,5);
 assert.equal(x.additional_healing_and_shielding_effect_when_target_below_40pct_hp_pct,10);
 assert.equal(x.target_hp_threshold_pct,40);
});
test('Orbe anti-magie: seuil, valeur, durée et récupération',()=>{
 const x=rune['Orbe anti-magie'].stats;
 assert.deepEqual([x.hp_threshold_pct,x.shield_min,x.shield_max,x.shield_duration_seconds,x.cooldown_seconds],[35,60,180,4,60]);
});
test('Fontaine de vie: soins de soi et allié non confondus',()=>{
 const x=rune['Fontaine de vie'].stats;
 assert.deepEqual([x.ally_heal_ally_max_hp_pct,x.self_heal_self_max_hp_pct,x.ally_heal_caster_ap_pct,x.self_heal_caster_ap_pct,x.cooldown_seconds,x.melee_healing_effectiveness_pct],[1.5,1,5,5,20,130]);
});
test('Surcroissance et Second souffle: effets conditionnels',()=>{
 const o=rune['Surcroissance'].stats,s=rune['Second souffle'].stats;
 assert.deepEqual([o.nearby_minions_or_monsters_dying_per_stack,o.permanent_max_hp_per_stack,o.stack_threshold_for_bonus_pct,o.bonus_max_hp_pct_at_threshold],[3,3,30,3]);
 assert.deepEqual([s.passive_hp_per_interval,s.passive_interval_seconds,s.after_champion_damage_base_heal,s.after_champion_damage_missing_hp_pct,s.after_champion_damage_heal_duration_seconds,s.melee_after_damage_effect_multiplier],[5,5,3,1.5,5,2]);
});
