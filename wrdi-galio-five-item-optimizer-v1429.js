/* WRDI V14.29 — five-item Galio mid qualitative draft optimizer.
 * Sources: ONLY player-supplied Wild Rift client items + equip restrictions.
 * No observed/popular builds, external item metadata, damage forecasts or winrate.
 * Beam search explores full legal combinations rather than picking one of several
 * relevant options. Boots/enchantments handled separately (not in these 5 slots).
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioFiveItemOptimizerV1429=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.6.0-alpha.1';
const synergyEngine=(typeof require==='function'
 ? require('./wrdi-galio-kit-item-synergy-v1434.js')
 : (typeof globalThis!=='undefined'?globalThis.WRDI_GalioKitItemSynergyV1434:null));
const defenseBalance=(typeof require==='function'
 ? require('./wrdi-galio-defense-balance-v153.js')
 : (typeof globalThis!=='undefined'?globalThis.WRDI_GalioDefenseBalanceV153:null));
const productiveEngine=(typeof require==='function'
 ? require('./wrdi-productive-survival-v166.js')
 : (typeof globalThis!=='undefined'?globalThis.WRDI_ProductiveSurvivalV166:null));
const interactionEngine=(typeof require==='function'
 ? require('./wrdi-item-interactions-v165.js')
 : (typeof globalThis!=='undefined'?globalThis.WRDI_ItemInteractionsV165:null));
const purchaseOrder=(typeof require==='function'
 ? require('./wrdi-galio-purchase-order-v1432.js')
 : null);
function firstItemModule(){
 return purchaseOrder||(typeof globalThis!=='undefined'?globalThis.WRDI_GalioPurchaseOrderV1432:null);
}
const num=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,v):0;
const count=v=>Math.min(5,num(v));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
function features(item){
 const stats=item.stats||{},passives=(item.passives||[]).map(p=>p.mechanics||{});
 const has=k=>passives.some(p=>num(p[k])>0);
 return {ap:num(stats.ap),hp:num(stats.hp),armor:num(stats.armor),mr:num(stats.mr),
  ah:num(stats.ah),ad:num(stats.ad),as:num(stats.as_pct),magicPen:num(stats.mpen_pct),
  antiheal:has('grievous_wounds_pct'),
  antihealBySpell:passives.some(p=>num(p.grievous_wounds_pct)>0&&
   (p.trigger==='deal_magic_damage_to_champion'||p.trigger==='magic_or_true_damage_to_champion')),
  antihealByContact:passives.some(p=>num(p.grievous_wounds_pct)>0&&
   (Array.isArray(p.trigger)?p.trigger.includes('damage_champion'):p.trigger==='damage_champion')),
  antihealByRetaliation:passives.some(p=>num(p.grievous_wounds_pct)>0&&
   (Array.isArray(p.trigger)?p.trigger.some(t=>['attacked','attacked_by_champion'].includes(t)):
    ['attacked','attacked_by_champion'].includes(p.trigger))),
  maxHp:passives.some(p=>String(p.damage_per_tick_formula||'').includes('target_max_hp')),
  ramp:has('max_amp_pct')||has('max_damage_amp_pct'),shred:has('mr_shred_per_stack_pct'),
  shieldCut:passives.some(p=>p.effect==='shield_reduction'||num(p.shield_reduction_pct)>0||typeof p.shield_reduction_aoe_pct_formula==='string'||typeof p.shield_reduction_single_pct_formula==='string'),
  slow:passives.some(p=>has('slow_pct')||p.effect==='slow'),
  protective:passives.some(p=>p.effect==='area_heal'||p.effect==='ally_shield'),
  active:passives.some(p=>p.active===true),
  stasis:passives.some(p=>p.active===true&&num(p.stasis_s)>0),
  critMitigation:passives.some(p=>num(p.physical_crit_damage_reduction_pct)>0),
  attackSpeedAura:passives.some(p=>num(p.enemy_attack_speed_reduction_pct)>0),
  waveclear:passives.some(p=>num(p.minion_multiplier)>1||Array.isArray(p.minion_multiplier_range)),
  hybridDefense:num(stats.armor)>0&&num(stats.mr)>0};
}
function eligible(prepared){
 if(!prepared?.ok||!Array.isArray(prepared.catalog?.items))return [];
 return prepared.catalog.items.filter(item=>['legendary','active'].includes(item.item_type)&&
  item.completeness?.description==='documented'&&
  ['visible','visible_client_shop','user-confirmed'].includes(item.completeness?.price)&&
  Number.isFinite(item.price_gold)&&item.price_gold>0&&item.stats&&
  (item.passives||[]).every(p=>typeof p.description_fr==='string')&&
  num(item.stats.ad)===0&&num(item.stats.as_pct)<40&&
  (item.item_type!=='active'||item.price_gold>=2000)&&
  (num(item.stats.ap)>=40||num(item.stats.hp)>=200||num(item.stats.armor)>=40||num(item.stats.mr)>=40))
 .map(item=>({...item,feature:features(item)}));
}
function weights(threats={}){
 return {physical:count(threats.ad),magic:count(threats.ap),tank:count(threats.tank),
  // Conditional healing (e.g. Kayn Darkin) is only a partial draft pressure;
  // preserve legacy behavior when the newer evidence counters are unavailable.
  heal:Object.hasOwn(threats,'confirmedHeal')&&Object.hasOwn(threats,'conditionalHeal')?
   Math.min(5,count(threats.confirmedHeal)+0.35*count(threats.conditionalHeal)):
   Math.max(count(threats.heal),count(threats.sustain)>=2?1:0),
  shield:count(threats.shield),cc:count(threats.cc),burst:count(threats.burst),
  assassin:count(threats.assassin),crit:count(threats.crit),
  frontlineNeed:count(threats.frontlineNeed),frontlineProvided:count(threats.frontlineProvided),
  damageDuty:count(threats.damageDuty),
  earlyStasisPriority:Number.isFinite(threats.earlyStasisPriority)?
   count(threats.earlyStasisPriority):
   (count(threats.assassin)>=2||count(threats.burst)>=2?2:
    count(threats.assassin)>=1?1:0),
  durableTargets:count(threats.tank)+Math.min(2,count(threats.sustain)),
  waveclearNeed:count(threats.waveclearNeed),
  lanePhysical:count(threats.lanePhysical),laneMagic:count(threats.laneMagic),
  laneAllIn:count(threats.laneAllIn),jungleAllIn:count(threats.jungleAllIn),
  peelNeed:count(threats.peelNeed),critPotential:count(threats.critPotential)};
}
/**
 * Draft-sensitive Galio hybrid identity. A strategic prior, not an item lock
 * or empirically measured pick rate. Observed healing and late defense remain
 * independent decisions.
 */
