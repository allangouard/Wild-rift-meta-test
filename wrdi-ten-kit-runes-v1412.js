/* WRDI V14.12 — ten champion kit signals, strictly exploratory.
 * Reads mobile Wild Rift source already used by V12. Never imports LoL PC kits.
 * No inferred winrates or claims of patch-verified matchup optimization.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_TenKitRunesV1412=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.12.0-alpha.1';
const LABELS=['Top allié','Jungle allié','Galio mid','ADC allié','Support allié',
 'Top adverse','Jungle adverse','Mid adverse','ADC adverse','Support adverse'];
const CC=new Set(['stun','knockup','root']);
const CONSTRAINED=new Set(['stun','knockup','root','slow']);
const dedupe=xs=>[...new Set(xs)];
const signalIds=result=>dedupe((Array.isArray(result?.signals)?result.signals:[]).map(x=>String(x?.id||'')).filter(Boolean));
function inspect(picks,records){
 const errors=[];
 if(!Array.isArray(picks)||picks.length!==10||picks.some(x=>!String(x??'').trim()))
  errors.push('Dix champions sélectionnés obligatoires.');
 if(Array.isArray(picks)&&String(picks[2])!=='10099')
  errors.push('Galio doit occuper le mid.');
 if(Array.isArray(picks)&&new Set(picks.map(String)).size!==picks.length)
  errors.push('Champions dupliqués.');
 if(errors.length)return {ok:false,errors};
 const byId=new Map((Array.isArray(records)?records:[]).map(x=>[String(x?.id||''),x]));
 const all=picks.map((id,i)=>{
  const row=byId.get(String(id)),data=row?.result;
  const valid=!!data&&Array.isArray(data.signals)&&Number(data.descriptionCount)>=1&&!row.error;
  return {id:String(id),role:LABELS[i],side:i<5?'ally':'enemy',
   signals:valid?signalIds(data):[],available:valid,
   sourceVersion:valid?(data.sourceVersion||null):null,
   reason:valid?null:String(row?.error||'Fiche non lue ou sans description exploitable')};
 });
 const ally=all.slice(0,5),enemy=all.slice(5);
 const evidence=[];
 const record=(trait,side,ids,note)=>{
  const rows=(side==='ally'?ally:enemy).filter(x=>x.available&&x.signals.some(y=>ids.includes(y)));
  return {trait,side,count:rows.length,champions:rows.map(x=>({id:x.id,role:x.role})),
   note,verified:false};
 };
 evidence.push(record('ally_engage','ally',['stun','knockup','root','dash'],
  'Mentions de contrôle ou mobilité chez les alliés, sans preuve de possibilité de follow-up sur l’ultime Galio.'));
 evidence.push(record('ally_protection','ally',['shield','heal'],
  'Mentions de soins/boucliers alliés, sans information sur le besoin réel de protection.'));
 evidence.push(record('enemy_cc','enemy',[...CC],
  'Mentions de contrôles ennemis, sans fréquence ni durée certifiée.'));
 evidence.push(record('enemy_slow','enemy',['slow'],
  'Mentions de ralentissements ennemis, sans preuve de fréquence.'));
 evidence.push(record('enemy_heal','enemy',['heal'],
  'Mentions de soins ennemis, sans quantification.'));
 evidence.push(record('enemy_dash','enemy',['dash'],
  'Mentions de mobilité ennemie, sans fréquence ni esquive estimée.'));
 evidence.push(record('mid_mobility','enemy',['dash'],
  'Mobilité du mid adverse selon mots-clés lexicaux, pas un verdict de lane.'));
 evidence[evidence.length-1].champions=evidence[evidence.length-1].champions.filter(x=>x.role==='Mid adverse');
 evidence[evidence.length-1].count=evidence[evidence.length-1].champions.length;
 const galio=ally[2];
 const kitTraits={
  ccMentioned:galio.available&&galio.signals.some(x=>CC.has(x)),
  dashMentioned:galio.available&&galio.signals.includes('dash'),
  shieldMentioned:galio.available&&galio.signals.includes('shield'),
  allVerified:false
 };
 const coverage={available:all.filter(x=>x.available).length,total:10,allDescriptionsPresent:all.every(x=>x.available)};
 return {ok:true,status:coverage.available===10?'ten-unverified-kits':'partial-unverified-kits',
  source:'wrchina.gg Wild Rift mobile champion JSON, extracted by V12 lexical engine',
  all,ally,enemy,evidence,galio:kitTraits,coverage,
  notes:[
   'Lecture de tous les champions alliés et ennemis, sans association à League of Legends PC.',
   'Les signaux sont des mots-clés de fiches de compétences ; ils ne prouvent pas le résultat d’un matchup.',
   'La présence d’un contrôle dans une fiche ne prouve pas sa fréquence, ses conditions ni sa disponibilité.',
   'Les versions de fiches ne sont pas attestées comme équivalentes au dernier patch client.',
   ...(coverage.available<10?['Fiches manquantes : aucune conclusion complète sur la draft.']:[])
  ]};
}
function analyzeCandidates(kitData,{advisor,picks,catalog,bridge}={}){
 if(!kitData?.ok)return {ok:false,errors:kitData?.errors||['Kits indisponibles']};
 if(!advisor?.decide||!bridge?.validate)return {ok:false,errors:['Moteur V14.11 ou catalogue absent']};
 const summary={ok:true,game:'Wild Rift mobile',
  enemies:kitData.enemy.map(x=>({id:x.id,mentioned:x.signals})),
  enemyKitSignalsAvailable:false,enemyKitSignalsVerified:false,counts:null};
 const baseline=advisor.decide({championId:'10099',picks,summary,catalog,bridge,
  preferences:{goal:'unknown',lane:'unknown',ally:'unknown'}});
 if(!baseline.ok)return baseline;
 const byTrait=Object.fromEntries(kitData.evidence.map(x=>[x.trait,x]));
 const complete=kitData.coverage.allDescriptionsPresent&&kitData.galio.ccMentioned;
 const cues={
  engage:[['ally_engage',1],['enemy_cc',1]],
  resilience:[['enemy_cc',1],['enemy_slow',1]],
  roam:[['ally_engage',1],['enemy_dash',1]],
  poke:[['mid_mobility',-1]],
  burst:[['mid_mobility',-1]],
  peel:[['enemy_cc',1]],
  longfight:[['enemy_heal',1]]
 };
 const options=baseline.options.map(c=>{
  const findings=[],uncertainty=[...c.limits];
  let heuristic=0;
  for(const [trait,weight] of cues[c.id]||[]){
   const evidence=byTrait[trait];
   if(!evidence||!evidence.count)continue;
   heuristic+=weight;
   findings.push(evidence.count+' mention(s) ['+trait+'] dans les fiches : '+evidence.champions.map(x=>x.role+' ('+x.id+')').join(', '));
  }
  if(c.id==='engage'&&!kitData.galio.ccMentioned)uncertainty.push('La fiche Galio ne permet pas de confirmer lexicalement le contrôle : vérifier le déclenchement en jeu.');
  return {...c,findings,heuristic,limits:uncertainty,estimatedWinRate:null,validatedMatchup:false};
 });
 // Keep the order fixed if one kit is missing or Galio control is not confirmed.
 // If lexical coverage is complete, exploratory sorting is permitted but is NOT
 // an automatic optimal recommendation, because source patch is unverified.
 const sorted=complete?[...options].sort((a,b)=>b.heuristic-a.heuristic||options.indexOf(a)-options.indexOf(b)):options;
 return {ok:true,status:complete?'lexical-comparison-only':'insufficient-kit-evidence',
  automaticRecommendation:false,fullyVerified:false,coverage:kitData.coverage,
  galio:kitData.galio,evidence:kitData.evidence,
  options:sorted,rankedProvisionally:complete,
  warnings:[...kitData.notes,
   complete?'Ordre purement heuristique sur mots-clés : pas une recommandation optimisée.':'Ordre non classé : fiches ou contrôle de Galio non confirmés.',
   'Aucun score de victoire ou de puissance relative n’est calculé.'
  ]};
}
return Object.freeze({VERSION,inspect,analyzeCandidates,LABELS});
});