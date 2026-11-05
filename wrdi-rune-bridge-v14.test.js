const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const catalog=require('./data/rune-catalog-client-v14.json');
const api=require('./wrdi-rune-bridge-v14.js');

test('V14.7: 52 runes et 39 emplacements contrôlés',()=>{
 const r=api.audit(catalog);
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.total,52);
 assert.equal(r.minor,39);
 assert.equal(r.fundamental,13);
 assert.equal(catalog.status.automatic_draft_recommendations_enabled,false);
});
test('Tous les arbres comportent exactement une ligne sélectionnable sur trois',()=>{
 for(const tree of catalog.trees){
  for(const row of [1,2,3])assert.ok(api.options(catalog,tree,row).length>=3,tree+' '+row);
 }
 const expected={Domination:[3,3,3],'Précision':[3,3,3],'Volonté':[4,3,3],'Sorcellerie':[4,3,4]};
 for(const [tree,counts] of Object.entries(expected))
  assert.deepEqual([1,2,3].map(r=>api.options(catalog,tree,r).length),counts);
});
test('Validation traverse toutes les 12 associations de branches',()=>{
 for(const tree of catalog.trees){
  const primary=[1,2,3].map(row=>api.options(catalog,tree,row)[0].name_fr);
  for(const secondaryTree of catalog.trees.filter(t=>t!==tree)){
   const secondary=catalog.minor.find(r=>r.tree===secondaryTree).name_fr;
   const r=api.validate({keystone:'Électrocution',primaryTree:tree,primary,secondary},catalog);
   assert.equal(r.valid,true,tree+' / '+secondaryTree+' : '+JSON.stringify(r.errors));
  }
 }
});
test('La secondaire de même branche et les doublons de ligne sont interdits',()=>{
 const p={keystone:'Électrocution',primaryTree:'Précision',primary:['Brutal',"Baroud d'honneur",'Légende : Alacrité'],secondary:'Coup bas'};
 assert.equal(api.validate({...p,secondary:'Triomphe'},catalog).valid,false);
 assert.equal(api.validate({...p,primary:['Brutal','Triomphe','Légende : Alacrité']},catalog).valid,false);
 assert.equal(api.validate({...p,keystone:'Rune inventée'},catalog).valid,false);
});
test('L onglet Runes charge les scripts V14.7 et le catalogue client',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const panel=fs.readFileSync('wrdi-rune-panel-v14.js','utf8');
 assert.ok(html.includes('./wrdi-rune-bridge-v14.js?v=1470'));
 assert.ok(html.includes('./wrdi-rune-panel-v14.js?v=1470'));
 assert.ok(panel.includes('./data/rune-catalog-client-v14.json'));
 assert.ok(panel.includes("const host=$('runes')"));
});
