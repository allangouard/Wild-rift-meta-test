/* WRDI V14.34 — Galio ability-to-client-passive compatibility (qualitative).
 * Kit facts: melee AP frontline, Q damaging AoE, W taunt, E knock-up,
 * passive empowered attack after casting, R ally-targeted arrival.
 * W/E proc testing is user-confirmed; item proc interactions are deductions
 * from the player-confirmed item descriptions, NOT in-game validated.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioKitItemSynergyV1434=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.34.0-alpha.1';
const KIT=Object.freeze({
 champion:'Galio',role:'mid',attackRange:'melee',
 damagingAbility:true,aoeAbility:true,magicDamage:true,
 taunt:true,knockup:true,closeEngage:true,empoweredAttack:true,
 ultimateAllyEngage:true,canRemainNearby:true,
 extendedChampionCombat:'conditional',
 source:'galio_kit_existing_project_and_player_observed_W_E_procs'
});
const positive=x=>typeof x==='number'&&Number.isFinite(x)&&x>0;
function read(item){
 const effects=Array.isArray(item?.passives)?item.passives:[];
 return effects.map(p=>({name:p.name||'',text:p.description_fr||'',m:p.mechanics||{}}));
}
function evaluate(item,needs={}){
 const p=read(item),entries=[];
 const push=(key,level,why,condition)=>entries.push({key,level,reason:why,condition:condition||null,
  validation:'item_text_confirmed_galio_interaction_inferred'});
 const any=fn=>p.some(x=>fn(x.m,x));
 if(!item?.id||!item?.stats||!Array.isArray(item.passives))return {ok:false,reason:'Fiche d’objet absente ou incomplète'};
 const hp=Number(item.stats.hp)||0;
 if(any(m=>m.bonus_ap_formula==='0.02 * bonus_hp'))
  push('bonus_hp_to_ap','direct','Galio peut associer les PV bonus du build à la puissance apportée par ce passif','Bonus dépendant des PV bonus effectivement achetés');
 if(any(m=>m.effect==='ap_multiplier'&&positive(m.value)))
  push('ap_multiplier','direct','La puissance obtenue des autres objets bénéficie du multiplicateur','Intérêt croissant avec les autres objets AP');
 if(any(m=>positive(m.base_magic_dps)||positive(m.minion_multiplier)||Array.isArray(m.minion_multiplier_range)))
  push('nearby_waveclear','conditional','Galio combat au contact et peut maintenir une immolation près de la vague et des ennemis','Être suffisamment proche ; conditions de combat applicables');
 if(any(m=>positive(m.tick_s)&&String(m.damage_formula||'').includes('own_max_hp')))
  push('sustained_proximity','conditional','Galio peut rester proche des adversaires pour exploiter un passif périodique','Combat prolongé au contact jusqu’au déclenchement');
 if(any(m=>positive(m.max_damage_amp_pct)||positive(m.max_amp_pct)||positive(m.max_stacks)&&positive(m.stack_interval_s)))
  push('combat_ramp','conditional','Le kit de mêlée de Galio permet d’envisager des effets qui montent en combat','Il faut rester en combat assez longtemps');
 if(any(m=>typeof m.damage_per_tick_formula==='string'&&m.damage_per_tick_formula.includes('target_max_hp')))
  push('damaging_spell_burn','direct','Les compétences offensives de Galio peuvent appliquer la brûlure décrite','Toucher les cibles avec une compétence blessante');
 if(any(m=>['damage_ability','empowered_attack'].some(t=>Array.isArray(m.trigger)?m.trigger.includes(t):m.trigger===t)))
  push('damaging_ability_trigger','direct','Galio dispose de compétences offensives et d’une attaque passive renforcée','Toucher une cible avec le déclencheur indiqué');
 if(any(m=>positive(m.activation_window_s)||positive(m.window_s)))
  push('spell_then_attack','conditional','Galio peut utiliser une attaque passive renforcée après un sort','L’attaque doit suivre le sort dans la fenêtre du passif');
 if(any(m=>positive(m.mr_shred_per_stack_pct)))
  push('magic_shred','conditional','Les dégâts magiques répétés de Galio peuvent contribuer à accumuler la réduction de RM','Appliquer assez d’instances et rester sur la cible');
 if(any(m=>m.trigger==='magic_or_true_damage_to_champion'))
  push('magic_hit_trigger','direct','Les sorts magiques de Galio remplissent la catégorie de dégâts requise','Toucher un champion');
 if(any(m=>m.trigger==='deal_magic_damage_to_champion'))
  push('magic_heal_reduction','direct','Galio peut infliger des dégâts magiques pour appliquer les blessures graves','Toucher un champion ; soins adverses réellement significatifs');
 if(any(m=>Array.isArray(m.trigger)&&m.trigger.includes('damage_champion')))
  push('champion_damage_trigger','direct','Le kit offensif de Galio permet d’endommager un champion','Infliger des dégâts au champion');
 if(any(m=>positive(m.slow_pct)&&positive(m.cooldown_s)&&positive(m.base_ad_ratio)))
  push('slow_after_attack','conditional','L’attaque renforcée de Galio après un sort peut déclencher un ralentissement','Pouvoir placer une attaque au corps à corps');
 if(any(m=>m.ult_trigger===true))
  push('ult_trigger','conditional','Galio possède un ultime utilisable pour déclencher l’effet décrit','Lancer réellement R et satisfaire la zone ou la cible du passif');
 if(any(m=>m.effect==='area_heal'||m.bind_ally_at_purchase===true||positive(m.redirect_ally_damage_ratio)))
  push('team_protection','conditional','Galio peut jouer près de ses alliés pour apporter une utilité collective','Allié présent ; conditions de déclenchement propres au passif');
 if(any(m=>positive(m.radius)&&positive(m.magic_damage_amp_pct)))
  push('nearby_magic_amp','conditional','Galio peut infliger des dégâts magiques à proximité des cibles','Les adversaires doivent rester dans le rayon');
 if(any(m=>positive(m.stasis_s)&&m.active===true))
  push('active_stasis','conditional','La stase peut protéger Galio pendant une menace d’engagement','Activation manuelle au bon moment, sans lancer de sorts durant la stase');
 if(any(m=>m.spell_shield===true))
  push('spell_shield','conditional','Un bouclier antisort peut aider Galio à engager','Le bouclier doit être disponible lorsque le sort adverse arrive');
 if(any(m=>positive(m.physical_crit_damage_reduction_pct)))
  push('critical_only','conditional','Le passif anti-critiques ne répond qu’aux coups critiques','Dégâts critiques adverses réellement présents');
 if(any(m=>positive(m.threshold_bonus_hp)))
  push('bonus_hp_threshold','conditional','Le passif exige un seuil de PV bonus avant de fonctionner','Seuil de PV bonus atteint par la combinaison d’objets');
 if(any(m=>positive(m.min_distance)&&m.min_distance>=600))
  push('long_range_condition','poor_fit','Un passif exigeant une longue distance est moins naturellement exploité par Galio engage mêlée','Toucher à la distance minimale indiquée');
 if(any(m=>positive(m.on_hit_magic_damage)||typeof m.on_hit_magic_damage_formula==='string'))
  push('repeated_on_hit','poor_fit','Un passif reposant sur des attaques répétées n’exploite pas particulièrement son cycle de sorts','Répéter les attaques de base pour rentabiliser le passif');
 const conditions=new Set(entries.map(x=>x.key));
 // A possible Galio proc is not automatically a useful item for the draft.
 const utility=(e)=>{
  if(e.key==='critical_only')return Number(needs.crit)>0?0.7:-2;
  if(e.key==='magic_heal_reduction')return Number(needs.heal)>0?1.4:0;
  if(e.key==='damaging_spell_burn')return Number(needs.tank)>=2?1.4:0.6;
  if(e.key==='long_range_condition')return -2;
  if(e.key==='repeated_on_hit')return -2;
  if(e.key==='team_protection')return Number(needs.peelNeed)>0?0.7:0.2;
  if(e.key==='active_stasis')return Number(needs.assassin)>0||Number(needs.burst)>=2?1:0.3;
  if(e.key==='sustained_proximity')return Number(needs.frontlineNeed)>0||Number(needs.tank)>=2?0.8:0.4;
  return e.level==='direct'?1.4:0.7;
 };
 let score=entries.reduce((n,e)=>n+utility(e),0);

 if(conditions.has('combat_ramp')&&Number(needs.frontlineNeed)>0)score+=0.5;
 if(conditions.has('sustained_proximity')&&Number(needs.frontlineNeed)>0)score+=0.6;
 if(conditions.has('team_protection')&&Number(needs.peelNeed)>0)score+=0.5;
 if(conditions.has('nearby_waveclear')&&Number(needs.lanePhysical)>0)score+=0.4;

 return {ok:true,itemId:item.id,entries,score:Math.round(score*100)/100,
  evidence:'client_passive_text_plus_galio_kit',procsConfirmedInGame:false,damageSimulated:false,
  conditionallyUseful:entries.some(x=>x.level==='conditional')};
}
function build(items,needs={}){
 if(!Array.isArray(items))return {ok:false,reason:'Objets absents'};
 const analyzed=items.map(item=>evaluate(item,needs));
 if(analyzed.some(x=>!x.ok))return {ok:false,reason:'Fiche invalide'};
 const itemIds=new Set(items.map(x=>x.id));
 const stats=items.reduce((x,i)=>({hp:x.hp+(Number(i.stats?.hp)||0),ap:x.ap+(Number(i.stats?.ap)||0)}),{hp:0,ap:0});
 let bonus=0;const combinations=[];
 const add=(v,reason)=>{bonus+=v;combinations.push(reason)};
 if(itemIds.has('riftmaker')&&stats.hp>=500)add(1.5,'Les autres objets PV renforcent la conversion PV → AP décrite sur Créateur de failles');
 if(itemIds.has('rabadons_deathcap')&&stats.ap>=180)add(1.2,'Les autres objets AP renforcent la valeur du multiplicateur de puissance');
 // Client-documented thresholds cannot be counted as useful before the set qualifies.
 for(const item of items){
  const gated=read(item).map(x=>x.m).filter(m=>positive(m.threshold_bonus_hp));
  if(gated.some(m=>stats.hp<m.threshold_bonus_hp)){
   bonus-=1.7;combinations.push('Passif à seuil non pleinement exploité : PV bonus insuffisants');
  }
 }
 const proximity=analyzed.filter(x=>x.entries.some(e=>e.key==='nearby_waveclear'||e.key==='sustained_proximity'));
 if(proximity.length>=2)add(0.5,'Plusieurs effets de proximité peuvent être utiles lors du même engagement');
 return {ok:true,score:Math.round((analyzed.reduce((sum,x)=>sum+x.score,0)+bonus)*100)/100,
  items:analyzed,combinations,bonus:Math.round(bonus*100)/100,
  procValidation:'inferred_not_player_tested',damageSimulated:false};
}
return Object.freeze({VERSION,KIT,evaluate,build});
});
