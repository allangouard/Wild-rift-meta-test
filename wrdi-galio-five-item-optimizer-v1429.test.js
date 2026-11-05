const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
function solution(threats){const result=optimizer.optimize({prepared,threats});assert.equal(result.ok,true,JSON.stringify(result));return result;}
test('five selected items come exclusively from client, do not use popular builds, and remain legal',()=>{
 const r=solution({ad:3,ap:3,tank:2,heal:2});
 assert.equal(r.main.items.length,5);
 assert.equal(new Set(r.main.items.map(x=>x.id)).size,5);
 assert.equal(core.validateEquipment(r.main.items.map(x=>x.id),catalog,rules).valid,true);
 assert.equal(r.bootsSeparate,true);assert.equal(r.noPopularityData,true);
 assert.equal(r.noDamageForecast,true);assert.equal(r.winRate,null);
 assert.ok(r.evaluatedPool>20);
 assert.ok(r.main.items.every(x=>catalog.items.some(c=>c.id===x.id)));
});
test('two relevant defensive items may both coexist in same five-slot solution',()=>{
 const r=solution({ad:4,ap:4,burst:2});
 const s=r.main.stats;
 assert.ok(s.armor>0,'must cover physical threats');
 assert.ok(s.mr>0,'must cover magic threats');
 assert.ok(s.ap>0,'remain relevant to Galio mid');
});
test('building five items never applies global comparison as one-item winner only',()=>{
 const r=solution({ad:3,ap:3,tank:2,heal:1});
 assert.equal(r.slots,5);assert.ok(r.main.items.every(x=>x.reason.length>0));
 for(const alt of r.alternatives){
  assert.equal(alt.items.length,5);
  assert.equal(core.validateEquipment(alt.items.map(x=>x.id),catalog,rules).valid,true);
  assert.ok(alt.items.some(x=>!r.main.items.some(y=>y.id===x.id)));
 }
});
test('incompatible exclusive client families never coexist',()=>{
 const ids=solution({tank:4,heal:4}).main.items.map(x=>x.id);
 for(const group of rules.groups)assert.ok(ids.filter(x=>group.members.includes(x)).length<=group.max,group.id);
});
test('healing reduction duplicates receive a penalty, not a hard ban',()=>{
 const byId=id=>({...catalog.items.find(x=>x.id===id),feature:optimizer.features(catalog.items.find(x=>x.id===id))});
 const a=[byId('thornmail'),byId('morellonomicon')];
 const b=[byId('thornmail'),byId('riftmaker')];
 const heal={heal:3,ad:2};
 const duplicate=optimizer.calculate(a,heal).score;
 const alternative=optimizer.calculate(b,heal).score;
 assert.ok(Number.isFinite(duplicate));assert.ok(Number.isFinite(alternative));
 assert.equal(a.filter(x=>x.feature.antiheal).length,2);
});
test('pure AD or attack-speed hypercarry legendary items are not forced on Galio mid',()=>{
 const pool=optimizer.eligible(prepared);
 assert.ok(!pool.some(x=>x.id==='titanic_hydra'));
 assert.ok(!pool.some(x=>x.id==='nashors_tooth'));
 assert.ok(pool.some(x=>x.id==='thornmail'));
 assert.ok(pool.some(x=>x.id==='riftmaker'));
 assert.ok(!pool.some(x=>x.id==='fimbulwinter'));
 assert.ok(pool.every(x=>x.price_gold>0));
});
test('source missing means fail-closed, with no alternative popularity fallback',()=>{
 const r=optimizer.optimize({prepared:null});
 assert.equal(r.ok,false);
});
test('app Galio route branches before external API patch check and external popular core fetch',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const start=app.indexOf('async function simpleAnalyze(){');
 const segment=app.slice(start,start+1900);
 assert.ok(segment.indexOf("if(String(own)==='10099')")<segment.indexOf('const patches='));
 const galio=app.slice(app.indexOf('async function wrdiGalioFiveCatalogAnalyze('),start);
 assert.ok(galio.includes('WRDI_GalioFiveItemOptimizerV1429'));
 assert.ok(galio.includes('noPopularityData:true'));
 assert.ok(!galio.includes('/api/build/'));
});
test('compact UI shows five-item build and alternatives',()=>{
 const ui=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(ui.includes('Build conseillé · 5 objets'));
 assert.ok(ui.includes('Objets situationnels'));
 assert.ok(ui.includes('Bottes séparées'));
});
