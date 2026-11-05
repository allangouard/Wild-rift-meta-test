/* WRDI V14.31 — draft needs from team functions and enemy roles.
 * Archetypes are hypotheses from the existing Wild Rift champion profiles.
 * Does not assume an enemy item build or that an archetype always activates.
 * Index convention: enemies top/jungle/mid/ADC/support, allies top/jungle/mid/ADC/support.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioTeamContextV1431=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.31.0-alpha.1';
const has=(arr,key)=>arr.includes(key);
function make({enemies,allies,lookup}={}){
 if(!Array.isArray(enemies)||enemies.length!==5||!Array.isArray(allies)||allies.length!==5||typeof lookup!=='function')
  return {ok:false,reason:'Composition de cinq adversaires et cinq alliés requise'};
 const resolve=(name,role)=>({name:String(name||''),role,traits:Array.isArray(lookup(name))?lookup(name).filter(t=>typeof t==='string'):[]});
 const enemy=enemies.map((n,i)=>resolve(n,['Top adverse','Jungle adverse','Mid adverse','ADC adverse','Support adverse'][i]));
 const own=allies.map((n,i)=>resolve(n,['Top allié','Jungle allié','Mid allié','ADC allié','Support allié'][i]));
 const unknownEnemy=enemy.filter(x=>!x.traits.length).map(x=>x.role);
 const knownAllies=own.filter((x,i)=>i!==2&&x.traits.length);
 const alliesComplete=own.filter((x,i)=>i!==2).every(x=>x.name&&x.traits.length>0);
 const counts={ad:0,ap:0,hybrid:0,tank:0,heal:0,shield:0,cc:0,burst:0,assassin:0,crit:0,sustain:0};
 for(const p of enemy){
  for(const k of Object.keys(counts))if(has(p.traits,k))counts[k]++;
 }
 const mid=enemy[2],jungle=enemy[1];
 const physicalAssassins=enemy.filter(x=>has(x.traits,'assassin')&&has(x.traits,'ad')).length;
 const magicAssassins=enemy.filter(x=>has(x.traits,'assassin')&&has(x.traits,'ap')).length;
 const enemyCritPotential=enemy.filter(x=>has(x.traits,'crit')).length;
 const teamTank=knownAllies.filter(x=>has(x.traits,'tank')).length;
 const teamEngage=knownAllies.filter(x=>has(x.traits,'engage')||has(x.traits,'tank')).length;
 const backline=own.filter(x=>['ADC allié','Support allié'].includes(x.role)&&
  x.traits.length>0&&!has(x.traits,'tank')).length;
 // No tank => Galio may front-line, but other engage champions can share the duty.
 const frontlineNeed=alliesComplete?(teamTank?0:teamEngage?1:2):0;
 const peelNeed=alliesComplete&&backline>0&&counts.assassin>0?Math.min(2,counts.assassin):0;
 const lanePhysical=has(mid.traits,'ad')?1:0;
 const laneMagic=has(mid.traits,'ap')?1:0;
 const laneAllIn=has(mid.traits,'assassin')||has(mid.traits,'burst')?1:0;
 const jungleAllIn=has(jungle.traits,'assassin')||has(jungle.traits,'burst')||has(jungle.traits,'engage')?1:0;
 const threats={...counts,
  physicalAssassins,magicAssassins,critPotential:enemyCritPotential,
  // Crit tag = potential based on kit archetype, never a confirmed item build.
  // No verified enemy-item builds were supplied, so confirmed crit stays zero.
  crit:0,lanePhysical,laneMagic,laneAllIn,jungleAllIn,
  frontlineNeed,peelNeed,enemyProfileCoverage:5-unknownEnemy.length,
  alliesProfileComplete:alliesComplete};
 const reasons=[];
 if(lanePhysical&&laneAllIn)reasons.push('Midlane : menace physique d’engagement, achat défensif précoce à considérer');
 if(laneMagic&&laneAllIn)reasons.push('Midlane : menace magique d’engagement');
 if(jungleAllIn)reasons.push('Jungle : potentiel de gank ou d’engagement');
 if(frontlineNeed)reasons.push('Équipe : responsabilité de première ligne accrue');
 if(peelNeed)reasons.push('Protection des alliés vulnérables à l’engagement');
 if(enemyCritPotential)reasons.push('Critiques possibles selon les archétypes, pas confirmés par un build adverse');
 return {ok:true,version:VERSION,game:'Wild Rift mobile',threats,reasons,
  enemy,allies:own,missingEnemyRoles:unknownEnemy,
  confidence:unknownEnemy.length?'partial_profiles':'complete_archetype_profiles',
  itemBuildsInferred:false,confirmedCritBuilds:false,damagePredicted:false};
}
return Object.freeze({VERSION,make});
});
