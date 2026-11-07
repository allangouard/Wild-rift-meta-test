/* V19.5 - client screenshot numerical evidence (Wild Rift, not PC).
 * Tabulated rank values are factual observations. A missing slot/row is unknown,
 * not zero. No unchecked patch, AP ratio or proc is fed into damage simulation.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_ClientNumericEvidenceV195=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='19.5.0',SLOTS=['passive','q','w','e','r'];
const fold=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function prepare(tables,facts){
 if(tables?.schema!=='wrdi.wild_rift_client_rank_tables.v195'||facts?.schema!=='wrdi.wild_rift_tooltip_facts.v195')
  return {ok:false,reason:'Fichiers client V19.5 invalides'};
 if(tables.game!=='Wild Rift mobile — not League of Legends PC'||facts.game!=='Wild Rift mobile')
  return {ok:false,reason:'Une source non Wild Rift a été détectée'};
 const map=new Map(),seenSources=new Set();let rows=0,cells=0,tooltips=0;
 for(const c of tables.champions||[]){
  const name=fold(c.name);if(!name||map.has(name))return {ok:false,reason:'Champion dupliqué'};
  const record={name:c.name,rankTables:c.abilities||{},tooltipFacts:{},numericStatus:'source_observed_patch_unconfirmed'};
  for(const [slot,ab] of Object.entries(record.rankTables)){
   if(!SLOTS.includes(slot)||!Number.isInteger(ab.sourceImageIndex)||ab.sourceImageIndex<1||ab.sourceImageIndex>122)
    return {ok:false,reason:'Index de capture ou slot invalide : '+c.name};
   for(const [key,row] of Object.entries(ab.statRows||{})){
    if(!/^[a-z0-9_]+$/.test(key)||!Array.isArray(row.values)||![3,4].includes(row.values.length)
      ||row.values.length!==ab.rankCount||row.values.some(x=>typeof x!=='number'||!Number.isFinite(x))
      ||row.sourceImageIndex!==ab.sourceImageIndex)
     return {ok:false,reason:'Valeurs par rang incohérentes : '+c.name+'/'+slot+'/'+key};
    if(row.damageFormulaValidated!==false)return {ok:false,reason:'Validation numérique trop large : '+c.name};
    rows++;cells+=row.values.length;
   }
   seenSources.add(ab.sourceImageIndex);
  }
  map.set(name,record);
 }
 for(const c of facts.champions||[]){
  const record=map.get(fold(c.name));if(!record)return {ok:false,reason:'Infobulle sans tableau de champion : '+c.name};
  for(const [slot,ab] of Object.entries(c.abilities||{})){
   if(!SLOTS.includes(slot)||!Number.isInteger(ab.sourceImageIndex)||ab.sourceImageIndex<1||ab.sourceImageIndex>122
    ||!Array.isArray(ab.clientDescriptionFacts)||!ab.clientDescriptionFacts.length||ab.approvedForNumericCombat!==false)
    return {ok:false,reason:'Faits client non sourcés : '+c.name+'/'+slot};
   record.tooltipFacts[slot]=ab;tooltips++;seenSources.add(ab.sourceImageIndex);
  }
 }
 if(map.size!==14||tooltips!==70||rows!==tables.verifiedRowCount||cells!==tables.verifiedCellCount)
  return {ok:false,reason:'Volume de données V19.5 divergent'};
 return {ok:true,version:VERSION,count:map.size,rankRows:rows,rankCells:cells,tooltipSlots:tooltips,
  sourceImagesUsed:seenSources.size,patchConfirmed:false,approvedForNumericCombat:false,
  getChampion:name=>map.get(fold(name))||null,
  inspectDraft:({names=[]}={})=>{
   const found=names.map(name=>map.get(fold(name))).filter(Boolean);
   const lineCount=found.reduce((s,c)=>s+Object.values(c.rankTables).reduce((n,slot)=>n+Object.keys(slot.statRows).length,0),0);
   const numericValues=found.reduce((s,c)=>s+Object.values(c.rankTables).reduce((n,slot)=>n+Object.values(slot.statRows).reduce((m,row)=>m+row.values.length,0),0),0);
   return {ok:true,champions:found.map(x=>x.name),count:found.length,rankRows:lineCount,
    rankValues:numericValues,tooltipSlots:found.length*5,allRanksPatchCertified:false,
    damageSimulationAllowed:false,source:'user_client_Champ_zip_2026_11_07'};
  }
 };
}
return Object.freeze({VERSION,prepare});
});
