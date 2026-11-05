const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const evidence=require('./wrdi-galio-rune-evidence-v1414.js');
const player=require('./wrdi-galio-player-evidence-v1416.js');
const data=require('./data/galio-rune-training-observations-v1415.json');
const ten=require('./wrdi-ten-kit-runes-v1412.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const matrix=require('./wrdi-galio-rune-matrix-v1413.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['101','102','10099','103','104','201','202','203','204','205'];
function run(playerEvidence){
 const rows=picks.map((id,i)=>({id,result:{signals:(i===2?[{id:'stun'}]:i===5?[{id:'dash'}]:[]),descriptionCount:5,sourceVersion:'unverified'}}));
 const kitData=ten.inspect(picks,rows);
 const comparison=ten.analyzeCandidates(kitData,{advisor,picks,catalog,bridge});
 return evidence.compare({kitData,comparison,matrix,catalog,bridge,playerEvidence});
}
test('confirmed positive and negative observations appear for each relevant rune',()=>{
 const r=run(player.summarize(data));assert.equal(r.ok,true,JSON.stringify(r.errors));
 const find=name=>r.pages.flatMap(x=>x.runes).find(x=>x.name===name);
 const phase=find('Rush phasique');
 assert.ok(phase.playerObservations.some(x=>x.testId==='phase-combo'&&x.triggered===true));
 assert.ok(phase.playerObservations.some(x=>x.testId==='phase-q-ticks'&&x.triggered===false));
 const elect=find('Électrocution');
 assert.ok(elect.playerObservations.some(x=>x.testId==='electrocute-q-ticks'&&x.triggered===false));
 const rev=find('Revitalisation');
 assert.equal(rev.playerObservations.length,0);
 assert.equal(r.canDeclareBestPage,false);
 assert.equal(r.calibratedWinRate,false);
});
test('without player data the old comparison remains exploratory',()=>{
 const r=run(null);assert.equal(r.ok,true);
 assert.equal(r.liveRuneTriggersVerified,false);
 assert.equal(r.playerValidatedObservations,0);
 assert.ok(r.pages.every(x=>x.runes.every(y=>y.inGameProcVerified===false)));
});
test('mobile page includes correct player data module and panel integration',()=>{
 const h=fs.readFileSync('index-v1417.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(h.includes('wrdi-galio-player-evidence-v1416.js?v=14160'));
 assert.ok(h.includes('wrdi-ten-kit-panel-v1414.js?v=14170'));
 assert.ok(panel.includes('playerEvidence'));
 assert.ok(panel.includes('playerObservations'));
 assert.ok(panel.includes('conditions testées uniquement'));
});
