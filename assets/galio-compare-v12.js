/* WRDI V12 step 15 — isolated, scenario-based Galio equipment comparison.
   No item passive is assumed; current patch NOT certified. */
(function(root){'use strict';
const galio=typeof module==='object'&&module.exports?require('./galio-kit-v12.js'):root.WRDI_GalioKitV12;
const advanced=typeof module==='object'&&module.exports?require('./effects-advanced-v12.js'):root.WRDI_AdvancedEffectsV12;
if(!galio||!advanced)throw Error('Load galio-kit-v12.js and effects-advanced-v12.js first');
const number=(v,label)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid '+label);return v;};
const allowed=new Set(['health','armor','magicResist','abilityPower','attackDamage','abilityHaste','magicPenPct','magicPenFlat','armorPenPct','armorPenFlat']);
function compare(config){
 const {level,baseStats={},target={},actions=[],builds=[],durationSeconds=10,slots=5}=config||{};
 if(!Array.isArray(builds)||!builds.length)throw Error('Provide at least one build');
 if(!Array.isArray(actions))throw Error('actions must be an array');
 const ids=new Set();
 const results=builds.map((build,index)=>{
  if(!build||typeof build.name!=='string'||!build.name.trim()||!Array.isArray(build.items))throw Error('Invalid build');
  if(ids.has(build.name))throw Error('Duplicate build name');ids.add(build.name);
  for(const item of build.items){if(!item||!item.baseStats)throw Error('Missing item baseStats');for(const [key,value] of Object.entries(item.baseStats)){if(!allowed.has(key))throw Error('Unrecognized or unsupported stat '+key);number(value,key);}}
  const check=advanced.equipment(build.items,slots);
  if(!check.valid)return {name:build.name,index,valid:false,errors:check.errors};
  const result=galio.scenario({level,baseStats,items:build.items,target,actions,durationSeconds});
  const health=number(result.stats.health??0,'health');const armor=number(result.stats.armor??0,'armor');const mr=number(result.stats.magicResist??0,'magicResist');
  if(health<0||armor<0||mr<0)throw Error('Negative defensive stat not supported by survival proxy');
  const damage=result.totals.damage;
  return {name:build.name,index,valid:true,damage,health,armor,magicResist:mr,
   physicalEhp:health*(1+armor/100),magicEhp:health*(1+mr/100),
   formulas:result.galio.formulas,warnings:result.galio.warnings,events:result.log,
   exclusions:['Item passive damage, heals, shields and procs','Runes, boots actives and enchantments','Target HP and actual time-to-kill','Actual CC, animation and movement','Patch-current item and Galio rank coefficients','Passive magic-resist conversion beyond explicitly provided item MR']};
 });
 const valid=results.filter(x=>x.valid);
 const pareto=valid.filter(a=>!valid.some(b=>b!==a&&b.damage>=a.damage&&b.physicalEhp>=a.physicalEhp&&b.magicEhp>=a.magicEhp&&(b.damage>a.damage||b.physicalEhp>a.physicalEhp||b.magicEhp>a.magicEhp))).map(x=>x.name);
 return {results,pareto,scenario:{level,target,actions,durationSeconds},disclaimer:'Exploratory comparison ONLY. Uses screenshot-era Galio formulas and explicit base stats; item passives and patch verification absent. EHP are unmitigated proxies, not survival simulations. No automatic recommendation.'};
}
const api=Object.freeze({compare});if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_GalioCompareV12=api;
})(typeof globalThis!=='undefined'?globalThis:this);
