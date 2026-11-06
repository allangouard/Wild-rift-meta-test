/* WRDI V16.9 — choose when a heal-counter should displace AP power.
 * Source only: 7.3d user-client item mechanics. Draft kit healing ≠ observed
 * healing in a live match. The default planning scenario remains conditional.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_AntihealTimingV169=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='16.9.0';
const n=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,v):0;
const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
function classify(item){
 const s=item?.stats||{},passives=(item?.passives||[]).map(p=>p.mechanics||{});
 const anti=passives.find(m=>n(m.grievous_wounds_pct)>0);
 const trigger=anti?.trigger;
 const spell=trigger==='deal_magic_damage_to_champion'||trigger==='magic_or_true_damage_to_champion';
 const contact=Array.isArray(trigger)?trigger.includes('damage_champion'):trigger==='damage_champion';
 const retaliation=Array.isArray(trigger)?trigger.some(x=>x==='attacked_by_champion'||x==='attacked'):
  trigger==='attacked_by_champion'||trigger==='attacked';
 const reflect=passives.some(m=>typeof m.damage_formula==='string'&&
  m.damage_formula.includes('bonus_armor')&&
  (m.trigger==='attacked'||m.trigger==='attacked_by_champion'));
 const offense=n(s.ap)+n(s.ah)*0.45;
 return {grievousPct:n(anti?.grievous_wounds_pct),spell,contact,retaliation,reflect,
  armor:n(s.armor),mr:n(s.mr),ap:n(s.ap),hp:n(s.hp),ah:n(s.ah),
  offense,usableViaGalioSpells:spell||contact,passiveSource:'client'};
}
function evaluateItem(item,{threats={},observedHealingSeverity=0,beingAutoAttacked=false}={}){
 if(!item)return {ok:false,reason:'Objet non disponible'};
 const t=threats||{},f=classify(item);
 const innate=n(t.confirmedHeal)+0.35*n(t.conditionalHeal);
 const observed=limit(n(observedHealingSeverity),0,5);
 // Kit-derived healing is only a prompt to watch, never a verified live event.
 const urgent=observed>=2;
 const healingExposure=observed>0?observed:Math.min(1.2,innate*0.55);
 const ad=n(t.ad),ap=n(t.ap),frontline=n(t.frontlineNeed),damage=n(t.damageDuty);
 const physicalNeed=limit(ad/3+(beingAutoAttacked?0.6:0),0,2);
 const magicNeed=limit(ap/3,0,2);
 let score=0;const reasons=[];
 if(f.grievousPct){
  const access=f.spell?1.0:f.contact?0.95:f.retaliation?0.45:0.2;
  const anti=healingExposure*access*(urgent?3.4:1.2);
  score+=anti;
  reasons.push(urgent?'Soins réellement problématiques : Hémorragie prioritaire':
   'Soins possibles selon les kits : Hémorragie non urgente sans observation');
  if(f.contact)reasons.push('Galio peut appliquer Hémorragie en blessant les champions');
  if(f.spell)reasons.push('Hémorragie appliquée par dégâts magiques des compétences');
 }
 const armorValue=f.armor*0.035*physicalNeed;
 const magicValue=f.mr*0.035*magicNeed;
 const apValue=f.ap*(damage>=2?0.055:0.036);
 const ahValue=f.ah*0.065;
 score+=armorValue+magicValue+apValue+ahValue;
 if(f.reflect){
  const probability=beingAutoAttacked?1:0.25;
  score+=2.8*probability;
  reasons.push(beingAutoAttacked?
   'Dégâts renvoyés pertinents : Galio subit effectivement des attaques':
   'Dégâts renvoyés possibles mais attaques reçues non confirmées');
 }
 if(f.armor>=50&&physicalNeed>=1.1)reasons.push('Armure pertinente contre la pression physique');
 if(f.ap>=60)reasons.push('AP permettant de maintenir la pression offensive');
 if(!f.grievousPct&&item.id==='riftmaker'){
  // The verified client gives sustained amplification + 2% bonus HP conversion.
  const ramp=passive(item,'max_damage_amp_pct');
  if(ramp?.bonus_ap_formula==='0.02 * bonus_hp')score+=0.6;
  score+=2.9;
  reasons.push('Créateur de failles : amplification progressive, omnivampirisme et AP de PV bonus');
 }
 return {ok:true,itemId:item.id,score:Number(score.toFixed(3)),
  urgent,healingExposure:Number(healingExposure.toFixed(2)),
  confirmedObservedHealing:observed>0,kitHealingIsNotLiveEvidence:true,
  mechanics:f,explanation:reasons,readiness:'conditional_comparison_not_actual_dps'};
}
function passive(item,key){return (item.passives||[]).map(x=>x.mechanics||{}).find(m=>Object.hasOwn(m,key));}
function compareCandidates({catalog,threats={},observedHealingSeverity=0,beingAutoAttacked=false}={}){
 const items=Array.isArray(catalog?.items)?catalog.items:[],get=id=>items.find(x=>x.id===id);
 const ids=['riftmaker','thornmail','morellonomicon'];
 if(ids.some(id=>!get(id)))return {ok:false,reason:'Fiches client du trio incompletes'};
 const options=ids.map(id=>evaluateItem(get(id),{threats,observedHealingSeverity,beingAutoAttacked}));
 options.sort((a,b)=>b.score-a.score||a.itemId.localeCompare(b.itemId));
 const byId=Object.fromEntries(options.map(x=>[x.itemId,x]));
 const antihealNeed=observedHealingSeverity>=2;
 const threshold=antihealNeed?Math.max(byId.thornmail.score,byId.morellonomicon.score)-
  byId.riftmaker.score:0;
 return {ok:true,options,byId,
  preferred:options[0].itemId,observedHealingSeverity,
  antihealNeed,antihealPreferred:antihealNeed&&threshold>0,
  notes:[
   'Une fiche de champion qui possède du soin ne prouve pas que les soins empêchent les éliminations.',
   'Cotte : blessures graves sur dégâts et attaques reçues, mais renvoi de dégâts uniquement si Galio est attaqué.',
   'Morellonomicon : blessures graves via dégâts magiques, AP et accélération mais aucune armure.',
   'Créateur de failles : AP, amplification et omnivampirisme sans blessures graves.'
  ],actualMatchNotObserved:observedHealingSeverity===0,version:VERSION};
}
function candidates({prepared,optimizer,order,threats={},observedHealingSeverity=0,
 beingAutoAttacked=false,mainItems}={}){
 if(!prepared?.ok||!optimizer?.calculate||!order?.order)return {ok:false,reason:'Moteur non prêt'};
 const catalog=prepared.catalog,comps=compareCandidates({catalog,threats,observedHealingSeverity,beingAutoAttacked});
 if(!comps.ok)return comps;
 const byId=new Map(catalog.items.map(x=>[x.id,x]));
 // Compare three-to-four item paths on the same valid defensive core, not
 // assume the player will own all optional items.
 const core=['hollow_radiance','unending_despair'];
 const chosen=core.map(id=>byId.get(id));
 if(chosen.some(x=>!x))return {ok:false,reason:'Core de référence indisponible'};
 const candidates=[];
 const plans=[
  ['riftmaker','oceanids_trident'],
  ['riftmaker','amaranths_twinguard'],
  ['riftmaker','liandrys_torment'],
  ['riftmaker','thornmail'],
  ['thornmail','riftmaker'],
  ['morellonomicon','riftmaker'],
  ['riftmaker','morellonomicon']
 ];
 const seen=new Set();
 for(const [third,fourth] of plans){
  const prefix=[...core,third,fourth];
  if(seen.has(prefix.join('|')))continue;
  seen.add(prefix.join('|'));
  if(!prepared.core.validateEquipment(prefix,catalog,prepared.rules).valid)continue;
  const three=prefix.slice(0,3),four=prefix;
  const ranks=[three,four].map(ids=>{
   const items=ids.map(id=>byId.get(id));
   return {items:ids,score:optimizer.calculate(items,threats).score};
  });
  const thirdEval=comps.byId[third]||evaluateItem(byId.get(third),{
   threats,observedHealingSeverity,beingAutoAttacked});
  const fourthEval=comps.byId[fourth]||evaluateItem(byId.get(fourth),{
   threats,observedHealingSeverity,beingAutoAttacked});
  const pressure=thirdEval.score*1.55+fourthEval.score*0.75;
  const antihealCount=[third,fourth].filter(id=>id==='thornmail'||id==='morellonomicon').length;
  const opportunityCost=observedHealingSeverity<2&&antihealCount?2.5:0;
  const score=ranks[0].score*1.1+(ranks[1].score-ranks[0].score)*0.5+pressure-opportunityCost;
  candidates.push({third,fourth,firstTwo:core,items:four,
   score:Number(score.toFixed(3)),threeItemScore:ranks[0].score,fourItemScore:ranks[1].score,
   thirdMechanics:thirdEval,actualLiveInfo:observedHealingSeverity>0,
   legal:true,conditional:true});
 }
 candidates.sort((a,b)=>b.score-a.score||a.items.join('|').localeCompare(b.items.join('|')));
 return {ok:true,version:VERSION,core,scenarios:candidates,
  preferred:candidates[0]||null,comparison:comps,
  note:'Scenarios de troisième et quatrième achat, avec et sans anti-soin ; aucun achat ne prouve l’équipement adverse. Les alternatives restent théoriques.',
  noClaimThatThirdItemIsUniversallyOptimal:true};
}
return Object.freeze({VERSION,classify,evaluateItem,compareCandidates,candidates});
});
