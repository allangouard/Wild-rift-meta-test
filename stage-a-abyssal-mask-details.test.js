const {test}=require('node:test'); const assert=require('node:assert/strict');
const item=require('./data/stage-a-abyssal-mask-details-2026-11-05.json');
const support=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const defense=require('./data/stage-a-defense-shop-evidence-2026-11-05.json');
test('Masque abyssal : valeurs de la boutique et fiche client',()=>{
 assert.equal(item.name_fr,'Masque abyssal');
 assert.equal(item.price_gold,2400);
 assert.equal(item.price_gold,support.entries.find(x=>x.name_fr===item.name_fr).price_gold);
 assert.equal(item.price_gold,defense.entries.find(x=>x.name_fr===item.name_fr).price_gold);
 assert.deepEqual(item.stats,{hp:350,magic_resistance:45,ability_haste:10});
});
test('Anéantissement : 650 unités, +12% dégâts magiques, non cumulable',()=>{
 const p=item.passives[0];
 assert.equal(p.name_fr,'Anéantissement');
 assert.equal(p.damage_type,'magic');
 assert.equal(p.affected_targets,'enemy_champions');
 assert.equal(p.range_units,650);
 assert.equal(p.damage_increase_pct,12);
 assert.equal(p.stacking,'same_effect_does_not_stack');
});
test('Pas de simulation certifiée ni extrapolation de synergie alliée',()=>{
 assert.equal(item.external_numeric_id_verified,false);
 assert.equal(item.mechanics_experimentally_calibrated,false);
 assert.equal(item.policy.do_not_automatically_load_into_build_recommendations,true);
 assert.ok(item.open_questions.some(x=>x.includes('allied magic damage')));
});
