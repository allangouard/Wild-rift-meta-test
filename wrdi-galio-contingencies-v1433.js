/* WRDI V14.33 — pre-game contingent item swaps for a fixed five-item Galio build.
 * Use ONLY verified player-client item cards and equipment restrictions.
 * A situational option is a legal one-for-one REPLACEMENT for a specific future
 * observation, not another arbitrary top-scored combination or a live tracker.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioContingenciesV1433=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='17.1.0';
const copy=x=>({...x});
const CONDITIONS=Object.freeze([
 {id:'critical',label:'Si les adversaires investissent dans les coups critiques',flag:'crit',raised:3,
  relevant:f=>f.critMitigation,category:'physical'},
 {id:'attack_speed',label:'Si les attaques rapides adverses deviennent une menace confirmée',flag:'attackSpeedPressureConfirmed',raised:2,
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
const roleKey=x=>String(x||'').toLocaleLowerCase('fr').normalize('NFD')
 .replace(/[\\u0300-\\u036f]/g,'').replace(/[’‘]/g,"'").trim();
const attackSpeedNames=new Set(['lucian','gnar','vayne','kalista','master yi',
 'tristana','jinx','twitch','zeri','kai\'sa','varus','kog\'maw',
 'irelia','tryndamere','yasuo','yone','olaf','aphelios','xayah']);
function speedCandidates(enemies=[],lookup){
 return enemies.filter(name=>{
  const traits=typeof lookup==='function'?lookup(name)||[]:[];
  return traits.includes('onhit')||attackSpeedNames.has(roleKey(name));
 });
}
function textFor(condition,enemies=[],lookup){
 if(condition.id!=='attack_speed')return condition.label;
 const relevant=speedCandidates(enemies,lookup);
 return relevant.length?
  'Si les attaques rapides de '+relevant.join(' ou ')+' deviennent une menace confirmée':
  'Si les attaques rapides adverses deviennent une menace confirmée';
}
function plan({prepared,optimizer,items,threats={},max=3,
 enemyNames=[],profileLookup,orderedItems,protectCore=true}={}){
 if(!prepared?.ok||typeof prepared.core?.validateEquipment!=='function'||!optimizer?.calculate||!optimizer?.eligible)
  return {ok:false,reason:'Catalogue client ou optimiseur indisponible'};
 if(!Array.isArray(items)||items.length!==5)return {ok:false,reason:'Build principal de cinq objets requis'};
 const catalog=new Map(prepared.catalog.items.map(x=>[x.id,x]));
 const base=items.map(x=>catalog.get(typeof x==='string'?x:x?.id));
 if(base.some(x=>!x)||new Set(base.map(x=>x.id)).size!==5||!
 prepared.core.validateEquipment(base.map(x=>x.id),prepared.catalog,prepared.rules).valid)
  return {ok:false,reason:'Build principal non vérifié'};
 const pool=optimizer.eligible(prepared),baseIds=new Set(base.map(x=>x.id));
 // Alternative equipment is a late-game *replacement*. It must not
 // sacrifice the first three purchases or the hybrid Galio core to gain
 // a defensive counter. The order is the real purchase sequence, not
 // the optimizer's arbitrary unordered five-item set.
 const validOrder=Array.isArray(orderedItems)&&orderedItems.length===5&&
  new Set(orderedItems.map(x=>typeof x==='string'?x:x?.id)).size===5&&
  orderedItems.every(x=>baseIds.has(typeof x==='string'?x:x?.id));
 const purchaseIds=validOrder?orderedItems.map(x=>typeof x==='string'?x:x?.id):
  base.map(x=>x.id);
 const protectedIds=new Set(protectCore?purchaseIds.slice(0,3):[]);
 // Three purchases are protected per draft, regardless of their identities.
 // Riftmaker / Thornmail are selectable by the optimizer, not universally locked.
 const baseline=base.map(x=>({...x,feature:optimizer.features(x)}));
 const original=optimizer.calculate(baseline,threats);
 const options=[];
 for(const condition of CONDITIONS){
  // No Lucian/Gnar/fast-attacking champion in the actual enemy five:
  // don't invent a named matchup. The generic counter remains possible
  // only if matching enemy archetype exists in this very draft.
  if(condition.id==='attack_speed'&&Array.isArray(enemyNames)&&enemyNames.length===5&&
    speedCandidates(enemyNames,profileLookup).length===0)continue;
  // Only show a contingency if it is a change from the pre-game estimate.
  if(Number(threats[condition.flag]||0)>=condition.raised)continue;
  const changed=copy(threats);changed[condition.flag]=condition.raised;
  const present=baseline.some(x=>condition.relevant(x.feature));
  let best=null;
  const current=optimizer.calculate(baseline,changed).score;
  for(const candidate of pool){
   if(baseIds.has(candidate.id)||!condition.relevant(candidate.feature))continue;
   for(let slot=0;slot<5;slot++){
    if(protectedIds.has(base[slot].id))continue;
    // Never drop the sole existing answer to the newly intensified threat.
    const next=base.map((x,i)=>i===slot?candidate:x);
    const ids=next.map(x=>x.id);
    if(!prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules).valid)continue;
    const score=optimizer.calculate(next.map(x=>({...x,feature:optimizer.features(x)})),changed).score;
    const gain=score-current;
    if(gain<=0.3)continue;
    const option={conditionId:condition.id,condition:textFor(condition,enemyNames,profileLookup),
      add:{id:candidate.id,name:candidate.name_fr},remove:{id:base[slot].id,name:base[slot].name_fr},
      gain:Number(gain.toFixed(2)),newIds:ids,conditional:true,verifiedLegal:true,
      protectedCorePreserved:true,replacementPhase:'late_game',
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
  protectedCoreIds:[...protectedIds],coreProtectionActive:protectCore,
  applicableEnemyNames:Array.isArray(enemyNames)?enemyNames.slice():[],
  baselineScore:original.score,liveTracking:false,liveRecalculation:false,
  certifiedOptimal:false,noPopularityData:true,
  note:'Options préparées avant la partie. Les conditions devront être constatées par le joueur.'};
}
return Object.freeze({VERSION,CONDITIONS,plan});
});
