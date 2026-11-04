/* WRDI V12 alpha 3 — deterministic event and mitigation engine.
   No patch-specific values are assumed. Not connected to V11 UI. */
(function(g){'use strict';
const VERSION='12.0.0-alpha.3';
const TYPES=new Set(['magic','physical','true']);
function finite(n){return typeof n==='number'&&Number.isFinite(n)}
function mitigate(amount,resistance,type){
 if(!finite(amount)||amount<0||!TYPES.has(type))throw Error('Invalid damage');
 if(type==='true')return amount;
 if(!finite(resistance))throw Error('Invalid resistance');
 return resistance>=0?amount*100/(100+resistance):amount*(2-100/(100-resistance));
}
function checkEvidence(e,patch){return !!(e&&e.verified===true&&e.patch===patch&&typeof e.source==='string'&&/^https:\/\//.test(e.source)&&typeof e.key==='string'&&e.key.length>0)}
function simulate(config){
 const {patch,events,enemy,shield=0}=config||{};
 if(typeof patch!=='string'||!patch||!Array.isArray(events)||!enemy||!finite(enemy.armor)||!finite(enemy.mr)||!finite(shield)||shield<0)return {ok:false,errors:['Invalid scenario']};
 const errors=[];let remainingShield=shield,totalRaw=0,totalAfterResistance=0,totalHealthDamage=0;
 const timeline=[];
 events.forEach((ev,i)=>{
  if(!ev||!finite(ev.amount)||ev.amount<0||!TYPES.has(ev.type)||!checkEvidence(ev.evidence,patch)){
   errors.push('Event '+i+': missing verified patch-specific evidence or invalid damage');return;
  }
  const after=mitigate(ev.amount,ev.type==='magic'?enemy.mr:enemy.armor,ev.type);
  const absorbed=Math.min(remainingShield,after);remainingShield-=absorbed;
  const health=after-absorbed;totalRaw+=ev.amount;totalAfterResistance+=after;totalHealthDamage+=health;
  timeline.push({id:String(ev.id||i),type:ev.type,raw:ev.amount,afterResistance:after,shieldAbsorbed:absorbed,healthDamage:health});
 });
 if(errors.length)return {ok:false,errors,warning:'No partial combat result is considered valid.'};
 return {ok:true,patch,totals:{raw:totalRaw,afterResistance:totalAfterResistance,healthDamage:totalHealthDamage,remainingShield},timeline,limitations:['Input event damage must already include verified ratios, item passives, penetration and cooldown behavior.','No automatic combo timing, champion defenses, crowd control or target movement is simulated.']};
}
function audit(){return {version:VERSION,readyForBuildOptimization:false,verifiedPatchDataIncluded:false,features:['damage mitigation','shield consumption','patch evidence checks','event breakdown']}}
g.WRDICombatV12=Object.freeze({VERSION,mitigate,checkEvidence,simulate,audit});
})(window);