function coreFit(items,threats={}){
 const ids=new Set(items.map(x=>x.id));
 const has=id=>ids.has(id);
 const t=threats||{},n=items.length;
 const hybrid=items.some(x=>(x.stats?.armor||0)>=30||(x.stats?.mr||0)>=30);
 const fullApCount=items.filter(x=>(x.stats?.ap||0)>=45).length;
 const hybridStrategy=hybrid&&(fullApCount<=3||has('unending_despair'));
 let score=0;const reasons=[];
 if(!hybridStrategy)return {score,hybrid:false,reasons,role:'ap'};
 // Hollow Radiance is a good mid-mage opener but never mandatory vs AD mid.
 if(has('hollow_radiance')&&has('unending_despair')){
  score+=2.5;
  reasons.push('Rayonnement + Désespoir : résistances, PV et dégâts au contact');
 }
 if(has('unending_despair')&&has('riftmaker')){
  score+=2.0;
  reasons.push('Désespoir + Créateur : PV, sustain et amplification en combat');
 }
 // Thornmail is a real third-item alternative when a physical lane and
 // healing/autoattack pressure make armor and healing reduction relevant.
 if(has('thornmail')){
  const observed=Number(t.observedHealingSeverity)||0;
  const physicalLane=Number(t.lanePhysical)||0;
  const heal=Number(t.confirmedHeal)||0;
  const conditional=Number(t.conditionalHeal)||0;
  if(observed>=2)score+=Math.min(3,observed*0.8);
  else if(physicalLane&&heal+conditional>0)score+=1.3;
  if(physicalLane&&n>=2)score+=1.4;
  if(has('unending_despair')&&heal+conditional>0)reasons.push('Cotte : armure et anti-soin conditionnel selon la draft');
 }
 if(has('iceborn_gauntlet')){
  // Its next BASIC attack after a spell is needed for the on-hit damage;
  // its 30% slow is often redundant on Galio's multi-CC control pattern.
  // Prefer defensive counters with relevant passives over speculative on-hit.
  score-=(n>=4?12:7);
  reasons.push('Gantelet : attaque de base post-sort requise ; ralentissement souvent redondant');
 }
 if(n>=4){
  if(has('force_of_nature')&&(Number(t.ap)||0)>=2)score+=2.5;
  if(has('kaenic_rookern')&&(Number(t.ap)||0)>=2&&(Number(t.burst)||0)>0)score+=2.3;
  if(has('amaranths_twinguard'))score+=1.2;
  if((Number(t.crit)||0)>0&&items.some(x=>features(x).critMitigation))score+=2.8;
 }
 return {score,hybrid:true,reasons,role:'hybrid_offensive_control'};
}
/* WRDI 17.3: burst Galio is a different combat goal from contact-tank Galio.
 * Qualitative priority is based on verified WR client procs. Not pick/win-rate.
 * Favor short-range damage events, damage multipliers and execute pressure,
 * rather than surviving four seconds to trigger a sustain passive.
 */
