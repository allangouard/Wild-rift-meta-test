const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const swaps=require('./wrdi-galio-rune-swaps-v1422.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const catalog=require('./data/rune-catalog-client-v14.json');
const bridge=require('./wrdi-rune-bridge-v14.js');
const pe=require('./wrdi-galio-player-evidence-v1416.js');
const log=require('./data/galio-rune-training-observations-v1415.json');
const names=['Top','Jungle','Galio','ADC','Support','Top e','Jungle e','Zed','ADC e','Support e'];
function fixture(mid='Zed',support='Support e',jungle='Jungle e'){
 const chosen=[...names];chosen[7]=mid;chosen[9]=support;chosen[6]=jungle;
 const roles=['Top allié','Jungle allié','Galio mid','ADC allié','Support allié','Top adverse','Jungle adverse','Mid adverse','ADC adverse','Support adverse'];
 const kits={ok:true,all:roles.map((role,i)=>({role,id:String(100+i),available:true,signals:[]}))};
 const pages=advisor.STRATEGIES.map(t=>({id:t.id,label:t.label,page:{keystone:t.keystone,primaryTree:t.tree,primary:[...t.primary],secondary:t.secondary}}));
 const midProfiles={Zed:['assassin_burst'],Syndra:['ranged_control','magic_burst'],Brand:['ranged_control'],Ahri:['charm_interrupt']};
 const curatedMid={ok:true,profile:midProfiles[mid]?{name:mid,traits:midProfiles[mid].map(id=>({id}))}:null};
 const jungleProfiles=(jungle==='Vi')?[{id:kits.all[6].id,name:'Vi',role:'Jungle adverse',traits:[{key:'dive'}]}]:[];
 const supportProfiles=(support==='Nautilus')?[{id:kits.all[9].id,name:'Nautilus',role:'Support adverse',traits:[{key:'hard_cc'}]}]:[];
 const five={ok:true,profiles:[...jungleProfiles,...supportProfiles]};
 return {kitData:kits,championNames:chosen,pages,curatedMid,five,bridge,catalog,playerEvidence:pe.summarize(log)};
}
test('Zed lane all-in suggests Bone Plating in legal Resolve row 2',()=>{
 const r=swaps.adapt(fixture());assert.equal(r.ok,true);
 const p=r.pages.find(x=>x.id==='engage');
 assert.equal(p.page.primary[1],"Plaque d'os");
 assert.ok(p.changes.some(x=>x.from==='Second souffle'&&x.to==="Plaque d'os"));
 assert.ok(r.pages.every(x=>bridge.validate(x.page,catalog).valid));
 assert.equal(r.automaticOptimalRecommendation,false);
 assert.ok(p.confirmations.some(x=>x.testId==='glacial-w'&&x.triggered));
});
test('poke-oriented Brand retains Second Wind and replaces Bone Plating where available',()=>{
 const f=fixture('Brand');f.kitData.all[7].signals=['overtime'];
 const r=swaps.adapt(f);
 const p=r.pages.find(x=>x.id==='resilience');
 assert.equal(p.page.primary[1],'Second souffle');
 assert.equal(r.pages.find(x=>x.id==='engage').page.primary[1],'Second souffle');
});
test('conflicting burst and poke signals do not force a lane rune swap',()=>{
 const r=swaps.adapt(fixture('Syndra'));
 assert.equal(r.pages.find(x=>x.id==='engage').page.primary[1],'Second souffle');
 assert.equal(r.pages.find(x=>x.id==='resilience').page.primary[1],'Second souffle');
});
test('Nautilus CC prioritizes Perseverance in its exact legal row',()=>{
 const r=swaps.adapt(fixture('Zed','Nautilus'));
 const p=r.pages.find(x=>x.id==='resilience');
 assert.equal(p.page.primary[2],'Persévérance');
 assert.ok(p.changes.some(c=>c.from==='Surcroissance'&&c.to==='Persévérance'));
 assert.ok(r.pages.every(p=>bridge.validate(p.page,catalog).valid));
});
test('Missing champion kit disables all adaptation rather than inventing absence of threats',()=>{
 const f=fixture();f.kitData.all[4].available=false;
 const r=swaps.adapt(f);assert.equal(r.ok,true);
 assert.equal(r.changedPages,0);
 assert.equal(r.context.ready,false);
});
test('No cross-tree illegal secondary substitutions, no changing keystone',()=>{
 const r=swaps.adapt(fixture('Zed','Nautilus','Vi'));
 for(const p of r.pages){assert.equal(bridge.validate(p.page,catalog).valid,true);
  assert.equal(p.page.keystone,p.originalPage.keystone);
  assert.equal(p.page.primaryTree,p.originalPage.primaryTree);
  assert.equal(p.page.primary.length,3);
 }
});
test('V14.22 page loads adapter and shows replacements',()=>{
 const html=fs.readFileSync('index-v1422.html','utf8');
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(html.includes('wrdi-galio-rune-swaps-v1422.js?v=14220'));
 assert.ok(html.includes('wrdi-ten-kit-panel-v1414.js?v=14220'));
 assert.ok(panel.includes('swap.changedPages'));
 assert.ok(panel.includes('substitutions possibles'));
});
