/* Wild Rift 7.3d client-derived items: catalogue and equip-rules only, not combat simulation */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDIClientCatalogV12=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function validateBuild(ids, rules, extraActiveIds=[]){
  if(!Array.isArray(ids))throw Error('ids must be an array');
  const errors=[],present=ids.filter(Boolean),set=new Set(present);
  if(set.size!==present.length)errors.push({type:'duplicate',message:'Un même objet ne peut pas occuper deux emplacements.',members:present.filter((x,i)=>present.indexOf(x)!==i)});
  for(const g of rules.groups||[]){
   const found=(g.members||[]).filter(x=>set.has(x));
   if(found.length>(g.max??1))errors.push({type:'family',group:g.id,message:'Famille '+g.label_fr+' : '+found.length+' objets (maximum '+g.max+').',members:found});
  }
  for(const pair of rules.extra_exclusion_pairs||[]){
   if(pair.every(x=>set.has(x)))errors.push({type:'pair',message:'Objets incompatibles entre eux.',members:pair});
  }
  const activeSet=new Set([...(rules.known_active_item_ids||[]),...extraActiveIds]);
  const active=present.filter(x=>activeSet.has(x));
  if(active.length>(rules.max_active_items||1)) errors.push({type:'active',message:'Un seul objet actif peut être équipé.',members:active});
  if(present.length>6)errors.push({type:'slots',message:'Six emplacements maximum.',members:present});
  return {valid:errors.length===0,errors,checked:present.length};
 }
 function combineItems(items){return new Map(items.map(x=>[x.id,x]));}
 return {validateBuild,combineItems};
});
