/* WRDI V12 step 11: opt-in, isolated advanced mechanics. Requires effects-v12.js. */
(function(root){'use strict';
const core=(typeof module==='object'&&module.exports)?require('./effects-v12.js'):root.WRDI_EffectsV12;
if(!core)throw Error('Charger effects-v12.js avant effects-advanced-v12.js');
const n=(v,k)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error('Nombre invalide: '+k);return v;};
const validStat=new Set(core.statKeys);
function equipment(items,slots=5){
 if(!Array.isArray(items)||!Number.isInteger(slots)||slots<1)throw Error('Equipement invalide');
 const errors=[];const ids=new Set();const exclusive=new Map();
 if(items.length>slots)errors.push('Nombre d’objets supérieur aux emplacements configurés');
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id)throw Error('Identifiant objet manquant');
  if(ids.has(item.id))errors.push('Objet dupliqué: '+item.id);ids.add(item.id);
  for(const group of item.exclusiveGroups||[]){if(exclusive.has(group))errors.push('Groupe exclusif '+group+': '+exclusive.get(group)+' / '+item.id);else exclusive.set(group,item.id);}
 }
 return {valid:errors.length===0,errors};
}
function simulate({baseStats={},items=[],effects=[],context={},slots=5}={}){
 const check=equipment(items,slots);if(!check.valid)return {valid:false,errors:check.errors,events:[],skipped:[]};
 const stats=core.sumStats(baseStats,items.map(x=>x.baseStats||{}));
 const bonus=core.sumStats({},items.map(x=>x.baseStats||{}));
 const events=[];const skipped=[];const appliedUnique=new Set();
 const elapsed=n(context.elapsedSeconds??0,'elapsedSeconds');if(elapsed<0)throw Error('Temps négatif');
 const combat=n(context.combatSeconds??0,'combatSeconds');if(combat<0)throw Error('Durée combat négative');
 const ordered=effects.slice().sort((a,b)=>(a.priority||0)-(b.priority||0));
 for(const e of ordered){
  if(!e||e.verified!==true){skipped.push({id:e&&e.id,reason:'Effet non vérifié'});continue;}
  if(typeof e.id!=='string'||!e.id)throw Error('ID effet manquant');
  if(e.uniqueGroup&&appliedUnique.has(e.uniqueGroup)){skipped.push({id:e.id,reason:'Passif unique déjà appliqué'});continue;}
  if(e.trigger&&e.trigger!==context.trigger){skipped.push({id:e.id,reason:'Déclencheur absent'});continue;}
  const cooldown=n(e.cooldownSeconds??0,'cooldownSeconds');
  const last=context.lastTriggeredAt?.[e.id];
  if(last!==undefined&&elapsed-n(last,'lastTriggeredAt')<cooldown){skipped.push({id:e.id,reason:'Effet en récupération'});continue;}
  const duration=e.durationSeconds===undefined?Infinity:n(e.durationSeconds,'durationSeconds');
  if(duration<0)throw Error('Durée négative');
  const interval=n(e.stackIntervalSeconds??1,'stackIntervalSeconds');if(interval<=0)throw Error('Intervalle invalide');
  const maxStacks=n(e.maxStacks??1,'maxStacks');if(!Number.isInteger(maxStacks)||maxStacks<1)throw Error('Cumuls invalides');
  const stacks=Math.min(maxStacks,Math.floor(combat/interval)+(e.initialStack===true?1:0));
  if(e.requiresStacks&&stacks<e.requiresStacks){skipped.push({id:e.id,reason:'Cumuls insuffisants'});continue;}
  if(e.activeUntilSeconds!==undefined&&elapsed>n(e.activeUntilSeconds,'activeUntilSeconds')){skipped.push({id:e.id,reason:'Effet expiré'});continue;}
  if(e.type==='conversion'){
   if(!validStat.has(e.source)||!validStat.has(e.target))throw Error('Statistique inconnue');
   const source=e.bonusOnly?bonus:stats;
   const amount=(source[e.source]||0)*n(e.ratio,'ratio')*(e.perStack?stacks:1);
   stats[e.target]=(stats[e.target]||0)+amount;
   events.push({id:e.id,type:e.type,amount,stacks});
  }else if(e.type==='heal'||e.type==='shield'){
   if(e.scalingStat&&!validStat.has(e.scalingStat))throw Error('Statistique inconnue');
   const source=e.bonusOnly?bonus:stats;
   const raw=n(e.base??0,'base')+(e.scalingStat?(source[e.scalingStat]||0)*n(e.ratio??0,'ratio'):0);
   const amount=Math.max(0,raw*(e.perStack?stacks:1));
   events.push({id:e.id,type:e.type,amount,stacks,durationSeconds:Number.isFinite(duration)?duration:null});
  }else if(e.type==='damage'){
   if(e.scalingStat&&!validStat.has(e.scalingStat))throw Error('Statistique inconnue');
   const source=e.bonusOnly?bonus:stats;
   const raw=Math.max(0,(n(e.base??0,'base')+(e.scalingStat?(source[e.scalingStat]||0)*n(e.ratio??0,'ratio'):0))*(e.perStack?stacks:1));
   const kind=e.damageType;if(!['magic','physical','true'].includes(kind))throw Error('Type de dégâts inconnu');
   const resist=kind==='magic'?n(context.targetMagicResist??0,'MR'):n(context.targetArmor??0,'armor');
   const dealt=kind==='true'?raw:core.mitigate(raw,resist,kind==='magic'?stats.magicPenFlat||0:stats.armorPenFlat||0,kind==='magic'?stats.magicPenPct||0:stats.armorPenPct||0);
   events.push({id:e.id,type:e.type,raw,amount:dealt,stacks});
  }else{skipped.push({id:e.id,reason:'Type non implémenté'});continue;}
  if(e.uniqueGroup)appliedUnique.add(e.uniqueGroup);
 }
 return {valid:true,stats,bonusStats:bonus,events,skipped,notes:['Les effets doivent être vérifiés explicitement; aucun passif du catalogue historique n’est activé automatiquement.','Les soins sont des valeurs brutes, sans anti-soins, sursoin ou réduction.','Les cumuls et durées sont des approximations par scénario, pas une simulation événementielle complète.']};
}
const api=Object.freeze({equipment,simulate});if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_AdvancedEffectsV12=api;
})(typeof globalThis!=='undefined'?globalThis:this);
