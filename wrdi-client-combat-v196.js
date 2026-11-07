/* V19.6.1: source-first Wild Rift client calculations, never PC.
 * Uses all 150 client rank rows + all 70 observed coefficients.
 * Ratios extracted from rank-one tooltips are used on later ranks as a
 * clearly identified assumption; conditional effects are not guaranteed hits.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_ClientCombatV196=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='19.6.1';
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const MECHANIC_GROUPS={
 maxHp:['max_hp_damage'],
 trueDamage:['true_damage','true_damage_conditional'],
 allyHeal:['ally_healing'],
 selfHeal:['self_heal','self_healing'],
 allyShield:['ally_shield'],
 selfShield:['self_shield','spell_shield'],
 control:['knockup','stun','conditional_fear','suppress','silence','root','pull','conditional_pull','knockback','displacement','banish','anti_dash'],
 invulnerable:['invulnerability'],
 reflect:['projectile_reflect'],
 revive:['revive'],
 execute:['execute'],
};
const DAMAGE=/damage|degats|dégâts|healing|heal|shield|bouclier/i;
const MAX_HP=/max_hp.*damage|damage.*max_hp/i;
/* Explicit associations of tooltip components with client rank-table rows.
 * Separate components are never silently combined (e.g. magic bonus on a
 * physical hit, or extra explosion/stack damage).
 */
