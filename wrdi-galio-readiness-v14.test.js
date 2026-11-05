const {test}=require('node:test');
const assert=require('node:assert/strict');
const api=require('./wrdi-galio-readiness-v14.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
function fixture(){
 return {
   core,catalog,rules,
   report:{ok:true,patch:'7.3d'},
   summary:{ok:true,enemies:[0,1,2,3,4].map(i=>({
     roleMatched:true,kitVersion:'7.3',buildsPatch:'7.3e',
     missingNames:0
   }))}
 };
}
test('Bloque simulation et conseil automatique pour le catalogue exploratoire',()=>{
 const r=api.evaluate(fixture());
 assert.equal(r.ok,true);
 assert.equal(r.automaticRecommendationAllowed,false);
 assert.equal(r.comparativeDamageAllowed,false);
 assert.equal(r.status,'simulation-not-certified');
 assert.ok(r.blockers.some(x=>x.includes('exploratoire')));
});
test('Signale les correctifs non integres et les versions incompatibles',()=>{
 const r=api.evaluate(fixture());
 assert.ok(r.blockers.some(x=>x.includes('Correctifs du patch')));
 assert.ok(r.blockers.some(x=>x.includes('autre version')));
 assert.equal(r.patch,'7.3d');
});
test('Ne conclut jamais que des mentions lexicales mesurent les degats',()=>{
 const r=api.evaluate(fixture());
 assert.ok(r.notices.some(x=>x.includes('répartition physique/magique')));
 assert.ok(r.blockers.some(x=>x.includes('non calibré')));
});
test('Rejette rapports et sources incomplets sans plantage',()=>{
 const r=api.evaluate({});
 assert.equal(r.ok,false);
 assert.equal(r.automaticRecommendationAllowed,false);
 assert.ok(r.blockers.length>=3);
});
test('Rejette des sources de versions inconnues',()=>{
 const x=fixture();x.summary.enemies[2].buildsPatch=null;
 const r=api.evaluate(x);
 assert.ok(r.blockers.some(x=>x.includes('inconnues')));
});
test('Signale les noms adverses manquants',()=>{
 const x=fixture();x.summary.enemies[0].missingNames=2;
 const r=api.evaluate(x);
 assert.ok(r.notices.some(x=>x.includes('noms')));
});
test('Rejette une synthese de moins de cinq ennemis',()=>{
 const x=fixture();x.summary.enemies.pop();
 const r=api.evaluate(x);
 assert.ok(r.blockers.some(x=>x.includes('Cinq profils')));
});
test('Rejette un poste non confirme',()=>{
 const x=fixture();x.summary.enemies[1].roleMatched=false;
 const r=api.evaluate(x);
 assert.ok(r.blockers.some(x=>x.includes('postes')));
});
test('La discordance de patch du rapport est bloquante',()=>{
 const x=fixture();x.report.patch='7.4';
 const r=api.evaluate(x);
 assert.ok(r.blockers.some(x=>x.includes('non concordant')));
});
test('Les recommandations restent bloquees meme sans indicateurs de versions divergentes',()=>{
 const x=fixture();
 x.summary.enemies.forEach(e=>{e.kitVersion='7.3d';e.buildsPatch='7.3d';});
 const r=api.evaluate(x);
 assert.equal(r.automaticRecommendationAllowed,false);
 assert.ok(r.blockers.some(x=>x.includes('combat Galio')));
});
