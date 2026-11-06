/* WRDI V15 — single explicit pregame decision pipeline.
 * The only item input is the user-verified Wild Rift client catalogue.
 * No legacy app, observed cores, Chinese ranked builds or live match signals.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_DraftEngineV15=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.8.0';
function chooseRune({bridge,catalog,advisor,needs={},laneOpponent,items=[],role}={}){
 if(!bridge?.audit?.(catalog)?.ok)return {ok:false,reason:'Catalogue des runes non valide'};
 const templates=(advisor?.STRATEGIES||[]).filter(x=>['engage','burst','poke'].includes(x.id));
 const apItems=items.filter(x=>Number(x?.stats?.ap||0)>=45);
 const apBase=items.reduce((sum,x)=>sum+Number(x?.stats?.ap||0),0);
 const defensiveItems=items.filter(x=>Number(x?.stats?.armor||0)>0||Number(x?.stats?.mr||0)>0);
 const fullAp=role==='ap_burst'||(apItems.length>=3&&apBase>=220&&defensiveItems.length<=2);
 // Riot WR 7.3b: Electrocute minimum base damage 40 -> 60 (max 210,
 // 10% bonus AD and 5% AP unchanged). The client rune catalog already
 // reflects this. Prioritize Electrocute for Galio AP burst rather than
 // requiring an enemy all-in; Comet remains a specialist sustained-poke
 // alternative when a verified strong poke-only plan is requested.
 const exceptionalPoke=fullAp&&Number(needs.lanePoke||0)>=2&&
  Number(needs.laneAllIn||0)===0;
 const order=fullAp?(exceptionalPoke?['poke','burst','engage']:['burst','poke','engage']):
  ['engage','poke','burst'];
 const candidates=[];
 for(const id of order){
  const t=templates.find(x=>x.id===id);if(!t)continue;
  const page={keystone:t.keystone,primaryTree:t.tree,primary:[...t.primary],secondary:t.secondary};
  // Rune slots stay client-legal: Volonté row 2 is interchangeable between
  // Second souffle (poke) and Plaque d'os (short all-in).
  const heavyAllIn=Number(needs.laneAllIn||0)>0&&Number(needs.lanePoke||0)===0;
  if(id==='engage') {
   if(heavyAllIn)page.primary[1]="Plaque d'os";
   if(Number(needs.cc||0)<2&&Number(needs.frontlineNeed||0)>=1)page.primary[2]='Surcroissance';
  }
  if(id==='poke'||id==='burst'){
   page.secondary=heavyAllIn?"Plaque d'os":'Second souffle';
  }
  const validity=bridge.validate(page,catalog);
  if(validity.valid)candidates.push({id,label:t.label,page,legal:true,
   reason:id==='engage'?'Contrôles et résistance : configuration chinoise fréquemment observée':
    id==='burst'?'Burst rapproché : trois touches nécessaires pour Électrocution':
    'Poke AP avec Comète : option tactique client vérifiée, fréquence chinoise inconnue'});
 }
 if(!candidates.length)return {ok:false,reason:'Aucune page parmi les trois profils Galio autorisée par le client'};
 const picked=candidates[0];
 const explanation=fullAp?(picked.id==='burst'?
  picked.reason+' Priorité Galio AP burst depuis le buff 7.3b : 60–210 dégâts de base, trois touches en trois secondes. Comète reste une alternative si les échanges de poke répétés priment.':
  picked.reason+' Alternative spécialisée en poke prolongé ; Électrocution demeure la référence AP burst après son buff 7.3b.') :
  picked.reason+' Poigne nécessite une attaque de base préparée ; Électrocution exige trois touches rapprochées, contrairement au contrôle répété de Galio.';
 return {ok:true,id:picked.id,label:picked.label,page:picked.page,reason:explanation,
  alternatives:candidates.slice(1,3),mode:fullAp?(picked.id==='burst'?'ap_burst':'ap_poke'):'hybrid_control',
  apItems:apItems.length,apBase,
  keystonePatchEvidence:fullAp?'riot_wild_rift_7_3b_electrocute_40_to_60_minimum_base_damage':null,
  selection:'galio_mid_build_role_coherence_client_runes_not_empirical_winrate',
  metaReference:'cn_galio_engage_electrocute_observed_comet_tactical_only'};
}
function analyze({picks,champions,championMeta,officialKits,reviewedKits,numericKits,numericPatch,numericClient,catalog,rules,runes,bootsCatalog,modules}={}){
 const fail=(stage,reason)=>({ok:false,stage,reason});
 if(!Array.isArray(picks)||picks.length!==10||picks.some(x=>!String(x||'').trim()))return fail('draft','Les dix champions sont requis');
 if(String(picks[2])!=='10099')return fail('draft','Galio mid uniquement pour le moment');
 if(new Set(picks.map(String)).size!==10)return fail('draft','Un champion ne peut pas être sélectionné deux fois');
 const m=modules||{},profile=m.profiles,team=m.team,guard=m.guard,core=m.core,
  optimizer=m.optimizer,order=m.order,contingency=m.contingency;
 if(!profile?.lookup||!team?.make||!guard?.prepare||!core?.validateEquipment||!optimizer?.optimize||!order?.order||!contingency?.plan)
  return fail('modules','Moteur incomplet : aucune substitution par les anciens calculs');
 const readiness=m.readiness?.inspect?.({picks,championMeta,officialKits,numericKits,items:catalog,runes,boots:bootsCatalog})||null;
 if(m.readiness&&!readiness?.ok)return fail('data_readiness',readiness?.reasons?.join(' ; ')||'Données de draft incomplètes');
 const names=picks.map(id=>String(champions?.[String(id)]||''));
 if(names.some(x=>!x))return fail('champions','Un champion choisi n’est pas présent dans l’index des noms');
 const metadataByName=new Map((Array.isArray(championMeta)?championMeta:[])
  .filter(x=>x?.name).map(x=>[String(x.name).toLocaleLowerCase('fr'),x]));
 // Official Riot Wild Rift skill text is part of draft recognition, not
 // champion build popularity. In normal V15.8 use, all 125 sheets are present.
 const kitEngine=m.kitIntelligence;
 const official=officialKits&&kitEngine?.prepare?kitEngine.prepare(officialKits):null;
 if(officialKits&&(!official?.ok||official.count<100))
  return fail('official_kits',official?.reason||'Répertoire Riot Wild Rift incomplet');
 const reviewedMap=new Map((Array.isArray(reviewedKits?.profiles)?reviewedKits.profiles:[])
  .map(x=>[String(x.id),x]));
 const evidence={};
 const lookup=name=>{
  const metadata=metadataByName.get(String(name).toLocaleLowerCase('fr'));
  const base=profile.lookup(name,metadata)||[];
  if(!official)return base;
  const sheet=official.find(metadata?.id||name);
  const enrichment=kitEngine.enrich(base,sheet,reviewedMap.get(String(metadata?.id||'')));
  if(enrichment.intel?.ok)evidence[name]=enrichment.intel;
  return enrichment.traits;
 };
 // Use the complete sourced Wild Rift descriptions to distinguish shields
 // placed on allies from personal shields. A personal shield on Annie or
 // Ambessa does not justify buying Trident for a burst Galio by itself.
 const rawSheets=new Map((officialKits?.entries||[]).map(x=>[String(x.id),x]));
 const shieldInfo=name=>{
  const meta=metadataByName.get(String(name).toLocaleLowerCase('fr'));
  const sheet=rawSheets.get(String(meta?.id||''));
  if(!sheet)return null;
  const descriptions=Object.values(sheet.skills||{}).map(x=>String(x?.description_fr||'').toLowerCase());
  const shieldSkills=descriptions.filter(x=>/bouclier|protéger un allié|protéger une alliée|protège un allié|protège une alliée/.test(x));
  const protectsAllies=shieldSkills.some(x=>/allié|alliés|alliée|alliées|coéquipier|coéquipiers/.test(x));
  return {hasShield:shieldSkills.length>0,protectsAllies};
 };
 const threatEvidence=m.threatEvidence?.summarize?.({
  enemies:names.slice(5),
  byName:name=>{
   const meta=metadataByName.get(String(name).toLocaleLowerCase('fr'));
   return rawSheets.get(String(meta?.id||''))||null;
  }
 })||null;
 if(m.threatEvidence&&!threatEvidence?.ok)
  return fail('threat_evidence',threatEvidence?.reason||'Fiches adverses manquantes');
 const context=team.make({allies:names.slice(0,5),enemies:names.slice(5),lookup,
  shieldInfo:officialKits?shieldInfo:null,threatEvidence});
 if(!context.ok)return fail('threats',context.reason);
 const prepared=guard.prepare({catalog,rules,core,livePatch:catalog?.patch_claimed_by_client_user});
 if(!prepared.ok)return fail('client_catalogue',prepared.reason);
 const need=context.threats;
 // Source-only WR numeric catalogue; patch overrides are validated field-by-field.
 const numeric=numericKits&&m.numericEngine?.prepare?
  m.numericEngine.prepare(numericKits,numericPatch,numericClient):null;
 if(numericKits&&(!numeric?.ok||numeric.count<100))
  return fail('numeric_wild_rift',numeric?.reason||'Catalogue numérique WR incomplet');
 const combatModel=numeric&&m.numericEngine?.galioDirectModel?.(numeric);
 const calculator=m.mechanicsCalculator;
 const inputAudit=calculator?.audit?.({officialKits,items:catalog,runes});
 const galioSheet=official?.find('10099')||official?.find('Galio');
 const antiheal=calculator?.antihealComparison?.({items:catalog,galio:galioSheet,threats:need});
 const strategic=m.rolePlanner?.plan?.({threats:need,items:optimizer.eligible(prepared)})||null;
 if(m.rolePlanner&&!strategic?.ok)return fail('role_planning',strategic?.reason||'Analyse stratégique indisponible');
 let main=optimizer.optimize({prepared,threats:need,combatModel,
  candidateIds:strategic?.candidateIds||null});
 if(!main.ok)return fail('five_items',main.reason);
 let sequence=order.order({prepared,items:main.main.items,threats:need});
 if(!sequence.ok)return fail('purchase_order',sequence.reason);
 // V18.4: score every legal pair of fourth/fifth objects together against
 // the full selected core. Keep the first three purchases unchanged.
 const lateSlots=m.lateSlots?.compare?.({prepared,optimizer,orderedItems:sequence.items,
  candidateIds:strategic?.candidateIds||[],threats:need,combatModel})||null;
 if(m.lateSlots&&!lateSlots?.ok)return fail('late_slots',lateSlots?.reason||'Comparaison des fins de build impossible');
 if(lateSlots?.applied){
  const source=new Map(optimizer.eligible(prepared).map(x=>[x.id,x]));
  const previous=[...sequence.items];
  const last=lateSlots.selectedIds.slice(3).map(id=>source.get(id));
  // Select the more practical fourth purchase based on the existing
  // per-slot purchase scorer; swap only slots four and five.
  const a=order.stageScore(last[0],need,3).score+order.stageScore(last[1],need,4).score;
  const b=order.stageScore(last[1],need,3).score+order.stageScore(last[0],need,4).score;
  if(b>a)last.reverse();
  const chosen=[...previous.slice(0,3).map(x=>source.get(x.id)),...last];
  const measured=optimizer.calculate(chosen,need,combatModel);
  main={...main,main:{...main.main,
   items:chosen.map((x,i)=>({id:x.id,name:x.name_fr,priceGold:x.price_gold,slot:i+1,
    reason:optimizer.reasonFor(x,need)})),
   suitability:measured.score,reasons:measured.reasons,stats:measured.stats,
   interaction:measured.interaction,productivity:measured.productivity,
   offenseRole:measured.offenseRole,burst:measured.burst}};
  sequence={...sequence,items:chosen.map((x,i)=>({id:x.id,name:x.name_fr,
   priceGold:x.price_gold,slot:i+1,
   phase:i===0?'lane':i===1?'transition':i===2?'escarmouches':'teamfights',
   reason:i<3?previous[i].reason:order.stageScore(x,need,i).reason})),
   lateSlotsReoptimized:true,originalOrderPreservedThroughThird:true};
 }
 // Distinct purchase-3/4 pathways, never pretend draft kit healing proves
 // that heal is decisive in a live match.
 const antihealPlanning=m.antihealOrder?.candidates?.({
  prepared,optimizer,order,threats:need,observedHealingSeverity:0
 })||null;
 const urgentAntihealPlanning=m.antihealOrder?.candidates?.({
  prepared,optimizer,order,threats:need,observedHealingSeverity:4,
  beingAutoAttacked:need.ad>=2
 })||null;
 const conditional=contingency.plan({prepared,optimizer,items:main.main.items,
  orderedItems:sequence.items,enemyNames:names.slice(5),profileLookup:lookup,
  threats:need,max:3,protectCore:true});
 if(!conditional.ok)return fail('contingencies',conditional.reason);
 const rune=chooseRune({bridge:m.runeBridge,catalog:runes,advisor:m.runeAdvisor,
  role:strategic?.role,needs:need,laneOpponent:names[7],
  items:main.main.items.map(x=>prepared.catalog.items.find(z=>z.id===x.id))});
 const boots=m.bootAdvisor?.select?.({bootsCatalog,threats:need,role:strategic?.role})||null;
 if(m.bootAdvisor&&!boots?.ok)return fail('boots',boots?.reason||'Sélection des bottes indisponible');
 const notes=[...context.reasons];
 if(threatEvidence?.ok)notes.push('V18.5 : '+threatEvidence.alliedHealers+' sources de soin allié, '+threatEvidence.personalHealers+' sources de soin personnel, '+threatEvidence.maxHpThreats+' menaces de dégâts % PV max détectées dans les compétences officielles ; efficacité réelle non prédite.');
 if(lateSlots?.ok)notes.push('V18.4 : '+lateSlots.evaluatedPairs+' duos légaux comparés sur les objets 4 et 5 ; '+lateSlots.explanation+' Valeurs qualitatives, pas des dégâts réels.');
 if(readiness?.ok)notes.push('Données contrôlées : '+readiness.fullyDescribed+'/10 kits, '+readiness.itemRecords+' objets, '+readiness.runeRecords+' runes et '+readiness.bootRecords+' fiches de bottes client disponibles.');
 if(strategic?.ok)notes.unshift('V18 : '+strategic.rationale+' ; '+strategic.shortlisted+'/'+strategic.evaluated+' objets candidats évalués en détail. Core de référence : '+strategic.coreReference.join(' / ')+'.');
 if(main.main.offenseRole?.active){
  const ap=main.main.offenseRole;
  notes.push('Rôle identifié : Galio carry AP, car '+need.frontlineProvided+
   ' alliés assurent déjà la première ligne et aucun autre carry AP n’est détecté.');
  notes.push('Build de dégâts : '+ap.apItems+' objets AP, '+ap.effectiveAp.toFixed(1)+
   ' AP issus des objets et passifs (hors statistiques de base) ; '+
   'le multiplicateur de Rabadon est pris en compte lorsque présent.');
  if(need.tank<2)notes.push('Liandry : ses dégâts sur PV max restent utiles, mais sans plusieurs tanks ennemis '+
   'il ne doit pas automatiquement passer devant Rabadon ou des objets de burst.');
  notes.push('Sécurité : une défense adaptée à '+names[7]+' reste possible, '+
   'sans transformer Galio en deuxième ou troisième tank.');
 }
 if(antihealPlanning?.ok&&urgentAntihealPlanning?.ok){
  const show=x=>x?.preferred?.third==='thornmail'?'Cotte épineuse':
   x?.preferred?.third==='morellonomicon'?'Morellonomicon':'Créateur de failles';
  notes.push('Troisième achat si les soins ne bloquent pas les éliminations : '+
   show(antihealPlanning)+' (plan comparatif, distinct du build principal).');
  notes.push('Si les soins deviennent réellement décisifs : comparer Cotte épineuse '+
   '(armure, dégâts renvoyés sous attaques) et Morellonomicon (AP, dégâts magiques) '+
   'avant de retarder Créateur de failles.');
  notes.push('Antiheal conditionnel : le soin présent dans un kit ennemi ne prouve pas '+
   'que le troisième objet doive être anti-soin.');
 }

 if(numeric){
  notes.push('Compétences chiffrées WR : '+numeric.numericAbilityCoverage+' entrées collectées ; '+
   numeric.patchOverlayApplied+' corrections officielles appliquées ; '+numeric.clientVerificationsCount+' compétences vérifiées sur client ; '+numeric.patchConflicts+
   ' écarts de patch à examiner. Couverture patch 7.3d non certifiée.');
  for(const conflict of numeric.patchOutcomes.filter(x=>x.status==='source_conflict').slice(0,5))
   notes.push('Différence '+conflict.champion+' '+conflict.slot.toUpperCase()+' : Wiki = '+
    conflict.sourceValue+' ; Riot avant = '+conflict.patchExpectedBefore+' ; après = '+conflict.patchExpectedAfter);
 }
 const numericDraft=numeric&&m.numericEngine?.summary?.(numeric,picks);
 // Client-confirmed conditional damage, not guessed as a guaranteed proc.
 if(numericDraft?.ok)for(const champion of numericDraft.champions){
  const shyvana=champion.name==='Shyvana'&&champion.spells?.e?.clientVerifiedMechanics;
  if(shyvana)notes.push('Shyvana E (client WR) : marque pendant '+shyvana.scorched_mark_duration_s+
    ' s ; attaques sur cible marquée : +'+shyvana.basic_attack_vs_scorched_target_max_health_damage_pct+
    ' % PV max ; zone de forme dragon '+shyvana.dragon_form_burning_ground_duration_s+
    ' s ; dégâts bruts sur cibles marquées uniquement après '+shyvana.dragon_lineage_stacks_for_true_damage+
    ' charges de Lignée draconique.');
 }
 const productivity=main.main.productivity||null;
 if(productivity?.ok){
  notes.push('Survie productive : priorité aux objets permettant de contrôler et d’infliger des dégâts pendant les engagements.');
  notes.push('Pression conditionnelle '+productivity.short.pressure.toFixed(2)+' à 2,5 s / '+
   productivity.long.pressure.toFixed(2)+' à 8 s (scores relatifs, pas DPS).');
  notes.push(...productivity.long.parts.slice(0,3));
  if(!need.attackSpeedPressureConfirmed)
   notes.push('Cœur gelé : réponse à envisager si les attaques rapides deviennent une menace confirmée, pas un achat automatique précoce.');
 }
 const interactions=main.main.interaction||null;
 if(interactions?.ok){
  notes.push('Passifs comparés sur 2,5 s et 8 s : scénarios conditionnels, et non dégâts réels garantis.');
  notes.push(...interactions.combinations.slice(0,3));
  if(interactions.long.values.unendingDespair)notes.push('Désespoir : dégâts calculés à partir des PV max propres du porteur dans le catalogue client ; PV de base Galio inconnus, soins réels non calculables.');
 }
 const numericGalio=combatModel?.directDamageAt?.({ap:main.main.stats?.apAfterInteractions??main.main.stats?.ap??0})||null;
 if(numericGalio)notes.push('Galio A/Z/E (rangs 4/1/4 de comparaison) : '+numericGalio.total.toFixed(1)+
  ' dégâts bruts directs avec '+numericGalio.ap+' AP des objets, sans tornade, passif, résistances ni procs');
 if(inputAudit?.ok)notes.push('Données inspectées : '+inputAudit.abilities+' compétences sur '+inputAudit.expectedAbilities+
  ', '+inputAudit.items+' objets et '+inputAudit.runes+' runes ; '+inputAudit.fullDescriptions+' descriptions intégrales accessibles');
 if(antiheal?.ok&&need.heal>0){
  const choices=antiheal.items.filter(i=>['morellonomicon','thornmail'].includes(i.itemId));
  for(const option of choices)notes.push(option.itemName+' : Blessures graves '+option.reductionPct+
   '% pendant '+(option.durationSeconds??'durée inconnue')+' s ; déclenchement : '+
   (option.triggeredByDocumentedMagicSpells.length?
    'sorts magiques identifiés ('+option.triggeredByDocumentedMagicSpells.map(s=>s.name).join(', ')+')':
    option.canTriggerWhenAttacked?'attaques subies ou dégâts infligés selon le passif':
    option.canTriggerOnOwnDamage?'dégâts infligés':'à confirmer'));
 }
 const selectedRune=rune.ok?([...runes.fundamental,...runes.minor].find(x=>x.name_fr===rune.page.keystone)):null;
 const runeRange=selectedRune&&calculator?.runeProcRange?.({rune:selectedRune,ap:main.main.stats?.apAfterInteractions??main.main.stats?.ap??0});
 if(runeRange?.ok)notes.push(runeRange.name+' : dégâts par déclenchement théoriques '+
  runeRange.min.toFixed(1)+'–'+runeRange.max.toFixed(1)+' avec '+runeRange.ap+
  ' AP du build (avant résistances, proc non garanti)');
 if(official){
  const sourced=names.filter(n=>evidence[n]?.ok).length;
  notes.push('Compétences Riot Wild Rift : '+sourced+'/10 champions analysés ; effets textuels documentés, valeurs non simulées');
  for(const target of names.slice(5)){
   const intel=evidence[target];if(!intel?.ok)continue;
   const useful=intel.evidence.filter(x=>['healing','healing_reviewed','cc','shield','burn','max_hp_damage','untargetable'].includes(x.flag)).slice(0,2);
   if(useful.length)notes.push(target+' : '+useful.map(x=>x.explanation+' ('+x.spellName+')').join(' ; '));
  }
 }
 if(context.missingEnemyRoles.length)notes.push('Profils adverses partiels : '+context.missingEnemyRoles.join(', '));
 return {ok:true,version:VERSION,game:'Wild Rift mobile',patch:catalog.patch_claimed_by_client_user,
  draft:{ids:[...picks],names,threats:need,threatEvidence:threatEvidence?.ok?threatEvidence:null,notes,confidence:context.confidence,
   officialKitCoverage:official?names.filter(n=>evidence[n]?.ok).length:0},
  build:{items:sequence.items,alternatives:conditional.options,legal:true,
   strategy:strategic?.ok?strategic:null,lateSlots:lateSlots?.ok?lateSlots:null,
   orderCertified:false,combinationsExamined:main.evaluatedPool,
   sourced:'player_client_items_only',noPopularBuilds:true},
  runes:rune,boots,dataReadiness:readiness,
  calculations:{inputAudit:inputAudit?.ok?inputAudit:null,
   antiheal:antiheal?.ok?antiheal:null,runeProc:runeRange?.ok?runeRange:null,
   numericDraft:numericDraft?.ok?numericDraft:null,
   numericGalio,
   combatScenarios:interactions?.ok?interactions:null,
   antihealTiming:antihealPlanning?.ok?{
    baseline:antihealPlanning,
    ifObservedHealingUrgent:urgentAntihealPlanning,
    evidence:'client_items_draft_healing_not_live_observed',
    actionRequired:'recheck_at_third_purchase'
   }:null,
   productiveSurvival:productivity?.ok?productivity:null,
   numericCoverage:numeric?{champions:numeric.count,abilities:numeric.numericAbilityCoverage,
    patchCorrections:numeric.patchOverlayApplied,clientVerifications:numeric.clientVerificationsCount,patchConflicts:numeric.patchConflicts,
    patchOutcomes:numeric.patchOutcomes,patchComplete:numeric.unreviewedPatchSections.length===0}:null},
  methods:{kitPassiveSynergy:'inferred_from_client_text',championThreatSource:official?'official_wild_rift_abilities':'legacy_profiles_only',selection:'draft_weighted_mechanical_scenarios_and_qualitative_heuristic',
   exactOptimalityProven:false,liveTracking:false,numericCombatInputs:numeric?'wiki_wr_and_riot_patch_layer':'not_loaded'},
  warnings:rune.ok?[]:['Runes indisponibles : '+rune.reason]};
}
return Object.freeze({VERSION,chooseRune,analyze});
});