const COMPONENT_ROWS={
 "Cho'Gath":{q:{direct_magic_damage:'base_magic_damage'},w:{direct_magic_damage:'base_magic_damage'},e:{spike_base_magic_damage:'base_magic_damage'},r:{champion_base_true_damage:'base_true_damage'}},
 "K'Sante":{q:{base_physical_damage:'base_physical_damage'},e:{shield:'base_shield'},r:{wall_collision_damage:'terrain_collision_damage'}},
 "Kog'Maw":{q:{base_magic_damage:'base_magic_damage'},e:{base_magic_damage:'base_magic_damage'},r:{base_magic_damage:'base_magic_damage'}},
 Mel:{q:{magic_damage_per_explosion:'damage_per_explosion'},e:{impact_magic_damage:'base_magic_damage',damage_per_second:'damage_per_second'},r:{passive_damage:'passive_base_magic_damage',active_damage:'active_base_magic_damage',active_damage_per_stack:'active_damage_per_accablement_stack'}},
 Nidalee:{q:{base_javelin:'base_magic_damage',max_distance_javelin:'max_magic_damage_by_distance'}},
 Nocturne:{e:{fear_tether_magic_damage:'base_magic_damage'},r:{dash_physical_damage:'base_physical_damage'}},
 Norra:{w:{portal_magic_damage:'base_magic_damage'},e:{thread_magic_damage:'base_magic_damage'},r:{projectile_magic_damage:'base_magic_damage'}},
 Rell:{q:{q_magic_damage:'base_magic_damage'},w:{crash_magic_damage:'base_magic_damage',dismount_shield:'base_shield'},r:{r_magic_damage:'base_magic_damage'}},
 Skarner:{w:{aoe_magic_damage:'base_magic_damage'},e:{collision_physical_damage:'base_physical_damage'},r:{r_magic_damage:'base_magic_damage'}},
 Smolder:{q:{fire_physical_damage:'base_physical_damage'},w:{sneeze_base_physical_damage:'base_physical_damage',sneeze_explosion_physical_damage:'base_explosion_damage'},e:{flight_hit_physical_damage:'base_damage_per_hit'},r:{r_physical_damage:'base_physical_damage',self_healing:'self_healing_base'}},
 Taliyah:{q:{first_rock_magic_damage:'base_magic_damage_first_rock',worked_ground_rock_magic_damage:'base_magic_damage_worked_ground'},e:{field_magic_damage:'base_magic_damage',explosion_magic_damage:'base_magic_damage_explosion'}},
 "Vel'Koz":{q:{plasma_magic_damage:'base_magic_damage'},w:{rift_initial_magic_damage:'initial_base_magic_damage',rift_delayed_magic_damage:'delayed_base_magic_damage'},e:{tectonic_magic_damage:'base_magic_damage'},r:{beam_total_magic_damage:'total_base_magic_damage'}},
 Yunara:{q:{passive_magic_impact:'passive_magic_damage_on_hit'},w:{judgement_magic_damage:'initial_magic_damage',judgement_tick_magic_damage:'damage_per_travel_tick'}},
 Zilean:{q:{time_bomb_magic_damage:'base_magic_damage'},w:{support_shield:'base_shield'},r:{revive_healing:'revive_base_heal'}}
};
function prepare(evidence){
 if(!evidence?.ok||typeof evidence.getChampion!=='function')return {ok:false,reason:'Données client non chargées'};
 function ability(name,slot,rank=1,stats={}){
  const c=evidence.getChampion(name);
  if(!c)return {ok:false,reason:'Pas de fiche client : '+name};
  const table=c.rankTables?.[slot],facts=c.tooltipFacts?.[slot];
  if(!table)return {ok:false,reason:'Aucun tableau par rang pour '+c.name+'/'+slot};
  if(!Number.isInteger(rank)||rank<1||rank>table.rankCount)return {ok:false,reason:'Rang non présent dans le client'};
  const base=Object.fromEntries(Object.entries(table.statRows||{}).map(([k,v])=>[k,v.values[rank-1]]));
  const mapping=COMPONENT_ROWS[c.name]?.[slot]||{};
  const coefficients=(facts?.observedCoefficients||[]).map(x=>({
   component:x.component,stat:x.stat,ratio:x.coefficient,sourceImageIndex:x.sourceImageIndex,
   field:mapping[x.component]||null,
   acrossRanksAssumed:rank>1&&!x.confirmedConstantAcrossRanks
  }));
  const calculated=Object.entries(base).filter(([key])=>DAMAGE.test(key)).map(([field,value])=>{
   const matched=coefficients.filter(x=>x.field===field);
   const contributions=matched.map(x=>({
    component:x.component,stat:x.stat,ratio:x.ratio,
    amount:finite(stats[x.stat])?x.ratio*stats[x.stat]:null
   }));
   const missing=contributions.some(x=>x.amount===null);
   return {field,base:value,contributions,
    total:missing?null:value+contributions.reduce((s,x)=>s+x.amount,0),
    completeRatioMapping:matched.length>0,conditional:true,
    basis:matched.length?'base_plus_mapped_tooltip_coefficients':'observed_base_only',
    sourceImageIndex:table.statRows[field]?.sourceImageIndex
   };
  });
  return {ok:true,version:VERSION,champion:c.name,slot,rank,rankCount:table.rankCount,
   base,coefficients,calculated,mechanics:facts?.mechanics||[],
   unmappedCoefficients:coefficients.filter(x=>!x.field),
   assumptions:coefficients.some(x=>x.acrossRanksAssumed)?['Ratios observés au rang 1 supposés constants pour ce calcul']:[],
   note:'Valeurs brutes, avant résistances ; dégâts multi-touches, déclenchements, soins, boucliers et formes conditionnels'};
 }
 function inspectDraft({names=[]}={}){
  const champions=[];
  for(const name of names){
   const c=evidence.getChampion(name);if(!c)continue;
   const abilities={},effects={};
   for(const key of Object.keys(MECHANIC_GROUPS))effects[key]=false;
   let damageRows=0,maxHpRows=0,trueDamageRows=0,coefficientCount=0,mappedCoefficients=0,rankRows=0,rankValues=0;
   for(const [slot,table] of Object.entries(c.rankTables||{})){
    const a=ability(name,slot,table.rankCount);
    abilities[slot]=a;
    damageRows+=a.calculated.filter(x=>/damage/.test(x.field)).length;
    maxHpRows+=Object.keys(a.base).filter(k=>MAX_HP.test(k)).length;
    trueDamageRows+=Object.keys(a.base).filter(k=>k.includes('true_damage')).length;
    coefficientCount+=a.coefficients.length;
    mappedCoefficients+=a.coefficients.filter(x=>x.field).length;
    rankRows+=Object.keys(table.statRows||{}).length;
    rankValues+=Object.values(table.statRows||{}).reduce((s,r)=>s+r.values.length,0);
   }
   const tooltipAbilities={};
   for(const [slot,f] of Object.entries(c.tooltipFacts||{})){
    tooltipAbilities[slot]={mechanics:f.mechanics||[],descriptionFacts:f.clientDescriptionFacts||[],
     coefficients:(f.observedCoefficients||[]).map(x=>({component:x.component,stat:x.stat,ratio:x.coefficient,sourceImageIndex:x.sourceImageIndex})),
     sourceImageIndex:f.sourceImageIndex};
    for(const [group,flags] of Object.entries(MECHANIC_GROUPS))
     if((f.mechanics||[]).some(x=>flags.includes(x)))effects[group]=true;
   }
   // Include passive/non-tabulated ratios in evidence, without inventing base damage.
   coefficientCount=Object.values(tooltipAbilities).reduce((sum,x)=>sum+x.coefficients.length,0);
   if(maxHpRows)effects.maxHp=true;
   if(trueDamageRows)effects.trueDamage=true;
   champions.push({name:c.name,abilities,tooltipAbilities,effects,damageRows,maxHpRows,trueDamageRows,
    coefficientCount,mappedCoefficients,rankRows,rankValues,allTooltipSlots:Object.keys(c.tooltipFacts||{}).length});
  }
  const enemyNames=new Set(names.slice(5).map(norm));
  const enemies=champions.filter(c=>enemyNames.has(norm(c.name)));
  const count=(key)=>enemies.filter(c=>c.effects[key]).length;
  return {ok:true,version:VERSION,champions,
   rankRows:champions.reduce((s,x)=>s+x.rankRows,0),
   rankValues:champions.reduce((s,x)=>s+x.rankValues,0),
   damageRows:champions.reduce((s,x)=>s+x.damageRows,0),
   coefficients:champions.reduce((s,x)=>s+x.coefficientCount,0),
   mappedCoefficients:champions.reduce((s,x)=>s+x.mappedCoefficients,0),
   enemyMaxHpNumericSources:enemies.filter(x=>x.maxHpRows>0).length,
   enemyTrueDamageNumericSources:enemies.filter(x=>x.trueDamageRows>0).length,
   enemyMaxHpSources:count('maxHp'),enemyTrueDamageSources:count('trueDamage'),
   enemyAllyHealingSources:count('allyHeal'),enemySelfHealingSources:count('selfHeal'),
   enemyAllyShieldSources:count('allyShield'),enemySelfShieldSources:count('selfShield'),
   enemyControlSources:count('control'),enemyReflectSources:count('reflect'),
   enemyInvulnerableSources:count('invulnerable'),enemyReviveSources:count('revive'),
   enemyExecuteSources:count('execute'),
   actualEnemyStatsKnown:false,conditionalEffectsNotAssumed:true,
   source:'user_client_122_screenshots'};
 }
 return {ok:true,version:VERSION,ability,inspectDraft};
}
return Object.freeze({VERSION,prepare,COMPONENT_ROWS});
});