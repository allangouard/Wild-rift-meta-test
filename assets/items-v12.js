/* WRDI V12 — données transcrites des captures Wild Rift fournies par l'utilisateur.
   Les règles conditionnelles ne sont PAS des simulations de combat automatiques. */
(function(g){'use strict';
const source='Captures écran Wild Rift fournies par utilisateur, 2026-11-04';
const items={
 'rayonnement-du-vide':{name:'Rayonnement du vide',stats:{hp:400,mr:40,haste:15},effects:[
  {id:'immolation',type:'magic-damage-over-time',baseMin:20,baseMax:30,bonusHpRatio:.01,intervalSeconds:1,durationSeconds:5,conditions:['en combat','ennemis proches'],monsterMultiplier:1.25,minionMultiplier:2},
  {id:'desolation',type:'magic-damage-on-kill',base:30,bonusHpRatio:.02,conditions:['éliminer un monstre neutre ou un ennemi'],radius:'zone non chiffrée'}]},
 'desespoir-infini':{name:'Désespoir infini',stats:{hp:300,armor:40,mr:40,haste:10},effects:[
  {id:'affliction',type:'magic-damage-and-heal',intervalSeconds:4,maxHpRatio:.03,healFromDamageRatio:2.5,conditions:['en combat avec un champion','champions ennemis proches'],hasteAffectsInterval:false}]},
 'cotte-epineuse':{name:'Cotte épineuse',stats:{hp:200,armor:75},effects:[
  {id:'epines',type:'magic-reflect-on-attack',base:20,bonusArmorRatio:.06,bonusHpRatio:.01,conditions:['touché par une attaque']},
  {id:'entrelacs',type:'grievous-wounds',healingReduction:.5,durationSeconds:3,conditions:['ennemi attaque le porteur','porteur inflige des dégâts à ennemi']}]},
 'createur-de-failles':{name:'Créateur de failles',nameVisibility:'nom non visible dans la capture; identification par contexte',stats:{hp:350,ap:70,haste:15},effects:[
  {id:'corruption-du-neant',type:'damage-amplification',increasePerSecond:.02,maxIncrease:.08,conditions:['en combat contre champions ennemis'],atMax:{omnivampMelee:.10,omnivampRanged:.06}},
  {id:'infusion-du-neant',type:'ap-from-bonus-hp',bonusHpRatio:.02}]},
 'baton-du-vide':{name:'Bâton du vide',stats:{ap:95,magicPenPct:.40},effects:[]}
};
function statsFor(ids){const sum={hp:0,armor:0,mr:0,haste:0,ap:0,magicPenPct:0};for(const id of ids){if(!items[id])throw Error('Objet inconnu: '+id);for(const [k,v] of Object.entries(items[id].stats))sum[k]=(sum[k]||0)+v;}return sum;}
function derived(ids){const s=statsFor(ids);const rift=ids.includes('createur-de-failles');return Object.freeze({...s,apFromBonusHp:rift?s.hp*.02:0,totalApFromItems:s.ap+(rift?s.hp*.02:0)});}
const api={version:'12.0-items-alpha',source,patch:'non vérifié indépendamment',items:Object.freeze(items),statsFor,derived,limitations:Object.freeze(['Pas de prix dans les captures','Pas de calcul des résistances ni du temps de combat','Conditions de déclenchement à simuler','Restrictions de cumul non vérifiées','Valeurs à revalider après changement de patch'])};
g.WRDIItemsV12=Object.freeze(api);
})(window);
