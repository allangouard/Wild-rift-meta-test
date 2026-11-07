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

test('every extracted client rank row and coefficient is accessible, including passives',()=>{
 const all=ready.inspectDraft({names:tables.champions.map(x=>x.name)});
 assert.equal(all.champions.length,14);
 assert.equal(all.rankRows,150);
 assert.equal(all.rankValues,564);
 assert.equal(all.coefficients,70);
 assert.equal(all.champions.every(x=>x.allTooltipSlots===5),true);
 assert.ok(all.mappedCoefficients>40);
});
test('separate spell components retain their own ratios and ranks',()=>{
 const mel=ready.ability('Mel','e',4,{ap:200});
 const impact=mel.calculated.find(x=>x.field==='base_magic_damage');
 const dot=mel.calculated.find(x=>x.field==='damage_per_second');
 assert.equal(impact.contributions[0].ratio,0.5);
 assert.equal(dot.contributions[0].ratio,0.06);
 assert.equal(mel.assumptions.length,1);
 const heal=ready.ability('Zilean','r',1,{ap:100}).calculated.find(x=>x.field==='revive_base_heal');
 assert.equal(heal.total,800);
});
test('client passive facts and conditional abilities affect enemy-mechanics counters',()=>{
 const a=ready.inspectDraft({names:['Ornn','Amumu','Galio','Caitlyn','Leona',"Cho'Gath","K'Sante",'Mel','Smolder','Zilean']});
 assert.ok(a.enemyMaxHpSources>=2);
 assert.ok(a.enemyAllyShieldSources>=2);
 assert.ok(a.enemySelfHealingSources>=1);
 assert.ok(a.enemyReflectSources>=1);
 assert.ok(a.enemyReviveSources>=1);
 assert.equal(a.conditionalEffectsNotAssumed,true);
});
test('role planner responds to real client-percent-HP pressure without changing AP objective',()=>{
 const planner=require('./wrdi-galio-role-planner-v18.js');
 const item={id:'test_hp',stats:{hp:350,ap:45},feature:{ap:45,hp:350}};
 const base=planner.evaluate(item,'hybrid_offensive',{enemyMaxHpNumericSources:0}).score;
 const vs=planner.evaluate(item,'hybrid_offensive',{enemyMaxHpNumericSources:2}).score;
 assert.ok(vs<base);
 assert.equal(planner.chooseRole({frontlineProvided:3,damageDuty:2,enemyMaxHpNumericSources:3}),'ap_burst');
});

test('Mel multihit uses real client hit count and per-hit AP without guaranteed hits',()=>{
 const a=ready.ability('Mel','q',1,{ap:200});
 assert.ok(a.multihit);
 assert.equal(a.multihit.hits,7);
 assert.equal(a.multihit.fullHitBase,77);
 assert.equal(a.multihit.fullHitWithStats,161);
 assert.equal(a.multihit.allHitsRequired,true);
 assert.equal(a.multihit.matchesClientBase,true);
});
test('damage source channels are documented by client tables',()=>{
 const x=ready.inspectDraft({names:['Ornn','Amumu','Galio','Caitlyn','Leona',"K'Sante",'Skarner','Mel',"Kog'Maw",'Smolder']});
 assert.ok(x.enemyMagicDamageSources>=2);
 assert.ok(x.enemyPhysicalDamageSources>=2);
});

test('target max HP percentage comes from client rank, target HP must be provided',()=>{
 const raw=ready.ability("Cho'Gath",'e',1);
 const percent=raw.calculated.find(x=>x.field==='target_max_hp_magic_damage_pct');
 assert.equal(percent.base,2.3);
 assert.equal(percent.total,null);
 assert.equal(percent.targetMaxHpRequired,true);
 const dmg=ready.ability("Cho'Gath",'e',1,{target_max_hp:2000}).calculated.find(x=>x.field==='target_max_hp_magic_damage_pct');
 assert.equal(dmg.total,46);
 const kog=ready.ability("Kog'Maw",'w',4,{target_max_hp:2000}).calculated.find(x=>x.field==='target_max_hp_magic_damage_pct');
 assert.equal(kog.total,90);
});
