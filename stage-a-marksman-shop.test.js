const {test}=require('node:test');
const assert=require('node:assert/strict');
const marksman=require('./data/stage-a-marksman-shop-evidence-2026-11-05.json');
const curated=require('./data/items-client-7.3d-v12.json');
const categories=['fighter','assassin','magic'].map(x=>require('./data/stage-a-'+x+'-shop-evidence-2026-11-05.json'));
const records=marksman.entries;
test('Tireur : 28 noms, 27 prix, une indisponibilité non interprétée',()=>{
 assert.equal(records.length,28);
 assert.equal(new Set(records.map(r=>r.name_fr)).size,28);
 assert.equal(records.filter(r=>Number.isFinite(r.price_gold)).length,27);
 assert.equal(marksman.coverage,'complete_28_items_confirmed_by_user_for_current_client');
 assert.equal(marksman.category_complete_confirmed_by_user,true);
});
test('Ouragan de Runaan : ne pas inventer un prix masqué par le cadenas',()=>{
 const x=records.find(r=>r.name_fr==='Ouragan de Runaan');
 assert.equal(x.price_gold,null);
 assert.equal(x.price_visibility,'covered_by_lock_icon');
 assert.ok(x.shop_restriction_markers.includes('ranged_champions_only_confirmed_by_user'));
 assert.equal(x.restriction.eligible_attack_range_class,'ranged');
 assert.equal(x.restriction.ineligible_attack_range_class,'melee');
 assert.equal(x.restriction.example_ineligible_champion,'Galio');
});
test('Les prix du catalogue déjà documenté sont cohérents',()=>{
 const map=new Map(curated.items.map(i=>[i.id,i]));
 const known=records.filter(r=>r.existing_catalog_id);
 assert.equal(known.length,4);
 for(const record of known){
   const source=map.get(record.existing_catalog_id);
   assert.ok(source);
   assert.equal(source.price_gold,record.price_gold,record.name_fr);
 }
});
test('Les prix des objets communs ne changent pas entre catégories',()=>{
 let n=0;
 for(const record of records){
  for(const c of categories){
   const x=c.entries.find(i=>i.name_fr===record.name_fr);
   if(!x)continue;
   assert.equal(record.price_gold,x.price_gold,record.name_fr);
   n++;
  }
 }
 assert.ok(n>=11);
 assert.equal(records.filter(r=>r.also_visible_in_categories.length>0).length,11);
});
test('Les nouvelles entrées ne sont pas automatiquement certifiées',()=>{
 assert.equal(records.filter(r=>!r.existing_catalog_id).length,24);
 assert.ok(records.every(r=>r.external_numeric_id_verified===false));
 assert.equal(marksman.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('Le prix inhabituel de Force de la trinité est préservé',()=>{
 assert.equal(records.find(r=>r.name_fr==='Force de la trinité').price_gold,3333);
});
