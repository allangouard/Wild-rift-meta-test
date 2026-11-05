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
  assert.equal(x.needs_client_details,true);
  assert.equal(x.existing_catalog_id,null);
 }
});
test('pas de preuve de passif issue des captures de prix',()=>{
 assert.equal(catalog.no_patch_deltas_applied,true);
 assert.equal(catalog.do_not_automatically_load_into_build_recommendations,true);
 assert.ok(catalog.items.every(x=>x.completeness?.interactions!=='verified'));
});
