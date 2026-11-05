const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const lab=require('./wrdi-rune-proc-lab-v1415.js');
const matrix=require('./wrdi-galio-rune-matrix-v1413.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
test('Protocoles opérationnels pour les interactions prioritaires Galio',()=>{
 const x=lab.audit({catalog,bridge,matrix});
 assert.equal(x.ok,true,JSON.stringify(x.errors));
 assert.equal(x.total,10);
 assert.equal(x.inGameTriggersCertified,0);
 assert.equal(x.automaticRecommendationEligible,false);
 assert.ok(x.protocols.every(p=>p.instruction&&p.success&&p.controls&&p.uncertainty));
 for(const name of ['Souverain des glaces','Courage du colosse','Électrocution','Rush phasique']){
  assert.ok(x.protocols.some(t=>t.rune===name),name);
 }
});
test('Pas de promotion automatique des observations manuelles',()=>{
 const a=lab.validateObservation('glacial-w','observed_yes','Effet visuel observé après provocation');
 assert.equal(a.ok,true);
 assert.equal(a.record.provenance,'manual_user_observation');
 assert.equal(a.record.validatedByDeveloper,false);
 assert.equal(a.record.replicated,false);
 const x=lab.audit({catalog,bridge,matrix,observations:[a.record]});
 assert.equal(x.observedInteractions,1);
 assert.equal(x.inGameTriggersCertified,0);
});
test('Observations incomplètes ou invalides refusées',()=>{
 assert.equal(lab.validateObservation('unknown','observed_yes','Notes assez longues').ok,false);
 assert.equal(lab.validateObservation('glacial-w','winning','Notes assez longues').ok,false);
 assert.equal(lab.validateObservation('glacial-w','observed_yes','oui').ok,false);
 assert.equal(lab.validateObservation('glacial-w','untested','').ok,true);
});
test('Le contrôle de la fenêtre Rush phasique cite le client et les divergences',()=>{
 const row=lab.TESTS.find(x=>x.id==='phase-combo');
 assert.ok(row.uncertainty.includes('4 s'));
});
test('Une corruption du catalogue invalide les protocoles',()=>{
 const falseCatalog={...catalog,minor:catalog.minor.slice(1)};
 assert.equal(lab.audit({catalog:falseCatalog,bridge,matrix}).ok,false);
});
test('Page V14.15 distincte, formulaire local et non-certification explicite',()=>{
 const html=fs.readFileSync('index-v1415.html','utf8');
 const panel=fs.readFileSync('wrdi-rune-proc-lab-panel-v1415.js','utf8');
 assert.ok(html.includes('wrdi-rune-proc-lab-v1415.js?v=14150'));
 assert.ok(html.includes('wrdi-rune-proc-lab-panel-v1415.js?v=14150'));
 assert.ok(panel.includes('Enregistrer cette observation'));
 assert.ok(panel.includes('localStorage.setItem(KEY'));
 assert.ok(panel.includes('non certifiée'));
});
