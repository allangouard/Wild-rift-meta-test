/* WRDI V16.2 — Wild Rift-only sourced numerical abilities and verified Riot delta reconciler.
 * Never substitutes LoL PC values. Numeric formulas are raw skill damage before defenses.
 * Source discrepancies stay flagged, never silently overwritten.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_NumericKitsV162=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='16.2.0',SLOTS=['passive','q','w','e','r'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const normalize=s=>String(s||'').trim().replace(/\s+/g,' ');
const numericTokens=s=>(normalize(s).match(/(?<![\w.])(?:\d+(?:\.\d+)?|\.\d+)(?!\w)/g)||[]).map(Number);
function prepare(catalog,patch,client){
 if(catalog?.schema!=='wrdi.wild_rift_numeric_source_catalog.v1'||!Array.isArray(catalog.entries))
  return {ok:false,reason:'Catalogue numérique WR absent ou incompatible'};
 if(catalog.game!=='Wild Rift mobile, NOT PC'||catalog.entries.length<100)
  return {ok:false,reason:'Catalogue incomplet ou confusion possible avec les compétences PC'};
 const byId=new Map(),byName=new Map();
 for(const entry of catalog.entries){
  if(!entry?.id||!entry?.name||!/^https:\/\/wiki\.leagueoflegends\.com\/en-us\/WR%3A/i.test(entry.source||'')||
     !entry.skills||SLOTS.some(s=>!entry.skills[s]?.name||!Array.isArray(entry.skills[s].stats)||!Array.isArray(entry.skills[s].formulas)))
   return {ok:false,reason:'Fiche numérique invalide : '+(entry?.name||'?')};
  if(byId.has(String(entry.id)))return {ok:false,reason:'Identifiant de champion numérique dupliqué'};
  const copy={...entry,skills:Object.fromEntries(SLOTS.map(k=>[k,{
   ...entry.skills[k],stats:entry.skills[k].stats.map(x=>({...x})),formulas:entry.skills[k].formulas.map(x=>({...x}))
  }]))};
  byId.set(String(entry.id),copy);byName.set(String(entry.name).toLowerCase(),copy);
 }
 const outcomes=[],patchEntries=patch?.changes||[];
 for(const change of patchEntries){
  const champ=byName.get(String(change.champion).toLowerCase()),skill=champ?.skills[change.slot];
  if(!skill||!['stat','formula'].includes(change.kind)){
   outcomes.push({champion:change.champion,slot:change.slot,patch:change.patch,status:'missing_skill'});continue;
  }
  const arr=change.kind==='stat'?skill.stats:skill.formulas;
  const field=change.kind==='stat'?'value':'formula';
  const target=arr.find(x=>normalize(x.label).toLowerCase()===normalize(change.label).toLowerCase());
  if(!target){outcomes.push({champion:change.champion,slot:change.slot,patch:change.patch,status:'missing_field',label:change.label});continue;}
  const current=normalize(target[field]);
  if(current===normalize(change.before)){
   target[field]=change.after;
   target.numericTokens=numericTokens(change.after);
   target.patchApplied=change.patch;
   target.patchSource=change.source;
   outcomes.push({champion:change.champion,slot:change.slot,patch:change.patch,status:'applied',label:change.label});
  }else if(current===normalize(change.after)){
   outcomes.push({champion:change.champion,slot:change.slot,patch:change.patch,status:'already_current',label:change.label});
  }else{
   outcomes.push({champion:change.champion,slot:change.slot,patch:change.patch,status:'source_conflict',
    label:change.label,sourceValue:current,patchExpectedBefore:change.before,patchExpectedAfter:change.after});
   target.conflictedWithPatch=change.patch;
  }
 }
 // Client-verified screenshots take precedence over Wiki and change-log conflicts.
 // Do not guess rank-2+ ratios from a rank-1 tooltip.
 const clientApplied=[];
 if(client?.schema==='wrdi.wild_rift_client_ability_verifications.v1'&&client.game==='Wild Rift mobile, NOT PC'){
  for(const check of client.entries||[]){
   const champion=byName.get(String(check.champion).toLowerCase()),skill=champion?.skills?.[check.slot];
   if(!skill){clientApplied.push({champion:check.champion,slot:check.slot,status:'missing_skill'});continue;}
   const field=skill.formulas.find(x=>normalize(x.label).toLowerCase()===normalize(check.field).toLowerCase());
   const v=check.verified||{};
   if(!field){clientApplied.push({champion:check.champion,slot:check.slot,status:'missing_field'});continue;}
   skill.clientVerified={...v,notVerified:check.notVerified||[],
    evidence:'user_client_screenshots_2026_11_06',verificationPatch:client.targetPatch,
    screenshotReferences:check.screenshots||[]};
   // Source formulas remain accessible, but cannot be used when the client
   // verifies a different ratio or a nonlinear effect.
   field.conflictedWithClient=client.targetPatch;
   field.clientEvidenceStatus=check.formulaDisposition||'manual_verification_required';
   const previous=outcomes.find(x=>x.champion===check.champion&&x.slot===check.slot&&
    normalize(x.label)===normalize(check.field)&&x.status==='source_conflict');
   if(previous){previous.status='resolved_by_client';previous.clientEvidencePatch=client.targetPatch;}
   // Store verified cooldown and base ranks for display even if Wiki differs.
   const cd=skill.stats.find(x=>normalize(x.label).toUpperCase()==='COOLDOWN');
   if(cd&&Array.isArray(v.cooldown_s_by_rank)){
    cd.value=v.cooldown_s_by_rank.join(' / ');
    cd.numericTokens=[...v.cooldown_s_by_rank];
    cd.clientVerified=client.targetPatch;
   }
   clientApplied.push({champion:check.champion,slot:check.slot,status:'verified_client',
    formulaDisposition:check.formulaDisposition,verifiedFields:Object.keys(v)});
  }
 }
 const unresolved=outcomes.filter(x=>!['applied','already_current','resolved_by_client'].includes(x.status));
 return {ok:true,version:VERSION,count:byId.size,patchTarget:patch?.targetPatch||catalog.targetPatch,
  basePatchConfirmed:false,patchOverlayApplied:outcomes.filter(x=>x.status==='applied').length,
  patchConflicts:unresolved.length,patchOutcomes:outcomes,clientVerified:clientApplied,
  clientVerificationsCount:clientApplied.filter(x=>x.status==='verified_client').length,
  unreviewedPatchSections:patch?.notYetStructured||[],
  numericAbilityCoverage:catalog.coverage?.abilityEntries||0,
  source:'League of Legends Wiki Wild Rift namespace',sourceCurrentPatchGuaranteed:false,
  find(idOrName){return byId.get(String(idOrName))||byName.get(String(idOrName).toLowerCase())||null;}};
}
function linearFormula(value){
 // Only fully defined single-hit linear base + AP/AD expressions are calculated.
 // Percent HP, scaling-by-level, conditional repeats, multipliers and durations excluded.
 const raw=normalize(value);
 const m=raw.match(/^(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*)\s*(?:\(\+\s*(\d+(?:\.\d+)?)% AP\))?\s*(?:\(\+\s*(\d+(?:\.\d+)?)% (bonus )?AD\))?$/i);
 if(!m)return null;
 const bases=m[1].split('/').map(x=>Number(x.trim()));
 if(!bases.length||bases.some(n=>!finite(n)))return null;
 return {bases,apRatio:m[2]?Number(m[2])/100:0,adRatio:m[3]?Number(m[3])/100:0,
  adType:m[4]?'bonus':'total',sourceFormula:raw};
}
function damageForSkill(skill,{ap=0,ad=0,bonusAd=0}={}){
 if(!skill||![ap,ad,bonusAd].every(x=>finite(x)&&x>=0))return [];
 return skill.formulas.filter(f=>/^(?:Magic Damage|Physical Damage)$/i.test(normalize(f.label))&&!f.conflictedWithPatch&&!f.conflictedWithClient)
  .flatMap(f=>{
   const model=linearFormula(f.formula);
   if(!model)return [];
   const damage=model.bases.map(base=>base+model.apRatio*ap+model.adRatio*(model.adType==='bonus'?bonusAd:ad));
   return [{label:f.label,rankValues:damage,base:model.bases,apRatio:model.apRatio,
    adRatio:model.adRatio,apFromBuild:ap,adFromBuild:ad,bonusAdFromBuild:bonusAd,
    beforeDefenses:true,procNotGuaranteed:true,patch:f.patchApplied||null,sourceFormula:f.formula}];
  });
}
function summary(prepared,ids,{ap=0,ad=0,bonusAd=0}={}){
 if(!prepared?.ok||!Array.isArray(ids))return {ok:false,reason:'Catalogue ou draft numérique absent'};
 const champions=ids.map(id=>{
  const sheet=prepared.find(id);
  if(!sheet)return {id:String(id),found:false,spells:{}};
  const spells=Object.fromEntries(SLOTS.map(k=>[k,{
   name:sheet.skills[k].name,
   cooldowns:sheet.skills[k].stats.filter(x=>normalize(x.label).toUpperCase()==='COOLDOWN').map(x=>x.numericTokens),
   formulas:sheet.skills[k].formulas.length,
   directDamage:damageForSkill(sheet.skills[k],{ap,ad,bonusAd})
  }]));
  return {id:String(id),name:sheet.name,found:true,source:sheet.source,spells};
 });
 return {ok:true,champions,numericChampionCoverage:champions.filter(x=>x.found).length,
  explanatoryOnly:true,missingDefenseAndLevelInputs:true,patchConflicts:prepared.patchConflicts};
}
function galioDirectModel(prepared){
 const g=prepared?.find('10099');
 if(!g)return null;
 const slots=['q','w','e'];
 const models=[];
 for(const slot of slots){
  const spell=g.skills[slot];
  const formula=spell.formulas.find(f=>normalize(f.label)==='Magic Damage'&&!f.conflictedWithPatch);
  const model=formula&&linearFormula(formula.formula);
  if(!model||model.apRatio<=0)return null;
  models.push({slot,...model,source:g.source});
 }
 return {source:g.source,slots:models,verifiedPatch:'source_wiki_plus_player_galio_crosscheck',
  directDamageAt({ap=0,ranks={q:4,w:1,e:4}}={}){
   if(!finite(ap)||ap<0)return null;
   let total=0;const details=[];
   for(const m of models){
    const rank=ranks[m.slot];if(!Number.isInteger(rank)||rank<1||rank>m.bases.length)return null;
    const amount=m.bases[rank-1]+m.apRatio*ap;
    total+=amount;details.push({slot:m.slot,rank,amount,apRatio:m.apRatio,base:m.bases[rank-1]});
   }
   return {total,details,ap,rawSingleHitOnly:true,excluded:['passive','tornado','ultimate','enemy_resistance','item_passives','runes']};
  }};
}
return Object.freeze({VERSION,prepare,linearFormula,damageForSkill,summary,galioDirectModel,numericTokens});
});
