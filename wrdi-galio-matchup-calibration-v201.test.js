'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('./wrdi-draft-engine-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const runeBridge=require('./wrdi-rune-bridge-v14.js');
const runeAdvisor=require('./wrdi-galio-rune-advisor-v1411.js');
const boots=require('./wrdi-galio-boots-v18.js');
const runes=require('./data/rune-catalog-client-v14.json');
const bootsCatalog=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const catalog=require('./data/items-client-7.3d-v12.json');
const burstItems=['ludens_echo','rabadons_deathcap','infinity_orb','riftmaker','morellonomicon'].map(id=>catalog.items.find(x=>x.id===id));
const alliedBurst=['Ornn','Amumu','Galio','Caitlyn','Leona'];
const alliedHybrid=['Riven','Viego','Galio','Miss Fortune','Nami'];
function make(mid,allies=alliedBurst){
 const enemies=['Darius','Lee Sin',mid,'Jinx','Janna'];
 const r=team.make({allies,enemies,lookup:profiles.lookup});
 assert.equal(r.ok,true);
 return r.threats;
}
function rune(mid,role,allies){
 const needs=make(mid,allies);
 const r=engine.chooseRune({bridge:runeBridge,catalog:runes,advisor:runeAdvisor,
  needs,role,items:burstItems,laneOpponent:mid});
 assert.equal(r.ok,true);
 assert.equal(runeBridge.validate(r.page,runes).valid,true);
 return {r,needs};
}
test('V20.1: Orianna ranged AP poke selects Comet, Second Wind and legal page',()=>{
 const {r,needs}=rune('Orianna','ap_burst');
 assert.equal(needs.lanePoke,1);
 assert.equal(needs.laneHardEngage,0);
 assert.equal(r.page.keystone,'Comète arcanique');
 assert.equal(r.page.secondary,'Second souffle');
});
test('V20.1: Syndra burst matchup keeps Electrocute, Bone Plating',()=>{
 const {r,needs}=rune('Syndra','ap_burst');
 assert.equal(needs.laneMagic,1);
 assert.equal(needs.laneHardEngage,1);
 assert.equal(r.page.keystone,'Électrocution');
 assert.equal(r.page.secondary,"Plaque d'os");
});
test('V20.1: Yasuo melee auto-attacks favor conditional Grasp for Galio hybrid',()=>{
 const {r,needs}=rune('Yasuo','hybrid_offensive',alliedHybrid);
 assert.equal(needs.laneAutoAttackPressure,1);
 assert.equal(needs.laneTradeMelee,1);
 assert.equal(needs.laneHardEngage,1);
 assert.equal(r.page.keystone,"Poigne de l'immortel");
 assert.equal(r.page.primary[1],"Plaque d'os");
});
test('V20.1: Zed physical assassin is not mislabeled auto-attack damage',()=>{
 const {r,needs}=rune('Zed','ap_burst');
 assert.equal(needs.lanePhysical,1);
 assert.equal(needs.laneAutoAttackPressure,0);
 assert.equal(needs.laneHardEngage,1);
 assert.equal(r.page.keystone,'Électrocution');
 assert.equal(r.page.secondary,"Plaque d'os");
});
test('V20.1: steelcaps explicitly gain value versus Yasuo autos, not spell-only Zed',()=>{
 const yas=boots.select({bootsCatalog,threats:make('Yasuo',alliedHybrid),role:'hybrid_offensive'});
 const zed=boots.select({bootsCatalog,threats:make('Zed',alliedHybrid),role:'hybrid_offensive'});
 assert.equal(yas.ok,true);assert.equal(zed.ok,true);
 const rank=r=>r.candidates.find(x=>x.name==='Coques en acier');
 assert.ok(rank(yas).score>rank(zed).score,'Yasuo autos should increase Steelcaps score');
 assert.ok(rank(yas).reason.includes('Mid centré sur les attaques'));
 assert.ok(rank(zed).reason.includes('assassin AD à sorts'));
});
test('V20.1: role remains the principal determinant of core, not enemy mid name',()=>{
 for(const mid of ['Syndra','Orianna','Yasuo','Zed']){
  const threats=make(mid);
  const planner=require('./wrdi-galio-role-planner-v18.js');
  assert.equal(planner.chooseRole(threats),'ap_burst');
  assert.deepEqual(planner.CORES.ap_burst,['ludens_echo','rabadons_deathcap','infinity_orb']);
 }
});

test('V20.1: thornmail third is an exception only with AD autos, healing and frontline duty',()=>{
 const order=require('./wrdi-galio-purchase-order-v1432.js');
 const thorn=catalog.items.find(x=>x.id==='thornmail');
 const severe={ad:4,lanePhysical:1,laneAutoAttackPressure:1,
  frontlineNeed:2,healPressure:3,frontlineProvided:0};
 const base=order.stageScore(thorn,{...severe,laneAutoAttackPressure:0},2);
 const priority=order.stageScore(thorn,severe,2);
 assert.ok(priority.score>=base.score+6,'Specific mid+draft pressure should advance Thornmail');
 const irrelevant=order.stageScore(thorn,{...severe,frontlineNeed:0},2);
 assert.ok(priority.score>irrelevant.score,'Do not advance pure defense for a Galio AP carry');
 const noHeal=order.stageScore(thorn,{...severe,healPressure:0},2);
 assert.ok(priority.score>noHeal.score);
});
test('V20.1: fourth physical or magic defense is paced before fifth when frontline',()=>{
 const order=require('./wrdi-galio-purchase-order-v1432.js');
 const armor=catalog.items.find(x=>x.id==='thornmail');
 const magic=catalog.items.find(x=>x.id==='force_of_nature');
 const ad={ad:4,ap:1,lanePhysical:1,frontlineNeed:2};
 const ap={ad:1,ap:4,laneMagic:1,frontlineNeed:2};
 assert.ok(order.stageScore(armor,ad,3).score>order.stageScore(armor,{...ad,lanePhysical:0},3).score);
 assert.ok(order.stageScore(magic,ap,3).score>order.stageScore(magic,{...ap,laneMagic:0},3).score);
});
