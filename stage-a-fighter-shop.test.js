const {test}=require('node:test');
const assert=require('node:assert/strict');
const evidence=require('./data/stage-a-fighter-shop-evidence-2026-11-05.json');
const catalog=require('./data/items-client-7.3d-v12.json');
const mapped=new Map(catalog.items.map(x=>[x.id,x]));
test('Combattant : 22 noms lisibles et 22 prix visuellement confirmes',()=>{
 assert.equal(evidence.entries.length,22);
 assert.equal(evidence.entries.filter(e=>e.price_status==='visible').length,22);
 assert.equal(evidence.entries.filter(e=>e.price_status==='obscured').length,0);
 assert.equal(new Set(evidence.entries.map(e=>e.name_fr)).size,22);
});
test('Identifications du catalogue actuel preservent prix existants',()=>{
 const known=evidence.entries.filter(e=>e.existing_catalog_id);
 assert.equal(known.length,5);
 for(const e of known){
   assert.ok(mapped.has(e.existing_catalog_id));
   assert.equal(mapped.get(e.existing_catalog_id).price_gold,e.price_gold);
 }
});
test('Les 17 non-catalogues ne deviennent pas des IDs verifies',()=>{
 const missing=evidence.entries.filter(e=>!e.existing_catalog_id);
 assert.equal(missing.length,17);
 assert.ok(missing.every(e=>e.canonical_external_id_verified===false&&e.candidate_id));
});
test('Estropieur et Éviscérateur confirmes à 3100 PO par le client',()=>{
 for(const name of ['Estropieur','Éviscérateur']){
  const entry=evidence.entries.find(e=>e.name_fr===name);
  assert.equal(entry.price_gold,3100);
  assert.equal(entry.screenshot,'1793885107169.jpeg');
 }
});
test('Force de la trinite conserve 3333 PO du client',()=>{
 const x=evidence.entries.find(e=>e.name_fr==='Force de la trinité');
 assert.equal(x.price_gold,3333);
 assert.equal(x.canonical_external_id_verified,false);
});
test('Pas de couverture totale ni passifs verifies a partir de vues boutique',()=>{
 assert.ok(evidence.caveats.some(x=>x.includes('not proven covered')));
 assert.ok(evidence.entries.every(x=>x.details_verified===false));
});
