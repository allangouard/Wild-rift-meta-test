const assert=require('node:assert/strict');
const {test}=require('node:test');
const identity=require('./data/stage-a-equipment-identity-crosswalk-v14.json');
const boots=require('./data/stage-a-boots-shop-evidence-2026-11-05.json');
const details=require('./data/stage-a-defense-active-details-2026-11-05.json');
const history=require('./data/items-7.2a-normalized.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const client=require('./assets/client-catalog-v12.js');
const records=identity.records;
test('17 candidats, dont 15 bottes et 2 objets actifs independants',()=>{
 assert.equal(records.length,17);
 assert.equal(records.filter(r=>r.kind==='boots').length,15);
 assert.equal(records.filter(r=>r.kind==='standalone_active_item').length,2);
 assert.equal(identity.counts.external_ids_verified,0);
 assert.ok(records.every(r=>r.external_item_id===null&&r.canonical_id_verified===false));
});
test('toutes les bottes sont couvertes par un candidat historique sans l adopter',()=>{
 for(const b of boots.entries){
  const x=records.find(r=>r.name_fr===b.name_fr);
  assert.ok(x,b.name_fr);
  assert.equal(x.current_price_gold,b.price_gold);
  assert.ok(x.historical_candidates.length>=1);
  assert.ok(x.historical_candidates.every(c=>history.items.some(y=>y.id===c.historical_id)));
  assert.ok(x.historical_candidates.every(c=>c.historical_only===true));
 }
});
test('les actifs restent autonomes et sans identité numérique vérifiée',()=>{
 for(const active of details.records){
  const x=records.find(r=>r.name_fr===active.name_fr);
  assert.ok(x);
  assert.equal(x.kind,'standalone_active_item');
  assert.equal(x.current_price_gold,active.price_gold);
  assert.equal(x.external_item_id,null);
 }
 assert.equal(boots.item_system_confirmed_by_client_user.boot_enchantments_exist,false);
});
test('prix du client préservé contre les données historiques divergentes',()=>{
 const l=records.find(x=>x.name_fr==='Médaillon de l’Iron Solari');
 assert.equal(l.current_price_gold,2500);
 assert.equal(l.historical_candidates[0].historical_price_gold,2600);
 assert.equal(l.historical_candidates[0].price_diff_gold,-100);
 assert.equal(identity.policy.do_not_import_historical_stats,true);
});
test('restrictions déjà vérifiées : huit familles, six équipements, un actif',()=>{
 assert.equal(rules.groups.length,8);
 assert.equal(rules.max_active_items,1);
 assert.equal(rules.all_active_items_one_slot,true);
 assert.equal(client.validateBuild(['zhonyas_hourglass','hextech_rocketbelt'],rules).valid,false);
 assert.equal(client.validateBuild(['void_staff','cryptbloom'],rules).valid,false);
 assert.equal(client.validateBuild(['hollow_radiance','sunfire_aegis'],rules).valid,false);
 assert.equal(client.validateBuild(['bloodletters_curse','terminus'],rules).valid,false);
 assert.equal(client.validateBuild(['a','b','c','d','e','f','g'],rules).valid,false);
});
test('provenance : les deux nouveaux actifs ne doivent pas être injectés comme IDs validés',()=>{
 const unresolved=details.records.map(r=>r.provisional_ref);
 assert.ok(unresolved.every(x=>!rules.known_active_item_ids.includes(x)));
 assert.equal(details.policy.do_not_automatically_load_into_build_recommendations,true);
 // La fonction accepte explicitement un identifiant supplémentaire uniquement une fois reconcilié :
 assert.equal(client.validateBuild(['zhonyas_hourglass',unresolved[0]],rules,unresolved).valid,false);
 assert.equal(client.validateBuild([unresolved[0],unresolved[1]],rules,unresolved).valid,false);
});
