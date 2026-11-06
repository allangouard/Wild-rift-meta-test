const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-draft-engine-v15.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const core=require('./wrdi-core-v14.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const contingencies=require('./wrdi-galio-contingencies-v1433.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const modules={profiles,core,team,guard,optimizer,order,contingency:contingencies,
 runeBridge:bridge,runeAdvisor:advisor};
const draft=['Aatrox','Lee Sin','Galio','Ashe','Lux','Ornn',"Kha'Zix",'Zed',"Kai'Sa",'Morgana'];
const picks=['1','2','10099','4','5','6','7','8','9','10'];
const champs=Object.fromEntries(picks.map((id,i)=>[id,draft[i]]));
function analyze(names=draft){return engine.analyze({picks,champions:Object.fromEntries(picks.map((id,i)=>[id,names[i]])),
 catalog,rules,runes,modules});}
test('ten champions pass into a single five-item client-only composition, legal order and conditional swaps',()=>{
 const r=analyze();assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.build.items.length,5);
 assert.equal(new Set(r.build.items.map(i=>i.id)).size,5);
 assert.equal(r.build.noPopularBuilds,true);
 assert.equal(r.methods.exactOptimalityProven,false);
 assert.equal(r.methods.liveTracking,false);
 assert.equal(core.validateEquipment(r.build.items.map(i=>i.id),catalog,rules).valid,true);
 for(const s of r.build.alternatives){
  assert.equal(s.verifiedLegal,true);
  assert.equal(core.validateEquipment(s.newIds,catalog,rules).valid,true);
  assert.ok(r.build.items.some(i=>i.id===s.remove.id));
 }
});
test('Galio draft rune advice validates against player client and never invents a winrate',()=>{
 const r=analyze();
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.runes.ok,true,JSON.stringify(r.runes));
 assert.equal(bridge.validate(r.runes.page,runes).valid,true);
 assert.equal(r.runes.selection,'galio_mid_build_role_coherence_client_runes_not_empirical_winrate');
});
test('the old result cannot silently substitute a popular observed build if a module is missing',()=>{
 const bad={...modules,optimizer:null};
 const r=engine.analyze({picks,champions:champs,catalog,rules,runes,modules:bad});
 assert.equal(r.ok,false);assert.equal(r.stage,'modules');
});
test('incomplete, repeated or non-Galio drafts fail closed',()=>{
 assert.equal(engine.analyze({picks:picks.slice(0,9),champions:champs,catalog,rules,runes,modules}).ok,false);
 assert.equal(engine.analyze({picks:[...picks.slice(0,9),picks[1]],champions:champs,catalog,rules,runes,modules}).ok,false);
 assert.equal(engine.analyze({picks:picks.map((x,i)=>i===2?'11':x),champions:champs,catalog,rules,runes,modules}).ok,false);
});
test('champion category source is explicit and separate from ranked item data',()=>{
 assert.deepEqual(profiles.lookup('Zed'),['ad','assassin']);
 assert.deepEqual(profiles.lookup("Kha'Zix"),['ad','assassin']);
 assert.equal(profiles.lookup('UnknownChampion'),null);
 assert.ok(!fs.readFileSync('wrdi-champion-profiles-v15.js','utf8').includes('/api/build/'));
});
test('V15 entrypoint is independent of legacy script chain and has only required scripts',()=>{
 const html=fs.readFileSync('index-v15.html','utf8');
 const list=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(x=>x[1]);
 assert.equal(list.length,12);
 for(const path of list)assert.ok(fs.existsSync(path.slice(2).split('?')[0]),path);
 for(const forbidden of ['assets/app.js','assets/galio-decision-v13.js','assets/optimizer-v12.js',
  'wrdi-galio-item-comparator-v1428.js','wrdi-diagnostic-v14.js','wrdi-compact-dashboard-v1423.js'])
  assert.ok(!html.includes(forbidden),'legacy forbidden '+forbidden);
 assert.ok(html.indexOf('kit-item-synergy-v1434.js')<html.indexOf('five-item-optimizer-v1429.js'));
});
test('rune page comes from the validated client catalogue; no fallback to observed pages',()=>{
 const s=fs.readFileSync('wrdi-draft-engine-v15.js','utf8');
 assert.ok(s.includes('bridge.validate(page,catalog)'));
 assert.ok(!s.includes('/api/build/'));
 assert.ok(!s.includes('rankedByWinRate'));
});
