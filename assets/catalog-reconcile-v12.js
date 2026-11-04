/* WRDI V12 step 19 — conservative catalog reconciliation, Wild Rift mobile only. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_CatalogReconcileV12=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
function key(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function reconcile({historical,coverage,officialDeltas,currentRecords=[]}={}){
 if(!historical||!Array.isArray(historical.items))throw Error('Historical catalog missing');
 if(!coverage||!Array.isArray(coverage.items))throw Error('Passive coverage missing');
 if(!officialDeltas||!Array.isArray(officialDeltas.items))throw Error('Official delta missing');
 const coverageById=new Map(coverage.items.map(x=>[x.id,x]));
 const currentById=new Map();const warnings=[];
 for(const rec of currentRecords){if(!rec||!rec.stableId||!rec.sourceUrl||!rec.patch||!rec.mode){warnings.push('Rejected untraceable current record');continue;}const id=String(rec.stableId);if(currentById.has(id))warnings.push('Duplicate current stableId: '+id);else currentById.set(id,rec);}
 const items=historical.items.map(h=>{const c=coverageById.get(h.id);const verified=currentById.get(h.id);const safe=!!(verified&&verified.patch==='7.3d'&&verified.mode==='ranked'&&verified.statsVerified===true&&verified.passivesVerified===true&&verified.availabilityVerified===true&&Array.isArray(verified.passives));return {id:h.id,historicalName:h.sourceName,patch:'7.3d',status:safe?'verified':'needs-verification',mayRecommend:safe,maySimulate:safe,source: safe?verified.sourceUrl:null,missing: safe?[]:['current-shop-availability','current-stats','all-passives-and-actives','stable-identity','ranked-mode'],historicalPassiveCandidates:c?.passiveCandidates||[]};});
 const ids=new Set(items.map(i=>i.id));for(const [id,r] of currentById){if(!ids.has(id)){const safe=r.patch==='7.3d'&&r.mode==='ranked'&&r.statsVerified===true&&r.passivesVerified===true&&r.availabilityVerified===true&&Array.isArray(r.passives);items.push({id,historicalName:null,patch:'7.3d',status:safe?'verified':'needs-verification',mayRecommend:safe,maySimulate:safe,source:safe?r.sourceUrl:null,missing:safe?[]:['verification-incomplete']});}}
 return {schema:'wrdi-catalog-reconciliation-v1',targetPatch:'7.3d',mode:'ranked',generatedFrom:'historical-and-coverage',policy:{deltaApplication:'NEVER apply deltas to current snapshots',unknownPassive:'BLOCK',unknownMode:'BLOCK'},counts:{historical:historical.items.length,currentSupplied:currentById.size,verified:items.filter(x=>x.mayRecommend).length,blocked:items.filter(x=>!x.mayRecommend).length,officialDeltaEntries:officialDeltas.items.length},items,warnings,officialDeltasReferenceOnly:officialDeltas.source?.url||null};
}
return Object.freeze({key,reconcile});
});
