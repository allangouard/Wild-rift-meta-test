/* WRDI V14.28 — relative item choice for Galio mid, NOT combat simulation.
 * User's Wild Rift client item prices, stats and passive descriptions are authoritative
 * when the item is recorded as complete. This module compares tactical fit only.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioItemComparatorV1428=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.28.0-alpha.1';
const finite=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
const bounded=n=>Math.min(5,finite(n));
function review({name,prepared,threats,coreNames=[]}={}){
 if(!prepared?.ok)return {ok:false,reason:'Catalogue client indisponible'};
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
 const key=norm(name),item=prepared.byName.get(key);
 if(!item||prepared.collisions.has(key))return {ok:false,reason:'Objet non rapproché de la fiche client'};
 const p=item.price_gold,docs=item.completeness;
 if(item.item_type!=='legendary'||docs?.description!=='documented'||!['visible','visible_client_shop','user-confirmed'].includes(docs?.price)||!Number.isFinite(p)||p<=0)
  return {ok:false,reason:'Fiche incomplète ou objet non achetable'};
 const selected=[...coreNames,item.name_fr];
 // Restriction checks are from the player-confirmed client equipment rules.
 const ids=selected.map(n=>prepared.byName.get(norm(n))?.id);
 if(ids.some(x=>!x))return {ok:false,reason:'Identité du core non vérifiée'};
 const valid=prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules);
 if(!valid.valid)return {ok:false,reason:'Incompatible avec le core : '+valid.errors.join('; ')};
 const s=item.stats||{},m=(item.passives||[]).map(x=>x.mechanics).filter(Boolean);
 const ad=bounded(threats?.ad),ap=bounded(threats?.ap),tank=bounded(threats?.tank),heal=bounded(threats?.heal),shield=bounded(threats?.shield);
 const pts=[],add=(category,value,reason)=>{if(value>0)pts.push({category,value,reason});};
 // Galio mid: AP + ability haste and survival/engage utility are generally coherent.
 // This is a role-fit prior, not an assertion of optimal skill/item damage.
 if(finite(s.ap)>=40)add('galio_fit',2,'Puissance adaptée au profil de Galio mid');
 if(finite(s.ah)>=10)add('galio_fit',1,'Accélération des compétences utile à ses contrôles et rotations');
 if(finite(s.hp)>=200)add('galio_fit',1,'PV renforçant sa capacité à engager');
 if(ad>=2&&finite(s.armor)>=30)add('draft',Math.min(3,ad),'Armure face à plusieurs sources physiques');
 if(ap>=2&&finite(s.mr)>=30)add('draft',Math.min(3,ap),'Résistance magique face à plusieurs sources magiques');
 if(heal>=1){
  const gw=m.find(x=>finite(x.grievous_wounds_pct)>0);
  if(gw)add('draft',heal>=2?4:2,'Blessures graves documentées contre les soins ennemis');
 }
 if(tank>=2){
  if(m.some(x=>typeof x.damage_per_tick_formula==='string'&&x.damage_per_tick_formula.includes('target_max_hp')))add('draft',4,'Dégâts conditionnels fondés sur les PV max de la cible');
  if(m.some(x=>finite(x.max_damage_amp_pct)>0||finite(x.max_amp_pct)>0))add('draft',1,'Amplification en combat prolongé');
  if(m.some(x=>finite(x.mr_shred_per_stack_pct)>0))add('draft',2,'Réduction progressive de résistance magique');
 }
 if(shield>=1){
  // No generic anti-shield inference from magic penetration or high AP.
  // Only an explicit client mechanic can justify a dedicated counter.
  if(m.some(x=>x.effect==='shield_reduction'||finite(x.shield_reduction_pct)>0))add('draft',3,'Réduction de bouclier explicitement documentée');
 }
 const score=pts.reduce((n,x)=>n+x.value,0);
 const coreStats=coreNames.map(n=>prepared.byName.get(norm(n))?.stats||{});
 const redundancy=[];
 if(heal>0&&pts.some(x=>x.reason.startsWith('Blessures graves'))){
  const coreHasGW=coreNames.some(n=>(prepared.byName.get(norm(n))?.passives||[]).some(x=>finite(x.mechanics?.grievous_wounds_pct)>0));
  if(coreHasGW)redundancy.push('Le core possède déjà des blessures graves');
 }
 if(tank>=2&&pts.some(x=>x.reason.includes('PV max'))){
  const coreHasBurn=coreNames.some(n=>(prepared.byName.get(norm(n))?.passives||[]).some(x=>String(x.mechanics?.damage_per_tick_formula||'').includes('target_max_hp')));
  if(coreHasBurn)redundancy.push('Le core possède déjà un passif contre les PV max');
 }
 // Price is reported, but not used to pretend economic efficiency without a shared utility scale.
 return {ok:true,id:item.id,name:item.name_fr,score,priceGold:p,points:pts,
  redundancy,roleFit:pts.filter(x=>x.category==='galio_fit').length>0,
  documentedDraftResponses:pts.filter(x=>x.category==='draft').length,
  certifiedBest:false,estimatedDamage:null,winRate:null,
  note:'Comparaison qualitative sous les menaces et le core renseignés ; aucun DPS calculé.'};
}
function compare({candidates,prepared,threats,coreNames=[]}={}){
 if(!Array.isArray(candidates)||!candidates.length)return {ok:false,reason:'Aucun candidat à comparer'};
 const results=candidates.map((x,index)=>({candidate:x,index,
  audit:review({name:x.name,prepared,threats,coreNames})}));
 const viable=results.filter(x=>x.audit.ok);
 if(!viable.length)return {ok:false,reason:'Aucun candidat avec fiche complète et compatible',results};
 viable.sort((a,b)=>{
  const effective=x=>x.audit.score-3*x.audit.redundancy.length;
  return effective(b)-effective(a)||a.index-b.index;
 });
 const best=viable[0],second=viable[1];
 const points=best.audit.points.filter(x=>x.category==='draft');
 const lead=second?(best.audit.score-3*best.audit.redundancy.length)-(second.audit.score-3*second.audit.redundancy.length):null;
 const reason=points.length?points.slice(0,2).map(x=>x.reason).join(' ; '):
  best.audit.points.filter(x=>x.category==='galio_fit').slice(0,2).map(x=>x.reason).join(' ; ')||'Compatibilité documentée ; avantage situationnel non établi';
 const comparative=second&&lead>0?'Préféré à '+second.audit.name+' pour les menaces reconnues : '+reason:
  second?'Avantage non démontré face à '+second.audit.name+' ; ordre conservé à titre exploratoire.':
  'Seul candidat vérifié et compatible dans cette comparaison.';
 return {ok:true,choice:best.candidate,choiceAudit:best.audit,
  ordered:viable.map(x=>({candidate:x.candidate,audit:x.audit})),
  relativeReason:comparative,advantageDemonstrated:!!second&&lead>0,
  recommendationStatus:'theoretical_draft_fit_not_winrate',
  hasDirectDraftReason:points.length>0,certifiedOptimal:false,
  rejected:results.filter(x=>!x.audit.ok).map(x=>({name:x.candidate.name,reason:x.audit.reason}))};
}
return Object.freeze({VERSION,review,compare});
});
