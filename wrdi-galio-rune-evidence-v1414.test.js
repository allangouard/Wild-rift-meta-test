const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-rune-evidence-v1414.js');
const ten=require('./wrdi-ten-kit-runes-v1412.js');
const matrix=require('./wrdi-galio-rune-matrix-v1413.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['101','102','10099','103','104','201','202','203','204','205'];
function mock(missing=false){
 const rows=picks.map((id,i)=>({id,result:{signals:(i===2?[{id:'stun'}]:i===5?[{id:'dash'}]:[]),descriptionCount:5,sourceVersion:'unverified'}}));
 const kits=ten.inspect(picks,missing?rows.slice(1):rows);
 const comparison=ten.analyzeCandidates(kits,{advisor,picks,catalog,bridge});
 return {kits,comparison};
}
test('V14.14 lie les sept pages aux cinq runes autorisées chacune',()=>{
 const {kits,comparison}=mock();
 const r=engine.compare({kitData:kits,comparison,matrix,catalog,bridge});
 assert.equal(r.ok,true,JSON.stringify(r.errors));
 assert.equal(r.pages.length,7);
 for(const p of r.pages){
  assert.equal(p.runes.length,5);
  assert.equal(p.conditionalOrIndirectCount+p.notYetStudiedCount,5);
  assert.equal(p.canClaimOptimal,false);
  for(const x of p.runes){
   assert.equal(x.inGameProcVerified,false);
   assert.ok(['conditional_trigger','indirect_synergy','interaction_unverified','not_yet_studied'].includes(x.evidenceStatus));
  }
 }
 assert.equal(r.canDeclareBestPage,false);
 assert.equal(r.calibratedWinRate,false);
 assert.equal(r.liveRuneTriggersVerified,false);
});
test('Effets non étudiés ne sont pas déclarés inefficaces',()=>{
 const {kits,comparison}=mock();
 const r=engine.compare({kitData:kits,comparison,matrix,catalog,bridge});
 assert.ok(r.pages.some(p=>p.notYetStudiedCount>0));
 assert.ok(r.warnings.some(x=>x.includes('pas inefficace')));
});
test('Les kits incomplets restent identifiés sans fausse conclusion',()=>{
 const {kits,comparison}=mock(true);
 const r=engine.compare({kitData:kits,comparison,matrix,catalog,bridge});
 assert.equal(r.ok,true);
 assert.equal(r.coverage.available,9);
 assert.equal(r.canDeclareBestPage,false);
 assert.ok(r.pages.every(p=>p.caveats.some(x=>x.includes('indisponibles'))));
});
test('Bloquer la matrice absente ou un catalogue invalide',()=>{
 const {kits,comparison}=mock();
 assert.equal(engine.compare({kitData:kits,comparison,catalog,bridge}).ok,false);
 assert.equal(engine.compare({kitData:kits,comparison,matrix,catalog:{...catalog,minor:catalog.minor.slice(1)},bridge}).ok,false);
});
test('Page mobile autonome avec un seul panneau dix kits, preuves et limitations',()=>{
 const html=fs.readFileSync('index-v1414.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(html.includes('wrdi-galio-rune-evidence-v1414.js?v=14140'));
 assert.ok(html.includes('wrdi-ten-kit-panel-v1414.js?v=14140'));
 assert.ok(!html.includes('wrdi-ten-kit-panel-v1412.js'));
 assert.ok(panel.includes('Voir les cinq runes et les déclenchements'));
 assert.ok(panel.includes('Aucune meilleure page certifiée'));
 assert.ok(!panel.includes('adapters.create('));
});
