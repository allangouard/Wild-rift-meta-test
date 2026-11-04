/* WRDI V12 étape 16 — universal, conservative item-passive interpreter.
   Only execute reviewed rules passed explicitly; never auto-load historical data. */
(function(root){'use strict';
const TRIGGERS=new Set(['onHit','onSpellHit','onDamageTaken','onAttackTaken','onCombatTick','onKill','onCast','onCombatStart']);
const KINDS=new Set(['damage','heal','shield','applyStatus','statModifier']);
const STATS=new Set(['health','bonusHealth','armor','bonusArmor','magicResist','bonusMagicResist','abilityPower','attackDamage','abilityHaste','targetMaxHealth','selfMaxHealth']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function validateRule(rule){
 const errors=[];
 if(!rule||typeof rule!=='object')return ['rule must be object'];
 if(typeof rule.id!=='string'||!rule.id.trim())errors.push('missing id');
 if(!TRIGGERS.has(rule.trigger))errors.push('invalid trigger');
 if(!KINDS.has(rule.kind))errors.push('invalid kind');
 if(!rule.review||rule.review.status!=='verified'||typeof rule.review.patch!=='string'||!rule.review.patch.trim()||typeof rule.review.source!=='string'||!rule.review.source.trim())errors.push('rule must be verified with patch and source');
 if(!finite(rule.flat??0)||!finite(rule.cooldownSeconds??0)|| (rule.cooldownSeconds??0)<0)errors.push('invalid flat/cooldown');
 if(rule.scalings!==undefined&&(!Array.isArray(rule.scalings)||rule.scalings.some(s=>!STATS.has(s.stat)||!finite(s.factor))))errors.push('invalid scalings');
 if(rule.kind==='damage'&&!['magic','physical','true'].includes(rule.damageType))errors.push('damageType required');
 if(rule.kind==='applyStatus'&&(typeof rule.status!=='string'||!finite(rule.durationSeconds)||rule.durationSeconds<0))errors.push('invalid status');
 if(rule.stacks!==undefined&&(!Number.isInteger(rule.stacks.max)||rule.stacks.max<1||!finite(rule.stacks.perStackFactor??0)))errors.push('invalid stacks');
 return errors;
}
function validateCatalog(catalog){
 if(!catalog||!Array.isArray(catalog.items))throw Error('catalog.items required');
 const issues=[],ids=new Set();
 for(const item of catalog.items){if(!item||typeof item.id!=='string'||ids.has(item.id)){issues.push('duplicate or missing item id');continue;}ids.add(item.id);
  for(const rule of item.rules||[]){for(const e of validateRule(rule))issues.push(item.id+': '+e);}
 }
 return {valid:issues.length===0,issues,itemCount:ids.size,ruleCount:catalog.items.reduce((n,i)=>n+(i.rules||[]).length,0)};
}
function simulate({catalog,equipment,events,stats={},target={},initialState}={}){
 const check=validateCatalog(catalog);if(!check.valid)throw Error(check.issues.join('; '));
 if(!Array.isArray(equipment)||!Array.isArray(events))throw Error('equipment and events arrays required');
 const byId=new Map(catalog.items.map(i=>[i.id,i]));
 const selected=equipment.map(id=>{const item=byId.get(id);if(!item)throw Error('Unknown item '+id);return item;});
 if(new Set(equipment).size!==equipment.length)throw Error('Duplicate item equipped');
 if(selected.some(i=>i.reviewStatus!=='verified'))throw Error('Unverified item in simulation');
 const rules=selected.flatMap(i=>(i.rules||[]).map(r=>({...r,itemId:i.id})));
 const ordered=[...events].sort((a,b)=>a.time-b.time);const clocks=new Map(),stacks=new Map(),log=[];
 let previous=-Infinity;const totals={rawDamage:0,rawHealing:0,rawShields:0,statuses:0};
 for(const ev of ordered){if(!finite(ev.time)||ev.time<0||ev.time<previous||typeof ev.type!=='string')throw Error('Invalid event');previous=ev.time;
  for(const rule of rules){if(rule.trigger!==ev.type)continue;
   const key=rule.uniqueGroup||rule.itemId+':'+rule.id;
   if(ev.time<(clocks.get(key)??-Infinity))continue;
   const n=rule.stacks?Math.min(rule.stacks.max,(stacks.get(key)||0)+1):1;
   if(rule.stacks)stacks.set(key,n);
   const value=(rule.flat||0)+(rule.scalings||[]).reduce((sum,s)=>sum+s.factor*(s.stat.startsWith('target')?target[s.stat]:stats[s.stat]||0),0);
   if(!finite(value)||value<0)throw Error('Invalid computed value '+rule.id);
   const amount=value*(1+(rule.stacks?.perStackFactor||0)*(n-1));
   if(rule.kind==='damage')totals.rawDamage+=amount;
   if(rule.kind==='heal')totals.rawHealing+=amount;
   if(rule.kind==='shield')totals.rawShields+=amount;
   if(rule.kind==='applyStatus')totals.statuses++;
   log.push({time:ev.time,itemId:rule.itemId,ruleId:rule.id,kind:rule.kind,amount,stacks:n,damageType:rule.damageType||null,status:rule.status||null});
   clocks.set(key,ev.time+(rule.cooldownSeconds||0));
  }
 }
 return {totals,log,warnings:['Raw amounts only: mitigation, target state, periodic scheduling, unique-group stacking across different rules, healing reduction, shields absorption and runtime integration NOT simulated.'],initialStateIgnored:initialState!==undefined};
}
const api=Object.freeze({validateRule,validateCatalog,simulate});
if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_ItemPassivesV12=api;
})(typeof globalThis!=='undefined'?globalThis:this);
