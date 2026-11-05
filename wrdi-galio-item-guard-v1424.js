/* WRDI V14.24 — explicit client item identity and equipment eligibility gate.
 * Player-confirmed complete client item records are authoritative for their
 * displayed price, stats, passive text and rules. Untested proc interactions,
 * unprovided fields and nonclient items remain unverified.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioItemGuardV1424=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.25.0-alpha.1';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
function itemEvidence(item){
 const documented=item?.completeness?.description==='documented';
 const priceConfirmed=['visible','visible_client_shop','user-confirmed'].includes(item?.completeness?.price);
 const priceValid=typeof item?.price_gold==='number'&&Number.isFinite(item.price_gold)&&item.price_gold>0;
 const verifiedSource=['user_client_screenshot','description_transcribed_from_conversation'].includes(item?.evidence?.kind)
   ||['client_description_transcribed','description_transcribed_from_conversation'].includes(item?.evidence?.validation);
 const statsPresent=item?.stats&&typeof item.stats==='object'&&Object.values(item.stats).every(v=>typeof v==='number'&&Number.isFinite(v));
 const passivesPresent=Array.isArray(item?.passives)&&item.passives.every(p=>p?.name&&typeof p.description_fr==='string');
 const complete=!!(documented&&priceConfirmed&&priceValid&&verifiedSource&&statsPresent&&passivesPresent);
 return {status:complete?'player_confirmed_complete':'incomplete_needs_verification',complete,
  priceVerified:priceConfirmed&&priceValid,descriptionVerified:documented&&verifiedSource,
  statsVerified:!!(documented&&verifiedSource&&statsPresent),
  passiveTextVerified:!!(documented&&verifiedSource&&passivesPresent),
  combatInteractionsVerified:false,
  missing:[!documented?'description':null,!priceConfirmed||!priceValid?'price':null,
   !statsPresent?'stats':null,!passivesPresent?'passive_description':null,!verifiedSource?'user_source':null].filter(Boolean)};
}
function prepare({catalog,rules,core,livePatch}={}){
 if(!core?.validateSources||!core?.validateEquipment)return {ok:false,reason:'Moteur de restrictions indisponible'};
 const audit=core.validateSources(catalog,rules);
 if(!audit.ok)return {ok:false,reason:audit.errors.join('; ')};
 // The user's current-client testimony is primary for the verified items.
 // An external API version string must not invalidate the client's direct observations.
 const externalPatchMismatch=!!livePatch&&String(livePatch).toLowerCase()!==String(audit.patch).toLowerCase();
 const collisions=new Set(),byName=new Map();
 for(const item of catalog.items){
  const key=normalize(item.name_fr);
  if(!key)continue;
  if(byName.has(key))collisions.add(key);
  else byName.set(key,item);
 }
 return {ok:true,catalog,rules,core,byName,collisions,patch:audit.patch,
  recommendationEligible:false, // mechanics-based build optimization is still uncalibrated.
  verifiedCompleteCount:catalog.items.filter(x=>itemEvidence(x).complete).length,
  externalPatchMismatch,externalPatch:livePatch||null,
  warnings:externalPatchMismatch?['Patch de l’API externe différent du patch client confirmé : priorité au client pour les fiches vérifiées.']:[]};
}
function identify(name,prepared){
 if(!prepared?.ok)return {ok:false,reason:'Catalogue client indisponible'};
 const key=normalize(name);
 if(!key||prepared.collisions.has(key)||!prepared.byName.has(key))
  return {ok:false,reason:'Nom français absent ou ambigu dans le catalogue client',name:String(name||'')};
 const item=prepared.byName.get(key);
 return {ok:true,id:item.id,name:item.name_fr,type:item.item_type,patch:prepared.patch,
  evidence:itemEvidence(item),
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
 const incomplete=identified.filter(x=>!x.evidence.complete);
 if(incomplete.length)return {ok:false,status:'incomplete_client_item',ids,
  reason:'Fiche client incomplète : '+incomplete.map(x=>x.name+' ('+x.evidence.missing.join(', ')+')').join(' ; '),
  incomplete};
 if(requireFullCore&&ids.length!==3)return {ok:false,status:'incomplete_core',reason:'Core de trois objets requis',ids};
 const check=prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules);
 const nonbuyable=identified.filter(x=>x.type==='transformed');
 if(nonbuyable.length)return {ok:false,status:'transformed_not_buyable',reason:'Transformation, non achetable directement',ids};
 return {ok:check.valid,status:check.valid?'equipment_compatible':'equipment_conflict',
  reason:check.valid?'Sélection compatible selon les restrictions du client '+prepared.patch:check.errors.join('; '),
  ids,errors:check.errors,warnings:check.warnings,
  recommendationEligible:false, // technical validation != optimal build.
  clientFieldsVerified:true,patch:prepared.patch};
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
return Object.freeze({VERSION,normalize,itemEvidence,prepare,identify,validateSelection,checkCandidate,filterAlternatives});
});
