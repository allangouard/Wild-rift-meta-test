/* WRDI V16.6 — productive survival: defense is valuable when it protects actions.
 * Works from the player's Wild Rift client item mechanics, not an item-name tier list.
 * Opportunity scores are auditable heuristics; no fabricated actual damage or uptime.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_ProductiveSurvivalV166=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='16.6.0';
const n=v=>Number.isFinite(v)?Math.max(0,v):0;
const b=v=>Boolean(v);
const cap=(v,a,z)=>Math.max(a,Math.min(z,v));
const mechanics=item=>(item?.passives||[]).map(p=>p.mechanics||{});
function itemProfile(item,context={}){
 const m=mechanics(item),s=item?.stats||{},t=context||{};
 const periods=m.filter(p=>n(p.tick_s)>0&&(
  typeof p.damage_formula==='string'||typeof p.damage_per_tick_formula==='string'||
  n(p.base_magic_dps)>0||n(p.magic_dps)>0));
 const periodic=periods.length>0;
 const contactDamage=m.some(p=>n(p.base_magic_dps)>0||
  typeof p.damage_formula==='string'&&(
   p.damage_formula.includes('own_max_hp')||
   p.damage_formula.includes('bonus_hp')&&n(p.tick_s)>0))||
  m.some(p=>n(p.flat_magic_damage)>0&&n(p.activation_range)>0);
 const sustainFromDamage=m.some(p=>n(p.heal_multiplier_of_damage_dealt)>0||
  n(p.omnivamp_melee_pct)>0||typeof p.heal_formula==='string');
 const damageRamp=m.some(p=>n(p.max_damage_amp_pct)>0||n(p.max_amp_pct)>0||
  n(p.damage_amp_pct_per_s)>0);
 const armorScalingDamage=m.some(p=>typeof p.damage_formula==='string'&&p.damage_formula.includes('bonus_armor'));
 const contactSpells=m.some(p=>n(p.activation_range)>0||n(p.radius)>0&&n(p.magic_dps)>0);
 const shieldCut=m.some(p=>typeof p.shield_reduction_aoe_pct_formula==='string');
 const antiheal=m.some(p=>n(p.grievous_wounds_pct)>0);
 const critOnly=m.some(p=>n(p.physical_crit_damage_reduction_pct)>0);
 const attackSpeedAura=m.some(p=>n(p.enemy_attack_speed_reduction_pct)>0);
 const passiveDamage=periodic||contactDamage||armorScalingDamage||
  m.some(p=>n(p.flat_magic_damage)>0||n(p.magic_damage_max)>0||n(p.on_hit_magic_damage)>0);
 const defensive=n(s.hp)+n(s.armor)*4+n(s.mr)*4;
 const offensive=passiveDamage||n(s.ap)>0||damageRamp||shieldCut;
 const opportunity={
  periodic,contactDamage,sustainFromDamage,damageRamp,armorScalingDamage,
  contactSpells,shieldCut,antiheal,critOnly,attackSpeedAura,
  passiveDamage,defensive,offensive,
  requiresLongFight:periods.some(p=>n(p.tick_s)>=4)||m.some(p=>n(p.stacks_max)>=5&&n(p.stack_interval_s)>=1),
  needsConfirmedCrit:critOnly,
  needsConfirmedAttackSpeed:attackSpeedAura,
  source:'player_client_item_mechanics'
 };
 return opportunity;
}
function evaluate(items,threats={},options={}){
 if(!Array.isArray(items))return {ok:false,reason:'Objets requis'};
 const t=threats||{},duration=n(options.duration)||8;
 const engaged=cap(options.engageContact??(duration>=4?.65:.35),0,1);
 const early=items.length<=3;
 const alliedEngage=n(t.teamEngage);
 const rolePressure=(alliedEngage>0||n(t.alliedApCarry)>0||n(t.frontlineProvided)>0)?1.15:1;
 const confirmedAttackSpeed=n(t.attackSpeedPressureConfirmed);
 const extremePhysical=n(t.physicalThreatSevere);
 const physical=n(t.ad),magic=n(t.ap);
 let score=0,pressure=0,defensive=0;const parts=[],details=[];
 const profiles=items.map(i=>itemProfile(i,t));
 const armor=items.reduce((v,x)=>v+n(x.stats?.armor),0);
 const mr=items.reduce((v,x)=>v+n(x.stats?.mr),0);
 const hp=items.reduce((v,x)=>v+n(x.stats?.hp),0);
 const relevantArmor=physical>=2,relevantMr=magic>=1;
 for(let i=0;i<items.length;i++){
  const item=items[i],p=profiles[i],m=mechanics(item);
  const mixedResists=n(item.stats?.armor)>=30&&n(item.stats?.mr)>=30;
  const defenseAvailable=n(item.stats?.armor)>=30||n(item.stats?.mr)>=30||n(item.stats?.hp)>=250;
  // Productive survival : only a defensive item with accessible offense and/or damage-based self-heal.
  const proc=m.find(q=>n(q.heal_multiplier_of_damage_dealt)>0&&n(q.tick_s)>0);
  const procPossible=proc&&duration>=n(proc.tick_s)&&engaged>0;
  const damageDuringControl=p.contactDamage||p.periodic;
  const ccPressure=damageDuringControl&&n(t.cc)>=1?0.45:0;
  let productive=0;
  if(defenseAvailable&&damageDuringControl){
   productive+=1.6*engaged*rolePressure;
   if(procPossible)productive+=0.9*engaged;
   if(ccPressure)productive+=ccPressure*engaged;
  }
  if(defenseAvailable&&procPossible&&p.sustainFromDamage){
   productive+=1.8*engaged*rolePressure;
  }
  if(defenseAvailable&&p.armorScalingDamage)productive+=0.5*engaged;
  if(defenseAvailable&&p.damageRamp&&duration>=4)productive+=1.0*engaged;
  if(defenseAvailable&&p.shieldCut&&n(t.shield)>0)productive+=1.25;
  if(defenseAvailable&&p.passiveDamage&&n(t.frontlineNeed)===0)productive+=0.5*engaged;
  pressure+=productive;
  if(productive>0)parts.push(item.name_fr+' : résistance utilisée pour maintenir dégâts et contrôles');
  // Pure-defense utility is not zero. But it requires a reason beyond another +80 armor.
  let special=0;
  if(p.attackSpeedAura)special+=confirmedAttackSpeed?3.3*Math.min(1.5,confirmedAttackSpeed):0.55*engaged;
  if(p.critOnly)special+=n(t.crit)>0?2.8:0.25;
  if(p.attackSpeedAura&&confirmedAttackSpeed)parts.push(item.name_fr+' : contre attaques rapides confirmées');
  if(p.critOnly&&n(t.crit))parts.push(item.name_fr+' : réponse à critiques confirmés');
  defensive+=special;
  // At build slot two or three, sacrificing an offensive passive for a pure defensive
  // aura is most costly when allied engage already supplies survival/CC coverage.
  if(early&&defenseAvailable&&!p.offensive&&!p.sustainFromDamage){
   const covered=(relevantArmor&&armor>=50||relevantMr&&mr>=40);
   if(covered&&!confirmedAttackSpeed&&!n(t.crit)&&!extremePhysical){
    score-=(items.length===2?1.5:items.length===3?1.0:0.3)*rolePressure;
   }
  }
  details.push({itemId:item.id,productive,defensiveUtility:special,
   defensive: p.defensive,contactDamage:p.contactDamage,
   damageDuringControl,healingFromDamage:p.sustainFromDamage,
   pureDefensive:!p.offensive&&!p.sustainFromDamage,
   source:p.source});
 }
 score+=pressure+defensive;
 // Do not count survival or defense as equivalent to damage: strong pressure needs
 // an opportunity for champion-hitting effects, not just resistances on the sheet.
 if(items.length>=2){
  const sustained=profiles.some(x=>x.contactDamage)&&profiles.some(x=>x.sustainFromDamage);
  if(sustained&&duration>=4)score+=engaged*0.8;
 }
 // Situational late armor: if real physical/on-hit or crit danger is confirmed,
 // counter-build rather than blindly holding onto five favorite objects.
 if(extremePhysical&&armor>=80)score+=Math.min(4,extremePhysical*1.7);
 if(confirmedAttackSpeed&&profiles.some(x=>x.attackSpeedAura))
  score+=Math.min(3,confirmedAttackSpeed*1.3);
 if(n(t.crit)&&profiles.some(x=>x.critOnly))score+=Math.min(3,n(t.crit)*1.2);
 // If defense coverage already exists, further unneeded pure-defense slot
 // faces an opportunity cost, but a verified counterpassive can override.
 if(items.length>=4&&armor>=95&&mr>=40&&
    !confirmedAttackSpeed&&!n(t.crit)&&!extremePhysical){
  const passiveOnly=profiles.filter(x=>x.attackSpeedAura||x.critOnly).length;
  score-=passiveOnly*1.3;
 }
 return {ok:true,version:VERSION,duration,engageContactAssumption:engaged,
  score:Math.round(score*100)/100,pressure:Math.round(pressure*100)/100,
  defensive:Math.round(defensive*100)/100,
  details,parts,
  stats:{armor,mr,hp},
  limits:['Pas de probabilité réelle de touche ni de durée au contact',
   'Les dégâts des sorts et les soins effectifs nécessitent statistiques complètes et résistances ennemies',
   'Le contrôle et la provocation augmentent les occasions de dégâts, pas une garantie de 4 ou 5 secondes'],
  method:'productive_survival_opportunity_not_dps'};
}
function compare(items,threats={}){
 const short=evaluate(items,threats,{duration:2.5,engageContact:0.35});
 const long=evaluate(items,threats,{duration:8,engageContact:0.65});
 const weight=n(threats.teamEngage)>=1||n(threats.alliedApCarry)>=1?0.65:0.5;
 return {ok:short.ok&&long.ok,short,long,
  score:Math.round(((1-weight)*short.score+weight*long.score)*100)/100,
  role:'contact_pressure_engage',method:'conditional_productive_survival'};
}
return Object.freeze({VERSION,itemProfile,evaluate,compare});
});
