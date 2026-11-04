/* WRDI V12 step 13 — isolated, deterministic event simulator. Not patch-verified. */
(function(root){'use strict';
const core=typeof module==='object'&&module.exports?require('./effects-v12.js'):root.WRDI_EffectsV12;
if(!core)throw Error('effects-v12.js must load first');
const finite=(v,label)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid '+label);return v;};
const nonneg=(v,label)=>Math.max(0,finite(v,label));
const TYPES=new Set(['cast','hit','attack','incoming','heal','shield','proc','status']);
function simulate(config){
 const {baseStats={},items=[],target={},timeline=[],rules=[],durationSeconds=10}=config||{};
 const duration=nonneg(durationSeconds,'duration');
 if(!Array.isArray(timeline)||!Array.isArray(rules)||!Array.isArray(items))throw Error('Arrays required');
 const stats=core.sumStats(baseStats,items.map(i=>i.baseStats||{}));
 const bonus=core.sumStats({},items.map(i=>i.baseStats||{}));
 const ordered=timeline.map((e,i)=>({...e,_i:i})).sort((a,b)=>a.at-b.at||a._i-b._i);
 const log=[],skipped=[],cooldowns=new Map(),stacks=new Map(),statuses=new Map();
 let damage=0,incoming=0,healing=0,shield=0;
 function value(expr,ctx){if(typeof expr==='number')return finite(expr,'value');if(!expr||typeof expr!=='object')throw Error('Bad formula');let v=finite(expr.base||0,'base');for(const part of expr.terms||[]){const source=part.bonusOnly?bonus:stats;v+=(source[part.stat]||0)*finite(part.ratio,'ratio');}if(expr.targetMaxHealthRatio)v+=nonneg(target.maxHealth||0,'target.maxHealth')*finite(expr.targetMaxHealthRatio,'targetMaxHealthRatio');if(expr.stackRatio)v*=1+ctx.stacks*finite(expr.stackRatio,'stackRatio');return v;}
 function hit(at,id,raw,kind,source){const armor=finite(target.armor??0,'armor'),mr=finite(target.magicResist??0,'magicResist');const amount=kind==='true'?nonneg(raw,'damage'):core.mitigate(nonneg(raw,'damage'),kind==='physical'?armor:mr,kind==='physical'?(stats.armorPenFlat||0):(stats.magicPenFlat||0),kind==='physical'?(stats.armorPenPct||0):(stats.magicPenPct||0));damage+=amount;log.push({at,id,type:'damage',source,damageType:kind,raw,amount});return amount;}
 function applyAction(at,id,action,ctx,source){const kind=action.damageType||'magic';if(action.type==='damage'){if(!['magic','physical','true'].includes(kind))throw Error('Bad damage type');return hit(at,id,value(action.value,ctx),kind,source);}if(action.type==='heal'){const amount=nonneg(value(action.value,ctx),'heal');healing+=amount;log.push({at,id,type:'heal',source,amount});return amount;}if(action.type==='shield'){const amount=nonneg(value(action.value,ctx),'shield');shield+=amount;log.push({at,id,type:'shield',source,amount});return amount;}if(action.type==='status'){const expires=at+nonneg(action.durationSeconds??0,'status duration');statuses.set(action.name,{expires,value:action.value??true});log.push({at,id,type:'status',name:action.name,expires});return 0;}throw Error('Bad action');}
 for(const e of ordered){const at=finite(e.at,'event time');if(at<0||at>duration)throw Error('Event outside duration');if(!TYPES.has(e.type))throw Error('Unknown event type');
  if(e.type==='incoming'){const amount=nonneg(e.amount,'incoming amount');incoming+=amount;log.push({at,id:e.id||'incoming',type:'incoming',amount});}
  else if(e.type==='heal'||e.type==='shield'||e.type==='status'){applyAction(at,e.id||e.type,{type:e.type,value:e.value??0,name:e.name,durationSeconds:e.durationSeconds},{stacks:0},'timeline');}
  else if(e.type==='hit'||e.type==='attack'||e.type==='proc'){if(e.raw!==undefined)hit(at,e.id||e.type,e.raw,e.damageType||'magic','timeline');}
  else log.push({at,id:e.id||'cast',type:'cast'});
  for(const rule of rules){if(rule.verified!==true){if(!skipped.some(x=>x.id===rule.id))skipped.push({id:rule.id,reason:'not verified'});continue;}
   if(rule.on!==e.type||(rule.eventId&&rule.eventId!==e.id))continue;
   if(rule.requiresStatus){const s=statuses.get(rule.requiresStatus);if(!s||s.expires<at)continue;}
   const key=rule.uniqueGroup||rule.id;if(!key)throw Error('Rule ID required');const cd=nonneg(rule.cooldownSeconds??0,'cooldown');if(cooldowns.has(key)&&at-cooldowns.get(key)<cd)continue;
   const state=stacks.get(key)||{count:0,last:-Infinity};const interval=(rule.stackWindowSeconds===undefined?Infinity:nonneg(rule.stackWindowSeconds,'stack window'));const count=(at-state.last>interval?0:state.count);const next=Math.min(rule.maxStacks||1,count+1);stacks.set(key,{count:next,last:at});if(next<(rule.requiresStacks||1))continue;
   if(!Array.isArray(rule.actions))throw Error('Rule actions required');cooldowns.set(key,at);
   for(const a of rule.actions)applyAction(at,rule.id,a,{stacks:next},'rule');
  }
 }
 return {stats,bonusStats:bonus,totals:{damage,incomingDamageRaw:incoming,healingRaw:healing,shieldRaw:shield},log,skipped,limitations:['No automatic game mechanics or champion kit: timeline and verified rules must be supplied.','No HP pool, actual shield absorption, overheal, grievous wounds, target deaths, range or cooldown enforcement for casts.','No periodic scheduler; periodic ticks must be supplied as events.','Not connected to app recommendations or verified against current patch.']};
}
const api=Object.freeze({simulate});if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_CombatEventsV12=api;
})(typeof globalThis!=='undefined'?globalThis:this);