function burstProfile(item){
 const p=(item.passives||[]).map(x=>x.mechanics||{});
 const stats=item.stats||{};
 const instant=p.some(m=>typeof m.base_damage==='string'&&m.cooldown_s>0&&m.max_secondary_targets>=1);
 const execute=p.some(m=>m.condition==='target_hp_pct < 40'&&m.eligible?.includes('abilities'));
 const amplify=p.some(m=>m.effect==='ap_multiplier'&&Number(m.value)>1);
 const shieldReduction=p.some(m=>typeof m.shield_reduction_aoe_pct_formula==='string');
 const delayed=p.some(m=>Number(m.tick_s)>=4&&Number(m.heal_multiplier_of_damage_dealt)>0);
 const percentBurn=p.some(m=>String(m.damage_per_tick_formula||'').includes('target_max_hp'));
 const conditionalBurst=p.some(m=>m.trigger==='damage_at_least_25pct_maxhp_within_2_5s'||
  (typeof m.damage_formula==='string'&&m.activation_window_s>0&&m.cooldown_s<=2));

 const resist=(Number(stats.armor)||0)+(Number(stats.mr)||0);
 return {instant,execute,amplify,shieldReduction,delayed,percentBurn,
  ap:Number(stats.ap)||0,armor:Number(stats.armor)||0,mr:Number(stats.mr)||0,
  resist,pen:Number(stats.mpen_flat)||0,conditionalBurst};
}
function burstFit(items,threats={}){
 const t=threats||{};
 const active=Number(t.damageDuty)>=2&&Number(t.frontlineProvided)>=2&&
  Number(t.alliedApCarry)===0;
 const profiles=items.map(burstProfile);
 const count=key=>profiles.filter(p=>p[key]).length;
 const immediate=count('instant'),execute=count('execute'),amplify=count('amplify');
 const defensive=profiles.filter(p=>p.resist>=35).length;
 const delayed=count('delayed'),burn=count('percentBurn'),conditionalBurst=count('conditionalBurst');
 const totalAp=profiles.reduce((a,p)=>a+p.ap,0);
 const shieldCut=profiles.filter(p=>p.shieldReduction).length;
 const squishy=Number(t.tank)<2;
 let score=0;
 if(active){
  // Mechanic-based burst triangle: spell hit burst + raw AP multiplier +
  // execute below 40% HP. An incomplete triangle still gets useful credit
  // during beam search, so the eventual best candidate isn't pruned.
  score+=immediate*10+amplify*7.5+execute*7.5+conditionalBurst*3;
  if(immediate&&amplify)score+=7.5;
  if(immediate&&execute)score+=6;
  if(amplify&&execute)score+=5;
  if(immediate&&execute&&amplify)score+=10;
  score+=Math.min(450,totalAp)*0.052;
  // A reactive shield cut is valuable into real shield archetypes, but not
  // a mandatory second purchase on every AP-carry draft.
  if(shieldCut&&Number(t.shield)>=1)score+=2.5;
  if(items.length>=3){
   // With 3 allied tanks and only one isolated AP assassin, a second
   // role as a frontline is costly: spending an equipment slot on 0 AP
   // means foregoing a burst, penetration or AP power spike.
   score-=defensive*(items.length>=5?25:13);
   score-=delayed*7.5;
   if(squishy)score-=burn*10;
  }
  // Respect short engagement windows: 4s periodic healing is not the
  // goal of Galio AP burst, unlike Galio hybrid sustained combat.
  if(items.length===5&&(!immediate||!execute||!amplify))score-=17;
 }
 return {active,mode:active?'ap_burst':'contextual_hybrid',score:Math.round(score*100)/100,
  immediate,execute,amplify,defensive,delayed,burn,shieldCut,totalAp,
  reason:active?'Burst AP : dégâts immédiats sur les sorts, multiplication de la puissance et exécution; survie prolongée non prioritaire':'Rôle Galio contextuel'};
}
function offensiveDutyFit(items,threats={},effectiveAp=null){
 const rawDuty=Number(threats.damageDuty)||0;
 const alliedFrontline=Number(threats.frontlineProvided)||0;
 const enemyTank=Number(threats.tank)||0;
 const primaryCarry=rawDuty>=2&&alliedFrontline>=2;
 const ids=new Set(items.map(x=>x.id));
 const rawAp=items.reduce((sum,x)=>sum+(Number(x.stats?.ap)||0),0);
 const hasCap=ids.has('rabadons_deathcap');
 const boostedAp=Number.isFinite(effectiveAp)?effectiveAp:
  (rawAp+(ids.has('riftmaker')?items.reduce((sum,x)=>sum+(Number(x.stats?.hp)||0),0)*.02:0))*(hasCap?1.3:1);
 const apItems=items.filter(x=>(Number(x.stats?.ap)||0)>=45).length;
 const hardDefense=items.filter(x=>(Number(x.stats?.armor)||0)>=30||
  (Number(x.stats?.mr)||0)>=30).length;
 const immediateBurst=items.filter(x=>{
  const m=(x.passives||[]).map(p=>p.mechanics||{});
  return m.some(p=>typeof p.base_damage==='string'&&Number(p.cooldown_s)>0||
    p.condition==='target_hp_pct < 40'||Number(p.mpen_flat)>0);
 }).length;
 const flatPen=items.reduce((sum,x)=>sum+(Number(x.stats?.mpen_flat)||0),0);
 const rampBurn=items.filter(x=>(x.passives||[]).some(p=>
  typeof p.mechanics?.damage_per_tick_formula==='string'&&
  p.mechanics.damage_per_tick_formula.includes('target_max_hp'))).length;
 let score=0;
 const explanation=[];
 if(primaryCarry){
  // Because the team already supplies 2+ frontliners and zero other AP carries,
  // our first duty is actually damaging enemies. Apply the AP multiplier of
  // Deathcap to effective AP rather than using its base AP alone.
  score+=Math.min(480,boostedAp)*0.072;
  if(items.length>=3){
   score+=apItems*2.3;
   score-=Math.max(0,hardDefense-1)*4.6;
   if(hasCap)score+=3.5;
  }
  if(items.length>=4){
   score+=immediateBurst*3.5+Math.min(20,flatPen)*0.25;
   if(enemyTank<2&&rampBurn)score-=rampBurn*5.0;
  }
  if(items.length===5){
   score-=Math.max(0,280-boostedAp)*0.085;
   if(!immediateBurst)score-=5;
  }
  explanation.push('Plusieurs tanks alliés : Galio est une source prioritaire de dégâts AP');
  if(hasCap)explanation.push('Coiffe de Rabadon multiplie réellement la puissance du build');
  if(rampBurn&&enemyTank<2)explanation.push('Brûlure en % PV non prioritaire sans plusieurs tanks ennemis');
 }else if(rawDuty>=1&&items.length>=4){
  score+=Math.min(300,boostedAp)*0.012;
 }
 return {active:primaryCarry,role:primaryCarry?'ap_burst_carry':'hybrid_or_contextual',
  score:Math.round(score*100)/100,rawAp,effectiveAp:boostedAp,
  apItems,defensiveItems:hardDefense,immediateBurst,flatPen,
  enemyTank,explanation};
}
function calculate(items,threats,combatModel=null){
 const t=weights(threats),fs=items.map(x=>x.feature||features(x));
 const total=key=>fs.reduce((v,x)=>v+x[key],0);
 const n=key=>fs.filter(x=>x[key]).length;
 // Galio is an AP engage/peel mid. Prefer a coherent blend of offense and durability.
 // Explicit diminishing returns prevent blindly stacking five objects of the same role.
 let score=0;const reasons=[];
 const hp=Math.min(1500,total('hp')),ap=Math.min(260,total('ap'));
 const ah=Math.min(70,total('ah')),armor=total('armor'),mr=total('mr');
 const frontline=t.frontlineNeed>0?1:0;
 const assassination=t.assassin>=2||t.burst>=2;
 // Five-slot opportunity cost: overall team needs affect the AP/defense
 // balance. These weights are qualitative, not simulated damage.
 score+=ap/(frontline?70:41)+hp/(frontline?125:175)+ah/25;
 // In a composition with multiple allied frontline champions and no other AP
 // carry, a purely defensive Galio spends precious slots duplicating a job
 // his teammates already fulfill. Reward actual spell power and damage passives,
 // while preserving lane survival and legal equipment checks.
 const damageDuty=t.damageDuty;
 if(damageDuty){
  score+=Math.min(280,total('ap'))*(damageDuty===2?0.040:0.020);
  if(items.length>=4){
   const apTarget=damageDuty===2?145:90;
   score-=Math.max(0,apTarget-total('ap'))*(damageDuty===2?0.105:0.05);
  }
 }
 if(items.length>=3){
  if(ap<40)score-=frontline?1:5;
  if(hp<300)score-=frontline?8:5;
 }
 const physWeight=t.physical+(assassination?Math.min(t.assassin,3)*0.7:0)+
  (t.lanePhysical&&t.laneAllIn?1.2:0)+(t.jungleAllIn&&t.physical>=2?0.4:0);
 if(physWeight>=2)score+=Math.min(170,armor)*(frontline?0.075:0.055)*Math.min(1.6,physWeight/2.5);
 const magicWeight=t.magic+(t.laneMagic&&t.laneAllIn?1.2:0);
 if(magicWeight>=2)score+=Math.min(160,mr)*(frontline?0.073:0.055)*Math.min(1.5,magicWeight/2.5);
 if(frontline&&items.length>=4&&hp<700)score-=5;
 if(frontline&&items.length>=4&&armor+mr<80)score-=5;
 if(t.physical>=2&&armor>0)reasons.push('Armure face aux menaces physiques');
 if(t.magic>=2&&mr>0)reasons.push('Résistance magique face aux menaces magiques');
 if(frontline&&hp>0)reasons.push('Première ligne renforcée pour les alliés');
 if(t.heal>0&&n('antiheal')){
  score+=(3+Math.min(2,t.heal))*Math.min(1,t.heal);
  reasons.push(t.heal<1?'Anti-soin conditionnel : valeur réduite tant que le déclenchement reste incertain':'Blessures graves contre les soins');
  // Compare trigger applicability instead of assuming all anti-heal items proc alike.
  // This is a qualitative opportunity score, NOT a measured proc frequency.
  const magicAccess=n('antihealBySpell');
  const contactAccess=n('antihealByContact');
  const retaliationAccess=n('antihealByRetaliation');
  const antihealPressure=Math.min(1,t.heal);
  if(magicAccess&&t.damageDuty>=1){
   score+=1.5*antihealPressure;
   reasons.push('Anti-soin déclenchable par les dégâts magiques de Galio');
  }
  if(retaliationAccess&&t.frontlineNeed===0&&t.frontlineProvided>=2&&!contactAccess)
   score-=1.2*antihealPressure;
  if(contactAccess&&t.frontlineNeed>0)score+=0.6*antihealPressure;
 }
 if(t.durableTargets>=2&&n('maxHp')){score+=4+Math.min(2,t.durableTargets);
  reasons.push('Effet documenté sur les PV max des cibles durables');}
 if(t.durableTargets>=2&&n('ramp')){score+=2;reasons.push('Passif de combat prolongé');}
 if(t.tank>=2&&n('shred')){score+=2;reasons.push('Réduction progressive de résistance magique');}
 if(t.shield>0&&n('shieldCut')){score+=3;reasons.push('Réduction de bouclier documentée');}
 if(t.earlyStasisPriority>=2&&n('stasis')){
  score+=5;reasons.push('Stase active contre un engagement explosif');
 }else if(n('stasis')&&t.earlyStasisPriority===1&&damageDuty>=1){
  score-=5;reasons.push('Stase à réserver en option face à un assassin isolé');
 }else if(n('stasis')&&t.earlyStasisPriority===0){
  score-=3;
 }
 if(assassination&&hp>=550)score+=2;
 if(t.crit>0&&n('critMitigation')){score+=3+Math.min(2,t.crit);reasons.push('Réduction de dégâts critiques documentée');}
 // Context-sensitive passive: Randuin without confirmed critical attacks has
 // less utility than an armor item with a generally applicable passive.
 if(!t.crit)score-=n('critMitigation')*7;
 if(t.waveclearNeed>0&&n('waveclear')){score+=3;reasons.push('Immolation facilitant la gestion des vagues');}
 if(t.cc>=2&&n('protective'))score+=1;
 if(t.peelNeed&&n('protective'))score+=Math.min(2,t.peelNeed);
 if(t.lanePhysical&&t.laneAllIn&&armor>0)reasons.push('Tenue de lane contre un engagement physique');
 if(t.laneMagic&&t.laneAllIn&&mr>0)reasons.push('Tenue de lane contre un engagement magique');
 if(frontline&&n('hybridDefense')&&t.physical>=1&&t.magic>=1)score+=2;
 score-=Math.max(0,n('antiheal')-1)*5;
 score-=Math.max(0,n('maxHp')-1)*3;
 score-=Math.max(0,n('shred')-1)*2;
 score-=Math.max(0,n('shieldCut')-1)*3;
 score-=Math.max(0,n('critMitigation')-1)*4;
 // Sustained tank Galio need not be punished for having only 1 AP item.
 if(!frontline&&items.length>=4&&total('ap')<90)score-=6;
 // Non-AP armor/HP pieces should compete on concrete utility when frontline
 // is already adequately covered; do not forbid them against genuine threats.
 if(damageDuty>=2&&items.length>=4){
  const pureDefense=fs.filter(x=>x.ap===0&&(x.armor>=40||x.mr>=40)).length;
  score-=Math.max(0,pureDefense-1)*3;
 }
 if(damageDuty>=1&&n('slow')&&t.frontlineProvided>=2&&t.cc>=2){
  score-=Math.min(2,n('slow'))*1.8;
 }
 // Kit-to-passive compatibility: direct activations and conditional usefulness
 // use Galio's actual cast/taunt/knock-up/empowered attack/engage kit.
 // Nothing is assigned by the name of an enemy champion or popular build.
 let synergy=null;
 if(synergyEngine?.build){
  synergy=synergyEngine.build(items,t);
  if(synergy.ok){
   score+=synergy.score*0.7;
   if(synergy.combinations.length)reasons.push(...synergy.combinations.slice(0,2));
  }
 }
 // Full-composition defensive coverage is independent from lane-only pressure.
 // Apply progressively as five slots fill; no hard-coded mandatory items.
 const balance=defenseBalance?.evaluate?.(items,threats);
 if(balance){
  score+=balance.score;
  if(items.length===5)reasons.push(...balance.reasons.slice(0,2));
 }
 // An excellent eventual five-item combination is insufficient if Galio
 // cannot safely farm the initial mid matchup. Favor a strong accessible
 // first completed item before evaluating later teamfight coverage.
 // This works on ITEM MECHANICS and lane threat categories, not champion names.
 const ordering=firstItemModule();
 let laneOpening=null;
 if(ordering?.stageScore&&items.length){
  const rated=items.map(item=>({item,assessment:ordering.stageScore(item,threats,0)}))
   .sort((a,b)=>b.assessment.score-a.assessment.score);
  laneOpening={id:rated[0].item.id,score:rated[0].assessment.score,
   reason:rated[0].assessment.reason};
  // The opening phase matters most when evaluating sets containing five items.
  // Retain the reward during partial beam exploration to avoid pruning
  // otherwise strategically strong lane-oriented combinations.
  score+=laneOpening.score*2.3;
  if(items.length===5)reasons.push('Premier achat étudié pour la lane : '+laneOpening.reason);
 }
 // Galio Q/W/E direct AP scaling from the sourced Wild Rift numeric kit.
 // Rank profile is a fixed comparison scenario, not a prediction of skill order.
 if(combatModel?.directDamageAt&&t.damageDuty>0){
  const baseline=combatModel.directDamageAt({ap:0});
  const current=combatModel.directDamageAt({ap:total('ap')});
  if(baseline&&current){
   const numericGain=current.total-baseline.total;
   score+=Math.min(7,numericGain/110)*Math.min(1,t.damageDuty/2);
   if(items.length===5)reasons.push('Dégâts AP directs A/Z/E évalués avec les ratios WR sourcés (sans résistances ni passifs)');
  }
 }
 const interaction=interactionEngine?.compare?.(items,{...threats,...t});
 if(interaction?.ok){
  // Timed passive opportunity with unobserved contact, not a win-rate forecast.
  score+=interaction.score*(Number(threats.damageDuty)>=2&&Number(threats.frontlineProvided)>=2?0.65:1.65);
  if(items.length===5)reasons.push(...interaction.combinations.slice(0,3));
 }
 const effective=interaction?.short?.stats;
 const productivity=productiveEngine?.compare?.(items,threats);
 if(productivity?.ok){
  // Survival is valuable if it preserves damage and control uptime. Pure
  // armor auras still win when confirmed attack-speed / physical danger merits them.
  // Productive SURVIVAL has no purchase goal in an immediate burst strategy.
  score+=productivity.score*(Number(threats.damageDuty)>=2&&Number(threats.frontlineProvided)>=2?0.2:1.8);
  if(items.length===5)reasons.push(...productivity.long.parts.slice(0,3));
 }
 const burst=burstFit(items,threats);
 score+=burst.score;
 const core=coreFit(items,threats);
 // A hybrid core is valuable for actual frontline duties, not a fixed default
 // when Galio is the only practical AP carry behind three allied tanks.
 score+=core.score*(burst.active?0:1);
 if(items.length===5&&core.reasons.length)reasons.push(...core.reasons);
 const offenseRole=offensiveDutyFit(items,threats,effective?.apAfterInteractions);
 score+=offenseRole.score;
 if(items.length===5&&offenseRole.active)reasons.push(...offenseRole.explanation);
 const stats={hp:total('hp'),ap:total('ap'),armor,mr,ah:total('ah'),
  apAfterInteractions:effective?.apAfterInteractions??total('ap'),
  riftBonusAp:effective?.riftBonusAp||0};
 return {score:Math.round(score*100)/100,reasons,stats,needs:t,synergy,balance,laneOpening,
  interaction:interaction?.ok?interaction:null,productivity:productivity?.ok?productivity:null,core,offenseRole,burst};
}
function optimize({prepared,threats={},slots=5,beamWidth=100,combatModel=null}={}){
 if(!prepared?.ok||!prepared.core?.validateEquipment)return {ok:false,reason:'Catalogue client indisponible'};
 if(slots!==5)return {ok:false,reason:'Ce moteur construit exactement cinq objets principaux'};
 const pool=eligible(prepared);
 if(pool.length<slots)return {ok:false,reason:'Pas assez de fiches d’objets achetables et pertinentes pour Galio',poolSize:pool.length};
 let beam=[{items:[],ids:[],score:0}];
 for(let depth=1;depth<=slots;depth++){
  const candidates=[];
  for(const partial of beam){
   const last=partial.items.length?pool.indexOf(partial.items.at(-1)):-1;
   for(let i=last+1;i<pool.length;i++){
    const item=pool[i];if(partial.ids.includes(item.id))continue;
    const ids=[...partial.ids,item.id];
    if(!prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules).valid)continue;
    const items=[...partial.items,item],measure=calculate(items,threats,combatModel);
    candidates.push({items,ids,score:measure.score,measure});
   }
  }
  if(!candidates.length)return {ok:false,reason:'Impossible de constituer cinq objets compatibles',depth};
  candidates.sort((a,b)=>b.score-a.score||a.ids.join('|').localeCompare(b.ids.join('|')));
  beam=candidates.slice(0,Math.max(20,Math.min(200,beamWidth)));
 }
 // Do not present duplicate combinations as situational options. Instead explain
 // how a legal alternative changes the needs addressed by the chosen five.
 const winner=beam[0];
 const others=beam.slice(1).filter(x=>x.ids.some(id=>!winner.ids.includes(id))).slice(0,3);
 const result=x=>({items:x.items.map((item,i)=>({
  id:item.id,name:item.name_fr,priceGold:num(item.price_gold)||null,
  slot:i+1,reason:reasonFor(item,threats)})),
  suitability:x.score,reasons:x.measure.reasons,stats:x.measure.stats,
  interaction:x.measure.interaction,productivity:x.measure.productivity,offenseRole:x.measure.offenseRole,burst:x.measure.burst,
  legal:true,source:'player_client_items_only'});
 return {ok:true,game:'Wild Rift mobile',version:VERSION,
  main:result(winner),alternatives:others.map(result),
  evaluatedPool:pool.length,slots:5,bootsSeparate:true,
  noPopularityData:true,noDamageForecast:true,winRate:null,activeItemsInFive:true,
  theoreticalOnly:true,method:'legal_five_item_beam_search_with_conditional_passive_scenarios'};
}
function reasonFor(item,threats){
 const f=item.feature||features(item),t=weights(threats),r=[];
 const synergy=synergyEngine?.evaluate?.(item,t);
 if(synergy?.ok){
  const direct=synergy.entries.find(x=>x.level==='direct');
  const conditional=synergy.entries.find(x=>x.level==='conditional');
  const chosen=direct||conditional;
  if(chosen)r.push(chosen.reason);
 }
 if(t.heal&&f.antiheal)r.push('Anti-soins');
 if(t.earlyStasisPriority>=2&&f.stasis)r.push('Stase contre plusieurs menaces d’engagement');
 if(t.crit&&f.critMitigation)r.push('Contre dégâts critiques confirmés');
 if(!t.crit&&f.critMitigation)r.push('Passif anti-critiques non confirmé (seule armure évaluée)');
 if(t.lanePhysical&&t.laneAllIn&&f.armor)r.push('Protection face au mid physique');
 if(t.laneMagic&&t.laneAllIn&&f.mr)r.push('Protection face au mid magique');
 if(t.frontlineNeed&&f.hybridDefense)r.push('Résistances pour première ligne');
 if(t.waveclearNeed&&f.waveclear)r.push('Nettoyage de vague');
 if(t.durableTargets>=2&&f.maxHp)r.push('Contre les PV max des cibles durables');
 if(t.tank>=2&&f.shred)r.push('Réduction de RM');
 if(t.physical>=2&&f.armor)r.push('Protection physique');
 if(t.magic>=2&&f.mr)r.push('Protection magique');
 if(f.ap)r.push('Puissance pour Galio');
 if(f.hp)r.push('Survie en engagement');
 if(f.ah)r.push('Disponibilité des contrôles');
 return r.slice(0,2).join(' · ')||'Utilité situationnelle documentée';
}
return Object.freeze({VERSION,features,eligible,weights,coreFit,offensiveDutyFit,burstProfile,burstFit,calculate,optimize,reasonFor});
});
