/* WRDI V14.8 — Galio rune scenario explorer (no optimized recommendation).
 * Derives only contextual signals from V14.4 descriptive threat summary.
 * Candidate pages are hand-reviewed hypotheses built from user client rune tooltips;
 * no win rate, quantified matchup advantage, or automatic meta claim.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioRuneScenariosV14=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.8.0-alpha.1';
const GALIO_ID='10099';
const TEMPLATES=Object.freeze([
 {id:'anti-control',label:'Contrôle / engagement',
   page:{keystone:'Souverain des glaces',primaryTree:'Volonté',
     primary:['Courage du colosse','Second souffle','Persévérance'],secondary:'Transcendance'},
   interactions:[
    'Souverain des glaces : déclenchement par immobilisation ennemie.',
    'Courage du colosse : bouclier lors de vos immobilisations.',
    'Persévérance : ténacité et résistances conditionnelles après immobilisation.'
   ],
   limits:['Souverain des glaces exige une immobilisation ennemie.','Persévérance ne réduit pas tous les types de contrôles.']},
 {id:'lane-poke',label:'Lane / harcèlement',
   page:{keystone:'Comète arcanique',primaryTree:'Sorcellerie',
     primary:['Ruban de mana','Transcendance','Brûlure'],secondary:'Second souffle'},
   interactions:[
    'Comète arcanique et Brûlure : dégâts supplémentaires liés aux compétences.',
    'Ruban de mana : mana maximum supplémentaire sous condition de touche.',
    'Second souffle : régénération après dégâts d’un champion ennemi.'
   ],
   limits:['La comète peut être évitée et sa fréquence réelle n’est pas calibrée.','Cette page ne prouve pas un avantage face à un matchup précis.']},
 {id:'roam-burst',label:'Roam / échanges courts',
   page:{keystone:'Électrocution',primaryTree:'Domination',
     primary:['Coup bas','Assaut enchaîné','Chasseur acharné'],secondary:'Transcendance'},
   interactions:[
    'Électrocution : trois touches sur un même champion dans une fenêtre de trois secondes.',
    'Coup bas : dégâts bruts supplémentaires sur les ennemis entravés.',
    'Chasseur acharné : vitesse de déplacement hors combat après cumuls.'
   ],
   limits:['L’activation des runes dépend des combos et du tempo réel de la partie.','Chasseur acharné ne donne pas son bonus hors combat lors d’un échange actif.']}
]);
function evaluate({championId,summary,catalog,bridge}={}){
 const blockers=[];
 if(String(championId)!==GALIO_ID)blockers.push('Ce premier moteur expérimental est limité à Galio mid.');
 if(!bridge||typeof bridge.audit!=='function'||typeof bridge.validate!=='function')blockers.push('Validateur de runes V14.7 manquant.');
 if(!summary?.ok || !Array.isArray(summary?.enemies) || summary.enemies.length!==5)
   blockers.push('Synthèse des cinq adversaires absente ou incomplète.');
 if(bridge?.audit && !bridge.audit(catalog).ok)blockers.push('Catalogue client des 52 runes invalide.');
 if(blockers.length)return {ok:false,status:'blocked',blockers};
 const enemyIds=summary.enemies.map(e=>String(e.id));
 if(new Set(enemyIds).size!==5)blockers.push('Adversaires dupliqués dans la synthèse.');
 if(summary.game!=='Wild Rift mobile')blockers.push('Données provenant d’un autre jeu.');
 if(blockers.length)return {ok:false,status:'blocked',blockers};
 const counts=summary.counts||{};
 const cues=[
  {id:'anti-control',evidence:(counts.cc||0)+' adversaire(s) avec mention explicite de contrôle dans les kits',
   supported:Number(counts.cc||0)>=2},
  {id:'lane-poke',evidence:(counts.overtime||0)+' adversaire(s) avec mention d’effet périodique ; le harcèlement de lane n’est pas établi par cette donnée',
   supported:false},
  {id:'roam-burst',evidence:'Mobilité et potentiel d’engagement de Galio : hypothèse de gameplay, non dérivée des kits adverses',
   supported:false}
 ];
 const cueById=Object.fromEntries(cues.map(x=>[x.id,x]));
 const candidates=TEMPLATES.map(t=>{
  const validation=bridge.validate(t.page,catalog);
  if(!validation.valid)throw Error('Page candidate invalide : '+t.id+' : '+validation.errors.join('; '));
  const cue=cueById[t.id];
  return {id:t.id,label:t.label,page:t.page,legal:true,
    status:cue.supported?'signal_contextuel_a_examiner':'alternative_non_classee',
    evidence:cue.evidence,interactions:[...t.interactions],limits:[...t.limits]};
 });
 const warnings=[
  'Exploration de trois pages légales, pas une sélection des meilleures runes ni un classement méta.',
  'Mentions de kits ≠ fréquence des contrôles, dominante de dégâts, portée ou risque de gank.',
  'Les quatre alliés et la phase de lane ne sont pas analysés dans ce prototype.',
  'Identifiants officiels, interactions réelles et efficacité chiffrée encore non réconciliés.',
  ...(Array.isArray(summary.notices)?summary.notices:[])
 ];
 return {ok:true,status:'scenario-comparison-only',game:'Wild Rift mobile',
  championId:GALIO_ID,patch:summary.patch||null,enemyIds,
  automaticRecommendationAllowed:false,rankedByWinRate:false,
  candidates,warnings:[...new Set(warnings)]};
}
return Object.freeze({VERSION,TEMPLATES,evaluate});
});
