/* Wild Rift mobile — evidence gate. Never infer current patch from retrieval date. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_SourceConfidenceV12=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const TARGET='7.3d';
function assess(record){
 const problems=[];
 if(!record||typeof record!=='object')return {status:'blocked',mayRecommend:false,reasons:['missing-record']};
 if(record.game!=='wild-rift-mobile')problems.push('game-not-confirmed');
 if(record.patch!==TARGET)problems.push('patch-not-7.3d');
 if(record.mode!=='ranked')problems.push('ranked-availability-not-confirmed');
 if(!record.sourceUrl||!/^https:\/\//.test(record.sourceUrl))problems.push('source-missing');
 if(record.statsVerified!==true)problems.push('stats-unverified');
 if(record.passivesVerified!==true||!Array.isArray(record.passives))problems.push('passives-unverified');
 if(record.activesVerified!==true)problems.push('actives-unverified');
 if(record.availabilityVerified!==true)problems.push('availability-unverified');
 if(record.conflict===true)problems.push('conflicting-evidence');
 return {status:problems.length?'blocked':'eligible-for-reviewed-simulation',mayRecommend:problems.length===0,reasons:problems};
}
function audit(records){if(!Array.isArray(records))throw Error('records must be array');return {targetPatch:TARGET,total:records.length,eligible:records.filter(x=>assess(x).mayRecommend).length,items:records.map(x=>({id:x.id||null,...assess(x)}))};}
return Object.freeze({assess,audit});});
