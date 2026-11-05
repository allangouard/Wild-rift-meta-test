/* WRDI V14.19 — role and ability-aware Wild Rift threat profiles.
 * Uses descriptive signals from individual champion abilities, not champion-name
 * guesses and never PC champion data. Profiles are hypotheses, not certified
 * matchups or measurements of threat frequency, cooldown, hit rate or damage.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioAbilityThreatV1419=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.19.0-alpha.1';
const HARD=new Set(['stun','knockup','root']);
const labels={dive:'Engagement avec mobilité et contrôle',midPoke:'Harcèlement prolongé en mid',
 midCatch:'Contrôle du mid adverse',carryEscape:'Mobilité du carry adverse',
 supportPeel:'Protection et contrôle du support',
 sustain:'Soin et combat prolongé',areaControl:'Contrôle de zone en combat'};
const weights={
 engage:{dive:3,midCatch:1,areaControl:1},
 resilience:{dive:3,midPoke:3,midCatch:1,areaControl:1},
 roam:{dive:1,carryEscape:2,midCatch:1},
 poke:{midPoke:1,carryEscape:-2,midCatch:-1},
 burst:{midCatch:1,carryEscape:-3,supportPeel:-2},
 peel:{dive:3,supportPeel:1,areaControl:1},
 longfight:{sustain:3,supportPeel:1,areaControl:1}
};
function profile(row){
 if(!row?.available)return {id:String(row?.id||''),role:row?.role||'Inconnu',available:false,findings:[],reason:'Fiche indisponible'};
 const flags=new Set(row.signals||[]);
 const hasCC=[...HARD].some(x=>flags.has(x));
 const slots=id=>[...new Set((row.abilitySignals||[]).filter(x=>x.id===id).flatMap(x=>x.slots||[]))];
 const ccSlots=[...new Set([...HARD].flatMap(x=>slots(x)))];
 const findings=[];
 const add=(key,why,abilities)=>findings.push({key,label:labels[key],reason:why,abilities:[...new Set(abilities)],source:'wild_rift_ability_lexical_hypothesis'});
 if(row.role==='Jungle adverse'&&flags.has('dash')&&hasCC)
   add('dive','Le jungler possède des mentions de mobilité et de contrôle : surveiller les trajectoires de gank.',[...slots('dash'),...ccSlots]);
 if(row.role==='Mid adverse'&&hasCC)
   add('midCatch','Le mid possède une compétence de contrôle : surveiller sa disponibilité en lane.',ccSlots);
 if(row.role==='Mid adverse'&&flags.has('overtime'))
   add('midPoke','Les compétences du mid mentionnent des effets répétés ; la fréquence du poke reste inconnue.',slots('overtime'));
 if(row.role==='ADC adverse'&&flags.has('dash'))
   add('carryEscape','Le tireur dispose d’une mobilité : Galio peut devoir conserver un contrôle pour contrer sa fuite.',slots('dash'));
 if(row.role==='Support adverse'&&hasCC&&(flags.has('shield')||flags.has('heal')))
   add('supportPeel','Le support combine contrôle et soin/bouclier dans son kit ; disponibilité non établie.',[...ccSlots,...slots('shield'),...slots('heal')]);
 if(flags.has('heal')&&(row.side==='enemy'||String(row.role).includes('adverse')))
   add('sustain','Soin mentionné dans le kit ennemi ; efficacité réelle inconnue.',slots('heal'));
 if((row.role==='Top adverse'||row.role==='Support adverse')&&hasCC&&flags.has('slow'))
   add('areaControl','Le kit combine contrôle et ralentissement ; zone d’effet et fréquence inconnues.',[...ccSlots,...slots('slow')]);
 return {id:String(row.id),role:row.role,available:true,findings,sourceVersion:row.sourceVersion||null};
}
function refine({kitData,baseline}={}){
 if(!kitData?.ok||!Array.isArray(kitData.all)||kitData.all.length!==10 ||baseline?.ok!==true||!Array.isArray(baseline.pages))
  return {ok:false,error:'Analyse Wild Rift des dix kits et comparaison V14.18 requises.'};
 const enemies=kitData.all.slice(5).map(profile);
 const complete=enemies.every(x=>x.available)&&kitData.all.slice(0,5).every(x=>x.available);
 const findings=enemies.flatMap(x=>x.findings.map(f=>({...f,championId:x.id,role:x.role})));
 const pages=baseline.pages.map((p,index)=>{
  const impacts=findings.flatMap(f=>{
   const weight=weights[p.id]?.[f.key]||0;
   return weight?[{key:f.key,championId:f.championId,role:f.role,abilities:f.abilities,
    reason:f.reason,impact:weight,kind:'role_and_ability_hypothesis'}]:[];
  });
  // Conservative: count a given pattern only once per champion; no numerical DPS.
  const roleScore=impacts.reduce((s,x)=>s+x.impact,0);
  return {...p,originalV1418Index:index,abilityThreats:impacts,
   roleCompatibility:complete?roleScore:null,
   roleEvidence:'hypothesis_not_validated_in_client',
   optimalCertified:false,estimatedWinRate:null};
 });
 const canOrder=complete && findings.length>0 && baseline.comparisonAvailable===true;
 const sorted=canOrder?[...pages].sort((a,b)=>b.roleCompatibility-a.roleCompatibility||a.originalV1418Index-b.originalV1418Index):pages;
 return {ok:true,version:VERSION,game:'Wild Rift mobile',profiles:enemies,
  findings,pages:sorted,comparisonAvailable:canOrder,
  status:canOrder?'role_ability_exploration':'unranked_insufficient_evidence',
  canDeclareBestPage:false,winRateCalibrated:false,
  warnings:['Chaque profil décrit des possibilités issues des compétences, pas leur fréquence en partie.',
   'Les slots des compétences sont conservés mais les descriptions de sorts ne sont pas certifiées sur le patch actif.',
   'Une priorité haute dans ce classement n’est pas un taux de victoire ni une page optimale.',
   'Les résultats de tests Galio du joueur restent valides dans leurs conditions indépendamment de ces hypothèses.']};
}
return Object.freeze({VERSION,profile,refine,weights});
});
