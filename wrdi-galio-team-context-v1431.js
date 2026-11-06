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
const VERSION='15.8.0';
const has=(arr,key)=>arr.includes(key);
function make({enemies,allies,lookup,shieldInfo}={}){
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
 const conditionalSustain=enemy.filter(x=>has(x.traits,'conditional_sustain')).length;
 // Conditional healing is not guaranteed in every match or champion form.
 const conditionalHeal=enemy.filter(x=>has(x.traits,'heal')&&has(x.traits,'conditional_sustain')).length;
 const confirmedHeal=counts.heal-conditionalHeal;
 const confirmedSustain=enemy.filter(x=>has(x.traits,'sustain')&&
  !has(x.traits,'conditional_sustain')).length;
 const mid=enemy[2],jungle=enemy[1];
 const physicalAssassins=enemy.filter(x=>has(x.traits,'assassin')&&has(x.traits,'ad')).length;
 const magicAssassins=enemy.filter(x=>has(x.traits,'assassin')&&has(x.traits,'ap')).length;
 const enemyCritPotential=enemy.filter(x=>has(x.traits,'crit')).length;
 // A single self-shield on an enemy mage is not a team-wide shielding draft.
 // Two or more shield kits, or a shielding support, make shield-cut materially relevant.
 const shieldFacts=typeof shieldInfo==='function'?enemy.map(x=>shieldInfo(x.name)):null;
 const shieldsWithEvidence=shieldFacts&&shieldFacts.every(x=>x&&typeof x.hasShield==='boolean'&&typeof x.protectsAllies==='boolean');
 const alliedShieldSources=shieldsWithEvidence?shieldFacts.filter(x=>x.protectsAllies).length:0;
 const personalShieldSources=shieldsWithEvidence?shieldFacts.filter(x=>x.hasShield&&!x.protectsAllies).length:0;
 const shieldingSupport=shieldsWithEvidence?(shieldFacts[4].protectsAllies?1:0):(has(enemy[4].traits,'shield')?1:0);
 const shieldPressure=shieldsWithEvidence?(alliedShieldSources>0?
  Math.min(5,2*alliedShieldSources):personalShieldSources>=3?2:personalShieldSources*0.25):
  (counts.shield>=2?counts.shield:shieldingSupport?2:counts.shield*0.25);
 const teamTank=knownAllies.filter(x=>has(x.traits,'tank')).length;
 const teamEngage=knownAllies.filter(x=>has(x.traits,'engage')||has(x.traits,'tank')).length;
 const backline=own.filter(x=>['ADC allié','Support allié'].includes(x.role)&&
  x.traits.length>0&&!has(x.traits,'tank')).length;
 // No tank => Galio may front-line, but other engage champions can share the duty.
 const frontlineNeed=alliesComplete?(teamTank?0:teamEngage?1:2):0;
 // Distinguish "Galio must frontline" from "team needs Galio AP".
 // More than one already-confirmed tank/engage teammate frees Galio to
 // prioritize ability power, provided his lane defense remains viable.
 const alliedApCarry=knownAllies.filter(x=>has(x.traits,'ap')&&
  !has(x.traits,'tank')).length;
 const frontlineProvided=alliesComplete?Math.min(3,teamTank):0;
 const damageDuty=alliesComplete?(frontlineProvided>=2&&alliedApCarry===0?2:
  frontlineProvided>=2?1:0):0;
 // An individual assassin is a situational threat, not a compulsory stasis.
 // Multiple independent dives or an explosive mid+jungle pair justify earlier protection.
 const midAssassin=has(mid.traits,'assassin')?1:0;
 const jungleAssassin=has(jungle.traits,'assassin')?1:0;
 const earlyDive=midAssassin+jungleAssassin+
  (has(mid.traits,'burst')&&has(jungle.traits,'burst')?1:0);
 const earlyStasisPriority=earlyDive>=2?2:earlyDive===1?1:0;
 const peelNeed=alliesComplete&&backline>0&&counts.assassin>0?Math.min(2,counts.assassin):0;
 const lanePhysical=has(mid.traits,'ad')?1:0;
 const laneMagic=has(mid.traits,'ap')?1:0;
 const laneAllIn=has(mid.traits,'assassin')||has(mid.traits,'burst')?1:0;
 // Lane harassment is different from assassination: Galio must step into
 // melee range for last hits but may use Q to manage the wave from farther.
 // No opponent-specific prescribed item or assumed enemy purchase.
 const lanePoke=has(mid.traits,'poke')?1:0;
 const jungleAllIn=has(jungle.traits,'assassin')||has(jungle.traits,'burst')||has(jungle.traits,'engage')?1:0;
 const threats={...counts,conditionalSustain,confirmedSustain,conditionalHeal,confirmedHeal,
  physicalAssassins,magicAssassins,critPotential:enemyCritPotential,
  // Crit tag = potential based on kit archetype, never a confirmed item build.
  // No verified enemy-item builds were supplied, so confirmed crit stays zero.
  crit:0,lanePhysical,laneMagic,laneAllIn,lanePoke,jungleAllIn,
  frontlineNeed,frontlineProvided,teamTank,teamEngage,alliedApCarry,
  damageDuty,shieldPressure,shieldingSupport,alliedShieldSources,personalShieldSources,midAssassin,jungleAssassin,earlyDive,earlyStasisPriority,
  peelNeed,enemyProfileCoverage:5-unknownEnemy.length,
  alliesProfileComplete:alliesComplete};
 const reasons=[];
 if(lanePhysical&&laneAllIn)reasons.push('Midlane : menace physique d’engagement, achat défensif précoce à considérer');
 if(laneMagic&&laneAllIn)reasons.push('Midlane : menace magique d’engagement');
 if(lanePoke)reasons.push('Midlane : harcèlement possible, limiter l’exposition au farm');
 if(conditionalSustain)reasons.push('Soins conditionnels : vérifier les formes ou déclenchements avant de considérer l’anti-soin comme indispensable');
 if(jungleAllIn)reasons.push('Jungle : potentiel de gank ou d’engagement');
 if(frontlineNeed)reasons.push('Équipe : responsabilité de première ligne accrue');
 if(damageDuty>=2)reasons.push('Équipe : plusieurs tanks alliés, Galio peut privilégier les dégâts magiques');
 if(earlyStasisPriority===1)reasons.push('Une menace d’assassin identifiée : stase à garder situationnelle');
 if(peelNeed)reasons.push('Protection des alliés vulnérables à l’engagement');
 if(shieldsWithEvidence&&personalShieldSources>0&&alliedShieldSources===0)reasons.push('Boucliers personnels isolés : anti-bouclier non prioritaire sans protection d’équipe');
 if(enemyCritPotential)reasons.push('Critiques possibles selon les archétypes, pas confirmés par un build adverse');
 return {ok:true,version:VERSION,game:'Wild Rift mobile',threats,reasons,
  enemy,allies:own,missingEnemyRoles:unknownEnemy,
  confidence:unknownEnemy.length?'partial_profiles':'complete_archetype_profiles',
  itemBuildsInferred:false,confirmedCritBuilds:false,damagePredicted:false};
}
return Object.freeze({VERSION,make});
});
