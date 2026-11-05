const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-curated-matchups-v1420.js');
test('curated profiles have Wild Rift sources and scoped status',()=>{
 for(const name of ['Syndra','Yasuo','Ahri','Zed']){
  const p=engine.lookup(name);
  assert.ok(p);
  assert.ok(p.source.startsWith('https://wildrift.leagueoflegends.com/fr-fr/champions/'));
  assert.ok(p.traits.length>=2);
  assert.equal(p.status,'abilities_documented_matchup_unvalidated');
 }
 assert.equal(engine.lookup('Unknown'),null);
});
test('mid opponent profile changes only with exact name and preserves limits',()=>{
 const all=Array.from({length:10},(_,i)=>({id:String(i),role:i===7?'Mid adverse':i<5?'Allié':'Adverse',available:true}));
 const baseline={ok:true,comparisonAvailable:true,pages:['engage','resilience','roam','poke','burst','peel','longfight'].map(id=>({id,label:id}))};
 const names=['a','b','Galio','c','d','e','f','Syndra','h','i'];
 const ok=engine.refine({tenKits:{ok:true,all},baseline,championNames:names});
 assert.equal(ok.midOpponent,'Syndra');
 assert.equal(ok.pages.length,7);
 assert.equal(ok.bestPageCertified,false);
 assert.equal(ok.metaPatchCertified,false);
 assert.ok(ok.pages.some(p=>p.curatedFindings.length));
 names[7]='Unknown';
 const absent=engine.refine({tenKits:{ok:true,all},baseline,championNames:names});
 assert.equal(absent.comparisonAvailable,false);
 assert.ok(absent.pages.every(p=>p.curatedDelta===null));
});
test('mobile page wires curated profile module and UI',()=>{
 const html=fs.readFileSync('index-v1420.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(html.includes('wrdi-galio-curated-matchups-v1420.js?v=14200'));
 assert.ok(panel.includes('detailed.profile.traits'));
});
