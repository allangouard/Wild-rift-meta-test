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
test('Vingt-six positions vérifiées, dont Précision et Sorcellerie complètes',()=>{
 const expected={
  'Coup bas':1,'Assaut enchaîné':2,'Chasseur acharné':3,
  'Courage du colosse':1,'Second souffle':2,'Revitalisation':3,
  'Brutal':1,'Triomphe':1,'Zèle de combat':1,
  "Baroud d'honneur":2,'Abattage':2,'Coup de grâce':2,
  'Légende : Alacrité':3,'Légende : Accélération':3,'Légende : Sangsue':3,
  'Arcaniste axiomatique':1,'Ruban de mana':1,'Botaniste':1,'Saut Hextech':1,
  'Transcendance':2,'Célérité':2,'Concentration absolue':2,
  'Brûlure':3,'Manteau nuageux':3,'Tempête menaçante':3,'Pot de graines ixtali':3
 };
 for(const r of C.minor){
  if(Object.prototype.hasOwnProperty.call(expected,r.name_fr)){
   assert.equal(r.primary_row,expected[r.name_fr],r.name_fr);
   assert.equal(r.primary_row_status,'client_screenshot_verified');
  }else{
   assert.equal(r.primary_row,null,r.name_fr);
   assert.equal(r.primary_row_status,'not_verified');
  }
 }
 assert.equal(C.minor.filter(r=>r.primary_row!==null).length,26);
 assert.equal(C.minor.filter(r=>r.tree==='Précision'&&r.primary_row!==null).length,9);
 assert.equal(C.minor.filter(r=>r.tree==='Sorcellerie'&&r.primary_row!==null).length,11);
});
test('Ne jamais signaler l optimiseur prêt avant réconciliation',()=>{
 assert.equal(C.optimizer_ready,false);
 assert.equal(C.rune_page_rules.secondary_tree_must_differ_from_primary,true);
 assert.equal(C.rune_page_rules.secondary_tree_allowed_options_count,3);
});
