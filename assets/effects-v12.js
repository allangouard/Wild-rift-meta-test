/* WRDI V12 - Etape 10: moteur générique autonome, non branché. */
(function(root){'use strict';
const KEYS=['health','mana','attackDamage','abilityPower','armor','magicResist','abilityHaste','attackSpeedPct','critChancePct','magicPenFlat','magicPenPct','armorPenFlat','armorPenPct','moveSpeed','moveSpeedPct','healthRegen','manaRegen'];
const allowed=new Set(KEYS);
function number(x,label){if(typeof x!=='number'||!Number.isFinite(x))throw Error('Valeur invalide: '+label);return x;}
function sumStats(base,items){const out={};for(const s of [base,...items])for(const [k,v] of Object.entries(s||{})){if(!allowed.has(k))throw Error('Statistique non reconnue: '+k);out[k]=(out[k]||0)+number(v,k);}return out;}
function resistanceMultiplier(r){number(r,'resistance');return r>=0?100/(100+r):2-100/(100-r);}
function effectiveResistance(res,flatPen=0,pctPen=0){number(res,'res');number(flatPen,'flatPen');number(pctPen,'pctPen');if(pctPen<0||pctPen>100)throw Error('Pénétration % hors plage');return res*(1-pctPen/100)-flatPen;}
function mitigate(raw,res,flatPen=0,pctPen=0){return Math.max(0,number(raw,'raw'))*resistanceMultiplier(effectiveResistance(res,flatPen,pctPen));}
function applyEffects(input){
 const {baseStats={},items=[],effects=[],context={}}=input||{};
 if(!Array.isArray(items)||!Array.isArray(effects))throw Error('items/effects doivent être des tableaux');
 const stats=sumStats(baseStats,items.map(i=>i.baseStats||{}));const events=[];const skipped=[];
 for(const e of effects){
  if(e.verified!==true){skipped.push({id:e.id,reason:'effet non vérifié'});continue;}
  if(e.type==='statFromStat'){
   if(!allowed.has(e.source)||!allowed.has(e.target))throw Error('Stat inconnue');
   const val=(stats[e.source]||0)*number(e.ratio,'ratio');stats[e.target]=(stats[e.target]||0)+val;events.push({id:e.id,type:e.type,value:val});
  }else if(e.type==='damageProc'){
   if(e.trigger!==context.trigger){skipped.push({id:e.id,reason:'déclencheur absent'});continue;}
   const raw=number(e.base||0,'base')+(stats[e.scalingStat]||0)*number(e.ratio||0,'ratio');
   const res=e.damageType==='magic'?number(context.targetMagicResist||0,'MR'):e.damageType==='physical'?number(context.targetArmor||0,'armor'):0;
   const pen=e.damageType==='magic'?[stats.magicPenFlat||0,stats.magicPenPct||0]:e.damageType==='physical'?[stats.armorPenFlat||0,stats.armorPenPct||0]:[0,0];
   const dealt=e.damageType==='true'?raw:mitigate(raw,res,...pen);
   events.push({id:e.id,type:e.type,raw,damage:dealt,damageType:e.damageType});
  }else skipped.push({id:e.id,reason:'type non implémenté'});
 }
 return {stats,events,skipped};
}
function validateCatalog(c){if(!c||!Array.isArray(c.items))throw Error('Catalogue invalide');return {records:c.items.length,sourcePatch:c.source&&c.source.claimedPatch||null,simulationAllowed:!!(c.policy&&c.policy.maySimulate),recommendationAllowed:!!(c.policy&&c.policy.mayAutoRecommend)};}
const api=Object.freeze({sumStats,resistanceMultiplier,effectiveResistance,mitigate,applyEffects,validateCatalog,statKeys:KEYS.slice()});
if(typeof module==='object'&&module.exports)module.exports=api;
root.WRDI_EffectsV12=api;
})(typeof globalThis!=='undefined'?globalThis:this);
