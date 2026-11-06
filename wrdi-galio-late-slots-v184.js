/* WRDI 18.4 — exhaustively compare Galio slots 4+5 after a selected
 * three-purchase core. Full item catalog and restrictions are the authority.
 * No opponent item build, damage outcome or winrate is assumed.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioLateSlotsV184=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.4.0';
function compare({prepared,optimizer,orderedItems=[],candidateIds=[],threats={},combatModel=null,minGain=2}={}){
 if(!prepared?.ok||!optimizer?.eligible||!optimizer?.calculate||
  typeof prepared.core?.validateEquipment!=='function')
  return {ok:false,reason:'Comparateur ou règles d’équipement indisponibles'};
 const baseIds=orderedItems.map(x=>typeof x==='string'?x:x?.id);
 if(baseIds.length!==5||new Set(baseIds).size!==5)return {ok:false,reason:'Cinq objets initiaux uniques nécessaires'};
 const all=optimizer.eligible(prepared),available=new Map(all.map(x=>[x.id,x]));
 if(baseIds.some(id=>!available.has(id)))return {ok:false,reason:'Objet initial absent du catalogue achetable'};
 const core=baseIds.slice(0,3),allowed=new Set(candidateIds.length?candidateIds:all.map(x=>x.id));
 // Existing items always remain candidates, preserving the current valid build.
 for(const id of baseIds)allowed.add(id);
 const pool=all.filter(x=>allowed.has(x.id)&&!core.includes(x.id));
 const legal=(ids)=>prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules).valid;
 if(!legal(baseIds))return {ok:false,reason:'Build initial non légal'};
 const originalMeasure=optimizer.calculate(baseIds.map(id=>available.get(id)),threats,combatModel);
 const evaluated=[];
 for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
  const ids=[...core,pool[i].id,pool[j].id];
  if(!legal(ids))continue;
  const assessment=optimizer.calculate(ids.map(id=>available.get(id)),threats,combatModel);
  if(!Number.isFinite(assessment.score))continue;
  const order=[pool[i].id,pool[j].id].sort();
  evaluated.push({ids,lateIds:order,score:assessment.score,assessment,
   tie:order.join('|')});
 }
 if(!evaluated.length)return {ok:false,reason:'Aucune paire de fin de build légale'};
 evaluated.sort((a,b)=>b.score-a.score||a.tie.localeCompare(b.tie));
 const best=evaluated[0],gain=Number((best.score-originalMeasure.score).toFixed(2));
 const changed=core.concat(best.lateIds).some(id=>!baseIds.includes(id));
 const apply=changed&&gain>minGain;
 const selected=apply?best:({ids:baseIds,lateIds:baseIds.slice(3),score:originalMeasure.score,assessment:originalMeasure});
 const top=evaluated.filter(x=>x.tie!==best.tie).slice(0,5).map(x=>({
  lastTwo:x.lateIds,score:x.score,deltaVsBaseline:Number((x.score-originalMeasure.score).toFixed(2)),
  highlights:x.assessment.reasons.slice(0,3)
 }));
 return {ok:true,version:VERSION,coreIds:core,baselineIds:baseIds,
  baselineScore:originalMeasure.score,topPair:best.lateIds,
  topScore:best.score,rawGain:gain,applied:apply,minGain,
  selectedIds:selected.ids,selectedScore:selected.score,
  evaluatedPairs:evaluated.length,alternatives:top,
  coreProtected:true,legal:true,exactOptimalityProven:false,
  basis:'qualitative_weighted_full_build_scores_not_actual_damage_or_winrate',
  explanation:apply?'Les deux derniers objets ont été réévalués ensemble en conservant les trois achats du core.':
   'Le duo initial reste préférable ou l’écart de score est trop faible pour le remplacer.'};
}
return Object.freeze({VERSION,compare});
});
