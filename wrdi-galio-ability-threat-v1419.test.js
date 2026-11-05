const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-ability-threat-v1419.js');
const ten=require('./wrdi-ten-kit-runes-v1412.js');
const draft=require('./wrdi-galio-draft-runes-v1418.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const evidence=require('./wrdi-galio-rune-evidence-v1414.js');
const player=require('./wrdi-galio-player-evidence-v1416.js');
const observations=require('./data/galio-rune-training-observations-v1415.json');
const matrix=require('./wrdi-galio-rune-matrix-v1413.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const picks=['101','102','10099','103','104','201','202','203','204','205'];
function setup(missing=false){
 const s=(id,skills)=>({id,skills});
 const rows=picks.map((id,i)=>({id,result:{signals:
  i===2?[s('stun',['Z'])]:
  i===6?[s('dash',['E']),s('knockup',['R'])]:
  i===7?[s('overtime',['A']),s('stun',['E'])]:
  i===8?[s('dash',['E'])]:
  i===9?[s('shield',['Z']),s('root',['A'])]:[],descriptionCount:4}}));
 const kits=ten.inspect(picks,missing?rows.slice(0,9):rows);
 const pages=ten.analyzeCandidates(kits,{advisor,picks,catalog,bridge});
 const pe=player.summarize(observations);
 const evaluated=evidence.compare({kitData:kits,comparison:pages,matrix,catalog,bridge,playerEvidence:pe});
 assert.equal(evaluated.ok,true,JSON.stringify(evaluated.errors));
 const baseline=draft.compare({kitData:kits,pages:evaluated.pages,playerEvidence:pe,bridge,catalog});
 return {kits,baseline};
}
test('retains ability slots per champion and identifies role-specific threats',()=>{
 const {kits,baseline}=setup();
 assert.deepEqual(kits.enemy[1].abilitySignals.find(x=>x.id==='dash').slots,['E']);
 const r=engine.refine({kitData:kits,baseline});
 assert.equal(r.ok,true);assert.equal(r.comparisonAvailable,true);
 assert.ok(r.findings.some(x=>x.key==='dive'&&x.role==='Jungle adverse'&&x.abilities.includes('R')));
 assert.ok(r.findings.some(x=>x.key==='midPoke'&&x.role==='Mid adverse'));
 assert.ok(r.findings.some(x=>x.key==='carryEscape'&&x.role==='ADC adverse'));
 assert.ok(r.findings.some(x=>x.key==='supportPeel'&&x.role==='Support adverse'));
 assert.equal(r.canDeclareBestPage,false);
 assert.equal(r.winRateCalibrated,false);
 assert.ok(r.pages[0].roleCompatibility>=r.pages.at(-1).roleCompatibility);
});
test('a dash alone is not treated as jungler engage',()=>{
 const row={id:'test',role:'Jungle adverse',available:true,signals:['dash'],
  abilitySignals:[{id:'dash',slots:['E']}]};
 assert.equal(engine.profile(row).findings.length,0);
});
test('missing champion description suspends all ranking',()=>{
 const {kits,baseline}=setup(true);
 const r=engine.refine({kitData:kits,baseline});
 assert.equal(r.ok,true);assert.equal(r.comparisonAvailable,false);
 assert.ok(r.pages.every(x=>x.roleCompatibility===null));
});
test('UI is wired and does not import PC champion abilities',()=>{
 const html=fs.readFileSync('index-v1419.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(html.includes('wrdi-galio-ability-threat-v1419.js?v=14190'));
 assert.ok(html.includes('wrdi-ten-kit-runes-v1412.js?v=14190'));
 assert.ok(panel.includes('specific.profiles'));
 assert.ok(!fs.readFileSync('wrdi-galio-ability-threat-v1419.js','utf8').includes('https://wiki.leagueoflegends.com'));
});
