/* WRDI V14.24 — explicit client item identity and equipment eligibility gate.
 * Wild Rift mobile only. Client item catalog is exploratory and not an
 * automatic recommendation source. Does NOT calculate item damage/passives.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioItemGuardV1424=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.24.0-alpha.1';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
function prepare({catalog,rules,core,livePatch}={}){
 if(!core?.validateSources||!core?.validateEquipment)return {ok:false,reason:'Moteur de restrictions indisponible'};
 const audit=core.validateSources(catalog,rules);
 if(!audit.ok)return {ok:false,reason:audit.errors.join('; ')};
 if(!livePatch||String(livePatch).toLowerCase()!==String(audit.patch).toLowerCase())
  return {ok:false,reason:'Patch de la source directe différent du catalogue client '+audit.patch};
 const collisions=new Set(),byName=new Map();
 for(const item of catalog.items){
  const key=normalize(item.name_fr);
  if(!key)continue;
  if(byName.has(key))collisions.add(key);
  else byName.set(key,item);
 }
 return {ok:true,catalog,rules,core,byName,collisions,patch:audit.patch,
  recommendationEligible:audit.recommendationEligible,
  warnings:audit.warnings};
}
function identify(name,prepared){
 if(!prepared?.ok)return {ok:false,reason:'Catalogue client indisponible'};
 const key=normalize(name);
 if(!key||prepared.collisions.has(key)||!prepared.byName.has(key))
  return {ok:false,reason:'Nom français absent ou ambigu dans le catalogue client',name:String(name||'')};
 const item=prepared.byName.get(key);
 return {ok:true,id:item.id,name:item.name_fr,type:item.item_type,patch:prepared.patch,
  mechanicsDocumented:Array.isArray(item.passives),interactionsValidated:false};
}
function validateSelection(names,prepared,{requireFullCore=false}={}){
 if(!prepared?.ok)return {ok:false,status:'source_unavailable',reason:prepared?.reason||'Sources absentes',ids:[]};
 if(!Array.isArray(names))return {ok:false,status:'invalid_input',reason:'Sélection absente',ids:[]};
 const identified=names.map(name=>identify(name,prepared));
 const unresolved=identified.filter(x=>!x.ok);
 if(unresolved.length)return {ok:false,status:'unresolved_identity',
  reason:'Objet(s) non rapproché(s) du catalogue client',unresolved,ids:identified.filter(x=>x.ok).map(x=>x.id)};
 const ids=identified.map(x=>x.id);
 if(requireFullCore&&ids.length!==3)return {ok:false,status:'incomplete_core',reason:'Core de trois objets requis',ids};
 const check=prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules);
 const nonbuyable=identified.filter(x=>x.type==='transformed');
 if(nonbuyable.length)return {ok:false,status:'transformed_not_buyable',reason:'Transformation, non achetable directement',ids};
 return {ok:check.valid,status:check.valid?'equipment_compatible':'equipment_conflict',
  reason:check.valid?'Sélection compatible selon les restrictions du client '+prepared.patch:check.errors.join('; '),
  ids,errors:check.errors,warnings:check.warnings,
  recommendationEligible:false, // The audited client catalog explicitly forbids automatic optimization.
  patch:prepared.patch};
}
function checkCandidate({coreNames,candidateName,prepared}={}){
 const whole=validateSelection([...(coreNames||[]),candidateName],prepared);
 return {...whole,candidateName,validatedOptimization:false};
}
function filterAlternatives({coreNames,candidates,prepared,max=3}={}){
 if(!Array.isArray(candidates))return {ok:false,selected:[],rejected:[],reason:'Candidats absents'};
 const baseline=validateSelection(coreNames,prepared,{requireFullCore:true});
 if(!baseline.ok)return {ok:false,selected:[],rejected:[],reason:'Core de base non résolu ou incompatible : '+baseline.reason};
 const selected=[],rejected=[];
 const names=[...coreNames];
 for(const c of candidates){
  const name=c?.name||'';
  const check=checkCandidate({coreNames:names,candidateName:name,prepared});
  if(!check.ok){rejected.push({name,reason:check.reason});continue;}
  selected.push({...c,identity:identify(name,prepared),legalWithPrevious:true});
  names.push(name);
  if(selected.length>=max)break;
 }
 return {ok:true,selected,rejected,patch:prepared.patch,validatedOptimization:false,
  note:'Compatibilité technique du client seulement, efficacité tactique non certifiée.'};
}
return Object.freeze({VERSION,normalize,prepare,identify,validateSelection,checkCandidate,filterAlternatives});
});
