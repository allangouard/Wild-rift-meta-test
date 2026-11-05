const assert=require('node:assert/strict');
const {test}=require('node:test');
const support=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
const items=require('./data/items-client-7.3d-v12.json');
const magic=require('./data/stage-a-magic-shop-evidence-2026-11-05.json');
const defense=require('./data/stage-a-defense-shop-evidence-2026-11-05.json');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,"'").toLowerCase();
test('Support : 20 noms uniques et 20 prix confirmés par deux captures',()=>{
 assert.equal(support.entries.length,20);
 assert.equal(support.counts.visible_prices,20);
 assert.equal(new Set(support.entries.map(x=>normalize(x.name_fr))).size,20);
 assert.deepEqual(support.screenshots,['1000010671.jpg','1000010674.jpg']);
});
test('13 entrées de Support correspondent à une fiche existante sans prix contradictoire',()=>{
 const known=new Map(items.items.map(x=>[x.id,x]));
 const hits=support.entries.filter(x=>x.existing_catalog_id);
 assert.equal(hits.length,13);
 for(const x of hits)assert.equal(known.get(x.existing_catalog_id)?.price_gold,x.price_gold,x.name_fr);
});
test('Aucun doublon ni écart de prix entre catégories Support Magie Défense',()=>{
 const previous=[magic,defense];
 let overlaps=0;
 for(const x of support.entries){
  for(const cat of previous){
   const found=cat.entries.find(y=>normalize(y.name_fr)===normalize(x.name_fr));
   if(!found)continue;
   assert.equal(found.price_gold,x.price_gold,x.name_fr);
   overlaps++;
  }
 }
 assert.ok(overlaps>=14);
 assert.equal(support.counts.overlap_previous_shop_categories,14);
});
test('Sept noms nouveaux gardent leurs identifiants provisoires',()=>{
 const fresh=support.entries.filter(x=>!x.existing_catalog_id);
 assert.equal(fresh.length,7);
 assert.ok(fresh.every(x=>!x.external_numeric_id_verified&&x.provisional_identity_candidate));
 assert.ok(fresh.some(x=>x.name_fr==="Écho harmonieux"));
 assert.ok(!fresh.some(x=>x.provisional_identity_candidate==='harmonic_circlet'));
});
test('Médaillon Support : déjà documenté, mais reste un actif autonome non certifié numériquement',()=>{
 const x=support.entries.find(x=>x.name_fr==="Médaillon de l'Iron Solari");
 assert.ok(x);
 assert.equal(x.price_gold,2500);
 assert.equal(x.external_numeric_id_verified,false);
 assert.equal(support.policy.do_not_automatically_load_into_build_recommendations,true);
});
test('La couverture complète Support est explicitement confirmée',()=>{
 assert.equal(support.counts.visible_entries,20);
 assert.equal(support.coverage,'complete_20_items_confirmed_by_user_for_current_client');
 assert.equal(support.category_complete_confirmed_by_user,true);
 assert.deepEqual(support.entries.filter(x=>x.client_full_details_newly_verified).map(x=>x.name_fr).sort(),['Bénédiction de Mikael','Chant de guerre de Shurelya'].sort());
});
