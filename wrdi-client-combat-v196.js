/* V19.6 — rank-accurate player-client Wild Rift numeric inputs.
 * Recorded rank values are first-class inputs. Rank-one observed coefficients
 * are applied at other ranks as a stated assumption, NEVER as fabricated rows.
 * Conditions (hits, targets, form, shields, resistance) remain explicit.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_ClientCombatV196=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='19.6.0';
const DAMAGE=/^(base_(?:magic|physical|true)_damage|(?:initial_|delayed_|enhanced_|centerline_|total_|sum_)?(?:base_)?(?:magic|physical|true)_damage|damage_per_explosion|damage_per_second|damage_per_hit|base_explosion_damage|base_damage_per_hit|base_magic_damage_first_rock|base_magic_damage_worked_ground|base_magic_damage_explosion)$/;
const MAX_HP=/max_hp.*damage|damage.*max_hp/;
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const valid=n=>typeof n==='number'&&Number.isFinite(n);
function prepare(evidence){
 if(!evidence?.ok||typeof evidence.getChampion!=='function')return {ok:false,reason:'Fiches client vérifiées requises'};
 function ability(name,slot,rank=1,stats={}){
  const champ=evidence.getChampion(name);
  if(!champ)return {ok:false,reason:'Champion sans tableau client'};
  const table=champ.rankTables[slot];
  const facts=champ.tooltipFacts[slot];
  if(!table)return {ok:false,reason:'Rang de compétence non relevé'};
  if(!Number.isInteger(rank)||rank<1||rank>table.rankCount)return {ok:false,reason:'Rang non disponible dans les captures'};
  const base=Object.fromEntries(Object.entries(table.statRows||{}).map(([key,row])=>[key,row.values[rank-1]]));
  const coefficients=(facts?.observedCoefficients||[]).map(c=>({
   component:c.component,stat:c.stat,ratio:c.coefficient,sourceImageIndex:c.sourceImageIndex,
   acrossRanksAssumed:rank>1&&!c.confirmedConstantAcrossRanks
  }));
  const calculated=[];
  for(const [field,value] of Object.entries(base)){
   if(!DAMAGE.test(field))continue;
   const matching=coefficients.filter(c=>c.component===field);
   const contributions=matching.map(c=>({stat:c.stat,ratio:c.ratio,amount:valid(stats[c.stat])?stats[c.stat]*c.ratio:null}));
   calculated.push({field,base:value,contributions,
    total:contributions.every(c=>c.amount!==null)?value+contributions.reduce((sum,c)=>sum+c.amount,0):null,
    completeRatioMapping:matching.length>0,conditional:true});
  }
  return {ok:true,champion:champ.name,slot,rank,rankCount:table.rankCount,sourceImageIndex:table.sourceImageIndex,
   base,coefficients,calculated,mechanics:facts?.mechanics||[],
   assumptions:coefficients.some(x=>x.acrossRanksAssumed)?['Coefficients constatés sur infobulle de rang 1 supposés stables aux rangs suivants']:[],
   note:'Dégâts bruts conditionnels avant résistances, déclenchements et nombre de touches'};
 }
 function inspectDraft({names=[]}={}){
  const champions=[];
  for(const name of names){
   const champ=evidence.getChampion(name);if(!champ)continue;
   const abilities={};let damageRows=0,maxHpRows=0,trueDamageRows=0,coefficientCount=0;
   for(const [slot,table] of Object.entries(champ.rankTables)){
    const out=ability(name,slot,table.rankCount);
    abilities[slot]=out;
    damageRows+=out.calculated.length;
    maxHpRows+=Object.keys(out.base).filter(k=>MAX_HP.test(k)).length;
    trueDamageRows+=Object.keys(out.base).filter(k=>k.includes('true_damage')).length;
    coefficientCount+=out.coefficients.length;
   }
   champions.push({name:champ.name,damageRows,maxHpRows,trueDamageRows,coefficientCount,abilities});
  }
  const enemies=champions.filter(c=>names.slice(5).some(n=>norm(n)===norm(c.name)));
  return {ok:true,version:VERSION,champions,enemyMaxHpNumericSources:enemies.filter(x=>x.maxHpRows>0).length,
   enemyTrueDamageNumericSources:enemies.filter(x=>x.trueDamageRows>0).length,
   damageRows:champions.reduce((s,x)=>s+x.damageRows,0),
   coefficients:champions.reduce((s,x)=>s+x.coefficientCount,0),
   source:'user_client_rank_tables_and_tooltips',actualEnemyStatsKnown:false};
 }
 return {ok:true,version:VERSION,ability,inspectDraft};
}
return Object.freeze({VERSION,prepare});
});