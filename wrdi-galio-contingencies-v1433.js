/* WRDI V14.33 — pre-game contingent item swaps for a fixed five-item Galio build.
 * Use ONLY verified player-client item cards and equipment restrictions.
 * A situational option is a legal one-for-one REPLACEMENT for a specific future
 * observation, not another arbitrary top-scored combination or a live tracker.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioContingenciesV1433=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.33.0-alpha.1';
const copy=x=>({...x});
const CONDITIONS=Object.freeze([
 {id:'critical',label:'Si les adversaires investissent dans les coups critiques',flag:'crit',raised:3,
  relevant:f=>f.critMitigation,category:'physical'},
 {id:'attack_speed',label:'Si les attaques rapides de Lucian ou Gnar deviennent une menace confirmée',flag:'attackSpeedPressureConfirmed',raised:2,
  relevant:f=>f.attackSpeedAura,category:'physical'},
 {id:'healing',label:'Si les soins adverses deviennent déterminants',flag:'heal',raised:4,
  relevant:f=>f.antiheal,category:'utility'},
 {id:'physical',label:'Si les dégâts physiques dominent réellement',flag:'ad',raised:5,
  relevant:f=>f.armor>=30,category:'defense'},
 {id:'magical',label:'Si les dégâts magiques dominent réellement',flag:'ap',raised:5,
  relevant:f=>f.mr>=30,category:'defense'},
 {id:'tanks',label:'Si les tanks adverses deviennent la priorité',flag:'tank',raised:4,
  relevant:f=>f.maxHp||f.ramp||f.shred,category:'offense'}
]);
function plan({prepared,optimizer,items,threats={},max=3}={}){
 if(!prepared?.ok||typeof prepared.core?.validateEquipment!=='function'||!optimizer?.calculate||!optimizer?.eligible)
  return {ok:false,reason:'Catalogue client ou optimiseur indisponible'};
 if(!Array.isArray(items)||items.length!==5)return {ok:false,reason:'Build principal de cinq objets requis'};
 const catalog=new Map(prepared.catalog.items.map(x=>[x.id,x]));
 const base=items.map(x=>catalog.get(typeof x==='string'?x:x?.id));
 if(base.some(x=>!x)||new Set(base.map(x=>x.id)).size!==5||!
 prepared.core.validateEquipment(base.map(x=>x.id),prepared.catalog,prepared.rules).valid)
  return {ok:false,reason:'Build principal non vérifié'};
 const pool=optimizer.eligible(prepared),baseIds=new Set(base.map(x=>x.id));
 const baseline=base.map(x=>({...x,feature:optimizer.features(x)}));
 const original=optimizer.calculate(baseline,threats);
 const options=[];
 for(const condition of CONDITIONS){
  // Only show a contingency if it is a change from the pre-game estimate.
  if(Number(threats[condition.flag]||0)>=condition.raised)continue;
  const changed=copy(threats);changed[condition.flag]=condition.raised;
  const present=baseline.some(x=>condition.relevant(x.feature));
  let best=null;
  const current=optimizer.calculate(baseline,changed).score;
  for(const candidate of pool){
   if(baseIds.has(candidate.id)||!condition.relevant(candidate.feature))continue;
   for(let slot=0;slot<5;slot++){
    // Never drop the sole existing answer to the newly intensified threat.
    const next=base.map((x,i)=>i===slot?candidate:x);
    const ids=next.map(x=>x.id);
    if(!prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules).valid)continue;
    const score=optimizer.calculate(next.map(x=>({...x,feature:optimizer.features(x)})),changed).score;
    const gain=score-current;
    if(gain<=0.3)continue;
    const option={conditionId:condition.id,condition:condition.label,
      add:{id:candidate.id,name:candidate.name_fr},remove:{id:base[slot].id,name:base[slot].name_fr},
      gain:Number(gain.toFixed(2)),newIds:ids,conditional:true,verifiedLegal:true,
      reason:'Ce remplacement répond mieux au scénario '+condition.id+' selon les passifs et statistiques du client.',
      scenario:changed,baseAlreadyResponds:present};
    if(!best||gain>best.gain+0.001||(Math.abs(gain-best.gain)<0.001&&
      (option.add.id+'|'+option.remove.id)<(best.add.id+'|'+best.remove.id)))best=option;
   }
  }
  if(best)options.push(best);
 }
 // Not 3 near-identical builds: three distinct future conditions, not guaranteed
 // outcomes. Prioritize the most actionable changes relative to the initial draft.
 options.sort((a,b)=>b.gain-a.gain||a.conditionId.localeCompare(b.conditionId));
 return {ok:true,version:VERSION,mode:'pregame_contingency_plan',items:base.map(x=>x.id),
  scenariosChecked:CONDITIONS.length,options:options.slice(0,Math.min(3,Math.max(0,max))),
  baselineScore:original.score,liveTracking:false,liveRecalculation:false,
  certifiedOptimal:false,noPopularityData:true,
  note:'Options préparées avant la partie. Les conditions devront être constatées par le joueur.'};
}
return Object.freeze({VERSION,CONDITIONS,plan});
});
