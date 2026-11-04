/* WRDI V12 — évaluation partielle et transparente de passifs, exclusivement Wild Rift 7.3d.
   Les valeurs des objets viennent du catalogue client, pas de LoL PC. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDIPassiveScenariosV12=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(Number(x))?Number(x):a));
function magicMultiplier(mr){return mr>=0?100/(100+mr):2-100/(100-mr);}
/* Hypothèse explicitement illustrative : dégâts connus répartis uniformément
   sur N secondes entières. La mécanique +2%/seconde, plafond +8% vient du client.
   La chronologie des coups n'est pas connue : il ne s'agit pas d'un DPS mesuré. */
function riftmakerEstimate(duration, damageAfterMr, options={}) {
 const seconds=clamp(duration,0,20), base=Math.max(0,Number(damageAfterMr)||0);
 const melee=options.melee!==false;
 if(seconds<=0 || base<=0)return {base,averageAmplification:0,extraDamage:0,amplifiedDamage:base,postFullStackDamage:0,estimatedOmnivampHealing:0,fullStackSeconds:0,fullStackReached:false,assumption:'Dégâts connus répartis uniformément sur le combat; ennemis champions uniquement.'};
 const whole=Math.floor(seconds);
 const slices=[];
 for(let i=0;i<whole;i++) slices.push({length:1,bonus:Math.min(.08,.02*(i+1)),full:i>=3});
 if(seconds>whole) slices.push({length:seconds-whole,bonus:Math.min(.08,.02*(whole+1)),full:whole>=3});
 const weighted=slices.reduce((sum,x)=>sum+x.length*x.bonus,0)/seconds;
 const postFullStackFraction=slices.reduce((sum,x)=>sum+(x.full?x.length:0),0)/seconds;
 const fullDamage=base*postFullStackFraction*1.08;
 return {base,averageAmplification:weighted,extraDamage:base*weighted,amplifiedDamage:base*(1+weighted),postFullStackDamage:fullDamage,estimatedOmnivampHealing:fullDamage*(melee?.10:.06),fullStackSeconds:seconds*postFullStackFraction,fullStackReached:postFullStackFraction>0,assumption:'Dégâts connus répartis uniformément entre les secondes, déclenchement de 2% puis 4%, 6%, 8%; 10% omnivamp mêlée uniquement à pleine puissance. Soins théoriques avant anti-soins et PV manquants.'};
}
function simulate(ids,catalog,stats,scenario){
 const selected=new Set(ids.filter(Boolean));const byId=new Map(catalog.map(x=>[x.id,x]));
 const active=id=>selected.has(id)&&byId.has(id);
 const ap=Math.max(0,Number(stats.ap)||0),bhp=Math.max(0,Number(stats.bonusHp)||0);
 const armorBonus=Math.max(0,Number(stats.armorBonus)||0);
 const maxHp=Math.max(1,Number(stats.hp)||1),baseAd=Math.max(0,Number(scenario.baseAd)||0);
 const mr=Number.isFinite(Number(stats.effectiveEnemyMr))?Number(stats.effectiveEnemyMr):Math.max(0,Number(scenario.enemyMr)||0);
 const enemyHp=Math.max(1,Number(scenario.enemyHp)||1);
 const duration=clamp(scenario.duration,0,20), autos=Math.floor(clamp(scenario.autos,0,20));
 const secondary=Math.floor(clamp(scenario.secondary,0,4));
 const withinRange=Boolean(scenario.withinRange), hitsTaken=Math.floor(clamp(scenario.hitsTaken,0,20));
 const targetPct=clamp(scenario.targetHpPct,1,100);
 const entries=[],notes=[];
 const add=(id,label,raw,explain,healingRaw=0)=>{
   const m=magicMultiplier(mr);entries.push({id,label,raw,magicAfterMr:raw*m,healingRaw,explain});
 };
 if(active('ludens_echo')&&duration>=0){
  const base=75+.08*ap,extra=20+.012*ap;
  const primary=base+(4-secondary)*extra;
  add('ludens_echo','Écho de Luden — cible principale',primary,'Un déclenchement supposé disponible (9 s de récupération). '+secondary+' cible(s) secondaire(s), leurs dégâts sont exclus du total monocible.');
 }
 if(active('lich_bane')&&autos>=1){
  add('lich_bane','Fléau de liche — attaque après compétence',.75*baseAd+.45*ap,'Un seul déclenchement : attaque placée dans les 10 s après un sort, récupération 1,5 s.');
 }
 if(active('nashors_tooth')&&autos>=1){
  add('nashors_tooth','Dent de Nashor — attaques à l’impact',autos*(15+.20*ap),'Suppose '+autos+' attaque(s) éligible(s). AP bonus assimilée à l’AP total dans ce scénario : à confirmer selon les sources d’AP du champion.');
  notes.push('Nashor : « puissance bonus » doit être distinguée de l’AP total si le champion dispose d’AP de base ou d’effets particuliers.');
 }
 if(active('liandrys_torment')&&duration>=1){
  const ticks=Math.min(3,Math.floor(duration));
  add('liandrys_torment','Liandry — brûlure (une application)',ticks*.02*enemyHp,ticks+' tic(s) de 1 s sur une cible ; aucune réapplication supposée. Amplification Folie exclue.');
  notes.push('Liandry : Folie (+2 %/s jusqu’à 6 %) n’est pas cumulée ici ; ordre avec autres amplifications non validé.');
 }
 if(active('hollow_radiance')&&withinRange&&duration>=1){
  const ticks=Math.min(5,Math.floor(duration));
  add('hollow_radiance','Rayonnement du vide — Immolation',ticks*(20+.01*bhp),ticks+' tic(s) avec base minimale 20 (le client annonce 20 à 30 selon progression). Aucun déclenchement de Désolation supposé.');
  notes.push('Rayonnement du vide : estimation basse du terme 20–30, progression exacte non confirmée.');
 }
 if(active('sunfire_aegis')&&withinRange&&duration>=1){
  const ticks=Math.floor(duration);
  add('sunfire_aegis','Égide solaire — Immolation',ticks*(20+.015*bhp),ticks+' tic(s) proches, champion ennemi.');
 }
 if(active('unending_despair')&&withinRange&&duration>=4){
  const ticks=Math.floor(duration/4),raw=ticks*.03*maxHp;
  add('unending_despair','Désespoir infini — Affliction',raw,ticks+' activation(s) toutes les 4 s sur une cible proche. Soins estimés sur les dégâts post-RM.',raw*magicMultiplier(mr)*2.5);
 }
 if(active('thornmail')&&hitsTaken>=1){
  add('thornmail','Cotte épineuse — Épines',hitsTaken*(20+.06*armorBonus+.01*bhp),hitsTaken+' attaque(s) reçue(s). Hémorragie non valorisée en dégâts.');
 }
 if(active('infinity_orb')){
  notes.push('Orbe d’infini : +20 % sur les coups éligibles sous 40 % de PV adverses ; non ajouté sans séquence d’événements et vérification du franchissement du seuil. Situation : '+targetPct+' % de PV.');
 }
 if(active('abyssal_mask')){
  notes.push('Masque abyssal : +12 % de dégâts magiques uniquement à portée de 650 unités ; non ajouté au total pour éviter le double compte.');
 }
 if(active('riftmaker'))notes.push('Créateur de failles : conversion PV→AP déjà comptée dans la puissance effective. Amplification/omnivamp estimés séparément avec distribution uniforme des dégâts; ne pas les rajouter automatiquement au combo.');
 if(active('bloodletters_curse'))notes.push('Malédiction du sanguinaire : réduction de RM par applications successives non simulée sans chronologie de sorts.');
 if(active('morellonomicon')||active('thornmail'))notes.push('Hémorragie : effet anti-soins à 50 % non quantifié sans soins adverses connus.');
 const total=entries.reduce((n,e)=>n+e.magicAfterMr,0),heal=entries.reduce((n,e)=>n+e.healingRaw,0);
 const unmodeled=ids.filter(Boolean).filter(id=>{
  const i=byId.get(id);return i&&(i.passives||[]).length&&!entries.some(e=>e.id===id)&&!['rabadons_deathcap'].includes(id);
 }).map(id=>byId.get(id).name_fr);
 const knownDamage=Math.max(0,Number(scenario.comboAfterMr)||0)+total;
 const riftmaker=active('riftmaker')?riftmakerEstimate(duration,knownDamage,{melee:true}):null;
 return {entries,totalMagicAfterMr:total,totalPotentialHealing:heal,riftmaker,unmodeled,notes,assumptions:{duration,autos,secondary,hitsTaken,targetPct,withinRange},isComplete:false};
}
return {simulate,magicMultiplier,riftmakerEstimate};
});
