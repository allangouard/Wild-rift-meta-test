const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildRuneCatalog,TREE_KEYS}=require('./wrdi-rune-catalog-v14.js');
const C=buildRuneCatalog();
test('52 runes du client: 13 fondamentales, 39 secondaires, identités distinctes',()=>{
 assert.equal(C.total,52);
 assert.equal(C.keystones.length,13);
 assert.equal(C.minor.length,39);
 assert.equal(C.inventory_complete,true);
 assert.equal(new Set(C.all.map(r=>r.name_fr)).size,52);
 assert.equal(new Set(C.all.map(r=>r.id)).size,52);
});
test('Quatre arbres valides et Sorcellerie bien orthographiée',()=>{
 assert.deepEqual(Object.keys(TREE_KEYS),['Domination','Précision','Volonté','Sorcellerie']);
 const counts=Object.fromEntries(Object.keys(TREE_KEYS).map(t=>[t,C.minor.filter(x=>x.tree===t).length]));
 assert.deepEqual(counts,{Domination:9,'Précision':9,'Volonté':10,'Sorcellerie':11});
 assert.equal(C.minor.find(x=>x.name_fr==='Zèle de combat').tree,'Précision');
});
test('Identifiants internes non confondus avec les identifiants officiels',()=>{
 for(const r of C.all){assert.match(r.id,/^wr:(minor|keystone):/);assert.equal(r.external_game_id,null);assert.ok(r.source_path);assert.ok(r.name_fr);}
});
test('Rangées des 39 secondaires non devinées',()=>{
 for(const r of C.minor){assert.equal(r.primary_row,null);assert.equal(r.primary_row_status,'not_verified');}
});
test('Ne jamais signaler l optimiseur prêt avant réconciliation',()=>{
 assert.equal(C.optimizer_ready,false);
 assert.equal(C.rune_page_rules.secondary_tree_must_differ_from_primary,true);
 assert.equal(C.rune_page_rules.secondary_tree_allowed_options_count,3);
});
