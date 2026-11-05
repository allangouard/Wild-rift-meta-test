const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-draft-runes-v1418.js');
const ten=require('./wrdi-ten-kit-runes-v1412.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const evidence=require('./wrdi-galio-rune-evidence-v1414.js');
const player=require('./wrdi-galio-player-evidence-v1416.js');
const record=require('./data/galio-rune-training-observations-v1415.json');
const matrix=require('./wrdi-galio-rune-matrix-v1413.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['101','102','10099','103','104','201','202','203','204','205'];
function fixture(missing=false,mobile=true){
 const records=picks.map((id,i)=>({id,result:{signals:
   i===0?[{id:'stun'}]:i===1?[{id:'dash'}]:i===2?[{id:'stun'}]:
   i===3?[{id:'heal'}]:i===4?[{id:'shield'}]:i===5?[{id:'stun'},{id:'slow'}]:
   i===6?[{id:'knockup'},{id:'dash'}]:i===7?[{id:'dash'}]:
   i===8?[{id:'heal'}]:[{id:'root'}],descriptionCount:5}}));
 const kits=ten.inspect(picks,missing?records.slice(1):records);
 if(!mobile)kits.game='League of Legends PC';
 const comparison=ten.analyzeCandidates(kits,{advisor,picks,catalog,bridge});
 const observed=player.summarize(record);
 const old=evidence.compare({kitData:kits,comparison,matrix,catalog,bridge,playerEvidence:observed});
 assert.equal(old.ok,true,JSON.stringify(old.errors));
 return {kits,old,observed};
}
test('complete draft yields context-based comparison, without meta claims',()=>{
 const {kits,old,observed}=fixture();
 const r=engine.compare({kitData:kits,pages:old.pages,playerEvidence:observed,bridge,catalog});
 assert.equal(r.ok,true);assert.equal(r.comparisonAvailable,true);
 assert.equal(r.pages.length,7);assert.equal(r.bestPageCertified,false);
 assert.equal(r.winRateCalibrated,false);assert.equal(r.automaticBuildRecommendation,false);
 assert.ok(r.pages[0].compatibility>=r.pages.at(-1).compatibility);
 const phase=r.pages.find(x=>x.id==='roam');
 assert.ok(phase.validatedCombos.some(x=>x.testId==='phase-combo'));
 assert.ok(phase.validatedNonProcs.some(x=>x.testId==='phase-q-ticks'));
});
test('missing any kit disables ranking, never interprets missing as no threat',()=>{
 const {kits,old,observed}=fixture(true);
 const r=engine.compare({kitData:kits,pages:old.pages,playerEvidence:observed,bridge,catalog});
 assert.equal(r.ok,true);assert.equal(r.comparisonAvailable,false);
 assert.ok(r.pages.every(x=>x.compatibility===null));
});
test('PC kit source and invalid rune pages cannot be accepted',()=>{
 const {kits,old,observed}=fixture();
 kits.game='League of Legends PC';
 assert.equal(engine.compare({kitData:kits,pages:old.pages,playerEvidence:observed,bridge,catalog}).ok,false);
 const {kits:valid}=fixture();
 const pages=old.pages.map(x=>({...x}));
 pages[0]={...pages[0],page:{...pages[0].page,secondary:pages[0].page.primary[0]}};
 assert.throws(()=>engine.compare({kitData:valid,pages,playerEvidence:observed,bridge,catalog}),/Page illégale/);
});
test('mobile V14.18 page wires module and presents caveats',()=>{
 const html=fs.readFileSync('index-v1418.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(html.includes('wrdi-galio-draft-runes-v1418.js?v=14180'));
 assert.ok(html.includes('wrdi-ten-kit-panel-v1414.js?v=14180'));
 assert.ok(panel.includes('comparisonAvailable'));
 assert.ok(panel.includes('Adéquation tactique exploratoire'));
});
