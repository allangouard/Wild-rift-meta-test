/* WRDI V14.20 — curated, source-backed Galio mid opponent profiles.
 * Official Wild Rift champion descriptions establish ability existence only.
 * No claim that a champion matchup, damage, matchup winrate, or rune selection
 * is independently certified by the official champion page.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioCuratedMatchupsV1420=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.20.0-alpha.1';
const profiles=Object.freeze({
 syndra:{name:'Syndra',lane:'mid',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/syndra/',patchNotes:['https://wildrift.leagueoflegends.com/fr-fr/news/game-updates/wild-rift-patch-notes-7-3a/'],traits:[
 {id:'ranged_control',ability:'E',name:'Dispersion des faibles',fact:'Compétence de contrôle et de repoussement de sphères décrite dans les notes Wild Rift 7.2 et sur la fiche officielle.',evidence:'official_wild_rift',context:'Attention à son contrôle lors des engagements de Galio'},
 {id:'magic_burst',ability:'R',name:'Déchaînement de puissance',fact:'Ultime infligeant des dégâts magiques avec plusieurs sphères.',evidence:'official_wild_rift',context:'Menace de dégâts concentrés, conditionnée par les sphères disponibles'}]},
 yasuo:{name:'Yasuo',lane:'mid',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/yasuo/',patchNotes:['https://wildrift.leagueoflegends.com/fr-fr/news/game-updates/wild-rift-patch-notes-7-3/'],traits:[
 {id:'mobility',ability:'E',name:'Cercle tranchant',fact:'Déplacement sur les unités via sa troisième compétence.',evidence:'official_wild_rift',context:'Positionnement de la vague et déplacements de la cible importants'},
 {id:'knockup_followup',ability:'R',name:'Dernier soupir',fact:'Ultime sur cible ennemie projetée, documenté sur la fiche officielle.',evidence:'official_wild_rift',context:'Éviter les engagements adverses qui permettent sa poursuite'}]},
 ahri:{name:'Ahri',lane:'mid',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/ahri/',patchNotes:[],traits:[
 {id:'charm_interrupt',ability:'E',name:'Charme',fact:'Charme le premier ennemi touché et interrompt les compétences de déplacement.',evidence:'official_wild_rift',context:'Le E de Galio peut être interrompu si le charme touche'},
 {id:'mobility',ability:'R',name:'Assaut spirituel',fact:'Ultime de mobilité documenté sur la fiche officielle.',evidence:'official_wild_rift',context:'Les engagements courts sont plus difficiles si Ahri conserve ses déplacements'}]},
 zed:{name:'Zed',lane:'mid',source:'https://wildrift.leagueoflegends.com/fr-fr/champions/zed/',patchNotes:[],traits:[
 {id:'shadow_swap',ability:'Z',name:'Ombre vivante',fact:'Zed peut changer de position avec son ombre lors de la réactivation.',evidence:'official_wild_rift',context:'Risque de repositionnement pendant les contrôles de Galio'},
 {id:'assassin_burst',ability:'R',name:'Marque de la mort',fact:'Ultime assassin documenté dans le kit officiel.',evidence:'official_wild_rift',context:'Menace d’engagement explosif à anticiper'}]}
});
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
function lookup(name){
 const p=profiles[normalize(name)];
 return p?{...p,key:normalize(name),status:'abilities_documented_matchup_unvalidated'}:null;
}
const PAGE_EFFECTS=Object.freeze({
 engage:{ranged_control:1,magic_burst:1,knockup_followup:1,charm_interrupt:1},
 resilience:{ranged_control:1,magic_burst:2,assassin_burst:2,charm_interrupt:1},
 roam:{mobility:1,shadow_swap:1,charm_interrupt:1},
 poke:{ranged_control:1,assassin_burst:1},
 burst:{mobility:-1,shadow_swap:-1,charm_interrupt:-1},
 peel:{assassin_burst:2,knockup_followup:1,charm_interrupt:1},
 longfight:{assassin_burst:-1,mobility:-1}
});
function refine({tenKits,baseline,championNames}={}){
 if(!tenKits?.ok||tenKits.all?.length!==10||baseline?.ok!==true||!Array.isArray(baseline.pages))
  return {ok:false,error:'Dix kits et pages Galio Wild Rift requis.'};
 if(!Array.isArray(championNames)||championNames.length!==10)
  return {ok:false,error:'Noms des dix champions nécessaires pour réconcilier les profils.'};
 const enemy=tenKits.all.slice(5);
 const named=enemy.map((row,i)=>({role:row.role,id:row.id,name:championNames[i+5],profile:lookup(championNames[i+5])}));
 const mid=named[2];
 // Only explicit role-matched MID profiles; ignore champion outside of its curated lane.
 const active=mid?.profile?.lane==='mid'?mid.profile:null;
 const pages=baseline.pages.map((p,index)=>{
  const matches=active?active.traits.map(t=>({trait:t.id,ability:t.ability,source:active.source,
    context:t.context,impact:PAGE_EFFECTS[p.id]?.[t.id]||0})).filter(x=>x.impact!==0):[];
  const delta=matches.reduce((sum,x)=>sum+x.impact,0);
  return {...p,curatedOpponent:active?.name||null,curatedFindings:matches,
   curatedDelta:active?delta:null,originalIndex:index,
   outcomeStatus:active?'documented_abilities_unverified_rune_advantage':'no_curated_profile',
   winRate:null,optimalCertified:false};
 });
 const canOrder=!!active&&baseline.comparisonAvailable===true;
 // Do not replace broader ability-threat ranking with poorly calibrated tiny modifier;
 // expose separate re-rank as an explicitly exploratory view.
 const sorted=canOrder?[...pages].sort((a,b)=>b.curatedDelta-a.curatedDelta||a.originalIndex-b.originalIndex):pages;
 return {ok:true,version:VERSION,game:'Wild Rift mobile',enemy:named,
  midOpponent:active?.name||null,profile:active,profilesCount:Object.keys(profiles).length,
  pages:sorted,comparisonAvailable:canOrder,
  status:active?'curated_ability_context_available':'no_curated_mid_profile',
  bestPageCertified:false,metaPatchCertified:false,
  warnings:['Descriptions des compétences vérifiées dans des sources officielles Wild Rift ; leurs timings, interactions spécifiques Galio et coefficients actuels ne le sont pas.',
   'Les incidences sur les pages de runes sont des hypothèses tactiques, pas une validation en partie.',
   'Le classement ne compare ni les taux de victoire ni la puissance réelle.']};
}
return Object.freeze({VERSION,profiles,lookup,refine});
});
