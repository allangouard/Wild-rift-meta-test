const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const bridge=require('./wrdi-rune-bridge-v14.js');
const scenarios=require('./wrdi-galio-rune-scenarios-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const threatSummary=require('./wrdi-threat-summary-v14.js');

const ids=['1001','1002','1003','1004','1005'];
function mockSummary(cc=0){
 const threats=ids.map((id,i)=>({id,name:'Ennemi '+id,sourceVersion:'7.3d',signals:i<cc?[{id:'stun'}]:[]}));
 const enemyBuilds=ids.map(id=>({id,roleMatched:true,sourcePatch:'7.3d',
  cores:[{ids:['itemA'],names:['Objet A'],classification:{ranked:['ap']}}]}));
 return threatSummary.summarize({ok:true,status:'audit-only',patch:'7.3d',threats,enemyBuilds});
}
test('Trois pages Galio valides, valeurs issues des 52 runes client',()=>{
 const r=scenarios.evaluate({championId:'10099',summary:mockSummary(3),catalog,bridge});
 assert.equal(r.ok,true);
 assert.equal(r.candidates.length,3);
 assert.equal(r.automaticRecommendationAllowed,false);
 assert.equal(r.rankedByWinRate,false);
 for(const candidate of r.candidates){
  assert.equal(bridge.validate(candidate.page,catalog).valid,true);
  assert.equal(candidate.legal,true);
  assert.ok(candidate.interactions.length>0);
  assert.ok(candidate.limits.length>0);
 }
});
test('Un signal CC contextuel n est pas une probabilité de victoire',()=>{
 const withCc=scenarios.evaluate({championId:'10099',summary:mockSummary(3),catalog,bridge});
 const withoutCc=scenarios.evaluate({championId:'10099',summary:mockSummary(0),catalog,bridge});
 assert.equal(withCc.candidates[0].status,'signal_contextuel_a_examiner');
 assert.equal(withoutCc.candidates[0].status,'alternative_non_classee');
 assert.equal(withCc.candidates[1].status,'alternative_non_classee');
 assert.equal(withCc.candidates[2].status,'alternative_non_classee');
});
test('Bloquer une autre sélection que Galio et un rapport sans 5 ennemis',()=>{
 assert.equal(scenarios.evaluate({championId:'999',summary:mockSummary(3),catalog,bridge}).ok,false);
 assert.equal(scenarios.evaluate({championId:'10099',summary:{ok:true,enemies:[]},catalog,bridge}).ok,false);
 const tampered={...catalog,minor:catalog.minor.slice(1)};
 assert.equal(scenarios.evaluate({championId:'10099',summary:mockSummary(),catalog:tampered,bridge}).ok,false);
});
test('Rejeter les 5 identifiants adverses non distincts',()=>{
 const s=mockSummary();
 const malformed={...s,enemies:s.enemies.map((enemy,i)=>i===1?{...enemy,id:s.enemies[0].id}:enemy)};
 assert.equal(scenarios.evaluate({championId:'10099',summary:malformed,catalog,bridge}).ok,false);
});
test('V14.8 visible dans l onglet Runes et sans injection de score inventé',()=>{
 const html=fs.readFileSync('index-v1434.html','utf8');
 const panel=fs.readFileSync('wrdi-rune-panel-v14.js','utf8');
 assert.ok(html.includes('./wrdi-galio-rune-scenarios-v14.js?v=14100'));
 assert.ok(panel.includes('Examiner les runes avec la draft'));
 assert.ok(panel.includes('runeDraft.run('));
 assert.ok(panel.includes('scenarios.evaluate('));
 assert.ok(!panel.includes('score de victoire :'));
});
