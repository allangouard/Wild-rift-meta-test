const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-five-runes-v1421.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const player=require('./wrdi-galio-player-evidence-v1416.js');
const observations=require('./data/galio-rune-training-observations-v1415.json');
const roster=['A','B','Galio','C','D','E','Vi','Syndra','F','Nautilus'];
const roles=['Top allié','Jungle allié','Galio mid','ADC allié','Support allié','Top adverse','Jungle adverse','Mid adverse','ADC adverse','Support adverse'];
function make(names=roster){
 const kitData={ok:true,all:roles.map((role,i)=>({id:String(100+i),role,available:true}))};
 const evidence=player.summarize(observations);
 const pages=advisor.STRATEGIES.map(template=>{
  const page={keystone:template.keystone,primaryTree:template.tree,primary:[...template.primary],secondary:template.secondary};
  assert.equal(bridge.validate(page,catalog).valid,true);
  return {id:template.id,page,runes:[page.keystone,...page.primary,page.secondary].map(name=>({name,playerObservations:evidence.entries.filter(e=>e.rune===name&&e.status.startsWith('validated_')).map(e=>({testId:e.testId,condition:e.condition,triggered:e.triggered}))}))};
 });
 return {kitData,championNames:names,pages};
}
test('Vi jungle and Nautilus support recognized by correct role, 5 runes per page',()=>{
 const a=make();const r=engine.analyze({...a,bridge,catalog});
 assert.equal(r.ok,true);assert.equal(r.profiles.length,2);
 assert.deepEqual(r.profiles.map(x=>x.name),['Vi','Nautilus']);
 assert.equal(r.pages.length,7);assert.ok(r.pages.every(p=>p.fiveRuneAnalysis.length===5));
 assert.equal(r.canDeclareBestPage,false);assert.equal(r.winRateCalibrated,false);
 const engage=r.pages.find(x=>x.id==='engage');
 assert.ok(engage.fiveRuneAnalysis.find(x=>x.name==='Courage du colosse').validatedInGame.length>=2);
});
test('Lee Sin jungle and Lulu support have independent official sources',()=>{
 const a=make(['A','B','Galio','C','D','E','Lee Sin','Syndra','F','Lulu']);
 const r=engine.analyze({...a,bridge,catalog});
 assert.equal(r.profiles.length,2);
 assert.ok(r.profiles.every(p=>p.source.startsWith('https://wildrift.leagueoflegends.com/fr-fr/champions/')));
 assert.ok(r.pages.find(p=>p.id==='burst').fiveRuneAnalysis.find(x=>x.name==='Électrocution').threatNotes.length>0);
});
test('profiles not assigned to other roles or guessed from missing names',()=>{
 const a=make(['A','B','Galio','C','D','E','Nautilus','Syndra','F','Vi']);
 const r=engine.analyze({...a,bridge,catalog});assert.equal(r.profiles.length,0);
 assert.equal(r.available,false);
 assert.ok(r.pages.every(p=>p.fiveRuneAnalysis.length===5));
});
test('missing kit blocks invented role profiles and illegal rune pages',()=>{
 const a=make();a.kitData.all[6].available=false;
 assert.deepEqual(engine.resolve(a).profiles.map(x=>x.name),['Nautilus']);
 const b=make();b.pages[0].page.secondary=b.pages[0].page.primary[0];
 assert.throws(()=>engine.analyze({...b,bridge,catalog}),/illégale/);
});
test('mobile page loads module and 5-rune panel',()=>{
 const html=fs.readFileSync('index-v1421.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(html.includes('wrdi-galio-five-runes-v1421.js?v=14210'));
 assert.ok(html.includes('wrdi-ten-kit-panel-v1414.js?v=14210'));
 assert.ok(panel.includes('fiveRuneAnalysis'));
});
