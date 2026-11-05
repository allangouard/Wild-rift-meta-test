/* Wild Rift Draft Intelligence V14.7 — rune catalogue / page validation.
 * Pure module for browser and Node. NO claim about official rune IDs,
 * combat interactions, champion-specific optimality or expected win rates.
 */
(function(root, factory) {
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.WRDI_RuneBridgeV14=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.7.0-alpha.1';
const TREE_NAMES=['Domination','Précision','Volonté','Sorcellerie'];

function audit(catalog){
 const errors=[];
 if(!catalog || catalog.game!=='Wild Rift mobile') return {ok:false,errors:['Catalogue Wild Rift absent']};
 if(!Array.isArray(catalog.fundamental)||catalog.fundamental.length!==13)errors.push('Le catalogue doit contenir 13 fondamentales');
 if(!Array.isArray(catalog.minor)||catalog.minor.length!==39)errors.push('Le catalogue doit contenir 39 secondaires');
 if(errors.length)return {ok:false,errors};
 const all=[...catalog.fundamental,...catalog.minor];
 if(new Set(all.map(x=>x.id)).size!==52)errors.push('Identifiants internes dupliqués');
 if(new Set(all.map(x=>x.name_fr)).size!==52)errors.push('Noms français dupliqués');
 for(const r of catalog.minor){
  if(!TREE_NAMES.includes(r.tree))errors.push('Branche inconnue : '+r.name_fr);
  if(![1,2,3].includes(r.row))errors.push('Ligne inconnue : '+r.name_fr);
 }
 if(!catalog.status?.minor_slot_positions_verified)errors.push('Lignes non vérifiées');
 return {ok:errors.length===0,errors,total:all.length,minor:catalog.minor.length,fundamental:catalog.fundamental.length};
}
function options(catalog,primaryTree,primaryRow){
 const x=audit(catalog);
 if(!x.ok)throw Error(x.errors.join('; '));
 if(!TREE_NAMES.includes(primaryTree))throw Error('Branche inconnue');
 if(![1,2,3].includes(primaryRow))throw Error('Ligne inconnue');
 return catalog.minor.filter(r=>r.tree===primaryTree&&r.row===primaryRow);
}
function validate(page,catalog){
 const check=audit(catalog);
 const errors=[...check.errors];
 if(!check.ok)return {valid:false,errors,verified:false};
 if(!page || typeof page!=='object')return {valid:false,errors:['Page de runes absente'],verified:false};
 const byName=new Map(catalog.minor.map(x=>[x.name_fr,x]));
 const fundamental=new Set(catalog.fundamental.map(x=>x.name_fr));
 if(!fundamental.has(page.keystone))errors.push('Fondamentale absente du catalogue');
 if(!TREE_NAMES.includes(page.primaryTree))errors.push('Branche principale invalide');
 if(!Array.isArray(page.primary)||page.primary.length!==3)errors.push('Trois runes principales requises');
 if(typeof page.secondary!=='string'||!page.secondary)errors.push('Rune secondaire requise');
 const primary=Array.isArray(page.primary)?page.primary.map(name=>byName.get(name)): [];
 if(primary.length===3){
   primary.forEach((r,i)=>{
    if(!r)errors.push('Rune principale inconnue (ligne '+(i+1)+')');
    else if(r.tree!==page.primaryTree || r.row!==i+1)errors.push('Rune '+r.name_fr+' : ligne/branche principale incorrecte');
   });
 }
 const secondary=byName.get(page.secondary);
 if(!secondary)errors.push('Rune secondaire inconnue');
 else if(secondary.tree===page.primaryTree)errors.push('Rune secondaire de la même branche principale : interdit');
 if(new Set([...(page.primary||[]),page.secondary].filter(Boolean)).size!==[...(page.primary||[]),page.secondary].filter(Boolean).length)errors.push('Doublon de rune');
 return {valid:errors.length===0,errors,verified:errors.length===0,primary_tree:page.primaryTree,secondary_tree:secondary?.tree??null,
    source:'client tooltips + row screenshots',recommendation:false};
}
return Object.freeze({VERSION,TREE_NAMES,audit,options,validate});
});
