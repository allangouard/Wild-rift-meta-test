/* WRDI V14.32 — purchase order for five existing Galio items, client-only.
 * Never changes the selected items, invents matchup damage or uses popular builds.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioPurchaseOrderV1432=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.5.0-alpha.1',n=x=>typeof x==='number'&&Number.isFinite(x)?Math.max(0,x):0,c=x=>Math.min(5,n(x));
function features(item){
 const s=item.stats||{},p=(item.passives||[]).map(x=>x.mechanics||{});
 return {armor:n(s.armor),mr:n(s.mr),hp:n(s.hp),ap:n(s.ap),ah:n(s.ah),cost:n(item.price_gold),
  waveclear:p.some(x=>Array.isArray(x.minion_multiplier_range)||n(x.minion_multiplier)>1),
  // Spell-triggered splash may let Galio use Q to manage the wave without
  // standing inside the wave. The exact proc remains conditional.
  spellClear:p.some(x=>n(x.max_secondary_targets)>=2&&n(x.cooldown_s)>0&&
   typeof x.base_damage==='string'),
  stasis:p.some(x=>x.active===true&&n(x.stasis_s)>0),
  grievous:p.some(x=>n(x.grievous_wounds_pct)>0),
  critGuard:p.some(x=>n(x.physical_crit_damage_reduction_pct)>0),
  maxHp:p.some(x=>String(x.damage_per_tick_formula||'').includes('target_max_hp')),
  ramp:p.some(x=>n(x.max_amp_pct)>0||n(x.max_damage_amp_pct)>0),
  hybrid:n(s.armor)>0&&n(s.mr)>0};
}
function stageScore(item,needs,slot){
 // Always read the verified item card: other modules use a different
 // shape for item.feature (notably cost), which would produce NaN scores.
 const f=features(item),t=needs||{},early=slot===0,transition=slot===1,mid=slot===1||slot===2;
 const lanePhysical=c(t.lanePhysical)*(c(t.laneAllIn)?2:1),laneMagic=c(t.laneMagic)*(c(t.laneAllIn)?2:1);
 const gank=c(t.jungleAllIn),frontline=c(t.frontlineNeed),ad=c(t.ad),ap=c(t.ap),assassin=c(t.assassin),tank=c(t.tank),heal=c(t.heal),crit=c(t.crit);
 const poke=c(t.lanePoke);
 let score=0;const factors=[];const add=(points,message)=>{if(points>0){score+=points;factors.push({points,message});}};
 if(early){
  if(lanePhysical&&f.armor>=30)add(3*lanePhysical,'Armure contre la pression physique du mid');
  if(laneMagic&&f.mr>=30)add(3*laneMagic,'Résistance magique contre la pression du mid');
  if(gank&&f.hp>=250)add(1.6,'PV pour tenir les premiers ganks');
  // Galio's melee last hits cost exposure: combine survival, HP and a way
  // to manage the wave. Immolation requires close proximity and combat;
  // spell splash has lower exposure when Galio lands Q, at a mana cost.
  if(f.hp>=300&&(f.armor>=30&&lanePhysical||f.mr>=30&&laneMagic))
   add(1.5,'PV et résistance adaptée pour farmer au corps à corps');
  if(f.waveclear)add(poke?1.6:2.6,
   'Immolation pour contrôler la vague, en restant proche des sbires');
  if(f.spellClear)add(poke?3.1:1.6,
   'Éclaboussure après sort : farmer avec le A sans rester au contact');
  if(f.spellClear&&f.ap>=80)add(0.8,
   'Puissance pour gérer la vague à distance avec le A');
  if(f.ap>=80&&!f.spellClear&&!f.waveclear)add(0.5,
   'Puissance de sort pour les échanges et le farm avec le A');
  if(f.ah>=15)add(0.7,'Accélération des compétences utile en lane');
  if(assassin&&f.stasis)add(1.2,'Stase contre une menace d’assassinat');
  score-=Math.max(0,f.cost-2600)/750;
 }else if(mid){
  // The second completed item is transitional: protect early rotations and
  // the remaining isolated mid exchanges without valuing an all-game lane.
  if(transition){
   if(lanePhysical&&f.armor>=30)add(lanePhysical*1.1,'Armure pour terminer la lane contre le mid');
   if(laneMagic&&f.mr>=30)add(laneMagic*1.1,'RM pour terminer la lane contre le mid');
   if(f.waveclear||f.spellClear)add(0.5,'Gestion des vagues avant les premières rotations');
  }
  if(ad>=2&&f.armor>=30)add(1.8,'Armure pour les premières escarmouches');
  if(ap>=2&&f.mr>=30)add(1.8,'Résistance magique pour les premières escarmouches');
  if(frontline&&f.hp>=250)add(1.8,'PV pour tenir la première ligne');
  if(assassin&&f.stasis)add(3,'Stase contre les engagements explosifs');
  if(f.ap>=40)add(1.1,'Puissance pour les combats intermédiaires');
  if(f.ah>=15)add(0.7,'Compétences disponibles plus souvent');
 }else{
  if(f.ap>=90)add(2.5,'Puissance pour compléter le build');
  if(frontline&&f.hybrid)add(2,'Résistances mixtes pour les combats d’équipe');
  if(tank>=2&&f.maxHp)add(2,'Passif contre les PV maximum');
  if(tank>=2&&f.ramp)add(1.3,'Passif de combat prolongé');
 }
 if(heal>=2&&f.grievous)add(1.1,'Blessures graves documentées contre les soins');
 if(crit&&f.critGuard)add(1.5,'Protection contre les critiques confirmés');
 if(!crit&&f.critGuard)score-=2.2;
 factors.sort((a,b)=>b.points-a.points);
 // Explain both matchup survival and wave management when they coexist.
 // A single "MR against mid" label hides why Galio can actually farm.
 const earlyWave=factors.find(x=>x.message.includes('Immolation')||
  x.message.includes('Éclaboussure'));
 const best=factors[0]?.message;
 const explanation=early&&earlyWave&&best!==earlyWave.message?
  best+' · '+earlyWave.message:
  (best||'Complète le build de cinq objets');
 return {score,reason:explanation,factors};
}
function order({prepared,items,threats={}}={}){
 if(!prepared?.ok||!prepared.catalog?.items||!prepared.core?.validateEquipment||!Array.isArray(items)||items.length!==5)
  return {ok:false,reason:'Cinq objets et le catalogue client vérifié sont nécessaires'};
 const map=new Map(prepared.catalog.items.map(x=>[x.id,x])),found=[];
 for(const raw of items){
  const id=typeof raw==='string'?raw:raw?.id,item=map.get(id);
  if(!item||!['legendary','active'].includes(item.item_type)||item.completeness?.description!=='documented'||
   !['visible','visible_client_shop','user-confirmed'].includes(item.completeness?.price)||
   !Number.isFinite(item.price_gold)||item.price_gold<=0)
   return {ok:false,reason:'Objet absent, transformé ou incomplet : '+String(id)};
  found.push({...item,feature:features(item)});
 }
 if(new Set(found.map(x=>x.id)).size!==5||!prepared.core.validateEquipment(found.map(x=>x.id),prepared.catalog,prepared.rules).valid)
  return {ok:false,reason:'Composition de cinq objets incompatible'};
 let best=null,second=-Infinity,visited=0;
 function permutations(seq,left){
  if(!left.length){
   visited++;
   const stages=seq.map((x,i)=>stageScore(x,threats,i));
   const score=stages.reduce((sum,p,i)=>sum+p.score*[2.5,1.6,1.3,1,0.9][i],0),tie=seq.map(x=>x.id).join('|');
   if(!best||score>best.score+1e-9||(Math.abs(score-best.score)<1e-9&&tie<best.tie)){
    if(best)second=Math.max(second,best.score);
    best={seq,stages,score,tie};
   }else second=Math.max(second,score);
   return;
  }
  for(let i=0;i<left.length;i++)permutations([...seq,left[i]],[...left.slice(0,i),...left.slice(i+1)]);
 }
 permutations([],found);
 return {ok:true,version:VERSION,game:'Wild Rift mobile',items:best.seq.map((x,i)=>({
  id:x.id,name:x.name_fr,priceGold:x.price_gold,slot:i+1,phase:i===0?'lane':i===1?'transition':i===2?'escarmouches':'teamfights',
  reason:best.stages[i].reason
 })),checkedPermutations:visited,sameFiveItems:true,bootsSeparate:true,
 priorityConfidence:best.score-second<0.7?'close_alternatives':'heuristic_preference',
 purchaseOrderCertified:false,noPopularityData:true,noDamageForecast:true,
 note:'Ordre initial théorique à adapter aux achats adverses et à la partie réelle.'};
}
return Object.freeze({VERSION,features,stageScore,order});
});
