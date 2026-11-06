/* V19 Galio ranked-readiness: independently audit provenance and known gaps.
 * Never claim empirical validity or patch-current data just because tests pass.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioReleaseAuditV19=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='19.0.0';
const LAST_RIOT_NOTE={patch:'7.3e',date:'2026-11-04',url:'https://wildrift.leagueoflegends.com/fr-fr/news/game-updates/wild-rift-patch-notes-7-3e/',scope:'AAA ARAM augment changes; no listed Summoner Rift item or rune balance changes'};
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function inspect({catalog={},runes={},bootsCatalog={},championMeta=[],result=null}={}){
 const warnings=[],blocked=[];
 const clientPatch=String(catalog.patch_claimed_by_client_user||'');
 const roster=Array.isArray(championMeta)?championMeta:[];
 const hasHwei=roster.some(x=>norm(x.name)==='hwei');
 if(clientPatch!=='7.3d')warnings.push('Patch du catalogue différent de la dernière fiche d’objets vérifiée (7.3d).');
 if(catalog.do_not_automatically_load_into_build_recommendations===true)
  warnings.push('Le catalogue source mentionne explicitement que l’intégration automatique aux recommandations n’a pas été approuvée.');
 if(catalog.no_patch_deltas_applied===true)
  warnings.push('Les corrections de statistiques propres au patch ne sont pas intégralement attestées dans le catalogue.');
 if(runes.status?.combat_behavior_verified!==true)
  warnings.push('Les déclenchements des runes ne sont pas validés en situation de combat.');
 if(bootsCatalog.recommendation_eligible!==true)
  warnings.push('Les bottes sont documentées par captures client, mais non certifiées pour une optimisation automatique.');
 if(!hasHwei)
  warnings.push('Hwei figure dans les notes officielles 7.3 mais manque au sélecteur actuel : couverture du roster incomplète.');
 if(hasHwei)
  warnings.push('Hwei : descriptions et valeurs ajoutées depuis les captures client ; formules numériques complètes non certifiées dans le moteur.');
 if(result?.build?.legal===false)blocked.push('Équipement non conforme aux règles client.');
 if(result?.runes?.ok===false)blocked.push('Page de runes indisponible ou invalide.');
 if(result?.draft?.officialKitCoverage<10)blocked.push('Descriptions de compétences manquantes dans la draft.');
 const comparisons=Number(result?.build?.lateSlots?.evaluatedPairs||0);
 const itemRisks=(result?.build?.conditionAudit?.entries||[])
  .filter(x=>['weak','unknown_enemy_items','conditional'].includes(x.status))
  .map(x=>({id:x.id,status:x.status,reason:x.reason||'',trigger:x.trigger||''}));
 if(itemRisks.some(x=>x.status==='weak'))
  warnings.push('Certains objets retenus ne répondent qu’à des menaces faibles ou hypothétiques dans cette draft.');
 return {ok:blocked.length===0,version:VERSION,status:blocked.length?'blocked':'experimental',
  verifiedLatestOfficialNote:LAST_RIOT_NOTE,sourcePatch:clientPatch||'unknown',
  currentLivePatchClaim:false,patchCompatibility:'7.3e_notes_have_no_announced_rift_item_rune_changes_but_unverified_client_fields',
  rosterCount:roster.length,knownMissingChampionNames:hasHwei?[]:['Hwei'],
  itemCount:Array.isArray(catalog.items)?catalog.items.length:0,
  inspectedPairs:comparisons,itemRisks,fullPatchStatsVerified:false,combatProcsVerified:false,
  empiricalWinrateAvailable:false,rankedOptimizationCertified:false,
  warnings,blocked,source:'client_captured_2026_11_04_plus_riot_official_patch_notes_2026_11_04'};
}
return Object.freeze({VERSION,LAST_RIOT_NOTE,inspect});
});
