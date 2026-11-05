const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const item=id=>catalog.items.find(x=>x.id===id);
const featured=id=>({...item(id),feature:optimizer.features(item(id))});
const solve=needs=>{const r=optimizer.optimize({prepared,threats:needs});assert.equal(r.ok,true,r.reason);return r;};
test('client active stasis item is an independent purchasable item eligible for a five-item build',()=>{
 const pool=optimizer.eligible(prepared);
 assert.ok(pool.some(x=>x.id==='zhonyas_hourglass'));
 assert.ok(pool.some(x=>x.id==='hextech_rocketbelt'));
 assert.ok(!pool.some(x=>x.id==='seekers_armguard'));
 assert.equal(optimizer.features(item('zhonyas_hourglass')).stasis,true);
});
test('stasis usefulness rises under assassin burst rather than arbitrary champion-name rules',()=>{
 const five=[featured('riftmaker'),featured('zhonyas_hourglass'),featured('hollow_radiance')];
 const low=optimizer.calculate(five,{ad:2});
 const high=optimizer.calculate(five,{ad:2,assassin:3,burst:2});
 assert.ok(high.reasons.includes('Stase active contre un engagement explosif'));
 assert.ok(!low.reasons.includes('Stase active contre un engagement explosif'));
});
test('critical damage reduction is not an unconditional reason to buy Randuin',()=>{
 const items=[featured('randuins_omen'),featured('riftmaker')];
 const none=optimizer.calculate(items,{ad:3,crit:0});
 const crit=optimizer.calculate(items,{ad:3,crit:3});
 assert.ok(!none.reasons.some(x=>x.includes('critiques')));
 assert.ok(crit.reasons.some(x=>x.includes('critiques')));
 assert.ok(crit.score>none.score);
});
test('frontline responsibility changes balance without removing all Galio AP',()=>{
 const five=[featured('unending_despair'),featured('amaranths_twinguard'),featured('riftmaker'),featured('thornmail'),featured('hollow_radiance')];
 const normal=optimizer.calculate(five,{ad:3,ap:2});
 const frontline=optimizer.calculate(five,{ad:3,ap:2,frontlineNeed:2});
 assert.ok(frontline.reasons.some(x=>x.includes('Première ligne')));
 assert.notEqual(normal.score,frontline.score);
 const result=solve({ad:3,ap:1,assassin:3,frontlineNeed:2,crit:0});
 assert.equal(result.main.items.length,5);
 assert.ok(result.main.stats.armor>0);
 assert.ok(result.main.stats.hp>=300);
});
test('two active items can never coexist under client restrictions, but active items can occupy a primary slot',()=>{
 const result=solve({assassin:4,burst:3,ad:3});
 assert.ok(result.main.items.filter(x=>rules.known_active_item_ids.includes(x.id)).length<=1);
 assert.equal(result.activeItemsInFive,true);
 assert.ok(result.main.items.every(x=>x.id!=='seekers_armguard'));
});
test('no scenario hardcoded by champion identity in scoring engine',()=>{
 const js=fs.readFileSync('wrdi-galio-five-item-optimizer-v1429.js','utf8');
 for(const name of ['khazix','zed','morgana','kaisa','randuins_omen','zhonyas_hourglass']){
  assert.ok(!js.includes("'"+name+"'"),name);
 }
});
test('app sends ally frontline requirement and crit evidence, without inserting a champion-specific counter',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const section=app.slice(app.indexOf('async function wrdiGalioFiveCatalogAnalyze('),app.indexOf('async function simpleAnalyze(){'));
 assert.ok(section.includes('WRDI_GalioTeamContextV1431?.make'));
 assert.ok(section.includes('teamContext.threats'));
 assert.ok(section.includes('frontlineNeed'));
 assert.ok(!section.includes("if(enemyNames.includes('Zed'))"));
});
