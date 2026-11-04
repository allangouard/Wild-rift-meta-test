/* WRDI V12 — Chronologie illustrative Wild Rift 7.3d. AUCUN classement automatisé. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDITimelineV12=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const clip=(x,min,max)=>Math.min(max,Math.max(min,n(x)));
const mult=mr=>mr>=0?100/(100+mr):2-100/(100-mr);
function simulate(ids,result,scenario,times){
 const set=new Set(ids.filter(Boolean));
 const duration=clip(scenario.duration,0,20),mr=n(result.effectiveMr),m=mult(mr);
 const damage=result.damageComponents||{},ap=n(result.stats?.ap),bhp=n(result.stats?.bonusHp),hp=n(result.stats?.hp);
 const events=[];const add=(time,id,label,raw,kind='sort')=>{if(time>=0&&time<=duration&&raw>0)events.push({time:Number(time.toFixed(3)),id,label,raw,kind});};
 const q=clip(times.q,0,20),e=clip(times.e,0,20),p=clip(times.passive,0,20);
 add(q,'galio_q','Galio A — vents + tornade',n(damage.q));
 add(e,'galio_e','Galio E — Horion',n(damage.e));
 add(p,'galio_passive','Galio — Frappe colossale',n(damage.passive),'attaque');
 if(set.has('liandrys_torment')&&q<=duration){for(let t=1;t<=3;t++)add(q+t,'liandrys_torment','Liandry — brûlure '+t,0.02*n(scenario.enemyHp),'objet');}
 if(set.has('hollow_radiance')&&scenario.withinRange){for(let t=1;t<=Math.min(5,Math.floor(duration));t++)add(t,'hollow_radiance','Rayonnement — Immolation',20+.01*bhp,'objet');}
 if(set.has('sunfire_aegis')&&scenario.withinRange){for(let t=1;t<=Math.floor(duration);t++)add(t,'sunfire_aegis','Égide solaire — Immolation',20+.015*bhp,'objet');}
 if(set.has('unending_despair')&&scenario.withinRange){for(let t=4;t<=duration;t+=4)add(t,'unending_despair','Désespoir — Affliction',0.03*hp,'objet');}
 if(set.has('ludens_echo'))add(q,'ludens_echo','Luden — un déclenchement',75+.08*ap+(4-clip(scenario.secondary,0,4))*(20+.012*ap),'objet');
 if(set.has('lich_bane')&&scenario.autos>=1){add(p,'lich_bane','Fléau de liche — proc supposé',.75*n(scenario.baseAd)+.45*ap,'objet');}
 if(set.has('nashors_tooth')&&scenario.autos>=1){add(p,'nashors_tooth','Nashor — un impact',15+.20*ap,'objet');}
 // Répartition de dégâts post-résistance : la chronologie n'inclut ni distance réelle ni re-déclenchements.
 events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
 let sum=0,bonus=0,healing=0,despairHeal=0;
 for(const ev of events){
   // Hypothèse : combat commence à t=0 et se maintient ; 2 % après chaque seconde entière, plafond 8 %.
   const stacks=set.has('riftmaker')?Math.min(4,Math.floor(ev.time+1e-9)):0;
   const amp=stacks*.02;
   ev.stacks=stacks;ev.amplification=amp;
   ev.postMr=ev.raw*m;
   ev.extra=ev.postMr*amp;
   ev.amplified=ev.postMr+ev.extra;
   // Soins Désespoir explicitement estimés sur dégâts subis, pas omnivamp.
   if(ev.id==='unending_despair')despairHeal+=ev.postMr*2.5;
   // Omnivamp : borne supérieure théorique; effets de zone généralement soumis à règles distinctes non chiffrées.
   if(stacks===4 && set.has('riftmaker'))healing+=ev.amplified*.10;
   sum+=ev.postMr;bonus+=ev.extra;
 }
 return {events,baseDamage:sum,extraDamage:bonus,projectedDamage:sum+bonus,omnivampUpperBound:healing,despairHealing:despairHeal,firstFullStackTime:4,notes:[
 'Hypothèse : le combat commence à t=0 et se maintient sans interruption ; +2 % par seconde révolue, 8 % à t=4. Le déclenchement réel peut différer.',
 'Galio A : dégâts de la tornade regroupés à un seul instant, pas ses véritables ticks. Runes, dégâts d’ultime, autres multiplicateurs et réactions adverses non simulés.',
 'Les soins d’omnivamp affichés sont une borne haute avant réductions des dégâts de zone, anti-soins et PV manquants. Ne pas les additionner à un soin de combat certifié.',
 'Une application de Liandry après A ; Luden et Fléau supposés disponibles. Immolation et Désespoir supposent la proximité permanente.',
 'Ces résultats sont indépendants du total historique : NE PAS les additionner au chiffre « Dégâts combo (partiel) ».'
 ],complete:false};
}
return {simulate};
});
