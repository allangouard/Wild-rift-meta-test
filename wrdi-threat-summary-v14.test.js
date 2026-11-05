const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('./wrdi-threat-summary-v14.js');
const ids=['10002','10018','10003','10005','10001'];
const kits=[
 ['physical','knockup','slow','heal','maxhp'],
 ['magic','stun','root','overtime'],
 ['magic','charm','dash'],
 ['physical','slow'],
 ['magic','knockup','stun']
];
function fixture(){
 return {ok:true,patch:'7.3d',threats:ids.map((id,i)=>({
   id,name:['Aatrox','Amumu','Ahri','Ashe','Alistar'][i],sourceVersion:'7.3',
   signals:kits[i].map(x=>({id:x}))
 })),enemyBuilds:ids.map((id,i)=>({
   id,roleMatched:true,sourcePatch:'7.3e',cores:[{
     ids:['a','b','c'],names:i===0?['Éclipse',null,'Danse de la mort']:['Objet A','Objet B','Objet C'],
     classification:i===0?{ranked:['ad','tank']}:{ranked:['ap']}
   }]
 }))}
}
test('Cinq kits : comptage par champion et non par occurrence',()=>{
 const x=fixture();x.threats[1].signals.push({id:'magic'});
 const r=api.summarize(x);
 assert.equal(r.ok,true);
 assert.equal(r.counts.physical,2);
 assert.equal(r.counts.magic,3);
 assert.equal(r.counts.cc,3);
 assert.equal(r.counts.heal,1);
 assert.equal(r.counts.maxhp,1);
 assert.equal(r.counts.overtime,1);
});
test('Versions divergentes signalees, pas de build annonce',()=>{
 const r=api.summarize(fixture());
 assert.equal(r.buildRecommendationEligible,false);
 assert.ok(r.notices.some(s=>s.includes('versions différentes')));
 assert.deepEqual(r.buildPatches,['7.3e']);
});
test('Noms manquants et orientations qualificatives',()=>{
 const r=api.summarize(fixture());
 assert.equal(r.enemies[0].missingNames,1);
 assert.deepEqual(r.enemies[0].orientations,['ad','tank']);
 assert.ok(r.notices.some(s=>s.includes('non résolus')));
});
test('Aucune dominante inventee pour une mention lexicale',()=>{
 const r=api.summarize(fixture());
 assert.equal('physicalDominant' in r.counts,false);
 assert.ok(r.notices.some(s=>s.includes('dominante')));
});
test('Rapport incomplet refuse',()=>{
 for(const bad of [null,{}, {ok:true,threats:[],enemyBuilds:[]}]){
   assert.equal(api.summarize(bad).ok,false);
 }
});
test('Desalignement de la draft refuse',()=>{
 const x=fixture();x.enemyBuilds[2].id='wrong';
 assert.equal(api.summarize(x).ok,false);
});
test('Champs optionnels et inconnus ne provoquent pas de plantage',()=>{
 const x=fixture();
 x.threats[0].signals=null;
 x.threats[0].sourceVersion=null;
 x.enemyBuilds[0].cores=[{ids:['z']}];
 x.enemyBuilds[0].sourcePatch=null;
 const r=api.summarize(x);
 assert.equal(r.ok,true);
 assert.equal(r.enemies[0].missingNames,1);
 assert.deepEqual(r.enemies[0].orientations,[]);
 assert.ok(r.notices.some(s=>s.includes('inconnue')));
});
