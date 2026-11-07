'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const evidence=require('./wrdi-client-numeric-evidence-v195.js');
const combat=require('./wrdi-client-combat-v196.js');
const tables=require('./data/wild-rift-client-rank-tables-v195.json');
const facts=require('./data/wild-rift-client-tooltip-facts-v195.json');
const ready=combat.prepare(evidence.prepare(tables,facts));
test('all 14 client datasets reach the combat arithmetic module',()=>{
 assert.equal(ready.ok,true);
 const report=ready.inspectDraft({names:['Ornn','Amumu','Galio','Caitlyn','Leona',"Cho'Gath",'Skarner','Mel',"Kog'Maw",'Zilean']});
 assert.equal(report.ok,true);
 assert.equal(report.champions.length,5);
 assert.ok(report.damageRows>=10);
 assert.ok(report.coefficients>=10);
 assert.ok(report.enemyMaxHpNumericSources>=2);
});
test('Cho Gath Q uses recorded base at each rank and observed AP coefficient',()=>{
 const first=ready.ability("Cho'Gath",'q',1,{ap:300});
 const fourth=ready.ability("Cho'Gath",'q',4,{ap:300});
 assert.equal(first.ok,true);
 assert.equal(first.base.base_magic_damage,80);
 assert.equal(fourth.base.base_magic_damage,245);
 assert.equal(first.calculated[0].total,380);
 assert.equal(fourth.calculated[0].total,545);
 assert.equal(fourth.coefficients[0].acrossRanksAssumed,true);
});
test('unknown statistics and unsupported ranks are not invented',()=>{
 const unknown=ready.ability("Cho'Gath",'q',3);
 assert.equal(unknown.calculated[0].total,null);
 assert.equal(ready.ability('Nidalee','r',1).ok,false);
 assert.equal(ready.ability('Taliyah','r',4).ok,false);
 assert.deepEqual(ready.ability('Taliyah','r',3).base.cooldown_s,80);
});
test('draft pressure is based on rank-table fields, not inferred builds',()=>{
 const a=ready.inspectDraft({names:['Ornn','Amumu','Galio','Caitlyn','Leona','Garen','Lee Sin','Orianna','Jinx','Janna']});
 const b=ready.inspectDraft({names:['Ornn','Amumu','Galio','Caitlyn','Leona',"Cho'Gath",'Skarner','Mel',"Kog'Maw",'Zilean']});
 assert.equal(a.enemyMaxHpNumericSources,0);
 assert.ok(b.enemyMaxHpNumericSources>=2);
 assert.equal(b.actualEnemyStatsKnown,false);
});
