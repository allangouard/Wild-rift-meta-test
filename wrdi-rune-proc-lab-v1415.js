/* WRDI 14.15 — Galio rune proc verification protocol, Wild Rift mobile only.
 * Source descriptions and in-client screenshot data support TEST CASES, not
 * observed proc success. User-entered observations are NEVER certified automatically.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_RuneProcLabV1415=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.15.0-alpha.1';
const TESTS=Object.freeze([
 {id:'glacial-w',rune:'Souverain des glaces',ability:'Z',name:'Provocation Z',
  instruction:'En entraînement, équipe Souverain des glaces. Sur champion cible, déclenche Z avec provocation réussie, sans autre contrôle avant. Observe l’effet de zone de la rune.',
  success:'L’effet visuel de Souverain des glaces apparaît après la provocation.',
  controls:'Répéter après la récupération de la rune ; essai sans cible provoquée.',
  uncertainty:'Ne pas confondre zone du Z avec zone de la rune.'},
 {id:'glacial-e',rune:'Souverain des glaces',ability:'E',name:'Projection E',
  instruction:'Sur cible immobile, utilise E pour toucher et projeter. Observe Souverain des glaces sans utiliser Z.',
  success:'L’effet de rune se produit lors d’une projection réussie.',
  controls:'Répéter après récupération, comparer à un E raté.',
  uncertainty:'Un E qui ne touche pas ne permet pas de conclure sur le déclenchement.'},
 {id:'colossus-w',rune:'Courage du colosse',ability:'Z',name:'Bouclier sur Z',
  instruction:'Équipe Courage du colosse. Active Z contre un champion et observe la présence d’un nouveau bouclier après la provocation.',
  success:'Un bouclier attribuable à la rune est créé après le contrôle.',
  controls:'Comparer avec le bouclier magique passif de Galio avant activation ; observer le délai de récupération.',
  uncertainty:'Les deux boucliers doivent être distingués visuellement ou par leurs valeurs.'},
 {id:'colossus-e',rune:'Courage du colosse',ability:'E',name:'Bouclier sur E',
  instruction:'Équipe Courage du colosse, utilise E seul sur champion, sans Z ni R et observe le bouclier.',
  success:'Le bouclier de la rune apparaît après E touché et projetant la cible.',
  controls:'Comparer avec E manqué et avec passif de Z déjà actif.',
  uncertainty:'Le passif de Z peut masquer le gain de bouclier.'},
 {id:'electrocute-combo',rune:'Électrocution',ability:'P',name:'3 touches indépendantes',
  instruction:'Équipe Électrocution puis réalise E touché, une attaque de base/passif et A sur le même champion en moins de 3 s, en notant chaque touche.',
  success:'Les trois événements admissibles déclenchent Électrocution une fois.',
  controls:'Comparer à deux touches, puis à des touches sur différentes cibles, après récupération.',
  uncertainty:'Le passif et les dégâts périodiques de A peuvent produire des événements distincts sans compter comme touches indépendantes.'},
 {id:'electrocute-q-ticks',rune:'Électrocution',ability:'A',name:'Tornade seule',
  instruction:'Équipe Électrocution et fais toucher uniquement la tornade A, sans attaque ni autre sort. Observe si les ticks suffisent.',
  success:'Observation explicite : activation oui ou non avec la tornade seule.',
  controls:'Aucun autre effet de dégâts, pas de rune concurrente ; répéter après récupération.',
  uncertainty:'Un résultat négatif ne prouve pas qu’A ne compte pas comme une touche.'},
 {id:'phase-combo',rune:'Rush phasique',ability:'P',name:'3 touches / fenêtre client',
  instruction:'Équipe Rush phasique et utilise E, passif puis A sur une seule cible en respectant la fenêtre indiquée par ton client Wild Rift.',
  success:'Un bonus de déplacement et les effets de la rune apparaissent après trois touches admissibles.',
  controls:'Comparer à deux touches et à une longue pause entre les touches.',
  uncertainty:'Les sources externes divergent sur la fenêtre ; valeur du catalogue client = 4 s tant que non revalidée.'},
 {id:'phase-q-ticks',rune:'Rush phasique',ability:'A',name:'Tornade et ticks',
  instruction:'Avec Rush phasique, fais toucher uniquement A et sa tornade à un champion sans autre coup ; observe le déclenchement.',
  success:'Observation explicite de l’activation ou non par la tornade seule.',
  controls:'Aucun autre dommage ; recommencer hors délai de récupération.',
  uncertainty:'Plusieurs ticks de dégâts ne sont pas forcément plusieurs touches admissibles.'},
 {id:'guardian-r',rune:'Gardien',ability:'R',name:'Protection R ≠ Gardien',
  instruction:'Avec Gardien, lance R vers un allié et observe séparément le bouclier magique de R et l’effet de Gardien.',
  success:'Identifier distinctement le bouclier de l’ultime et l’éventuel déclenchement de Gardien.',
  controls:'Comparer avec R sans attaque subie, puis avec attaque subie par allié proche.',
  uncertainty:'R ne doit pas être considéré comme une activation automatique de Gardien.'},
 {id:'revitalize-r',rune:'Revitalisation',ability:'R',name:'Amplification du bouclier R',
  instruction:'Comparer le bouclier magique de R sur un allié similaire avec et sans Revitalisation dans des conditions identiques.',
  success:'Différence du bouclier mesurée et attribuable à Revitalisation.',
  controls:'Garder même niveau, objets, cible, PV et autres runes ; répéter.',
  uncertainty:'Sans mesure reproductible, l’interaction reste non vérifiée.'}
]);
const STATUSES=Object.freeze(['untested','observed_yes','observed_no','inconclusive']);
function validateObservation(testId,result,notes){
 if(!TESTS.some(t=>t.id===testId))return {ok:false,error:'Test inconnu.'};
 if(!STATUSES.includes(result))return {ok:false,error:'Résultat invalide.'};
 const n=String(notes||'').trim().slice(0,1000);
 if(result!=='untested' && n.length<10)return {ok:false,error:'Ajoute au moins dix caractères expliquant ce qui a été observé.'};
 return {ok:true,record:{testId,result,notes:n,provenance:'manual_user_observation',validatedByDeveloper:false,replicated:false}};
}
function audit({catalog,bridge,matrix,observations=[]}={}){
 const errors=[];
 if(!bridge?.audit?.(catalog)?.ok)errors.push('Catalogue Wild Rift des runes invalide.');
 if(!matrix?.rules||!Array.isArray(matrix.rules))errors.push('Matrice Galio V14.13 manquante.');
 const names=new Set([...(catalog?.fundamental||[]),...(catalog?.minor||[])].map(x=>x.name_fr));
 const slots=new Set((matrix?.abilities||[]).map(x=>x.slot));
 for(const t of TESTS){
  if(!names.has(t.rune))errors.push('Rune absente : '+t.rune);
  if(!slots.has(t.ability))errors.push('Sort absent : '+t.ability);
  if(!t.instruction||!t.success||!t.controls||!t.uncertainty)errors.push('Protocole incomplet : '+t.id);
 }
 const accepted=[],rejected=[];
 for(const raw of Array.isArray(observations)?observations:[]){
  const check=validateObservation(raw?.testId,raw?.result,raw?.notes);
  if(!check.ok){rejected.push(check.error);continue;}
  accepted.push(check.record);
 }
 return {ok:errors.length===0,errors,protocols:TESTS,
  total:TESTS.length,
  accepted,rejected,
  status:'verification-protocol-only',
  game:'Wild Rift mobile',patchCertified:false,
  observedInteractions:accepted.filter(x=>x.result==='observed_yes').length,
  inGameTriggersCertified:0,
  automaticRecommendationEligible:false,
  warnings:[
   'Un protocole de test n’est pas une preuve de résultat. Aucun test en jeu n’a été réalisé par ce module.',
   'Une observation manuelle est conservée comme témoignage non vérifié ; elle ne certifie ni patch ni effet.',
   'La valeur de Rush phasique vient des captures client ; des sources externes divergent sur sa fenêtre.',
   'Seule une validation indépendante avec répétition, preuve et version du client pourra autoriser la promotion de statut.'
  ]};
}
return Object.freeze({VERSION,TESTS,STATUSES,validateObservation,audit});
});