const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-rune-advisor-v1411.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['1001','1002','10099','1003','1004','1005','1006','1007','1008','1009'];
const generic={ok:true,game:'Wild Rift mobile',enemyKitSignalsAvailable:false,enemyKitSignalsVerified:false,
 enemies:picks.slice(5).map(id=>({id,mentioned:[]})),counts:null,notices:[]};
const decide=(opts={})=>engine.decide({championId:'10099',picks,summary:generic,catalog,bridge,...opts});
test('Sept pages légales distinctes, couvrant quatre arbres et au moins cinq fondamentales',()=>{
 const d=decide();
 assert.equal(d.ok,true);
 assert.equal(d.options.length,7);
 assert.equal(new Set(d.options.map(x=>x.id)).size,7);
 assert.ok(new Set(d.options.map(x=>x.page.keystone)).size>=5);
 assert.deepEqual(new Set(d.options.map(x=>x.page.primaryTree)),new Set(['Volonté','Domination','Sorcellerie','Précision']));
 for(const x of d.options){
  assert.equal(bridge.validate(x.page,catalog).valid,true,x.id);
  assert.equal(x.estimatedWinRate,null);
  assert.equal(x.validatedMatchup,false);
 }
});
test('Sans préférences, le moteur ne prétend pas classer par matchup',()=>{
 const d=decide();
 assert.equal(d.status,'unranked-options');
 assert.equal(d.hasTacticalPreference,false);
 assert.equal(d.automaticMetaRecommendation,false);
 assert.ok(d.options.every(x=>x.relevance===0));
});
test('Un choix manuel engage remonte le scénario engagement sans faux winrate',()=>{
 const d=decide({preferences:{goal:'engage'}});
 assert.equal(d.status,'tactical-comparison');
 assert.equal(d.options[0].id,'engage');
 assert.ok(d.options[0].reasons.some(x=>x.includes('choisie')));
 assert.equal(d.options[0].estimatedWinRate,null);
});
test('Lane all-in fait varier les runes en conservant les lignes légales',()=>{
 const d=decide({preferences:{goal:'engage',lane:'allin'}});
 const page=d.options.find(x=>x.id==='engage').page;
 assert.equal(page.primary[1],"Plaque d'os");
 assert.equal(bridge.validate(page,catalog).valid,true);
 const long=d.options.find(x=>x.id==='longfight').page;
 assert.equal(long.primary[1],'Coup de grâce');
 assert.equal(bridge.validate(long,catalog).valid,true);
});
test('Besoin de protéger des alliés est explicitement manuel',()=>{
 const d=decide({preferences:{ally:'needs_peel'}});
 assert.equal(d.options[0].id,'peel');
 assert.ok(d.options[0].reasons[0].includes('manuelle'));
 assert.equal(d.enemySignalsValidated,false);
});
test('Les mentions non vérifiées des contrôles adverses ne créent pas de rang factice',()=>{
 const summary={...generic,enemyKitSignalsAvailable:true,counts:{cc:5},enemies:generic.enemies};
 const d=decide({summary});
 assert.equal(d.ok,true);
 assert.equal(d.status,'unranked-options');
 assert.equal(d.enemySignalsValidated,false);
 assert.ok(d.options.every(x=>x.relevance===0));
 assert.ok(d.options.find(x=>x.id==='engage').reasons.some(x=>x.includes('non confirmé')));
});
test('Bloquer mauvais champion, catalogue, synthèse ou ordre de draft',()=>{
 assert.equal(decide({championId:'123'}).ok,false);
 assert.equal(decide({picks:[...picks.slice(0,9),'']}).ok,false);
 assert.equal(decide({catalog:{...catalog,minor:catalog.minor.slice(1)}}).ok,false);
 assert.equal(decide({summary:{...generic,enemies:generic.enemies.slice().reverse()}}).ok,false);
});
test('Interface mobile et page autonome V14.11 référencent le nouveau moteur',()=>{
 const p=fs.readFileSync('wrdi-rune-panel-v14.js','utf8');
 const html=fs.readFileSync('index-v1411.html','utf8');
 assert.ok(p.includes('WRDI_GalioRuneAdvisorV1411'));
 assert.ok(p.includes('Objectif de Galio'));
 assert.ok(p.includes('Voir les '));
 assert.ok(html.includes('wrdi-galio-rune-advisor-v1411.js?v=14110'));
 assert.ok(html.includes('wrdi-rune-panel-v14.js?v=14110'));
});
