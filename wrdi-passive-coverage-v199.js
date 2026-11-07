/* V19.9: source-complete effect registry for every Wild Rift item, rune and boot.
 * Coverage != proc certification; each passive is independently tracked, never
 * silently treated as active. Works with any champion's five-item loadout.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_PassiveCoverageV199=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='19.9.0';
const SIMULATED={
 rabadons_deathcap:[0],riftmaker:[0,1],void_staff:[],
 ludens_echo:[0],liandrys_torment:[0,1],hollow_radiance:[0],
 unending_despair:[0],sunfire_aegis:[0],blackfire_torch:[0],
 infinity_orb:[0],thornmail:[0,1],morellonomicon:[0],
 oceanids_trident:[0],amaranths_twinguard:[0],dawnshroud:[0],
 abyssal_mask:[],stormsurge:[],lich_bane:[],horizon_focus:[],
};
const unique=(xs)=>[...new Set(xs)];
function auditCatalog({catalog,runes,bootsCatalog}={}){
 const items=catalog?.items||[],keystones=runes?.fundamental||[],minors=runes?.minor||[];
 const boots=bootsCatalog?.records||[];
 if(!Array.isArray(items)||!Array.isArray(keystones)||!Array.isArray(minors)||!Array.isArray(boots))
  return {ok:false,reason:'Catalogue incomplet'};
 const passives=items.flatMap(item=>(item.passives||[]).map((p,index)=>({
  itemId:item.id,index,name:p.name||'',description:p.description_fr||'',
  mechanics:p.mechanics||{},fields:Object.keys(p.mechanics||{}),
  simulatedByCurrentScenario:(SIMULATED[item.id]||[]).includes(index)
 })));
 const categories={};
 for(const p of passives)for(const key of p.fields)categories[key]=(categories[key]||0)+1;
 return {ok:true,version:VERSION,itemCount:items.length,itemPassiveCount:passives.length,
  itemPassiveFields:categories,distinctPassiveFields:Object.keys(categories).length,
  itemPassives:passives,runeCount:keystones.length+minors.length,
  runeRecords:[...keystones,...minors].map(r=>({id:r.id,name:r.name_fr,fields:Object.keys(r.effect||{})})),
  bootCount:boots.length,bootPassives:boots.flatMap(b=>(b.passives||[]).map((p,i)=>({
   bootName:b.name_fr,index:i,description:p.effect||'',fields:Object.keys(p)
  }))),allKnownEffectsInventoried:true,allEffectsNumericallySimulated:false};
}
function inspectLoadout({items=[],boots=null,runePage=null,runes=null,scenario=null}={}){
 if(!Array.isArray(items))return {ok:false,reason:'Items invalides'};
 const seen=new Set();
 const selected=items.flatMap(item=>(item.passives||[]).map((p,index)=>{
  const id=item.id+':'+index;if(seen.has(id))return null;seen.add(id);
  const modelled=(SIMULATED[item.id]||[]).includes(index);
  const proc=scenario?.procs?.find(x=>x.id===item.id)||null;
  return {id,itemId:item.id,itemName:item.name_fr,passiveName:p.name,
   description:p.description_fr,mechanics:p.mechanics||{},
   trigger:(p.mechanics||{}).trigger||null,
   modeled:modelled,status:modelled?(proc&&!proc.eligible?'condition_not_met':'modeled_conditionally'):
    'not_yet_in_numerical_model',
   evidence:item.evidence?.kind||'local_client_catalog',
   activeConditionExplicit:Boolean(proc?.condition),modeledDamageCounted:Boolean(proc?.countedDamage>0)};
 })).filter(Boolean);
 const runeNames=unique([runePage?.keystone,...(runePage?.primary||[]),runePage?.secondary].filter(Boolean));
 const records=[...(runes?.fundamental||[]),...(runes?.minor||[])];
 const selectedRunes=runeNames.map(name=>{
  const r=records.find(x=>x.name_fr===name);
  return {name,found:Boolean(r),fields:Object.keys(r?.effect||{}),
   numericallyModeled:Boolean(scenario?.procs?.some(p=>p.id==='minor_rune_'+name||
    (name==='Électrocution'&&p.id==='rune_electrocute')||
    (name==='Comète arcanique'&&p.id==='rune_comet')||
    (name==='Poigne de l\'immortel'&&p.id==='rune_grasp')||
    (name==='Souverain des glaces'&&p.id==='rune_glacial'))) };
 });
 return {ok:true,version:VERSION,selectedItems:items.map(x=>x.id),
  passives:selected,totalPassives:selected.length,
  numericallyModeled:selected.filter(x=>x.modeled).length,
  remainingPassives:selected.filter(x=>!x.modeled).map(x=>x.id),
  boots:boots?{name:boots.name_fr,stats:boots.stats,
   passives:(boots.passives||[]).map(x=>({description:x.effect||'',fields:Object.keys(x)}))}:null,
  runes:selectedRunes,unknownEffectsNotSilentlyScored:true};
}
return Object.freeze({VERSION,auditCatalog,inspectLoadout});
});