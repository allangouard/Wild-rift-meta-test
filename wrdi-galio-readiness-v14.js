/* WRDI V14.5 — pre-vol de simulation Galio, aucune optimisation automatique.
   Un audit qualitatif ne constitue jamais une preuve de statistiques courantes. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioReadinessV14=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.5.0-alpha.1';
const norm=x=>String(x??'').trim();
function evaluate({report,summary,catalog,rules,core}={}){
 const blockers=[],notices=[];
 if(!report?.ok||!summary?.ok)blockers.push('Rapport de draft ou synthèse V14 incomplet.');
 if(!core||typeof core.validateSources!=='function')
   blockers.push('Contrôle du catalogue V14.0 indisponible.');
 let validation=null;
 if(core?.validateSources){
   validation=core.validateSources(catalog,rules);
   if(!validation.ok)blockers.push(...validation.errors);
   if(!validation.recommendationEligible)
     blockers.push('Catalogue client exploratoire : pas de recommandations automatiques.');
   if(catalog?.no_patch_deltas_applied)
     blockers.push('Correctifs du patch non intégrés au catalogue.');
 }
 const patch=norm(report?.patch);
 const catalogPatch=norm(validation?.patch);
 if(!patch||!catalogPatch||patch!==catalogPatch)
   blockers.push('Patch du rapport et du catalogue non concordant.');
 const enemyRows=summary?.enemies;
 if(!Array.isArray(enemyRows)||enemyRows.length!==5)
   blockers.push('Cinq profils adverses cohérents nécessaires.');
 else {
   if(enemyRows.some(e=>!e.roleMatched))
     blockers.push('Un ou plusieurs postes adverses non confirmés.');
   if(enemyRows.some(e=>!e.kitVersion||!e.buildsPatch))
     blockers.push('Versions de fiches ou de builds inconnues.');
   if(enemyRows.some(e=>e.kitVersion!==catalogPatch||e.buildsPatch!==catalogPatch))
     blockers.push('Fiches et builds observés sur une autre version que le catalogue client.');
   if(enemyRows.some(e=>e.missingNames>0))
     notices.push('Des noms d’objets adverses sont manquants.');
 }
 if(!Array.isArray(catalog?.items)||catalog.items.length===0)
   blockers.push('Aucun objet client disponible.');
 else {
   const incomplete=catalog.items.filter(x=>x.completeness?.interactions!=='verified').length;
   notices.push(incomplete+' fiche(s) sans interactions intégralement certifiées selon le catalogue.');
 }
 notices.push('La présence d’un mot-clé de dégâts ne fournit aucune répartition physique/magique.');
 notices.push('Aucune probabilité de build par composition ni scénario de dégâts calibré pour cette partie.');
 // Intentionnellement bloqué : aucune validation du modèle des ratios/dégâts et passifs Galio 7.3d ici.
 blockers.push('Modèle de combat Galio non calibré et validé sur le client Wild Rift actuel.');
 return Object.freeze({
   ok:!!report?.ok&&!!summary?.ok,
   status:'simulation-not-certified',
   automaticRecommendationAllowed:false,
   comparativeDamageAllowed:false,
   blockers:Object.freeze([...new Set(blockers)]),
   notices:Object.freeze([...new Set(notices)]),
   targetGame:'Wild Rift mobile',
   patch:catalogPatch||null
 });
}
return Object.freeze({VERSION,evaluate});
});
