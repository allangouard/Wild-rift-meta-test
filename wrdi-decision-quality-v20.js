/* Wild Rift Draft Intelligence V20 — ranked draft decision quality benchmarks.
 * No fabricated "best builds". Assertions are testable tactical properties;
 * full 5-item gold labels require actual expert review.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_DecisionQualityV20=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='20.0.0';
const DIMENSIONS=Object.freeze({coreOrder:40,lateItems:30,situational:15,runesBoots:15});
const sum=a=>a.reduce((x,v)=>x+v,0);
function review({result,reference}={}){
 if(!result?.ok||!reference)return {ok:false,reason:'Draft ou référence absente'};
 const ids=(result.build?.items||[]).map(x=>x.id),role=result.build?.strategy?.role;
 const t=result.draft?.threats||{},notes=[],checks=[];
 const add=(part,label,pass,points,critical=false)=>{
  checks.push({part,label,pass:Boolean(pass),points,critical});
  if(!pass)notes.push(label);
 };
 const burst=role==='ap_burst',hybrid=role==='hybrid_offensive',tank=role==='tank_utility';
 add('coreOrder','Rôle attendu pour la composition',role===reference.expectedRole,12,true);
 add('coreOrder','Exactement cinq achats sans duplication',ids.length===5&&new Set(ids).size===5,5,true);
 add('coreOrder','Burst AP : Luden en premier',!burst||ids[0]==='ludens_echo',9,true);
 add('coreOrder','Burst AP : Rabadon dans les trois premiers achats',!burst||ids.slice(0,3).includes('rabadons_deathcap'),8,true);
 add('coreOrder','Burst AP : pas de Désespoir dans le core',!burst||!ids.slice(0,3).includes('unending_despair'),6,true);
 add('lateItems','Deux derniers objets distincts du core',ids.length===5&&ids.slice(3).every(x=>!ids.slice(0,3).includes(x)),7,true);
 add('lateItems','Quatrième et cinquième achats évalués ensemble',result.build?.lateSlots?.ok&&result.build.lateSlots.evaluatedPairs>4,8);
 add('lateItems','Core préservé pendant les substitutions de fin de build',
  result.build?.lateSlots?.coreProtected===true&&ids.slice(0,3).join('|')===result.build.lateSlots.coreIds.join('|'),8,true);
 add('lateItems','Build légal après optimisation',result.build?.legal===true,7,true);
 const shield=Number(t.shieldPressure)||0,healing=Number(t.healPressure)||0;
 add('situational','Pas de Trident sans boucliers collectifs documentés',
  shield>=1.5||!ids.includes('oceanids_trident'),5,true);
 add('situational','Pas de Désespoir en burst AP',
  !burst||!ids.includes('unending_despair'),5,true);
 // Do not ban Morellonomicon on drafts alone; its AP and stats retain value.
 // Record potentially unnecessary antiheal for targeted review, not as a truth.
 const weakHealing=burst&&healing<1.5&&ids.includes('morellonomicon');
 add('situational','Options situationnelles légales',
  (result.build?.alternatives||[]).every(x=>x.protectedCorePreserved),5);
 if(weakHealing)notes.push('À expertiser : Morellonomicon malgré pression de soins < 1,5');
 add('runesBoots','Runes complètes et reconnues',result.runes?.ok===true,6,true);
 add('runesBoots','Rune fondamentale adaptée au rôle',
  result.runes?.page?.keystone===(burst?'Électrocution':'Souverain des glaces'),5);
 add('runesBoots','Bottes recommandées avec source client',
  result.boots?.ok===true&&Boolean(result.boots?.recommended?.name),4,true);
 const score=sum(checks.filter(x=>x.pass).map(x=>x.points));
 return {ok:true,version:VERSION,scenarioId:reference.id,role,items:ids,score,scoreMax:100,
  dimensions:Object.fromEntries(Object.keys(DIMENSIONS).map(part=>[part,{
   score:sum(checks.filter(x=>x.part===part&&x.pass).map(x=>x.points)),
   total:DIMENSIONS[part]}])),
  blockers:checks.filter(x=>x.critical&&!x.pass).map(x=>x.label),
  diagnostics:notes,weakHealing,checks,referenceIsExpertValidated:false};
}
function summarize(results=[]){
 const valid=results.filter(x=>x?.ok);
 return {ok:valid.length>0,version:VERSION,count:valid.length,
  avgScore:valid.length?Math.round(sum(valid.map(x=>x.score))/valid.length*100)/100:null,
  blockers:valid.flatMap(x=>x.blockers.map(label=>({id:x.scenarioId,label}))),
  weakHealingDrafts:valid.filter(x=>x.weakHealing).map(x=>x.scenarioId),
  differentCores:[...new Set(valid.map(x=>x.items.slice(0,3).join('|')))].length,
  differentLatePairs:[...new Set(valid.map(x=>x.items.slice(3).join('|')))].length,
  calibration:'tactical_rules_only_not_expert_ground_truth'};
}
return Object.freeze({VERSION,DIMENSIONS,review,summarize});
});