const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const inspect=require('./wrdi-ten-kit-runes-v1412.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['101','102','10099','103','104','201','202','203','204','205'];
const make=(signalTable={})=>picks.map(id=>({id,result:{
 signals:(signalTable[id]||[]).map(x=>({id:x})),descriptionCount:5,sourceVersion:'unknown'
}}));
test('Les dix kits sont séparés en cinq alliés et cinq adversaires, Galio mid',()=>{
 const x=inspect.inspect(picks,make({'10099':['stun','dash','shield'],'102':['knockup'],'202':['stun'],'203':['dash']}));
 assert.equal(x.ok,true);
 assert.equal(x.coverage.available,10);
 assert.equal(x.ally.length,5);
 assert.equal(x.enemy.length,5);
 assert.equal(x.galio.ccMentioned,true);
 assert.equal(x.evidence.find(e=>e.trait==='ally_engage').count,2);
 assert.equal(x.evidence.find(e=>e.trait==='enemy_cc').count,1);
 assert.equal(x.evidence.find(e=>e.trait==='mid_mobility').count,1);
 assert.equal(x.galio.allVerified,false);
});
test('Sept pages restent légales, aucune victoire ni matchup certifié',()=>{
 const x=inspect.inspect(picks,make({'10099':['stun'],'102':['knockup'],'202':['stun'],'203':['dash']}));
 const d=inspect.analyzeCandidates(x,{advisor,picks,catalog,bridge});
 assert.equal(d.ok,true);
 assert.equal(d.options.length,7);
 assert.equal(d.rankedProvisionally,true);
 assert.equal(d.automaticRecommendation,false);
 assert.equal(d.fullyVerified,false);
 for(const entry of d.options){
  assert.equal(bridge.validate(entry.page,catalog).valid,true);
  assert.equal(entry.estimatedWinRate,null);
  assert.equal(entry.validatedMatchup,false);
 }
});
test('Un kit absent interdit le classement et distingue absence de preuve de zéro menace',()=>{
 const rows=make({'10099':['stun']}).slice(1);
 const x=inspect.inspect(picks,rows);
 assert.equal(x.coverage.available,9);
 assert.equal(x.ally[0].available,false);
 const y=inspect.analyzeCandidates(x,{advisor,picks,catalog,bridge});
 assert.equal(y.ok,true);
 assert.equal(y.rankedProvisionally,false);
 assert.equal(y.status,'insufficient-kit-evidence');
});
test('Sans contrôle dans le kit Galio, pas de classement lexical',()=>{
 const x=inspect.inspect(picks,make({'102':['stun'],'202':['root']}));
 const y=inspect.analyzeCandidates(x,{advisor,picks,catalog,bridge});
 assert.equal(y.rankedProvisionally,false);
});
test('L ordre de la draft et les champions dupliqués sont contrôlés',()=>{
 assert.equal(inspect.inspect([...picks.slice(0,2),'222',...picks.slice(3)],make()).ok,false);
 assert.equal(inspect.inspect([...picks.slice(0,9),picks[0]],make()).ok,false);
 const wrong=[...picks];wrong[2]='10099';const doc=inspect.inspect(wrong,make());
 assert.equal(doc.ok,true);
});
test('La page V14.12 expose un bouton autonome, dix requêtes et leurs limites',()=>{
 const page=fs.readFileSync('index-v1412.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1412.js','utf8');
 assert.ok(page.includes('./wrdi-ten-kit-runes-v1412.js?v=14120'));
 assert.ok(page.includes('./wrdi-ten-kit-panel-v1412.js?v=14120'));
 assert.ok(panel.includes('Analyser automatiquement les 10 kits'));
 assert.ok(panel.includes('Promise.all(picks.map'));
 assert.ok(panel.includes('Fiches adverses'));
 assert.ok(!panel.includes('adapters.create('));
});
