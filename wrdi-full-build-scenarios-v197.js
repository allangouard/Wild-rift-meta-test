/* WRDI V19.7 — complete five-item, reproducible Wild Rift combat scenarios.
 * Item/passive figures come from the player's client catalogue. Targets, base
 * Galio stats, hits, enemy attacks and fight length are EXPLICIT hypothetical
 * scenario parameters, NOT claims about champion stats or actual games.
 * Partial Galio Q/W/E source model excludes passive, tornado, R and rune procs.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_FullBuildScenariosV197=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='19.7.0';
const n=x=>typeof x==='number'&&Number.isFinite(x)?Math.max(0,x):0;
const clamp=(x,lo,hi)=>Math.min(hi,Math.max(lo,x));
const round=x=>Math.round(x*100)/100;
const defense=(raw,resistance)=>raw*100/(100+Math.max(-90,resistance));
const passive=(it,key)=>(it?.passives||[]).map(x=>x.mechanics||{}).find(x=>Object.hasOwn(x,key));
const select=(items,id)=>items.find(x=>x.id===id);
const PROFILES=Object.freeze([
 {id:'burst',label:'Burst court contre cible fragile',seconds:2.5,targetHp:1900,targetArmor:55,targetMr:45,targetRemainingHpPct:85,
  galioBaseHp:2000,galioBaseArmor:65,galioBaseMr:45,incomingPhysical:650,incomingMagic:350,
  spellHits:1,adjacentSeconds:1,autosReceived:0,shieldHp:0,skillsTrigger:true},
 {id:'bruiser',label:'Escarmouche contre bruiser',seconds:5,targetHp:2900,targetArmor:115,targetMr:95,targetRemainingHpPct:65,
  galioBaseHp:2000,galioBaseArmor:65,galioBaseMr:45,incomingPhysical:1050,incomingMagic:850,
  spellHits:2,adjacentSeconds:3,autosReceived:2,shieldHp:250,skillsTrigger:true},
 {id:'tank',label:'Combat prolongé contre frontline',seconds:8,targetHp:3900,targetArmor:180,targetMr:160,targetRemainingHpPct:32,
  galioBaseHp:2000,galioBaseArmor:65,galioBaseMr:45,incomingPhysical:1750,incomingMagic:1550,
  spellHits:2,adjacentSeconds:6,autosReceived:4,shieldHp:450,skillsTrigger:true}
]);
function stats(items){
 const total={ap:0,hp:0,armor:0,mr:0,ah:0,mpenFlat:0,mpenPct:0};
 for(const it of items){
  const s=it.stats||{};
  for(const k of ['ap','hp','armor','mr','ah'])total[k]+=n(s[k]);
  total.mpenFlat+=n(s.mpen_flat);
  total.mpenPct+=n(s.mpen_pct);
 }
 const rift=select(items,'riftmaker');
 const bonusAp=rift&&passive(rift,'bonus_ap_formula')?.bonus_ap_formula==='0.02 * bonus_hp'?total.hp*.02:0;
 const cap=select(items,'rabadons_deathcap');
 const multiplier=n(passive(cap,'value')?.value)||1;
 total.ap=(total.ap+bonusAp)*multiplier;
 total.apFromItems=n(items.reduce((s,i)=>s+n(i.stats?.ap),0));
 total.riftBonusAp=bonusAp;
 total.rabadonMultiplier=multiplier;
 return total;
}
function evaluate(items,profile,combatModel,{role='hybrid_offensive'}={}){
 if(!Array.isArray(items)||items.length!==5||new Set(items.map(x=>x?.id)).size!==5)
  return {ok:false,reason:'Cinq objets uniques requis'};
 if(!profile||!['burst','bruiser','tank'].includes(profile.id))return {ok:false,reason:'Profil inconnu'};
 const s=stats(items),notes=[],procs=[];
 const trigger=(id,active,when,raw=0,kind='magic')=>{
  const amount=active?round(raw):0;
  procs.push({id,eligible:Boolean(active),condition:when,rawDamageIfTriggered:round(raw),countedDamage:amount,damageType:kind});
  return amount;
 };
 const targetMr=Math.max(0,profile.targetMr*(1-s.mpenPct/100)-s.mpenFlat);
 const rawSpell=combatModel?.directDamageAt?.({ap:s.ap})||null;
 const spellRaw=rawSpell?rawSpell.total:null;
 const magic=(raw)=>defense(n(raw),targetMr);
 // Galio Q/W/E source model is a single-hit comparison; do not multiply the
 // whole combo by casts whose cooldowns and hit timing are not verified.
 let extraRaw=0,physicalRaw=0;
 const luden=select(items,'ludens_echo');
 if(luden){
  const m=passive(luden,'base_damage');
  const has=m?.base_damage==='75 + 0.08 * ap';
  const base=75+0.08*s.ap,extra=20+.012*s.ap;
  const missingSecondaries=4; // single champion in scenario, explicitly stated
  const possible=base+missingSecondaries*extra;
  extraRaw+=trigger('ludens_echo',has&&profile.skillsTrigger,
   'Sort dommageable disponible, 4 cibles secondaires absentes, un proc, récupération 9 s',possible);
 }
 const liandry=select(items,'liandrys_torment');
 if(liandry){
  const m=passive(liandry,'damage_per_tick_formula');
  const valid=m?.damage_per_tick_formula==='0.02 * target_max_hp'&&n(m.tick_s)===1;
  const ticks=valid&&profile.skillsTrigger?Math.min(3,Math.floor(profile.seconds)):0;
  extraRaw+=trigger('liandrys_torment',ticks>0,
   'Une application du sort, '+ticks+' ticks sur 3 s, sans réapplication automatique',ticks*.02*profile.targetHp);
 }
 const hollow=select(items,'hollow_radiance');
 if(hollow){
  const m=passive(hollow,'damage_formula');
  const ticks=Math.min(Math.floor(profile.adjacentSeconds),Math.floor(profile.seconds));
  const valid=m?.damage_formula==='base_20_to_30 + 0.01 * bonus_hp';
  extraRaw+=trigger('hollow_radiance',valid&&ticks>0,'Cible au contact pendant '+ticks+' secondes ; base basse 20 du client',
    ticks*(20+0.01*s.hp));
 }
 const despair=select(items,'unending_despair');
 let conditionalHeal=0;
 if(despair){
  const m=passive(despair,'heal_multiplier_of_damage_dealt');
  const ticks=n(m?.tick_s)>0?Math.floor(profile.seconds/m.tick_s):0;
  const valid=m?.damage_formula==='0.03 * own_max_hp'&&ticks>0&&profile.adjacentSeconds>=m.tick_s;
  const raw=ticks*.03*(profile.galioBaseHp+s.hp);
  extraRaw+=trigger('unending_despair',valid,
   'En combat >= 4 s, proche de cible au déclenchement, '+ticks+' proc(s)',raw);
  if(valid)conditionalHeal=magic(raw)*n(m.heal_multiplier_of_damage_dealt);
 }
 const dawn=select(items,'dawnshroud');
 if(dawn){
  const enabled=profile.skillsTrigger&&profile.adjacentSeconds>0;
  extraRaw+=trigger('dawnshroud',enabled,
   'Galio immobilise un champion dans la portée requise ; un proc',40+0.025*s.hp);
 }
 const thorn=select(items,'thornmail');
 if(thorn){
  const m=passive(thorn,'damage_formula');
  const active=m?.damage_formula==='20 + 0.06 * bonus_armor + 0.01 * bonus_hp'&&profile.autosReceived>0;
  extraRaw+=trigger('thornmail',active,'Galio subit '+profile.autosReceived+' attaque(s) adverses',
   profile.autosReceived*(20+.06*s.armor+.01*s.hp));
 }
 const rift=select(items,'riftmaker');
 let amp=0;
 if(rift){
  const m=passive(rift,'max_damage_amp_pct');
  if(m)amp=Math.min(n(m.max_damage_amp_pct),Math.floor(profile.seconds)*n(m.damage_amp_per_s_pct))/100;
  procs.push({id:'riftmaker',eligible:amp>0,condition:'Temps de combat contre champions : '+profile.seconds+' s',ampPct:round(amp*100)});
 }
 const liandryRamp=liandry&&passive(liandry,'damage_amp_pct_per_s');
 if(liandryRamp){
  const m=liandryRamp;
  const liAmp=Math.min(n(m.max_amp_pct),Math.floor(profile.seconds)*n(m.damage_amp_pct_per_s))/100;
  amp=(1+amp)*(1+liAmp)-1;
  procs.push({id:'liandry_ramp',eligible:liAmp>0,condition:'Maintien du combat pendant '+profile.seconds+' s',ampPct:round(liAmp*100)});
 }
 let rawTotal=spellRaw===null?null:(spellRaw+extraRaw+physicalRaw)*(1+amp);
 const orb=select(items,'infinity_orb'),orbM=passive(orb,'damage_bonus_pct');
 const orbEligible=orbM?.condition==='target_hp_pct < 40'&&profile.targetRemainingHpPct<40;
 if(orb)procs.push({id:'infinity_orb',eligible:orbEligible,condition:'PV de la cible avant dégâts strictement < 40 %',ampPct:orbEligible?n(orbM.damage_bonus_pct):0});
 // Orb only applies to eligible abilities, not all item passives.
 const bonusOrb=orbEligible&&spellRaw!==null?spellRaw*(1+amp)*n(orbM.damage_bonus_pct)/100:0;
 if(rawTotal!==null)rawTotal+=bonusOrb;
 let shieldReduced=0;
 const trident=select(items,'oceanids_trident');
 if(trident){
  const p=passive(trident,'shield_reduction_aoe_pct_formula');
  const pct=Math.min(45,25+.05*s.ap);
  shieldReduced=profile.shieldHp>0&&profile.skillsTrigger&&p?profile.shieldHp*pct/100:0;
  procs.push({id:'oceanids_trident',eligible:shieldReduced>0,
   condition:'Sort touche une cible avec bouclier, scénario AoE, réduction de bouclier et non dégâts PV',shieldReduced:round(shieldReduced)});
 }
 const antiheal=items.filter(x=>['morellonomicon','thornmail'].includes(x.id));
 for(const it of antiheal)procs.push({id:it.id+'_grievous',eligible:it.id==='morellonomicon'?profile.skillsTrigger:profile.skillsTrigger||profile.autosReceived>0,
  condition:'Blessures graves si contact magique/attaque selon déclencheur ; aucun soin adverse chiffré',healingReductionNotDamage:true});
 const incomingPhysical=defense(profile.incomingPhysical,profile.galioBaseArmor+s.armor);
 const incomingMagic=defense(profile.incomingMagic,profile.galioBaseMr+s.mr);
 const totalIncoming=incomingPhysical+incomingMagic;
 const hp=profile.galioBaseHp+s.hp;
 const remainingHp=hp-totalIncoming;
 const rawDirect=rawTotal;
 const magicDamage=rawDirect===null?null:round(magic(rawDirect));
 const survived=remainingHp>0;
 const result={ok:true,id:profile.id,label:profile.label,seconds:profile.seconds,
  stats:s,damage:{rawGalioQWE:spellRaw,rawConditionalPassives:round(extraRaw),rawTotal:rawDirect===null?null:round(rawDirect),
   targetMrAfterPenetration:round(targetMr),magicDamageToHpIfAllConditions:magicDamage,
   shieldReduction:round(shieldReduced),physicalBonusNotModeled:true,
   excludes:['Galio passive','Galio ultimate','Q tornado','rune procs','enemy spell shields']},
  survival:{hpBeforeDamage:hp,incomingPhysicalAfterArmor:round(incomingPhysical),
   incomingMagicAfterMr:round(incomingMagic),incomingTotal:round(totalIncoming),hpRemainingWithoutHealing:round(remainingHp),
   survivesIncomingScenario:survived,conditionalHealNotCounted:round(conditionalHeal),
   survivalMarginWithConditionalHeal:round(remainingHp+conditionalHeal),itemDefenseOnly:false},
  procs,assumptions:profile,modelStatus:'illustrative_conditions_not_predicted_winrate'};
 return result;
}
function compare({primaryItems,candidateBuilds=[],combatModel,threats={},profiles=PROFILES}={}){
 if(!Array.isArray(primaryItems)||primaryItems.length!==5)return {ok:false,reason:'Build principal absent'};
 const ids=new Set(),builds=[];
 for(const items of [primaryItems,...candidateBuilds]){
  if(!Array.isArray(items)||items.length!==5)continue;
  const key=items.map(x=>x?.id).join('|');
  if(ids.has(key))continue;ids.add(key);
  builds.push({ids:items.map(x=>x.id),items});
 }
 const role=n(threats.damageDuty)>=1&&n(threats.frontlineProvided)>=2?'ap_burst':n(threats.frontlineNeed)>0?'tank_utility':'hybrid_offensive';
 const evaluated=builds.map(({ids,items})=>{
  const scenarios=profiles.map(p=>evaluate(items,p,combatModel,{role}));
  const all=scenarios.every(x=>x.ok);
  if(!all)return {ids,ok:false};
  // Normalized relative performance: never equate damage with durability.
  const burst=scenarios[0],bruiser=scenarios[1],tank=scenarios[2];
  const d=x=>n(x.damage.magicDamageToHpIfAllConditions);
  const hp=x=>x.survival.hpRemainingWithoutHealing;
  const damageScore=(d(burst)*.5+d(bruiser)*.3+d(tank)*.2)/100;
  const sustainScore=(hp(burst)*.2+hp(bruiser)*.35+hp(tank)*.45)/250;
  const utility=items.some(x=>x.id==='morellonomicon')&&n(threats.healPressure)>0?2:0;
  const shield=items.some(x=>x.id==='oceanids_trident')&&n(threats.shieldPressure)>=1.5?2:0;
  const weights=role==='ap_burst'?{damage:.78,sustain:.22}:role==='tank_utility'?{damage:.32,sustain:.68}:{damage:.52,sustain:.48};
  const score=weights.damage*damageScore+weights.sustain*sustainScore+utility+shield;
  return {ok:true,ids,score:round(score),damageScore:round(damageScore),
   survivalScore:round(sustainScore),scenarios};
 });
 const valid=evaluated.filter(x=>x.ok).sort((a,b)=>b.score-a.score||a.ids.join('|').localeCompare(b.ids.join('|')));
 const baseline=evaluated.find(x=>x.ids.join('|')===primaryItems.map(x=>x.id).join('|'));
 return {ok:true,version:VERSION,role,primaryIds:primaryItems.map(x=>x.id),
  baselineScore:baseline?.score??null,winner:valid[0]||null,candidates:valid.slice(0,8),totalCompared:valid.length,
  weights:role==='ap_burst'?{damage:0.78,survival:0.22}:role==='tank_utility'?{damage:0.32,survival:0.68}:{damage:0.52,survival:0.48},
  exactOpponentStats:false,actualCombatPredicted:false,profilesHypothetical:true,
  includesAllFiveItems:true,basis:'client_item_effects_and_Galio_QWE_partial_source_model'};
}
return Object.freeze({VERSION,PROFILES,stats,evaluate,compare});
});