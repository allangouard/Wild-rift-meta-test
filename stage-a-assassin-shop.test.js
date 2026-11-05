const {test}=require('node:test');
const assert=require('node:assert/strict');
const evidence=require('./data/stage-a-assassin-shop-evidence-2026-11-05.json');
const fighter=require('./data/stage-a-fighter-shop-evidence-2026-11-05.json');
const curated=require('./data/items-client-7.3d-v12.json');
test('Assassin : dix noms et prix, completude confirmee par utilisateur',()=>{
 assert.equal(evidence.entries.length,10);
 assert.equal(evidence.visible_prices,10);
 assert.equal(new Set(evidence.entries.map(x=>x.name_fr)).size,10);
 assert.equal(evidence.coverage,'complete_category_confirmed_by_user_for_current_client');
 assert.equal(evidence.category_complete_confirmed_by_user,true);
 assert.ok(evidence.entries.every(x=>!x.external_numeric_id_verified&&!x.details_verified));
});
test('Un seul objet est deja detaille dans la base partielle de 59',()=>{
 assert.equal(evidence.entries.filter(x=>x.existing_catalog_id).length,1);
 const x=evidence.entries.find(x=>x.existing_catalog_id);
 assert.equal(x.existing_catalog_id,'guardian_angel');
 const y=curated.items.find(z=>z.id===x.existing_catalog_id);
 assert.equal(y.price_gold,x.price_gold);
});
test('Les prix communs aux categories Assassin et Combattant correspondent',()=>{
 const lookup=new Map(fighter.entries.map(x=>[x.name_fr,x.price_gold]));
 const overlap=evidence.entries.filter(x=>lookup.has(x.name_fr));
 assert.ok(overlap.length>=4);
 for(const x of overlap) assert.equal(x.price_gold,lookup.get(x.name_fr),x.name_fr);
});
test('Aucune invention de fiche complete dans les donnees Assassin',()=>{
 assert.ok(evidence.entries.every(x=>x.candidate_id&&x.screenshot==='1000010659.jpg'));
 assert.ok(evidence.entries.every(x=>!('stats' in x)&&!('passives' in x)));
});
