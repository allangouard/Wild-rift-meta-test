/* V18: role-first candidate planning for Galio mid. Data-driven shortlist,
 * never a compulsory core. Items are actual verified client objects.
 * Threats from the ten Wild Rift kits arrive before optimization.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioRolePlannerV18=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.2.0';
const n=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
function chooseRole(t={}){
 const frontline=n(t.frontlineProvided),duty=n(t.damageDuty),need=n(t.frontlineNeed);
 if(frontline>=2&&duty>=1)return 'ap_burst';
 // One other engager is not a durable frontline. If no ally is actually
 // classified as tank, Galio should assume tank responsibility.
 if(need>=1&&frontline===0)return 'tank_utility';
 return 'hybrid_offensive';
}
const CORES=Object.freeze({
 ap_burst:['ludens_echo','rabadons_deathcap','infinity_orb'],
 hybrid_offensive:['hollow_radiance','unending_despair','riftmaker'],
 tank_utility:['hollow_radiance','unending_despair','thornmail']
});
function evaluate(item,role,t={}){
 const f=item.feature||{},id=String(item.id||'');
 const ap=n(f.ap),hp=n(f.hp),armor=n(f.armor),mr=n(f.mr);
 const offense=ap>=40||f.maxHp||f.shred||f.ramp||f.waveclear;
 const defense=hp>=200||armor>=30||mr>=30||f.protective||f.stasis;
 const needHeal=Number.isFinite(t.healPressure)?n(t.healPressure):
  n(t.confirmedHeal)+0.35*n(t.conditionalHeal)+0.2*n(t.heal);
 const needShield=n(t.shieldPressure??t.shield),needCrit=n(t.crit),needCritPotential=n(t.critPotential);
 // Documented spell damage channels supplement broad AD/AP champion archetypes.
 // Each distinct client-screened champion counts once, not each spell hit.
 const pressurePhysical=n(t.ad)+n(t.lanePhysical)*1.5+Math.max(0,n(t.enemyPhysicalDamageSources)-1)*0.3;
 const pressureMagic=n(t.ap)+n(t.laneMagic)*1.5+Math.max(0,n(t.enemyMagicDamageSources)-1)*0.3;
 let score=0;const why=[];
 const add=(points,reason)=>{score+=points;if(points>0)why.push(reason);};
 if(role==='ap_burst'){
  if(ap>=90)add(6,'Puissance AP pour Galio carry');
  else if(ap>=40)add(3,'Complément AP');
  if(f.waveclear)add(1.5,'Sorts et vague');
  // Pénétration applicable selon la résistance probable, pas un bonus fixe
  // attribué à deux identifiants d'objets.
  const pen=n(item.stats?.mpen_pct);
  if(pen>0)add(Math.min(8,pen*(n(t.tank)>=2?0.18:n(t.tank)>=1?0.10:0.045)),
   n(t.tank)>=2?'Pénétration face aux cibles résistantes':'Pénétration possible, valeur conditionnée à la RM');
  if(f.maxHp&&n(t.tank)>=2)add(4,'Cibles résistantes');
  if(f.ramp&&n(t.tank)>=2)add(2,'Combat prolongé probable');
  if(!offense)score-=14;
  if(armor||mr)score-=5;
  if(id==='unending_despair'||id==='hollow_radiance')score-=12;
 }else if(role==='tank_utility'){
  if(defense)add(5,'Frontline nécessaire');
  if(hp)add(Math.min(3,hp/200),'Points de vie');
  if(ap>=40)add(1.5,'Pression magique utile');
  if(!defense)score-=10;
 }else{
  if(defense)add(3,'Engagement durable');
  if(offense)add(3,'Pression offensive');
  if(hp&&ap)add(2,'Hybride PV/AP');
  if(!offense&&!defense)score-=8;
 }
 if(f.shieldCut&&needShield>=1.5)add(
  n(t.alliedShieldSources)>=2?5+needShield:n(t.alliedShieldSources)===1?1.25:0.5,
  n(t.alliedShieldSources)>=2?'Plusieurs boucliers alliés documentés':'Bouclier allié isolé : valeur à confirmer en jeu');
 else if(f.shieldCut&&needShield<1.5)score-=12;
 if(f.antihealBySpell&&needHeal)add(3+needHeal,'Anti-soin par les sorts');
 if(f.antihealByRetaliation&&needHeal&&pressurePhysical>=2)add(2+needHeal,'Anti-soin conditionné aux attaques reçues');
 if(f.critMitigation&&needCrit)add(6+needCrit,'Critiques confirmés');
 else if(f.critMitigation&&needCritPotential)add(1,'Critiques possibles, non confirmés');
 if(armor&&pressurePhysical>=2)add(Math.min(5,pressurePhysical),'Dégâts physiques adverses');
 if(mr&&pressureMagic>=2)add(Math.min(5,pressureMagic),'Dégâts magiques adverses');
 if(f.stasis&&n(t.earlyStasisPriority)>=2)add(4,'Menace de dive importante');
 // Client-observed %HP damage makes stacking raw HP less attractive, without
 // treating any conditional spell as a guaranteed hit or invented DPS.
 if(n(t.enemyMaxHpNumericSources)>=2&&hp>=200&&role!=='ap_burst')
  score-=Math.min(3,n(t.enemyMaxHpNumericSources));
 if(f.maxHp&&n(t.tank)>=2)add(2,'Anti-PV');
 if(f.shred&&n(t.tank)>=2)add(2,'Pénétration et réduction RM');
 if(f.attackSpeedAura&&n(t.attackSpeedPressureConfirmed)>0)add(4,'Attaques rapides confirmées');
 if(CORES[role].includes(id))add(5,'Core de référence pour ce rôle');
 return {item,score,why,offense,defense};
}
function plan({threats={},items=[],limit=20}={}){
 if(!Array.isArray(items)||items.length<5)return {ok:false,reason:'Catalogue Galio insuffisant'};
 const role=chooseRole(threats),shieldPressure=n(threats.shieldPressure??threats.shield);
 // Unneeded specialty pieces are not candidate slots for a burst carry.
 // Other common AP items, including Void Staff and Cryptbloom, remain eligible.
 const usable=items.filter(x=>{
  if(role==='ap_burst'&&x.id==='cosmic_drive'&&!n(threats.kitePressureConfirmed))return false;
  if(x.feature?.shieldCut&&shieldPressure<1.5)return false;
  return true;
 });
 const rated=usable.map(x=>evaluate(x,role,threats));
 rated.sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
 // All legally eligible AP items are considered together. Never discard an
 // AP item only because it ranked 21st in a preliminary heuristic score.
 // Keep relevant situational defenses alongside them, without expanding the
 // expensive search to all irrelevant physical/attack-speed equipment.
 const allAp=rated.filter(x=>n(x.item.stats?.ap)>=40);
 const situational=rated.filter(x=>n(x.item.stats?.ap)<40&&(
  CORES[role].includes(x.item.id)||
  (role!=='ap_burst'&&x.defense)||
  (n(threats.crit)>0&&x.item.feature?.critMitigation)||
  ((n(threats.healPressure??threats.confirmedHeal)>0)&&x.item.feature?.antihealByRetaliation)||
  (n(threats.earlyStasisPriority)>=2&&x.item.feature?.stasis)
 ));
 const candidate=new Map(allAp.map(x=>[x.item.id,x]));
 // Base tank/hybrid core pieces must remain available even when non-AP.
 for(const x of situational.slice(0,Math.max(6,Math.min(12,limit))))candidate.set(x.item.id,x);
 for(const x of rated.filter(x=>CORES[role].includes(x.item.id)))candidate.set(x.item.id,x);
 const chosen=[...candidate.values()].sort((a,b)=>b.score-a.score||a.item.id.localeCompare(b.item.id));
 return {ok:true,version:VERSION,role,coreReference:CORES[role].slice(),
   candidateIds:chosen.map(x=>x.item.id),evaluated:items.length,
   apCandidatesConsidered:allAp.length,allRelevantApIncluded:true,
   shortlisted:chosen.length,rejected:items.length-chosen.length,
   rationale:role==='ap_burst'?'Alliés capables de frontline : Galio priorise le burst AP':
     role==='tank_utility'?'Peu de frontline alliée : Galio privilégie la tenue et le contrôle':
     'Galio équilibre pression offensive, contrôle et survie',
   candidates:chosen.map(x=>({id:x.item.id,score:+x.score.toFixed(2),reasons:x.why.slice(0,3)})),
   coresAreReferences:true,patchAssumed:false,penetrationNotForced:true};
}
return Object.freeze({VERSION,chooseRole,CORES,evaluate,plan});
});
