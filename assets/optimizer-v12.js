/* WRDI V12 alpha 4 — scenario comparison, evidence gated.
   Does NOT infer item passives, champion ratios, or live patch data.
   Does NOT change the V11 UI. */
(function(g){'use strict';
 const VERSION='12.0.0-alpha.4';
 const REQUIRED=['short-trade','extended-fight','engage'];
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 function compare(config){
  const combat=g.WRDICombatV12;
  if(!combat||typeof combat.simulate!=='function')return {ok:false,errors:['combat-v12.js is not loaded']};
  const {patch,builds,weights,scenarioTargets}=config||{};
  if(typeof patch!=='string'||!patch||!Array.isArray(builds)||builds.length<2||!weights||!scenarioTargets)return {ok:false,errors:['Patch, at least two builds, scenario weights and targets required']};
  const errors=[];
  const sum=REQUIRED.reduce((n,k)=>{
   if(!finite(weights[k])||weights[k]<0)errors.push('Invalid weight: '+k);
   if(!scenarioTargets[k]||!finite(scenarioTargets[k].armor)||!finite(scenarioTargets[k].mr))errors.push('Invalid target: '+k);
   return n+(finite(weights[k])?weights[k]:0);
  },0);
  if(sum<=0)errors.push('At least one positive weight required');
  const seen=new Set();
  builds.forEach((b,i)=>{
   if(!b||typeof b.id!=='string'||!b.id.trim()||seen.has(b.id))errors.push('Invalid or duplicate build ID '+i);
   else seen.add(b.id);
   if(!b||!b.scenarios)errors.push('Missing scenarios for build '+i);
   else REQUIRED.forEach(k=>{if(!Array.isArray(b.scenarios[k]))errors.push('Missing event list for '+b.id+' / '+k)});
  });
  if(errors.length)return {ok:false,errors};
  const results=[];
  for(const b of builds){
   let score=0;const details={};
   for(const k of REQUIRED){
    const sim=combat.simulate({patch,events:b.scenarios[k],enemy:scenarioTargets[k],shield:scenarioTargets[k].shield||0});
    if(!sim.ok){errors.push(b.id+' / '+k+': '+sim.errors.join('; '));continue}
    const value=sim.totals.healthDamage;
    details[k]={healthDamage:value,weight:weights[k],timeline:sim.timeline};
    score+=value*weights[k]/sum;
   }
   results.push({id:b.id,weightedHealthDamage:score,details});
  }
  if(errors.length)return {ok:false,errors,warning:'No ranking produced from partial or unverified scenarios'};
  results.sort((a,b)=>b.weightedHealthDamage-a.weightedHealthDamage);
  return {ok:true,patch,ranking:results,metric:'Weighted health damage in supplied verified scenarios',limitations:[
   'Not a full build optimizer: no automatic item effect extraction or champion kit formulas.',
   'Damage alone does not measure tankiness, control, protection, mobility, gold cost, or team utility.',
   'Scenario weights and hit assumptions must be justified; a ranking is conditional on them.',
   'WR China Meta is not consulted and does not influence this ranking.'
  ]};
 }
 function audit(){return {version:VERSION,dependencies:['WRDICombatV12'],requiredScenarios:REQUIRED.slice(),readyForAutomaticBuilds:false,metaInfluence:false}}
 g.WRDIOptimizerV12=Object.freeze({VERSION,compare,audit});
})(window);
