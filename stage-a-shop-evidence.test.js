const assert=require('node:assert/strict');
const {test}=require('node:test');
const catalog=require('./data/items-client-7.3d-v12.json');
const magic=require('./data/stage-a-magic-shop-evidence-2026-11-05.json');
const defense=require('./data/stage-a-defense-shop-evidence-2026-11-05.json');
const byId=new Map(catalog.items.map(x=>[x.id,x]));
test('catalogue conserve 59 fiches et aucune duplication',()=>{
 assert.equal(catalog.items.length,59);
 assert.equal(byId.size,catalog.items.length);
});
test('prix catalogues 56 presents, trois transformations manquantes',()=>{
 const missing=catalog.items.filter(x=>!Number.isFinite(x.price_gold)).map(x=>x.id).sort();
 assert.deepEqual(missing,['fimbulwinter','harmonic_circlet','seraphs_embrace']);
});
for(const e of [magic,defense]){
 test(e.category+' : prix et identites correspondants aux captures',()=>{
  assert.equal(e.entries.length,e.entry_count);
  for(const entry of e.entries){
   if(!entry.existing_catalog_id)continue;
   const item=byId.get(entry.existing_catalog_id);
   assert.ok(item,entry.existing_catalog_id);
   assert.equal(item.name_fr,entry.name_fr,entry.id);
   assert.equal(item.price_gold,entry.price_gold,entry.id);
   assert.ok(e.images.includes(entry.screenshot),entry.id);
  }
 });
}
test('30 lignes defense dont deux non associees, aucune fiche inventee',()=>{
 assert.equal(defense.entries.length,30);
 const unresolved=defense.entries.filter(x=>!x.existing_catalog_id);
 assert.equal(unresolved.length,2);
 assert.deepEqual(unresolved.map(x=>x.name_fr).sort(),
  ['Lithoplastron de gargouille','Médaillon de l’Iron Solari'].sort());
 for(const x of unresolved){
  assert.equal(x.needs_client_details,false);
  assert.equal(x.details_verified,true);
  assert.equal(x.needs_canonical_id_reconciliation,true);
  assert.equal(x.existing_catalog_id,null);
 }
});
test('pas de preuve de passif issue des captures de prix',()=>{
 assert.equal(catalog.no_patch_deltas_applied,true);
 assert.equal(catalog.do_not_automatically_load_into_build_recommendations,true);
 assert.ok(catalog.items.every(x=>x.completeness?.interactions!=='verified'));
});

const detail=require('./data/stage-a-defense-active-details-2026-11-05.json');
test('deux objets actifs de defense documentes sans inventer identifiants',()=>{
 assert.equal(detail.records.length,2);
 assert.equal(detail.policy.do_not_automatically_load_into_build_recommendations,true);
 const byRef=new Map(detail.records.map(x=>[x.provisional_ref,x]));
 assert.equal(byRef.get('medallion_of_the_iron_solari_UNRESOLVED').price_gold,2500);
 assert.deepEqual(byRef.get('medallion_of_the_iron_solari_UNRESOLVED').stats,{hp:300,armor:30,mr:30,ah:10});
 const med=byRef.get('medallion_of_the_iron_solari_UNRESOLVED').active;
 assert.equal(med.shield_min,250);
 assert.equal(med.shield_max,370);
 assert.equal(med.duration_seconds,2.5);
 assert.equal(med.cooldown_seconds,60);
 assert.equal(med.repeat_application.window_seconds,20);
 assert.equal(med.repeat_application.subsequent_shield_multiplier,0.5);
 const garg=byRef.get('gargoyle_stoneplate_UNRESOLVED');
 assert.equal(garg.price_gold,2900);
 assert.deepEqual(garg.stats,{hp:200,armor:45,mr:45,ah:10});
 assert.equal(garg.active.shield_formula,'100 + 0.90 * bonus_hp');
 assert.equal(garg.active.shield_duration_seconds,2.5);
 assert.equal(garg.active.cooldown_seconds,60);
 assert.ok(detail.records.every(x=>x.evidence_status.external_item_id==='unknown'));
});
