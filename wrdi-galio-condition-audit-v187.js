/* Wild Rift Draft Intelligence V18.7
 * Item passives are conditional opportunities, never guaranteed purchases.
 * All labels derive from explicitly sourced client item effects and kit signals.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioConditionAuditV187=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.7.0';
const n=x=>Number.isFinite(Number(x))?Math.max(0,Number(x)):0;
function inspect({items=[],threats={}}={}){
 const out=[];
 for(const x of items){
  const id=String(x.id||''),f=x.feature||{},e={id,status:'not_counter_item',trigger:'',reason:'',confidence:'qualitative_draft_only'};
  if(id==='oceanids_trident'||f.shieldCut){
   const sources=n(threats.alliedShieldSources),conditional=n(threats.conditionalShieldSources);
   e.trigger='Les boucliers doivent être réellement appliqués et gêner une élimination';
   e.status=sources>=2?'relevant':sources===1?'conditional':'weak';
   e.reason=sources>=2?'Plusieurs sources de protection alliée identifiées':sources===1?
    'Une seule source de boucliers alliés : vérifier leur fréquence, cible et puissance':
    conditional>0?'Bouclier lié à un effet conditionnel (ex. excédent de soin)':
    'Aucun bouclier allié direct identifié comme gênant';
  }else if(id==='morellonomicon'||(f.antihealBySpell&&n(x.stats?.ap)>=40)){
   const ally=n(threats.allyHealerCount),pressure=n(threats.healPressure);
   e.trigger='Appliquer des dégâts magiques au champion soigné pour obtenir Blessures graves';
   e.status=ally>=2||ally>=1&&pressure>=2.5?'relevant':pressure>0?'conditional':'weak';
   e.reason=ally>=1?'Soins sur alliés présents ; réévaluer leur impact en partie':
    'Soins personnels ou conditionnels : ne pas forcer cet objet avant de constater leur impact';
  }else if(id==='thornmail'){
   e.trigger='Les dégâts physiques reçus ou attaques adverses doivent permettre le déclenchement du passif';
   e.status=n(threats.lanePhysical)>0&&n(threats.healPressure)>0?'conditional':'weak';
   e.reason='Ne pas attribuer automatiquement une réduction de soins aux sorts de Galio';
  }else if(id==='cosmic_drive'){
   e.trigger='Les dégâts doivent activer une mobilité supplémentaire réellement utile';
   e.status=n(threats.kitePressureConfirmed)>0?'conditional':'weak';
   e.reason='Galio dispose déjà de déplacements et contrôles ; mobilité achetée seulement pour une menace identifiée';
  }else if(n(x.stats?.mpen_pct)>=25){
   e.trigger='La valeur de pénétration dépend des résistances magiques effectivement achetées';
   e.status=n(threats.tank)>=2?'conditional':'unknown_enemy_items';
   e.reason='Aucune résistance magique ennemie achetée n’est observable depuis la draft';
  }
  if(e.status!=='not_counter_item')out.push(e);
 }
 return {ok:true,version:VERSION,entries:out,unknownEnemyItems:true,guaranteedProcs:false};
}
return Object.freeze({VERSION,inspect});
});
