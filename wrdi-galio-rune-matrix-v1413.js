/* V14.13: explicit Galio Wild Rift ability ↔ rune interaction registry.
 * No import from League of Legends PC. Sources: Riot Wild Rift Galio
 * page for passive, Wild Rift-specific Galio ability summaries for Q/W/E/R,
 * and the user's Wild Rift client rune tooltip catalogue. Claims requiring
 * live combat validation are never marked as confirmed triggers.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioRuneMatrixV1413=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.13.0-alpha.1';
const SOURCE={
 riot:'https://wildrift.leagueoflegends.com/fr-fr/champions/galio/',
 wrguide:'https://www.wildriftmeta.com/champions/galio/'
};
const abilities=[
 {slot:'P',name:'Frappe colossale',traits:['enhanced_auto','aoe_magic','cooldown_on_spell_hit'],
  verified:'riot_wild_rift',source:SOURCE.riot,
  detail:'Attaque de base renforcée en zone ; toucher un champion ou monstre épique avec une compétence réduit la récupération du passif de 3 s (une fois par lancer).'},
 {slot:'A',name:'Vents de guerre',traits:['spell_damage','area_damage','damage_over_time'],
  verified:'wild_rift_secondary',source:SOURCE.wrguide,
  detail:'Deux bourrasques convergent en tornade infligeant des dégâts répétés.'},
 {slot:'Z',name:'Bouclier de Durand',traits:['taunt','crowd_control','self_damage_reduction','magic_shield_passive'],
  verified:'wild_rift_secondary',source:SOURCE.wrguide,
  detail:'Galio charge sa posture et provoque les champions proches à la relâche. La réduction des dégâts et la protection magique nécessitent vérification de la version actuelle.'},
 {slot:'E',name:'Horion de la justice',traits:['dash','knockup','crowd_control','spell_damage'],
  verified:'wild_rift_secondary',source:SOURCE.wrguide,
  detail:'Galio recule brièvement, charge, touche et projette le premier champion ennemi rencontré.'},
 {slot:'R',name:'Entrée héroïque',traits:['ally_target','ally_magic_shield','knockup','crowd_control','arrival_delay'],
  verified:'wild_rift_secondary',source:SOURCE.wrguide,
  detail:'Zone centrée sur un allié ; bouclier magique aux alliés de la zone ; Galio atterrit après un délai et projette les ennemis proches.'}
];
const rules=[
 {rune:'Souverain des glaces',ability:'Z',status:'conditional_trigger',condition:'La provocation de Z doit immobiliser effectivement un champion et la rune doit être disponible.',reason:'Provoquer constitue un contrôle de déplacement ; vérifier le déclenchement exact et les immunités.'},
 {rune:'Souverain des glaces',ability:'E',status:'conditional_trigger',condition:'E doit projeter un champion ; déclenchement précis à confirmer dans le client.',reason:'Projection et contrôle constituent une interaction plausible.'},
 {rune:'Souverain des glaces',ability:'R',status:'conditional_trigger',condition:'Le R doit atterrir et projeter des ennemis ; effet non garanti si la zone est évitée.',reason:'La projection du R est une condition d’activation plausible.'},
 {rune:'Courage du colosse',ability:'Z',status:'conditional_trigger',condition:'Z touche/provoque un champion ennemi ; vérifier la portée et le délai.',reason:'Bouclier de rune lié aux contrôles de Galio.'},
 {rune:'Courage du colosse',ability:'E',status:'conditional_trigger',condition:'E doit toucher et projeter un champion, non seulement traverser la zone.',reason:'Projection ennemie décrite dans le kit.'},
 {rune:'Courage du colosse',ability:'R',status:'conditional_trigger',condition:'Le R doit projeter au moins un adversaire après l’atterrissage.',reason:'La zone du R peut être évitée.'},
 {rune:'Coup bas',ability:'Z',status:'conditional_trigger',condition:'Le champion doit être entravé puis touché selon la règle de Coup bas.',reason:'La provocation crée une possibilité de cible entravée.'},
 {rune:'Coup bas',ability:'E',status:'conditional_trigger',condition:'L’ennemi projeté doit recevoir les dégâts admissibles dans la fenêtre de rune.',reason:'E est un contrôle mais le proc exact n’est pas testé.'},
 {rune:'Ruée offensive',ability:'E',status:'conditional_trigger',condition:'Après le dash E, une attaque ou compétence doit toucher dans la fenêtre d’activation.',reason:'E procure une ruée ; déplacement seul ne suffit pas.'},
 {rune:'Électrocution',ability:'P',status:'conditional_trigger',condition:'La frappe renforcée peut compter parmi 3 touches sur le même champion en 3 s.',reason:'Attaque de base renforcée + sorts : combo à tester.'},
 {rune:'Électrocution',ability:'A',status:'conditional_trigger',condition:'Atteindre 3 touches distinctes/valides sur le même champion dans les 3 s.',reason:'Les dégâts répétés d’une tornade ne prouvent pas plusieurs déclenchements admissibles.'},
 {rune:'Électrocution',ability:'E',status:'conditional_trigger',condition:'Combiner E et autres dégâts pour totaliser 3 touches valides.',reason:'E participe à un échange court, ne déclenche pas seul Électrocution.'},
 {rune:'Rush phasique',ability:'P',status:'conditional_trigger',condition:'Le passif peut être une des 3 touches en 4 s ; compter les touches indépendantes.',reason:'Le simple nombre de ticks de la tornade ne constitue pas un compteur certifié.'},
 {rune:'Comète arcanique',ability:'A',status:'conditional_trigger',condition:'A doit toucher un champion ennemi ; la comète peut ensuite être esquivée.',reason:'A est une compétence de poke à distance.'},
 {rune:'Conquérant',ability:'P',status:'conditional_trigger',condition:'Touches répétées en combat, avec 6 cumuls maximum ; durée réelle non simulée.',reason:'L’attaque renforcée contribue potentiellement au combat prolongé.'},
 {rune:"Poigne de l'immortel",ability:'P',status:'conditional_trigger',condition:'Être en combat depuis suffisamment longtemps puis frapper un champion avec une attaque admissible.',reason:'Le passif facilite les échanges de base, sans garantir l’activation de Poigne.'},
 {rune:'Gardien',ability:'R',status:'indirect_synergy',condition:'L’allié à protéger doit rester dans la portée et remplir les conditions de Gardien ; R n’est pas le déclencheur.',reason:'L’ultime se lance vers un allié mais son bouclier magique est distinct de Gardien.'},
 {rune:'Revitalisation',ability:'R',status:'interaction_unverified',condition:'Vérifier en client si le bouclier magique du R est amplifié sur la bonne cible et dans les bonnes conditions.',reason:'Pas de garantie que tous les types de boucliers fonctionnent identiquement.'},
 {rune:'Fontaine de vie',ability:'Z',status:'interaction_unverified',condition:'Vérifier l’application de la marque et les soins sur la provocation.',reason:'Possibilité de synergie avec contrôle, sans trace de proc client.'}
];
function inspect(catalog,bridge){
 const errors=[];
 if(!bridge?.audit?.(catalog)?.ok)errors.push('Catalogue client des runes non vérifié.');
 const byName=new Map([...(catalog?.fundamental||[]),...(catalog?.minor||[])].map(x=>[x.name_fr,x]));
 const slots=new Set(abilities.map(x=>x.slot));
 for(const r of rules){
  if(!byName.has(r.rune))errors.push('Rune absente du catalogue : '+r.rune);
  if(!slots.has(r.ability))errors.push('Compétence inconnue : '+r.ability);
  if(!['conditional_trigger','indirect_synergy','interaction_unverified'].includes(r.status))
   errors.push('Statut illégal : '+r.status);
  if(!r.condition||!r.reason)errors.push('Explication manquante : '+r.rune);
 }
 const grouped=abilities.map(a=>({...a,interactions:rules.filter(x=>x.ability===a.slot)}));
 return {ok:errors.length===0,errors,version:VERSION,champion:'Galio',game:'Wild Rift mobile',
  abilities:grouped,runeCoverage:new Set(rules.map(x=>x.rune)).size,interactionCount:rules.length,
  effectDescriptionsVerifiedInClient:!!catalog?.status?.names_descriptions_verified,
  combatTriggerVerified:false,patchCurrentVerified:false,
  warnings:[
   'Les fiches du kit ont des sources de niveau différent ; Riot confirme directement le passif, les autres descriptions proviennent d’un guide Wild Rift spécialisé.',
   'Les statuts conditional_trigger décrivent des conditions plausibles, pas des déclenchements certifiés en partie.',
   'Aucune probabilité, taux de victoire, ordre de runes optimal ou dominance de dégâts ne découle de cette matrice.',
   'Les runes non listées ne sont pas considérées inefficaces : leurs interactions sont encore non étudiées.'
  ]};
}
return Object.freeze({VERSION,SOURCE,abilities,rules,inspect});
});