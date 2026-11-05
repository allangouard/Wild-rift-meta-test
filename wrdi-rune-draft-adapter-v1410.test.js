const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const adapter=require('./wrdi-rune-draft-adapter-v1410.js');
const scenarios=require('./wrdi-galio-rune-scenarios-v14.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['11','12','10099','13','14','21','22','23','24','25'];
const audit=picks.slice(5).map((id,i)=>({id,name:'Enemy '+id,result:{signals:i<3?[{id:'stun'}]:[]}}));
test('Les kits adverses valides produisent des signaux indépendamment des objets',async()=>{
 const r=await adapter.run({picks,getAudit:()=>audit});
 assert.equal(r.ok,true);
 assert.equal(r.summary.enemyKitSignalsAvailable,true);
 assert.equal(r.summary.counts.cc,3);
 const evaluated=scenarios.evaluate({championId:'10099',summary:r.summary,catalog,bridge});
 assert.equal(evaluated.ok,true);
 assert.equal(evaluated.candidates.length,3);
 assert.equal(evaluated.candidates[0].status,'signal_contextuel_a_examiner');
});
test('Si les données adverses sont indisponibles, on affiche trois pages GÉNÉRIQUES',async()=>{
 let n=0;
 const r=await adapter.run({picks,getAudit:()=>null,analyze:async()=>{n++;throw Error('offline')}});
 assert.equal(n,1);
 assert.equal(r.ok,true);
 assert.equal(r.summary.enemyKitSignalsAvailable,false);
 assert.equal(r.summary.counts,null);
 const evaluated=scenarios.evaluate({championId:'10099',summary:r.summary,catalog,bridge});
 assert.equal(evaluated.ok,true);
 assert.equal(evaluated.candidates.length,3);
 assert.equal(evaluated.candidates[0].status,'alternative_non_classee');
 assert.equal(evaluated.enemyKitSignalsAvailable,false);
 assert.ok(evaluated.warnings.some(x=>x.includes('non personnalisés')));
});
test('Un audit incomplet ne doit jamais être pris pour zéro menace confirmée',()=>{
 const bad=audit.map(x=>({...x}));bad[0].error='unavailable';
 const summary=adapter.summarizeKitAudit(picks,bad);
 assert.equal(summary.enemyKitSignalsAvailable,false);
 assert.equal(summary.counts,null);
});
test('Draft modifiée pendant un chargement asynchrone => refus',async()=>{
 let current=true;
 const r=await adapter.run({picks,getAudit:()=>null,isCurrent:()=>current,analyze:async()=>{current=false}});
 assert.equal(r.ok,false);assert.equal(r.status,'stale');
});
test('Galio mid et cinq ennemis obligatoires, aucune donnée objet requise',async()=>{
 assert.equal((await adapter.run({picks:[...picks.slice(0,2),'99',...picks.slice(3)]})).ok,false);
 assert.equal((await adapter.run({picks:[...picks.slice(0,9),'']})).ok,false);
 assert.equal((await adapter.run({picks,getAudit:()=>audit})).ok,true);
});
test('Le bouton Runes ne passe plus par le coordinateur objets V14',()=>{
 const panel=fs.readFileSync('wrdi-rune-panel-v14.js','utf8');
 assert.ok(panel.includes('runeDraft.run('));
 assert.ok(!panel.includes('adapters.create('));
 assert.ok(!panel.includes('summaryApi.summarize(report)'));
});
