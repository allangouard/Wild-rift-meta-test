/* WRDI V16.5 — Wild Rift client passive interaction scenarios.
 * These are conditional item-passive opportunity scenarios, NOT a battle simulator:
 * no known champion base stats, enemy MR/armor, real proc frequency or enemy build.
 * Every number is derived from item mechanical fields and disclosed assumptions.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_ItemInteractionsV165=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='16.5.0';
const n=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,v):0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const find=(item,key)=>(item.passives||[]).map(p=>p.mechanics||{}).find(m=>Object.hasOwn(m,key));
const has=(items,id)=>items.some(i=>i.id===id);
function stats(items){
 const s={hp:0,ap:0,armor:0,mr:0,ah:0};
 for(const item of items)for(const k of Object.keys(s))s[k]+=n(item.stats?.[k]);
 const rift=items.find(i=>i.id==='riftmaker');
 const conversion=rift&&find(rift,'bonus_ap_formula')?.bonus_ap_formula==='0.02 * bonus_hp'?s.hp*0.02:0;
 const cap=items.find(i=>i.id==='rabadons_deathcap');
 const multiplier=n(find(cap||{},'value')?.value)||1;
 const ap=(s.ap+conversion)*multiplier;
 return {...s,apAfterInteractions:ap,riftBonusAp:conversion,apMultiplier:multiplier};
}
function scenario(items,threats={},options={}){
 if(!Array.isArray(items)||items.some(x=>!x?.id))return {ok:false,reason:'Objets invalides'};
 const duration=n(options.duration)||8;
 const exposure=clamp(options.contactChance??(duration<4?0.35:0.65),0,1);
 const targetHp=n(options.targetMaxHp)||2500;
 const s=stats(items);
 const enemyPhysical=n(threats.ad),enemyMagic=n(threats.ap),enemyHeal=n(threats.confirmedHeal??threats.heal);
 const enemyShield=n(threats.shield);
 const critConfirmed=n(threats.crit);const critPotential=n(threats.critPotential);
 const alliedMagic=n(threats.alliedApCarry),frontline=n(threats.frontlineNeed);
 const notes=[],values={};
 let opportunity=0;
 const item=id=>items.find(x=>x.id===id);
 // Conditional close-range effects: expected uptime is unknown.
 const hollow=item('hollow_radiance');
 if(hollow){
  const imm=find(hollow,'damage_formula');
  if(imm?.damage_formula==='base_20_to_30 + 0.01 * bonus_hp'){
   const ticks=Math.floor(duration);
   const min=(20+0.01*s.hp)*ticks,max=(30+0.01*s.hp)*ticks;
   values.hollowRadiance={damagePerSecondRawRange:[20+0.01*s.hp,30+0.01*s.hp],
    rawDamageRangeIfAlwaysAdjacent:[min,max],seconds:duration,
    contactCondition:true,damageResistancesUnknown:true};
   // Range is reported, never called expected actual damage.
   opportunity+=exposure*Math.min(3,duration/2)*1.1;
   notes.push('Rayonnement : dégâts de proximité conditionnels, augmentés par les PV bonus');
  }
 }
 const despair=item('unending_despair');
 if(despair){
  const passive=find(despair,'heal_multiplier_of_damage_dealt');
  if(passive?.damage_formula==='0.03 * own_max_hp'&&n(passive.tick_s)>0){
   const triggers=Math.floor(duration/passive.tick_s);
   values.unendingDespair={
    triggerIntervalSeconds:passive.tick_s,
    possibleTriggersIfContinuousCombat:triggers,
    bonusHpOnlyDamageContributionPerTrigger:0.03*s.hp,
    hpOwner:'Galio / own_max_hp according to client catalogue mechanics',
    fullDamageUnknownBaseHp:true,healingMultiplierOfDamageDealt:n(passive.heal_multiplier_of_damage_dealt),
    actualHealsUnknownBeforeResistances:true,
    damageFormula:passive.damage_formula};
   opportunity+=exposure*triggers*(frontline>0?1.5:1.2);
   if(triggers>0)notes.push('Désespoir : déclenchement périodique et soin seulement si le combat dure au moins 4 s');
  }
 }
 const rift=item('riftmaker');
 if(rift){
  const p=find(rift,'max_damage_amp_pct');
  const maxAmp=n(p?.max_damage_amp_pct);
  const perSecond=n(p?.damage_amp_per_s_pct);
  const ramp=clamp(Math.floor(duration)*perSecond,0,maxAmp);
  values.riftmaker={bonusApFromHp:s.riftBonusAp,damageAmplificationAtDurationPct:ramp,
   omnivampMeleeAtMaximumPct:n(p?.omnivamp_melee_pct),
   fullRampAtSeconds:perSecond?Math.ceil(maxAmp/perSecond):null,
   healingDependsOnRealDamage:true};
  opportunity+=clamp(duration/4,0,1)*1.5+(s.riftBonusAp>0?Math.min(2,s.riftBonusAp/20):0);
  notes.push('Créateur de failles : '+s.riftBonusAp.toFixed(1)+' AP issus des PV bonus ; amplification progressive sous condition');
 }
 const amaranth=item('amaranths_twinguard');
 if(amaranth){
  const p=find(amaranth,'stacks_max');
  const stacks=n(p?.stacks_max),interval=n(p?.stack_interval_s)||1;
  const active=duration>=stacks*interval;
  const bonusArmor=active?s.armor*n(p?.bonus_armor_at_max_pct)/100:0;
  const bonusMr=active?s.mr*n(p?.bonus_mr_at_max_pct)/100:0;
  values.amaranth={requiredSeconds:stacks*interval,activeInScenario:active,
   additionalBonusArmorIfActive:bonusArmor,additionalBonusMrIfActive:bonusMr,
   tenacityAtMaxPct:active?n(p?.tenacity_at_max_pct):0,
   valuesExcludeBaseAndPreexistingChampionStats:true};
  opportunity+=active?2.4*(enemyPhysical>=1&&enemyMagic>=1?1.15:1):0;
  notes.push(active?'Amaranth : cinq charges supposées atteintes, résistances bonus renforcées':
   'Amaranth : cinq charges non atteintes dans ce combat court');
 }
 const trident=item('oceanids_trident');
 if(trident){
  const p=find(trident,'shield_reduction_aoe_pct_formula');
  if(p){
   values.trident={aoeShieldReductionPct:Math.min(45,25+0.05*s.apAfterInteractions),
    singleTargetShieldReductionPct:Math.min(60,40+0.05*s.apAfterInteractions),
    requiresAbilityDamageToChampion:true,durationSeconds:n(p.duration_s)};
   opportunity+=Math.min(4,enemyShield*2.6);
   if(enemyShield)notes.push('Trident : réduction de bouclier sur dégâts de compétence, pertinente contre les boucliers détectés');
  }
 }
 const thorn=item('thornmail'),morello=item('morellonomicon');
 if(thorn||morello){
  values.antiheal={healThreatCount:enemyHeal,thornmail:!!thorn,morellonomicon:!!morello,
   meaningfulIfEnemyHealing:true};
  if(enemyHeal<=0){
   opportunity-=thorn?6:0; opportunity-=morello?4:0;
   notes.push('Anti-soin : aucun soin adverse confirmé dans la draft, passif peu rentable');
  }else opportunity+=Math.min(3,enemyHeal*1.5);
 }
 const randuin=item('randuins_omen');
 if(randuin){
  values.randuin={criticalPhysicalDamageReductionPct:30,
   confirmedCriticalSources:critConfirmed,potentialCriticalSources:critPotential,
   enemyItemBuildUnknown:critConfirmed===0};
  opportunity+=critConfirmed?Math.min(4,critConfirmed*2.5):-1.8;
  if(!critConfirmed)notes.push('Randuin : critiques possibles mais build critique adverse non confirmé');
 }
 const iceborn=item('iceborn_gauntlet');
 if(iceborn){
  values.iceborn={damageFromBaseAdPlusBonusArmor:'1.0 * Galio_base_AD + 0.25 * bonus_armor',
   cooldownSeconds:1.5,slowPct:30,slowSeconds:2,
   requiresMeleeAttackAfterSpell:true};
  opportunity+=(enemyPhysical>=2?1:0)+(frontline?0.4:0);
  if(n(threats.cc)>=2)opportunity-=1.6;
  notes.push('Gantelet : nécessite une attaque de mêlée après un sort ; ralentissement moins précieux avec plusieurs contrôles');
 }
 const heart=item('frozen_heart');
 if(heart){
  values.frozenHeart={attackSpeedReductionPct:25,range:650,requiresEnemyWithinRange:true};
  opportunity+=enemyPhysical>=2?1.5*exposure:0;
 }
 const liandry=item('liandrys_torment');
 if(liandry){
  const p=find(liandry,'damage_per_tick_formula');
  values.liandry={targetMaxHpPercentPerTick:p?.damage_per_tick_formula==='0.02 * target_max_hp'?2:null,
   tickSeconds:p?.tick_s||null,requiresSpellHit:true};
  if(n(threats.tank)>0)opportunity+=Math.min(2.5,n(threats.tank)*1.5);
 }
 const ice=item('dawnshroud');
 if(ice){
  values.dawnshroud={ccTrigger:true,revealSeconds:3,bonusHpDamageRatio:0.025,
   rawTriggerDamageIfProcced:40+0.025*s.hp,
   triggerCondition:'immobilization within 400 units',actualTriggersUnknown:true};
  if(n(threats.cc)>=2)opportunity+=0.6;
 }
 // Being able to last in combat matters, but massive all-defense builds
 // must still provide at least some threat if Galio's allies lack damage.
 if(enemyPhysical>=2&&enemyMagic>=1){
  const coverage=Math.min(1,s.armor/65)+Math.min(1,s.mr/65);
  opportunity+=0.6*coverage;
 }
 if(items.length>=4&&s.apAfterInteractions<70&&alliedMagic<1)opportunity-=3;
 if(items.length>=4&&s.apAfterInteractions<40&&alliedMagic>=1)opportunity-=1.2;
 if(items.length>=4&&s.armor>=100&&enemyPhysical<2)opportunity-=(s.armor-100)*0.025;
 if(items.length>=4&&s.mr>=135&&enemyMagic<2)opportunity-=(s.mr-135)*0.025;
 return {ok:true,version:VERSION,duration,contactChance:exposure,targetHpPlaceholder:targetHp,
  stats:s,values,notes,opportunity:Math.round(opportunity*100)/100,
  assumptions:['Pas de statistiques de base Galio ni de résistances adverses vérifiées',
   'Temps passé au contact non observé : scénario hypothétique',
   'Procs, PV restants, CC et soins réels non simulés',
   'Cibles ennemies et builds de leurs objets inconnus'],
  notObservedGameplay:true};
}
function compare(items,threats={}){
 const short=scenario(items,threats,{duration:2.5,contactChance:0.35});
 const long=scenario(items,threats,{duration:8,contactChance:0.65});
 if(!short.ok||!long.ok)return {ok:false,reason:'Impossible de comparer les scénarios'};
 const sustainedContext=n(threats.frontlineNeed)>0||n(threats.teamEngage)>=1||
  n(threats.alliedApCarry)>=1;
 // Moderate contribution: never turn 8-second assumptions into guaranteed results.
 const weight=sustainedContext?0.64:0.48;
 const score=(1-weight)*short.opportunity+weight*long.opportunity;
 const ids=new Set(items.map(i=>i.id));
 const combinations=[];
 if(ids.has('hollow_radiance')&&ids.has('unending_despair'))
  combinations.push('Rayonnement + Désespoir : dégâts de proximité cumulables si Galio reste en combat');
 if(ids.has('riftmaker')&&ids.has('unending_despair'))
  combinations.push('Désespoir + Créateur de failles : dégâts périodiques et amplification progressive, soins conditionnels');
 if(ids.has('riftmaker')&&ids.has('amaranths_twinguard'))
  combinations.push('Amaranth + Créateur de failles : PV bonus convertis en AP, résistances qui montent après 5 s');
 if(ids.has('oceanids_trident')&&n(threats.shield)>0)
  combinations.push('Trident : réduction des boucliers pertinents, seulement sur champions touchés');
 return {ok:true,version:VERSION,short,long,score:Math.round(score*100)/100,
  combinations,method:'conditional_client_passive_scenarios_not_actual_combat_forecast'};
}
return Object.freeze({VERSION,stats,scenario,compare});
});
