const assert=require('node:assert/strict');
const {test}=require('node:test');
const inv=require('./data/stage-a-cross-category-inventory-v14.json');
test('139 lignes de six catégories, dédoublonnées sans conflit',()=>{
 assert.equal(inv.counts.shop_category_rows,139);
 assert.equal(inv.items.length,102);
 assert.equal(inv.counts.unique_priced_items,101);
 assert.equal(inv.counts.unique_unknown_price_items,1);
 assert.equal(inv.counts.price_conflicts,0);
 assert.equal(inv.conflicts.length,0);
 assert.equal(new Set(inv.items.map(x=>x.name_fr)).size,102);
});
test('Runaan est seule entrée sans prix, restriction de mêlée déjà documentée ailleurs',()=>{
 assert.deepEqual(inv.items.filter(x=>x.unresolved_price).map(x=>x.name_fr),['Ouragan de Runaan']);
});
test('Les six catégories sont confirmées complètes par l’utilisateur',()=>{
 assert.deepEqual(inv.counts.confirmed_complete_categories,['Magie','Défense','Combattant','Assassin','Tireur','Support']);
 assert.deepEqual(inv.counts.categories_not_yet_confirmed_complete,[]);
 assert.equal(inv.counts.all_six_categories_user_confirmed_complete,true);
});
test('aucun prix contradictoire après dédoublonnage de la boutique',()=>{
 for(const item of inv.items){
  const prices=item.category_entries.map(x=>x.price_gold).filter(Number.isFinite);
  assert.equal(new Set(prices).size<=1,true,item.name_fr);
  if(item.price_verified_from_client)assert.equal(item.display_price_gold,prices[0]);
 }
});
