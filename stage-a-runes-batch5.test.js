const {test}=require('node:test');
const assert=require('node:assert/strict');
const d=require('./data/stage-a-runes-client-batch5-2026-11-05.json');
const r=Object.fromEntries(d.entries.map(x=>[x.id,x]));
test('10 fiches distinctes et leurs captures',()=>{
 assert.equal(d.entries.length,10);assert.equal(Object.keys(r).length,10);
 for(const e of d.entries){assert.match(e.screenshot,/^100001\d{4}\.jpg$/);assert.ok(e.name_fr);assert.ok(e.stats)}
 assert.equal(r.demolish.tree,'Volonté');
 for(const e of d.entries.filter(x=>x.id!=='demolish'))assert.equal(e.tree,'Précision');
});
test('Démolition: mêlée et distance, 3e coup, 30 sec',()=>{
 assert.deepEqual(r.demolish.stats,{turret_hit_number:3,melee_base:85,melee_max_hp_pct:28,ranged_base:50,ranged_max_hp_pct:20,cooldown_s:30});
});
test('Seuils HP, dégâts et PV rendus sont distincts',()=>{
 assert.equal(r.coup_de_grace.stats.target_hp_below_pct,40);
 assert.equal(r.cut_down.stats.target_hp_above_pct,60);
 assert.equal(r.last_stand.stats.maximum_effect_self_hp_below_pct,30);
 assert.equal(r.triumph.stats.missing_hp_restored_pct,10);
 assert.equal(r.brutal.stats.bonus_ad_ratio_pct,6);
});
test('Stack et condition de combat vérifiés sans inventer progression',()=>{
 assert.equal(r.legend_bloodline.stats.bonus_omnivamp_cap_pct,7);
 assert.equal(r.legend_haste.stats.max_bonus_ability_haste,15);
 assert.equal(r.legend_alacrity.stats.stacked_attack_speed_bonus_cap_pct,18);
 assert.equal(r.combat_zeal.stats.max_stacks,3);
 assert.equal(d.policy.stack_increments_not_inferred,true);
});
