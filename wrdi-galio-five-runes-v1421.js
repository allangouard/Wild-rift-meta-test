/* WRDI V14.21 — enemy jungler/support threat profiles and five-rune reasoning.
 * Wild Rift mobile only. Official champion kit evidence describes abilities,
 * not champion matchup probabilities. Rune choice remains experimental.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioFiveRunesV1421=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.21.0-alpha.1';
const PROFILES=Object.freeze({
 vi:{name:'Vi',role:'Jungle adverse',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/vi/',traits:[
  {key:'dive',ability:'A/R',label:'Brise-coffre / Mise en demeure',detail:'Engagement et poursuite d’une cible ; résistance au gank à considérer.'},
  {key:'burst',ability:'R',label:'Mise en demeure',detail:'Engagement prioritaire sur une cible, effet réel conditionné par la situation.'}]},
 leesin:{name:'Lee Sin',role:'Jungle adverse',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/lee-sin/',traits:[
  {key:'dive',ability:'A/Z',label:'Onde sonore / Rempart',detail:'Mobilité et entrée sur une cible ; attention aux angles de gank.'},
  {key:'displacement',ability:'R',label:'Rage du dragon',detail:'Projection et déplacement potentiel de la cible.'}]},
 nautilus:{name:'Nautilus',role:'Support adverse',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/nautilus/',traits:[
  {key:'hard_cc',ability:'P/A/R',label:'Coup écrasant / Abordage / Grenade ASM',detail:'Menace de contrôles multiples et d’engagement.'},
  {key:'displacement',ability:'R',label:'Grenade ASM',detail:'Projection lors de l’ultime.'}]},
 lulu:{name:'Lulu',role:'Support adverse',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/lulu/',traits:[
  {key:'ally_shield',ability:'E',label:'Pix à la rescousse !',detail:'Bouclier accordé à un allié.'},
  {key:'peel',ability:'Z/R',label:'Fantaisie / Croissance prodigieuse',detail:'Capacité potentielle à protéger une cible menacée.'}]}
});
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function resolve({kitData,championNames}={}){
 if(!kitData?.ok||kitData?.all?.length!==10||!Array.isArray(championNames)||championNames.length!==10)return {ok:false,error:'Dix kits et dix noms requis.'};
 const matched=[];
 for(const i of [6,9]){
  const champion=kitData.all[i],p=PROFILES[normalize(championNames[i])];
  if(!champion?.available||!p||p.role!==champion.role)continue;
  matched.push({id:champion.id,name:p.name,role:p.role,source:p.source,
   evidence:'official_wild_rift_kit',traits:p.traits});
 }
 return {ok:true,profiles:matched,coverage:matched.length,source:'official_wild_rift_champion_pages',
  warnings:['Une fiche officielle confirme le kit, pas la fréquence des effets ni la supériorité d’une rune.']};
}
const RULES=Object.freeze({
 'Persévérance':{hard_cc:'Résistance aux contrôles ennemis à examiner',displacement:'Contrôles de déplacement à examiner'},
 'Plaque d\'os':{dive:'Fenêtre de dégâts d’engagement à examiner',burst:'Échanges brefs à examiner'},
 'Second souffle':{dive:'Survie en phase de lane et après les échanges',burst:'Régénération situationnelle à examiner'},
 'Courage du colosse':{dive:'Bouclier activable par les contrôles de Galio constatés en jeu',hard_cc:'Bouclier à anticiper lors de contre-engagement'},
 'Souverain des glaces':{dive:'Provocation Z et projection E validées sur champion',peel:'Contrôle des adversaires proches du carry'},
 'Rush phasique':{dive:'Combo E → passif → A validé pour le repositionnement',displacement:'Ne pas supposer un proc avec A seul'},
 'Électrocution':{peel:'La protection ennemie peut gêner l’exécution complète du combo',ally_shield:'Le bouclier ennemi peut réduire l’impact du burst'},
 'Gardien':{dive:'Protection d’allié conditionnelle ; R seul ne déclenche pas la rune'},
 'Revitalisation':{ally_shield:'Amplification du bouclier R non mesurée, sans affirmation de proc'},
 'Coup bas':{hard_cc:'La provocation et la projection créent des occasions de dégâts conditionnels'},
 'Transcendance':{dive:'La disponibilité des compétences peut être utile lors de ganks répétés'},
 'Fontaine de vie':{hard_cc:'Effet de soin à vérifier après contrôle Galio'},
 'Chasseur acharné':{dive:'Mobilité hors combat pertinente pour rotations défensives'},
 'Ruée offensive':{dive:'Activation après déplacement E à étudier'},
 'Surcroissance':{burst:'PV supplémentaires possibles sur la durée'},
 'Abattage':{ally_shield:'Condition sur PV de la cible à vérifier, sans effet antishield déduit'}
});
function analyze({kitData,championNames,pages,bridge,catalog}={}){
 const threat=resolve({kitData,championNames});
 if(!threat.ok)return threat;
 if(!Array.isArray(pages)||pages.length!==7||!bridge?.validate||!catalog)return {ok:false,error:'Sept pages de runes Wild Rift requises.'};
 const keyset=new Set(threat.profiles.flatMap(x=>x.traits.map(t=>t.key)));
 const entries=pages.map(p=>{
  if(!bridge.validate(p.page,catalog).valid)throw Error('Page de runes illégale : '+p.id);
  const names=[p.page.keystone,...p.page.primary,p.page.secondary];
  const runes=names.map(name=>{
   const base=p.runes?.find(x=>x.name===name);
   const matches=[...keyset].filter(key=>RULES[name]?.[key]).map(key=>({threat:key,interpretation:RULES[name][key],level:'tactical_hypothesis'}));
   const confirmed=(base?.playerObservations||[]);
   return {name,slot:name===p.page.keystone?'fondamentale':name===p.page.secondary?'secondaire':'principale',
    threatNotes:matches,validatedInGame:confirmed.map(x=>({testId:x.testId,condition:x.condition,triggered:x.triggered})),
    directBenefitVerified:false};
  });
  return {...p,fiveRuneAnalysis:runes,threatsIdentified:threat.profiles.length,
   matchedRuneNotes:runes.reduce((n,r)=>n+r.threatNotes.length,0),optimalCertified:false};
 });
 return {ok:true,version:VERSION,game:'Wild Rift mobile',profiles:threat.profiles,pages:entries,
  available:threat.profiles.length>0,status:threat.profiles.length?'rune_by_rune_context':'no_curated_profile',
  winRateCalibrated:false,canDeclareBestPage:false,
  warnings:[...threat.warnings,'Cinq runes expliquées individuellement ; aucun score de puissance créé.',
   'Les activations confirmées par le joueur sont conservées pour les conditions testées.',
   'Une absence de profil ne signifie pas absence de menace.']};
}
return Object.freeze({VERSION,PROFILES,RULES,resolve,analyze});
});
