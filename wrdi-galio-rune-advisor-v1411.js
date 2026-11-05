/* Wild Rift Draft Intelligence V14.11 — Galio rune decision research.
 * This is a transparent tactical hypothesis engine, NOT win-rate optimization.
 * Named enemy kit signals may be unverified; ally and lane preferences are
 * explicitly supplied by the user rather than invented from champion IDs.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioRuneAdvisorV1411=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.11.0-alpha.1';
const OPTIONS=Object.freeze({
 goal:['unknown','engage','roam','poke','burst','peel','longfight'],
 lane:['unknown','poke','allin','neutral'],
 ally:['unknown','followup','needs_peel']
});
const STRATEGIES=[
 {id:'engage',label:'Engagement et résistance',goal:'engage',
  keystone:'Souverain des glaces',tree:'Volonté',
  primary:['Courage du colosse','Second souffle','Persévérance'],secondary:'Transcendance',
  pros:['Immobiliser un champion peut déclencher Souverain des glaces et Courage du colosse.','Persévérance répond aux immobilisations subies.'],
  cautions:['Ne confirme pas la fréquence effective des contrôles ennemis ni le résultat des échanges.']},
 {id:'resilience',label:'Tenue de lane et survie',goal:'engage',
  keystone:"Poigne de l'immortel",tree:'Volonté',
  primary:['Démolition','Second souffle','Surcroissance'],secondary:'Transcendance',
  pros:['Second souffle aide à récupérer après avoir subi des dégâts d’un champion.','Surcroissance donne des PV supplémentaires avec les éliminations de sbires/monstres à proximité.'],
  cautions:['Poigne de l’immortel nécessite des échanges adaptés pour s’activer ; rendement non simulé.']},
 {id:'roam',label:'Déplacements et engagements courts',goal:'roam',
  keystone:'Rush phasique',tree:'Domination',
  primary:['Ruée offensive','Assaut enchaîné','Chasseur acharné'],secondary:'Transcendance',
  pros:['Ruée offensive est conditionnée par une ruée ou téléportation préalable.','Chasseur acharné favorise la vitesse hors combat après cumuls.'],
  cautions:['Une ruée ne garantit pas de toucher l’ennemi ; pas de simulation de rotations.']},
 {id:'poke',label:'Lane à distance et poke',goal:'poke',
  keystone:'Comète arcanique',tree:'Sorcellerie',
  primary:['Ruban de mana','Transcendance','Brûlure'],secondary:'Second souffle',
  pros:['Comète arcanique et Brûlure ajoutent des dégâts sous condition de touches de compétences.','Ruban de mana augmente le mana maximal en touchant.'],
  cautions:['Aucun calcul de précision, DPS ou pression de vague.']},
 {id:'burst',label:'Échanges courts et dégâts',goal:'burst',
  keystone:'Électrocution',tree:'Domination',
  primary:['Coup bas','Assaut enchaîné','Chasseur acharné'],secondary:'Transcendance',
  pros:['Électrocution exige trois touches sur le même champion en trois secondes.','Coup bas exige une restriction des déplacements.'],
  cautions:['La fenêtre d’Électrocution n’est pas garantie contre un champion mobile.']},
 {id:'peel',label:'Protection des alliés',goal:'peel',
  keystone:'Gardien',tree:'Volonté',
  primary:['Fontaine de vie','Second souffle','Revitalisation'],secondary:'Transcendance',
  pros:['Gardien et Revitalisation sont orientés protection.','Fontaine de vie nécessite un allié proche pouvant recevoir les soins.'],
  cautions:['Gardien et Fontaine de vie nécessitent le bon positionnement autour des alliés.']},
 {id:'longfight',label:'Combat prolongé',goal:'longfight',
  keystone:'Conquérant',tree:'Précision',
  primary:['Zèle de combat','Abattage','Légende : Accélération'],secondary:'Courage du colosse',
  pros:['Conquérant nécessite de cumuler des effets en combat.','Abattage est conditionné par les PV élevés de la cible.'],
  cautions:['La durée réelle des combats et les PV ennemis ne sont pas établis à partir des noms.']}
];
function matchPreferences(preferences={}){
 const out={};
 for(const [key,allowed] of Object.entries(OPTIONS)){
  const value=preferences[key];
  out[key]=allowed.includes(value)?value:'unknown';
 }
 return out;
}
function decide({championId,picks,summary,catalog,bridge,preferences}={}){
 const errors=[];
 if(String(championId)!=='10099')errors.push('Analyse V14.11 limitée à Galio mid.');
 if(!Array.isArray(picks)||picks.length!==10||String(picks[2])!=='10099'||picks.slice(5).some(x=>!String(x??'').trim()))
  errors.push('Galio mid et cinq adversaires requis.');
 const ids=Array.isArray(picks)?picks.filter(Boolean).map(String):[];
 if(ids.length!==new Set(ids).size)errors.push('Draft avec champion dupliqué.');
 if(!bridge?.audit?.(catalog)?.ok)errors.push('Catalogue des runes non conforme.');
 if(!summary?.ok||summary.game!=='Wild Rift mobile'||!Array.isArray(summary.enemies)||summary.enemies.length!==5)
  errors.push('Synthèse de draft Wild Rift absente.');
 else if(Array.isArray(picks)&&summary.enemies.some((e,i)=>String(e.id)!==String(picks[i+5])))
  errors.push('Synthèse adversaire différente de la draft.');
 if(errors.length)return {ok:false,status:'blocked',errors};
 const p=matchPreferences(preferences);
 const signalData=summary.enemyKitSignalsAvailable===true && summary.enemyKitSignalsVerified===true;
 // The V12 lexical kit extractor is explicitly unverified. Never treat it as
 // a confirmed matchup advantage or calibrated numerical recommendation.
 const candidateRows=STRATEGIES.map(template=>{
  const page={keystone:template.keystone,primaryTree:template.tree,primary:[...template.primary],secondary:template.secondary};
  const reasons=[],cautions=[...template.cautions];
  let relevance=0;
  if(p.goal!=='unknown'&&p.goal===template.goal){relevance+=3;reasons.push('Priorité tactique choisie : '+p.goal);}
  if(p.lane==='poke'&&['poke','resilience'].includes(template.id)){relevance+=2;reasons.push('Harcèlement en lane signalé manuellement.');}
  if(p.lane==='allin'&&['burst','engage'].includes(template.id)){relevance+=2;reasons.push('Menace de all-in en lane signalée manuellement.');}
  if(p.ally==='followup'&&['engage','roam'].includes(template.id)){relevance+=1;reasons.push('Alliés capables de suivre un engagement (indication manuelle).');}
  if(p.ally==='needs_peel'&&template.id==='peel'){relevance+=2;reasons.push('Besoin de protéger les alliés (indication manuelle).');}
  if(summary.enemyKitSignalsAvailable && template.id==='engage'){
   const n=Number(summary.counts?.cc||0);
   if(n>=2){
    reasons.push(n+' mentions lexicales de contrôles dans les fiches ennemies : signal non confirmé.');
    cautions.push('Ces mentions proviennent de fiches externes : elles ne prouvent pas la fréquence ni la nature des contrôles en partie.');
   }
  }
  if(['engage','resilience'].includes(template.id)&&p.lane==='allin')page.primary[1]="Plaque d'os";
  if(template.id==='engage'&&p.goal==='peel')page.primary[2]='Revitalisation';
  if(template.id==='longfight'&&p.lane==='allin')page.primary[1]='Coup de grâce';
  const validity=bridge.validate(page,catalog);
  if(!validity.valid)throw Error('Page Galio non autorisée : '+template.id+' '+validity.errors.join('; '));
  return {id:template.id,label:template.label,page,legal:true,reasonCount:reasons.length,
    relevance,source:'runes client + priorités manuelles',reasons,
    interactions:[...template.pros],limits:cautions,estimatedWinRate:null,validatedMatchup:false};
 });
 const ordered=[...candidateRows].sort((a,b)=>b.relevance-a.relevance||STRATEGIES.findIndex(x=>x.id===a.id)-STRATEGIES.findIndex(x=>x.id===b.id));
 const hasPreference=Object.values(p).some(x=>x!=='unknown');
 const warnings=[
  'Ordre exploratoire basé uniquement sur les priorités tactiques saisies ; pas sur des winrates ou une calibration de matchups.',
  'Les quatre alliés ne sont pas inférés automatiquement : leurs synergies sont indiquées manuellement.',
  'Les fiches de sorts adverses V12 fournissent au mieux des mentions lexicales non certifiées.',
  'Les identifiants de runes sont internes à l’application, pas des IDs officiels réconciliés.',
  'Les valeurs de runes proviennent des captures du client courant, pas d’un moteur de simulation des combats.'
 ];
 return {ok:true,status:hasPreference?'tactical-comparison':'unranked-options',
  game:'Wild Rift mobile',championId:'10099',options:ordered,
  hasTacticalPreference:hasPreference,comparisonEvidenceAvailable:hasPreference,
  automaticMetaRecommendation:false,enemySignalsValidated:signalData,
  preferences:p,warnings};
}
return Object.freeze({VERSION,OPTIONS,STRATEGIES,matchPreferences,decide});
});