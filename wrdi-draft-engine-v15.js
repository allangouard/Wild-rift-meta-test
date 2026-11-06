/* WRDI V15 — single explicit pregame decision pipeline.
 * The only item input is the user-verified Wild Rift client catalogue.
 * No legacy app, observed cores, Chinese ranked builds or live match signals.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_DraftEngineV15=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.8.0';
function chooseRune({bridge,catalog,advisor,needs}){
 if(!bridge?.audit?.(catalog)?.ok)return {ok:false,reason:'Catalogue des runes non valide'};
 const profiles=advisor?.STRATEGIES||[];
 const t=needs||{};
 // A role-first rule: rune templates are taken from the verified client page
 // structure, never from observed usage or rank-based winrates.
 // The team-composition role is evaluated BEFORE generic peel or tank
 // signals. Three allied tanks must not force Galio into Guardian when he is
 // responsible for magic damage. Galio can apply Comet with Q against a
 // ranged/poke mid; Electrocute remains a candidate for short all-in trades.
 const offensiveDuty=t.damageDuty>=2&&t.frontlineProvided>=2&&t.frontlineNeed===0;
 const choices=offensiveDuty?
  (t.lanePoke||t.laneMagic&&!t.laneAllIn?
   ['poke','burst','longfight','engage']:
   t.tank>=2?['longfight','burst','poke','engage']:
   ['burst','poke','longfight','engage']):
  t.frontlineNeed>=1?['engage','resilience','peel']:
  t.laneAllIn?['resilience','burst','engage']:
  t.peelNeed>=1?['peel','engage','resilience']:
  t.tank>=2?['longfight','engage','resilience']:
  ['engage','resilience','roam'];
 const accepted=[];
 for(const id of choices){
  const template=profiles.find(x=>x.id===id);
  if(!template)continue;
  const page={keystone:template.keystone,primaryTree:template.tree,primary:[...template.primary],secondary:template.secondary};
  const validation=bridge.validate(page,catalog);
  if(validation.valid)accepted.push({page,label:template.label,reason:template.pros?.[0]||'Interaction conditionnelle',id,legal:true});
 }
 if(!accepted.length)return {ok:false,reason:'Aucune page de runes du catalogue client entièrement valide'};
 const picked=accepted[0];
 const why=offensiveDuty&&picked.id==='poke'?
  'Galio est chargé d’apporter les dégâts magiques : sa compétence A peut déclencher Comète arcanique contre un mid à distance. Les touches et le délai ne sont pas garantis.':
  offensiveDuty&&picked.id==='burst'?
  'Galio joue dégâts AP : Électrocution peut renforcer un échange court après trois touches, si le combo atteint la cible.':
  picked.reason;
 return {ok:true,id:picked.id,label:picked.label,page:picked.page,reason:why,
  alternatives:accepted.slice(1),selection:'heuristique_tactique_non_certifiee'};
}
function analyze({picks,champions,championMeta,officialKits,reviewedKits,numericKits,numericPatch,numericClient,catalog,rules,runes,modules}={}){
 const fail=(stage,reason)=>({ok:false,stage,reason});
 if(!Array.isArray(picks)||picks.length!==10||picks.some(x=>!String(x||'').trim()))return fail('draft','Les dix champions sont requis');
 if(String(picks[2])!=='10099')return fail('draft','Galio mid uniquement pour le moment');
 if(new Set(picks.map(String)).size!==10)return fail('draft','Un champion ne peut pas être sélectionné deux fois');
 const m=modules||{},profile=m.profiles,team=m.team,guard=m.guard,core=m.core,
  optimizer=m.optimizer,order=m.order,contingency=m.contingency;
 if(!profile?.lookup||!team?.make||!guard?.prepare||!core?.validateEquipment||!optimizer?.optimize||!order?.order||!contingency?.plan)
  return fail('modules','Moteur incomplet : aucune substitution par les anciens calculs');
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
 const context=team.make({allies:names.slice(0,5),enemies:names.slice(5),lookup});
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
 const main=optimizer.optimize({prepared,threats:need,combatModel});
 if(!main.ok)return fail('five_items',main.reason);
 const sequence=order.order({prepared,items:main.main.items,threats:need});
 if(!sequence.ok)return fail('purchase_order',sequence.reason);
 const conditional=contingency.plan({prepared,optimizer,items:main.main.items,threats:need,max:3});
 if(!conditional.ok)return fail('contingencies',conditional.reason);
 const rune=chooseRune({bridge:m.runeBridge,catalog:runes,advisor:m.runeAdvisor,needs:need});
 const notes=[...context.reasons];
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
 const runeRange=selectedRune&&calculator?.runeProcRange?.({rune:selectedRune,ap:main.main.stats?.ap||0});
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
  draft:{ids:[...picks],names,threats:need,notes,confidence:context.confidence,
   officialKitCoverage:official?names.filter(n=>evidence[n]?.ok).length:0},
  build:{items:sequence.items,alternatives:conditional.options,legal:true,
   orderCertified:false,combinationsExamined:main.evaluatedPool,
   sourced:'player_client_items_only',noPopularBuilds:true},
  runes:rune,
  calculations:{inputAudit:inputAudit?.ok?inputAudit:null,
   antiheal:antiheal?.ok?antiheal:null,runeProc:runeRange?.ok?runeRange:null,
   numericDraft:numericDraft?.ok?numericDraft:null,
   numericGalio,
   combatScenarios:interactions?.ok?interactions:null,
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
