const {test}=require('node:test');const assert=require('node:assert/strict');
const st=require('./data/stage-a-reconciliation-status-2026-11-05.json');
const shop=require('./data/stage-a-cross-category-inventory-v14.json');
const catalog=require('./data/items-client-7.3d-v12.json');
const boots=require('./data/stage-a-boots-shop-evidence-2026-11-05.json');
const support=require('./data/stage-a-support-shop-evidence-2026-11-05.json');
test('Inventaire des six categories et prix sans confusion avec les bottes',()=>{
 assert.equal(st.catalog_inventory.shop_category_rows,shop.counts.shop_category_rows);
 assert.equal(st.catalog_inventory.distinct_non_boot_items,shop.counts.unique_item_names);
 assert.equal(st.catalog_inventory.non_boot_known_prices,shop.counts.unique_priced_items);
 assert.deepEqual(st.catalog_inventory.non_boot_missing_price_names,shop.items.filter(x=>x.unresolved_price).map(x=>x.name_fr));
 assert.equal(st.catalog_inventory.separate_boot_names,boots.entries.length);
 assert.equal(shop.counts.all_six_categories_user_confirmed_complete,true);
});
test('Quatre fiches support existaient deja dans le catalogue client',()=>{
 for(const name of st.prior_support_gap_correction.names){
  const x=catalog.items.find(y=>y.name_fr===name);
  assert.ok(x,name+' absent');
  assert.ok(x.stats,name+' stats missing');
  assert.ok(Array.isArray(x.passives)&&x.passives.length>0,name+' passive missing');
  assert.ok(support.entries.some(y=>y.name_fr===name),name+' support category absent');
 }
});
test('Ne pas confondre completude des inventaires et validite de recommendation',()=>{
 assert.equal(st.safety.do_not_autorecommend_from_incomplete_data,true);
 assert.equal(st.safety.never_confuse_boots_and_standalone_active_items,true);
 assert.ok(st.remaining_work_priorities.some(x=>x.id==='runes'&&x.state==='not_confirmed_complete'));
 assert.ok(st.remaining_work_priorities.some(x=>x.id==='canonical_identity'));
});
