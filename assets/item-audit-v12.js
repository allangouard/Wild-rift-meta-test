/* WRDI V12 Etape 17: validation de l'inventaire, sans activer de recommandations. */
(function(root){'use strict';
function audit(data){const errors=[];if(!data||!Array.isArray(data.items))return {ok:false,errors:['invalid audit data']};
const ids=new Set();for(const x of data.items){if(!x.id||ids.has(x.id))errors.push('duplicate/missing id: '+x.id);ids.add(x.id);
if(x.combatRuleStatus==='enabled' && (!x.evidence||!x.evidence.length||x.currentPatchPassives!=='verified'||x.currentPatchStats!=='verified'||x.currentPatchPresence!=='confirmed'))errors.push('unsafe enabled item: '+x.id);
}return {ok:errors.length===0,errors,records:data.items.length,verified:data.items.filter(x=>x.currentPatchPresence==='confirmed'&&x.currentPatchStats==='verified'&&x.currentPatchPassives==='verified').length};}
root.WRDIItemAuditV12=Object.freeze({audit});if(typeof module!=='undefined'&&module.exports)module.exports={audit};
})(typeof globalThis!=='undefined'?globalThis:this);
