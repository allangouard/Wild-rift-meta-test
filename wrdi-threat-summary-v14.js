/* WRDI V14.4 — synthese descriptive, aucune recommendation.
   Les mots-cles de sorts et classes de cores ne quantifient pas les degats. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WRDI_ThreatSummaryV14=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.4.0-alpha.1';
const SIGNALS=Object.freeze({
  magic:'Dégâts magiques mentionnés',
  physical:'Dégâts physiques mentionnés',
  true:'Dégâts véritables mentionnés',
  stun:'Étourdissement mentionné',
  knockup:'Projection mentionnée',
  root:'Immobilisation mentionnée',
  heal:'Soins mentionnés',
  shield:'Boucliers mentionnés',
  maxhp:'Effet lié aux PV maximum mentionné',
  overtime:'Effet périodique mentionné'
});
const CC=['stun','knockup','root'];
const ORIENTATIONS=['tank','ap','ad','crit','utilitaire'];
const string=x=>String(x??'').trim();
function summarize(report){
  if(!report?.ok||!Array.isArray(report.threats)||!Array.isArray(report.enemyBuilds)||
     report.threats.length!==5||report.enemyBuilds.length!==5)
    return {ok:false,error:'Rapport V14 incomplet ou indisponible'};
  const enemies=[];
  for(let i=0;i<5;i++){
    const threat=report.threats[i],build=report.enemyBuilds[i];
    if(!threat||!build||!string(threat.id)||string(threat.id)!==string(build.id))
      return {ok:false,error:'Identifiants de champions non concordants'};
    const ids=new Set((Array.isArray(threat.signals)?threat.signals:[]).map(x=>string(x?.id)).filter(Boolean));
    const cores=Array.isArray(build.cores)?build.cores:[];
    const orientations=[...new Set(cores.flatMap(core=>{
      const cl=core.classification;
      return Array.isArray(cl?.ranked)?cl.ranked.filter(x=>ORIENTATIONS.includes(x)):[];
    }))];
    const missingNames=cores.reduce((n,c)=>n+(Array.isArray(c.ids)?c.ids.filter((id,j)=>!string(c.names?.[j])).length:0),0);
    enemies.push(Object.freeze({
      id:string(threat.id),name:string(threat.name)||'Champion '+threat.id,
      mentioned:[...ids].filter(x=>x in SIGNALS),
      orientations,
      coreCount:cores.length,
      missingNames,
      roleMatched:build.roleMatched===true,
      kitVersion:string(threat.sourceVersion)||null,
      buildsPatch:string(build.sourcePatch)||null
    }));
  }
  const count=id=>enemies.filter(e=>e.mentioned.includes(id)).length;
  const versions=[...new Set(enemies.map(e=>e.kitVersion).filter(Boolean))];
  const buildsPatches=[...new Set(enemies.map(e=>e.buildsPatch).filter(Boolean))];
  const patch=string(report.patch);
  const notices=[];
  if(enemies.some(e=>!e.kitVersion))notices.push('Version de certaines fiches de compétences inconnue.');
  if(enemies.some(e=>!e.buildsPatch))notices.push('Patch de certains builds non renseigné.');
  if(versions.some(v=>v!==patch)||buildsPatches.some(v=>v!==patch))
    notices.push('Sources de versions différentes du catalogue client '+patch+' : pas de validation inter-patch.');
  if(enemies.some(e=>e.missingNames))
    notices.push('Certains objets restent non résolus : aucun nom ni effet ne doit être déduit de leur ID.');
  if(enemies.some(e=>!e.orientations.length))
    notices.push('Certains cores ne disposent d’aucune orientation qualitative reconnue.');
  notices.push('Mentions lexicales ≠ dominante de dégâts, importance du contrôle ou fréquence des soins.');
  notices.push('Cores observés ≠ inventaire réel des adversaires, ni probabilité du build dans cette partie.');
  return Object.freeze({
    ok:true,patch,game:'Wild Rift mobile',
    enemies:Object.freeze(enemies),
    counts:Object.freeze({
      magic:count('magic'),physical:count('physical'),true:count('true'),
      cc:enemies.filter(e=>CC.some(id=>e.mentioned.includes(id))).length,
      heal:count('heal'),shield:count('shield'),maxhp:count('maxhp'),
      overtime:count('overtime')
    }),
    kitVersions:versions,buildPatches:buildsPatches,
    notices:Object.freeze(notices),
    buildRecommendationEligible:false
  });
}
return Object.freeze({VERSION,SIGNALS,summarize});
});
