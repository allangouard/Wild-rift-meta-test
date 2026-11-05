const {test}=require('node:test');
const assert=require('node:assert/strict');
const {RULES,validateRunePage}=require('./wrdi-rune-page-rules-v14.js');
const valid={keystone:'Électrocution',primary:['Coup bas','Assaut enchaîné','Chasseur acharné'],secondary:'Démolition'};
test('Page complète: 1 fondamentale + 3 Domination + 1 Volonté',()=>{
 assert.equal(RULES.keystone_count,1);
 assert.equal(RULES.primary_count,3);
 assert.equal(RULES.secondary_count,1);
 const x=validateRunePage(valid);
 assert.equal(x.valid,true,JSON.stringify(x.errors));
 assert.equal(x.primary_tree,'Domination');
 assert.equal(x.secondary_tree,'Volonté');
});
test('Une quatrième Domination est interdite comme secondaire',()=>{
 const x=validateRunePage({...valid,secondary:'Tyran'});
 assert.equal(x.valid,false);
 assert.ok(x.errors.some(e=>e.includes('autre branche')));
});
test('Précision et Sorcellerie acceptées comme branches secondaires différentes',()=>{
 for(const secondary of ['Triomphe','Ruban de mana']){
  const x=validateRunePage({...valid,secondary});
  assert.equal(x.valid,true,secondary+': '+JSON.stringify(x.errors));
 }
});
test('Il faut trois runes principales issues de la même branche',()=>{
 const x=validateRunePage({...valid,primary:['Coup bas','Triomphe','Chasseur acharné']});
 assert.equal(x.valid,false);
 assert.ok(x.errors.some(e=>e.includes('même branche')));
});
test('Il faut une fondamentale et cinq choix structurés, sans doublons',()=>{
 assert.equal(validateRunePage({...valid,keystone:''}).valid,false);
 assert.equal(validateRunePage({...valid,primary:['Coup bas','Assaut enchaîné']}).valid,false);
 assert.equal(validateRunePage({...valid,primary:['Coup bas','Coup bas','Chasseur acharné']}).valid,false);
 assert.equal(validateRunePage({...valid,secondary:'Rune inventée'}).valid,false);
});
test('Les noms français et quatre branches sont ceux du catalogue client',()=>{
 assert.deepEqual(RULES.trees,['Domination','Précision','Volonté','Sorcellerie']);
 assert.equal(RULES.secondary_tree_allowed_options_count,3);
});

test('Précision: une rune dans chacune des trois lignes est valide',()=>{
 const x=validateRunePage({keystone:'Électrocution',
  primary:['Brutal',"Baroud d'honneur",'Légende : Alacrité'],secondary:'Coup bas'});
 assert.equal(x.valid,true,JSON.stringify(x.errors));
 assert.equal(x.primary_rows_verified,true);
});
test('Précision: deux runes de même ligne principale sont interdites',()=>{
 const x=validateRunePage({keystone:'Électrocution',
  primary:['Brutal','Triomphe','Légende : Alacrité'],secondary:'Coup bas'});
 assert.equal(x.valid,false);
 assert.ok(x.errors.some(e=>e.includes('chaque ligne')));
});
test('Précision: combinaison libre avec l autre arbre, sans doublon de ligne',()=>{
 const x=validateRunePage({keystone:'Électrocution',
  primary:['Zèle de combat','Coup de grâce','Légende : Sangsue'],secondary:'Démolition'});
 assert.equal(x.valid,true,JSON.stringify(x.errors));
 assert.equal(x.secondary_tree,'Volonté');
});
