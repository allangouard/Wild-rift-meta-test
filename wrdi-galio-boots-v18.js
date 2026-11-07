/* WRDI V18 Galio-mid boots: narrow to three client-confirmed choices.
 * CN ranked observations guide hypotheses; never mislabel a different boot
 * as Chinese Spellslinger's Shoes or claim exact win rates for these choices.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioBootsV18=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='20.1.0';
const CANDIDATES=['Bottes de mana','Sandales de Mercure','Coques en acier'];
const n=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
function select({bootsCatalog,threats={},role='hybrid_offensive'}={}){
 const records=bootsCatalog?.records;
 if(!Array.isArray(records))return {ok:false,reason:'Fiches de bottes client manquantes'};
 const find=name=>records.find(x=>x.name_fr===name&&x.client_description_visible===true&&x.stats&&Number.isFinite(x.price_gold));
 const boots=CANDIDATES.map(find);
 if(boots.some(x=>!x))return {ok:false,reason:'Une des trois fiches de bottes n’est pas vérifiée dans le client'};
 const t=threats,physical=n(t.ad)+2*n(t.lanePhysical),magical=n(t.ap)+2*n(t.laneMagic);
 const autoLane=n(t.laneAutoAttackPressure),spellDive=n(t.laneAllIn)&&!autoLane;
 const autoTeam=Math.max(0,n(t.critPotential)-autoLane);
 const evaluated=boots.map(b=>{
  let score=0;const why=[];
  const add=(pts,s)=>{score+=pts;if(pts>0)why.push(s);};
  if(b.name_fr==='Bottes de mana'){
   add(role==='ap_burst'?11:role==='hybrid_offensive'?5:2,'Puissance, pénétration magique et mana pour Galio');
   if(n(t.damageDuty)>=2)add(4,'Galio doit apporter les dégâts AP');
   if(role==='ap_burst'&&n(t.lanePoke)&&!n(t.laneHardEngage))add(2,'Mana et pénétration pour répondre à une lane de poke');
  }else if(b.name_fr==='Sandales de Mercure'){
   add(role==='tank_utility'?5:role==='hybrid_offensive'?4:1,'Résistance magique et ténacité');
   if(magical>=2)add(magical*1.4,'Menaces magiques');
   if(n(t.cc)>=2)add(Math.min(4,n(t.cc)),'Contrôles potentiels ; vérifier ceux affectés par la ténacité');
   if(n(t.laneMagic))add(3,'Mid adverse magique');
   if(n(t.laneMagic)&&n(t.laneHardEngage))add(3.5,'Échange explosif contre un mid magique : résistance immédiate');
   if(n(t.magicAssassins)>=2)add(2,'Deux menaces d’assassinat magiques documentées');
  }else if(b.name_fr==='Coques en acier'){
   add(role==='tank_utility'?5:role==='hybrid_offensive'?4:1,'Armure et dégâts des attaques réduits');
   if(physical>=2)add(physical*1.4,'Menaces physiques');
   if(n(t.lanePhysical))add(3,'Mid adverse physique');
   if(n(t.critPotential)>=2)add(1,'Plusieurs champions peuvent utiliser les attaques de base ; builds non observés');
   if(autoLane)add(5,'Mid centré sur les attaques : passif de réduction des attaques particulièrement exploitable');
   if(autoTeam>=2)add(2,'Plusieurs autres menaces potentielles par attaques');
   if(spellDive&&n(t.lanePhysical))add(1.25,'Armure contre un assassin AD à sorts ; le passif anti-attaques reste partiel');
  }
  const caveat=b.name_fr==='Sandales de Mercure'?
   'La ténacité ne raccourcit pas nécessairement tous les contrôles, notamment certaines projections.':
   b.name_fr==='Coques en acier'?
   'Le passif réduit les attaques de champions, pas tous les sorts physiques.':
   'Privilégie les dégâts et la pénétration, pas la survie contre un ciblage explosif.';
  return {name:b.name_fr,priceGold:b.price_gold,stats:b.stats,score:+score.toFixed(2),
   reason:why.join(' · '),caveat,clientSource:true};
 }).sort((a,b)=>b.score-a.score||CANDIDATES.indexOf(a.name)-CANDIDATES.indexOf(b.name));
 return {ok:true,version:VERSION,recommended:evaluated[0],alternatives:evaluated.slice(1,3),candidates:evaluated,
  source:'client_screenshots_2026_11_05',cnEvidence:'Chinese top-player boot preferences observed; exact comparable client names not all confirmed',
  enchantmentsExcluded:true,winrate:null,priority:'draft_threats_and_galio_role',
  guaranteedMitigation:false};
}
return Object.freeze({VERSION,CANDIDATES,select});
});
