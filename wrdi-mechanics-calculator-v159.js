/* WRDI V15.9 — exhaustive input-field accounting and grounded interaction calculations.
 * Reads every available skill mechanic, every verified item passive/stats and all rune effects.
 * Numeric ranges are conditional PROC ranges, NOT predictions of actual match damage.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_MechanicsCalculatorV159=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.9.0';
const slots=['passive','q','w','e','r'];
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function leafPaths(value,prefix=''){
 if(value===null||typeof value!=='object')return prefix?[{path:prefix,value}]:[];
 if(Array.isArray(value))return value.flatMap((x,i)=>leafPaths(x,prefix+'['+i+']'));
 return Object.entries(value).flatMap(([k,v])=>leafPaths(v,prefix?prefix+'.'+k:k));
}
function audit({officialKits,items,runes}={}){
 const entries=officialKits?.entries,inventory=items?.items;
 const fundamentals=runes?.fundamental,minors=runes?.minor;
 if(!Array.isArray(entries)||!Array.isArray(inventory)||!Array.isArray(fundamentals)||!Array.isArray(minors))
  return {ok:false,reason:'Une des trois familles de fiches est absente'};
 const mechanics={},missing=[],truncated=[];
 let abilities=0,skillsWithMechanics=0;
 for(const c of entries){
  for(const slot of slots){
   const s=c.skills?.[slot];
   if(!s?.name||typeof s.excerpt_fr!=='string'){missing.push(c.name+':'+slot);continue;}
   abilities++;
   if(s.descriptionTruncated)truncated.push(c.name+':'+slot);
   const flags=Array.isArray(s.detected_mechanics)?s.detected_mechanics:[];
   if(flags.length)skillsWithMechanics++;
   for(const flag of flags)mechanics[flag]=(mechanics[flag]||0)+1;
  }
 }
 const itemStats={},itemPassiveFields={},runeFields={};
 for(const item of inventory){
  for(const [key,val] of Object.entries(item.stats||{}))if(finite(val))itemStats[key]=(itemStats[key]||0)+1;
  for(const p of item.passives||[])for(const {path} of leafPaths(p.mechanics||{}))
   itemPassiveFields[path]=(itemPassiveFields[path]||0)+1;
 }
 for(const r of [...fundamentals,...minors])for(const {path} of leafPaths(r.effect||{}))
  runeFields[path]=(runeFields[path]||0)+1;
 return {ok:true,version:VERSION,champions:entries.length,abilities,expectedAbilities:entries.length*5,
  mechanics,skillsWithMechanics,missing,truncatedDescriptions:truncated.length,
  items:inventory.length,itemStatFields:itemStats,itemPassiveFields,
  runes:fundamentals.length+minors.length,runeEffectFields:runeFields,
  ratiosFromChampionSkillsVerified:false,completeCombatSimulation:false,
  note:'Tous les champs inventoriés ; seuls les déclencheurs et nombres documentés autorisent un calcul effectif.'};
}
function antihealComparison({items,galio,threats={}}={}){
 const inventory=Array.isArray(items?.items)?items.items:[];
 const spells=slots.flatMap(slot=>{
  const s=galio?.skills?.[slot];return s?[{slot,name:s.name,flags:s.detected_mechanics||[]}]:[];
 });
 const magicSpells=spells.filter(s=>s.flags.includes('magic_damage'));
 const result=[];
 for(const item of inventory){
  for(const passive of item.passives||[]){
   const m=passive.mechanics||{};
   if(!finite(m.grievous_wounds_pct))continue;
   const triggers=Array.isArray(m.trigger)?m.trigger:[m.trigger].filter(Boolean);
   const spellTrigger=triggers.some(t=>['deal_magic_damage_to_champion','magic_or_true_damage_to_champion'].includes(t));
   const contactTrigger=triggers.includes('damage_champion');
   const retaliatory=triggers.some(t=>['attacked','attacked_by_champion'].includes(t));
   result.push({itemId:item.id,itemName:item.name_fr,passive:passive.name,
    reductionPct:m.grievous_wounds_pct,durationSeconds:finite(m.duration_s)?m.duration_s:null,
    triggers,triggeredByDocumentedMagicSpells:spellTrigger?magicSpells.map(s=>({slot:s.slot,name:s.name})):[],
    canTriggerOnOwnDamage:spellTrigger&&magicSpells.length>0||contactTrigger,
    canTriggerWhenAttacked:retaliatory,
    pressure:finite(threats.confirmedHeal)&&finite(threats.conditionalHeal)?
     {confirmed:threats.confirmedHeal,conditional:threats.conditionalHeal}:null,
    uptimePredictable:false,
    limitations:retaliatory?'L’effet dépend du déclencheur réel (notamment des attaques subies)':'Le sort doit toucher un champion pour activer le passif'});
  }
 }
 return {ok:true,version:VERSION,items:result,galioMagicSpells:magicSpells.map(s=>({slot:s.slot,name:s.name})),
  rankingCertified:false,note:'Égalité des pourcentages ne signifie pas égalité de fréquence d’application.'};
}
function runeProcRange({rune,ap=0,bonusAd=0}={}){
 if(!rune||!finite(ap)||!finite(bonusAd)||ap<0||bonusAd<0)return {ok:false,reason:'Rune ou caractéristiques invalides'};
 const e=rune.effect||{};
 const keys=[['magic_damage_base_min','magic_damage_base_max','damage_ap_pct','damage_bonus_ad_pct'],
  ['damage_base_min','damage_base_max','damage_ap_pct','damage_bonus_ad_pct']];
 for(const [min,max,apRatio,adRatio] of keys){
  if(finite(e[min])&&finite(e[max])&&finite(e[apRatio])){
   const bonus=ap*e[apRatio]/100+bonusAd*(finite(e[adRatio])?e[adRatio]:0)/100;
   return {ok:true,name:rune.name_fr,min:e[min]+bonus,max:e[max]+bonus,
    ap,bonusAd,damageType:e.damage_type|| (min.startsWith('magic_')?'magic':'unspecified'),
    conditional:true,levelUnknown:true,procNotGuaranteed:true,
    warning:'Fourchette du déclenchement, avant résistances et sans garantir son activation'};
  }
 }
 if(e.damage_base_range&&finite(e.damage_base_range.min)&&finite(e.damage_base_range.max)&&finite(e.ap_ratio_pct)){
  const bonus=ap*e.ap_ratio_pct/100+bonusAd*(finite(e.bonus_ad_ratio_pct)?e.bonus_ad_ratio_pct:0)/100;
  return {ok:true,name:rune.name_fr,min:e.damage_base_range.min+bonus,max:e.damage_base_range.max+bonus,
   ap,bonusAd,damageType:e.damage_type||'adaptive',conditional:true,levelUnknown:true,
   procNotGuaranteed:true,requiredHits:e.required_hits||null,windowSeconds:e.window_seconds||null,
   warning:'Fourchette du déclenchement, avant résistances et sans garantir son activation'};
 }
 return {ok:false,name:rune.name_fr,reason:'Pas de formule de dégâts directe et complète exploitable sans hypothèse'};
}
return Object.freeze({VERSION,audit,antihealComparison,runeProcRange,leafPaths});
});
