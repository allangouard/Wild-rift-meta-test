/* WRDI V14.18 — contextual Galio rune-page comparison for Wild Rift mobile.
 * Evidence: draft kit lexical flags (unverified as combat power), player-confirmed
 * proc tests (valid only for tested conditions), legal rune pages from client.
 * This is a transparent compatibility ranking, NOT a win-rate or damage model.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioDraftRuneV1418=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.18.0-alpha.1';
const SIGNALS=Object.freeze({
 cc:['stun','knockup','root'],slow:['slow'],mobility:['dash'],
 sustain:['heal'],shield:['shield'],poke:['overtime'],
 allyEngage:['stun','knockup','root','dash'],allyProtect:['shield','heal']
});
function any(row,keys){return Array.isArray(row?.signals)&&row.signals.some(x=>keys.includes(x));}
function contexts(kitData){
 if(!kitData?.ok||kitData?.all?.length!==10||kitData.game==='League of Legends PC')
  return {ok:false,error:'Dix fiches Wild Rift nécessaires.'};
 const enemies=kitData.all.slice(5);
 const allies=kitData.all.slice(0,5).filter(x=>x.role!=='Galio mid');
 const available=enemies.filter(x=>x.available);
 const count=(rows,keys)=>rows.filter(x=>x.available&&any(x,keys)).length;
 return {ok:true,enemyCoverage:available.length,allyCoverage:allies.filter(x=>x.available).length,
  counts:{
   cc:count(enemies,SIGNALS.cc),slow:count(enemies,SIGNALS.slow),
   mobility:count(enemies,SIGNALS.mobility),sustain:count(enemies,SIGNALS.sustain),
   shield:count(enemies,SIGNALS.shield),poke:count(enemies,SIGNALS.poke),
   allyEngage:count(allies,SIGNALS.allyEngage),allyProtect:count(allies,SIGNALS.allyProtect),
   midMobility:enemies[2]?.available&&any(enemies[2],SIGNALS.mobility)?1:0
  },source:'lexical_wild_rift_kits_unverified',complete:available.length===5,
  notes:['Un mot-clé ne prouve ni fréquence ni dégâts réels.',
   'Les alliés sans fiche disponible ne sont pas assimilés à des champions sans utilité.']};
}
const RULES=Object.freeze({
 engage:[['cc',2],['allyEngage',1],['mobility',1]],
 resilience:[['cc',2],['slow',1],['poke',1]],
 roam:[['allyEngage',2],['mobility',1]],
 poke:[['midMobility',-2],['poke',1]],
 burst:[['midMobility',-2],['mobility',-1]],
 peel:[['cc',2],['mobility',1],['allyProtect',1]],
 longfight:[['sustain',1],['shield',1]]
});
const LABELS={cc:'contrôles ennemis',slow:'ralentissements ennemis',
 mobility:'mobilité ennemie',sustain:'soins ennemis',shield:'boucliers ennemis',
 poke:'effets périodiques ennemis',allyEngage:'possibilités d’engagement alliées',
 allyProtect:'soins/boucliers alliés',midMobility:'mobilité du mid adverse'};
function compare({kitData,pages,playerEvidence,bridge,catalog}={}){
 const ctx=contexts(kitData);
 if(!ctx.ok)return ctx;
 if(!Array.isArray(pages)||pages.length!==7||!bridge?.validate||!catalog)return {ok:false,error:'Sept pages et vérificateur Wild Rift requis.'};
 const confirmed=playerEvidence?.ok===true&&playerEvidence.game==='Wild Rift mobile'?
 playerEvidence.entries.filter(e=>e.valid&&(e.status==='validated_in_game_positive'||e.status==='validated_in_game_negative')):[];
 const unique=new Set();
 const ranked=pages.map((page,index)=>{
  if(!page?.id||unique.has(page.id))throw Error('Page absente ou identifiant en double');
  unique.add(page.id);
  const validity=bridge.validate(page.page,catalog);
  if(!validity.valid)throw Error('Page illégale : '+page.id);
  const positive=confirmed.filter(e=>e.triggered===true&&[page.page.keystone,...page.page.primary,page.page.secondary].includes(e.rune));
  const negative=confirmed.filter(e=>e.triggered===false&&[page.page.keystone,...page.page.primary,page.page.secondary].includes(e.rune));
  const contributions=[];
  let compatibility=0;
  for(const [trait,weight] of RULES[page.id]||[]){
   const n=ctx.counts[trait];
   if(!n)continue;
   const delta=weight*Math.min(n,2);
   compatibility+=delta;
   contributions.push({trait,label:LABELS[trait],count:n,impact:delta,
    note:'Indice lexical non validé en combat : '+n+' champion(s) concerné(s).'});
  }
  // Confirmed rune activation is evidence, not a statistical power multiplier.
  const validatedCombos=positive.map(e=>({testId:e.testId,condition:e.condition,result:'observed_yes'}));
  const validatedNonProcs=negative.map(e=>({testId:e.testId,condition:e.condition,result:'observed_no'}));
  const eligible=ctx.complete && ctx.allyCoverage===4 && contributions.length>0;
  return {...page,originalIndex:index,compatibility:eligible?compatibility:null,
   evidenceLevel:eligible?'exploratory_draft_alignment':'insufficient_kit_coverage',
   eligible,contributions,validatedCombos,validatedNonProcs,
   metaWinRate:null,estimatedDamage:null,optimalCertified:false,
   caution:'Compatibilité de scénario uniquement. Les activations testées ne prouvent pas un avantage de victoire.'};
 });
 const canCompare=ctx.complete&&ctx.allyCoverage===4&&ranked.some(x=>x.contributions.length);
 const sorted=canCompare?[...ranked].sort((a,b)=>(b.compatibility??-999)-(a.compatibility??-999)||a.originalIndex-b.originalIndex):ranked;
 return {ok:true,version:VERSION,game:'Wild Rift mobile',context:ctx,
  pages:sorted,comparisonAvailable:canCompare,
  status:canCompare?'exploratory_draft_order':'no_ranking_insufficient_data',
  bestPageCertified:false,winRateCalibrated:false,automaticBuildRecommendation:false,
  warnings:['Classement pédagogique par adéquation des signaux, pas classement méta.',
   'Les résultats des tests en jeu sont conservés comme validés pour les conditions constatées.',
   'Les effets des runes et leur force relative ne sont pas déduits des seuls mots-clés.',
   'Si des kits sont manquants, aucun classement contextuel n’est autorisé.']};
}
return Object.freeze({VERSION,contexts,compare,RULES});
});
