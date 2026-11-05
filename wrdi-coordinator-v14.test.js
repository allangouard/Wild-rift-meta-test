const assert = require('node:assert/strict');
const fs = require('node:fs');
const {test} = require('node:test');
const core = require('./wrdi-core-v14.js');
const coordinator = require('./wrdi-coordinator-v14.js');
const catalog = JSON.parse(fs.readFileSync('data/items-client-7.3d-v12.json','utf8'));
const rules = JSON.parse(fs.readFileSync('data/item-restrictions-client-7.3d-v12.json','utf8'));

const picks = ['1','2','10099','','','6','7','8','9','10'];
const rows = () => picks.slice(5).map(id => ({id}));
const input = () => ({picks:[...picks],patch:'7.3d',rank:'1',sourceRevision:'test'});
function setup(overrides={}){
  let state=input();
  const config={
    core,
    getInput:()=>state,
    loadCatalog:async()=>catalog,
    loadRules:async()=>rules,
    loadThreats:async()=>rows(),
    loadEnemyBuilds:async()=>rows(),
    ...overrides
  };
  return {
    engine:coordinator.create(config),
    change:x=>{state={...state,...x};}
  };
}

test('01 - Analyse valide mais non eligible aux recommandations',async()=>{
  const {engine}=setup();
  const r=await engine.run();
  assert.equal(r.ok,true);
  assert.equal(r.status,'audit-only');
  assert.equal(r.recommendationEligible,false);
});

test('02 - Objets incompatibles detectes',async()=>{
  const {engine}=setup({makeCandidates:()=>[['void_staff','cryptbloom']]});
  const r=await engine.run();
  assert.equal(r.candidates[0].validation.valid,false);
});

test('03 - Rapport avec adversaires mal ordonnes rejete',async()=>{
  const {engine}=setup({loadThreats:async()=>rows().reverse()});
  assert.equal((await engine.run()).status,'invalid-reports');
});

test('04 - Patch different du catalogue rejete',async()=>{
  const {engine}=setup({getInput:()=>({...input(),patch:'9.9z'})});
  assert.equal((await engine.run()).status,'invalid-sources');
});

test('05 - Modification de draft pendant une requete',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const {engine,change}=setup({loadThreats:async()=>{await gate;return rows();}});
  const pending=engine.run();
  await new Promise(resolve=>setImmediate(resolve));
  change({picks:[...picks.slice(0,5),'11',...picks.slice(6)]});
  release();
  assert.equal((await pending).status,'stale');
});

test('06 - Analyse plus ancienne ignoree',async()=>{
  let release;
  let calls=0;
  const gate=new Promise(resolve=>{release=resolve;});
  const {engine}=setup({loadThreats:async()=>{
    calls++;
    if(calls===1)await gate;
    return rows();
  }});
  const old=engine.run();
  await new Promise(resolve=>setImmediate(resolve));
  const latest=await engine.run();
  release();
  assert.equal(latest.ok,true);
  assert.equal((await old).status,'stale');
  assert.equal(engine.getLast(),latest);
});

test('07 - Annulation invalide le resultat en cours',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const {engine}=setup({loadEnemyBuilds:async()=>{await gate;return rows();}});
  const pending=engine.run();
  await new Promise(resolve=>setImmediate(resolve));
  engine.invalidate();
  release();
  assert.equal((await pending).status,'stale');
  assert.equal(engine.getLast(),null);
});
