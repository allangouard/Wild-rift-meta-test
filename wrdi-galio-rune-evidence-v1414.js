/* WRDI V14.14 — explainable rune page interaction audit.
 * Combines V14.12 ten-kit lexical evidence and V14.13 Galio kit matrix.
 * This module does NOT pretend to verify actual in-game rune procs.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioRuneEvidenceV1414=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.14.0-alpha.1';
const STATUS=new Set(['conditional_trigger','indirect_synergy','interaction_unverified']);
const abilities=new Set(['P','A','Z','E','R']);
function compare({kitData,comparison,matrix,catalog,bridge}={}){
 const errors=[];
 if(!kitData?.ok || kitData?.all?.length!==10 || !kitData.coverage)errors.push('Analyse des dix kits absente.');
 if(!comparison?.ok || !Array.isArray(comparison.options)||comparison.options.length!==7)errors.push('Sept pages V14.12 requises.');
 if(!matrix?.rules || !Array.isArray(matrix.rules))errors.push('Matrice Galio ↔ runes absente.');
 if(!bridge?.audit?.(catalog)?.ok)errors.push('Catalogue des 52 runes non valide.');
 if(errors.length)return {ok:false,errors};
 const map=new Map();
 for(const r of matrix.rules){
  if(!STATUS.has(r.status)||!abilities.has(r.ability)||!r.rune)errors.push('Entrée matrice invalide.');
  if(!map.has(r.rune))map.set(r.rune,[]);
  map.get(r.rune).push(r);
 }
 if(errors.length)return {ok:false,errors};
 const pages=comparison.options.map(c=>{
  const validation=bridge.validate(c.page,catalog);
  if(!validation.valid)throw Error('Page invalide : '+c.id+' '+validation.errors.join(' ; '));
  const names=[c.page.keystone,...c.page.primary,c.page.secondary];
  const runes=names.map(name=>{
   const matches=map.get(name)||[];
   const conditional=matches.filter(x=>x.status==='conditional_trigger');
   const indirect=matches.filter(x=>x.status==='indirect_synergy');
   const unverified=matches.filter(x=>x.status==='interaction_unverified');
   return {name,kind:name===c.page.keystone?'fondamentale':'secondaire',
    evidenceStatus:conditional.length?'conditional_trigger':indirect.length?'indirect_synergy':unverified.length?'interaction_unverified':'not_yet_studied',
    interactions:matches.map(x=>({ability:x.ability,status:x.status,condition:x.condition,reason:x.reason})),
    inGameProcVerified:false};
  });
  const matched=runes.filter(r=>r.evidenceStatus!=='not_yet_studied');
  const awaiting=runes.filter(r=>r.evidenceStatus==='not_yet_studied');
  return {...c,runes,conditionalOrIndirectCount:matched.length,
    notYetStudiedCount:awaiting.length,
    canClaimOptimal:false,kitEvidence: Array.isArray(c.findings)?c.findings:[],
    caveats:[
     'Les effets répertoriés sont conditionnels ou restent à vérifier en jeu.',
     ...(awaiting.length?['Interactions non encore étudiées pour : '+awaiting.map(x=>x.name).join(', ')]:[]),
     ...(kitData.coverage.available<10?['Certains kits des dix champions sont indisponibles.']:[])
    ]};
 });
 const testedCombat=pages.some(p=>p.runes.some(r=>r.inGameProcVerified));
 if(testedCombat)errors.push('Données de combat non certifiées présentes.');
 if(errors.length)return {ok:false,errors};
 const patchVerified=false;
 return {ok:true,status:'evidence-audit-only',game:'Wild Rift mobile',
  coverage:kitData.coverage,
  pages,automaticRecommendation:false,
  canDeclareBestPage:false,
  calibratedWinRate:false,patchVerified,liveRuneTriggersVerified:false,
  interpretation:'Comparaison de preuves et de conditions : aucun score de force et aucune page gagnante.',
  warnings:[
   'Une rune sans correspondance dans la matrice n’est pas inefficace : elle n’a simplement pas été étudiée.',
   'Les effets sur les alliés et adversaires sont des mentions lexicales non certifiées ; leur fréquence n’est pas connue.',
   'La source officielle Wild Rift documente le passif Galio ; les autres descriptions de kit nécessitent une validation sur le patch actuel.',
   'Aucune garantie d’activation de rune sur une attaque, une provocation, une projection ou un bouclier sans test en jeu.'
  ]};
}
return Object.freeze({VERSION,compare});
});
