/* WRDI V14.1 - coordinateur sans effet sur l'interface ni les builds existants.
   Les fournisseurs sont injectes. Aucune donnee externe n'est presume valide. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.WRDI_CoordinatorV14=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.1.0-alpha.1';
function create({core,getInput,loadCatalog,loadRules,loadThreats,loadEnemyBuilds,makeCandidates}={}){
  if(!core||typeof core.createSnapshot!=='function'||typeof core.validateSources!=='function'||typeof core.validateEquipment!=='function')throw Error('WRDI_CoreV14 requis');
  for(const [name,fn] of Object.entries({getInput,loadCatalog,loadRules,loadThreats,loadEnemyBuilds})){
    if(typeof fn!=='function')throw Error('Fournisseur absent : '+name);
  }
  if(makeCandidates!==undefined&&typeof makeCandidates!=='function')throw Error('makeCandidates invalide');
  let sequence=0, last=null;
  const current=(token,snapshot)=>token===sequence&&core.isCurrent(snapshot,getInput());
  const stale=(snapshot)=>({ok:false,status:'stale',signature:snapshot.signature,reason:'Draft, patch ou analyse remplacee'});
  async function run(){
    const token=++sequence;
    last=null;
    let snapshot;
    try{snapshot=core.createSnapshot(getInput());}
    catch(error){return {ok:false,status:'invalid-draft',reason:String(error.message||error)};}
    try{
      const [catalog,rules]=await Promise.all([loadCatalog(snapshot),loadRules(snapshot)]);
      if(!current(token,snapshot))return stale(snapshot);
      const sources=core.validateSources(catalog,rules);
      if(!sources.ok||sources.patch!==snapshot.patch)return {ok:false,status:'invalid-sources',errors:[...sources.errors,...(sources.patch!==snapshot.patch?['Patch de draft different du catalogue']:[])],warnings:sources.warnings};
      const [threats,enemyBuilds]=await Promise.all([loadThreats(snapshot),loadEnemyBuilds(snapshot)]);
      if(!current(token,snapshot))return stale(snapshot);
      const expected=snapshot.picks.slice(5);
      const validRows=(rows)=>Array.isArray(rows)&&rows.length===5&&rows.every((row,i)=>row&&String(row.id)===expected[i]);
      if(!validRows(threats)||!validRows(enemyBuilds))return {ok:false,status:'invalid-reports',reason:'Rapports adverses absents, incomplets ou associes a une autre draft'};
      let candidates=[];
      if(makeCandidates){
        const proposed=await makeCandidates({snapshot,threats,enemyBuilds,catalog,rules});
        if(!current(token,snapshot))return stale(snapshot);
        if(!Array.isArray(proposed))return {ok:false,status:'invalid-candidates',reason:'Liste de candidats invalide'};
        candidates=proposed.map((ids,i)=>({index:i,ids,validation:core.validateEquipment(ids,catalog,rules)}));
      }
      const result=Object.freeze({ok:true,status:'audit-only',signature:snapshot.signature,patch:snapshot.patch,
        recommendationEligible:false,sourceRecommendationEligible:sources.recommendationEligible,
        threats,enemyBuilds,candidates,warnings:sources.warnings});
      last=result;
      return result;
    }catch(error){if(!current(token,snapshot))return stale(snapshot);
      return {ok:false,status:'error',reason:String(error.message||error)};}
  }
  function invalidate(){sequence++;last=null;}
  return Object.freeze({run,invalidate,getLast:()=>last});
}
return Object.freeze({VERSION,create});
});
