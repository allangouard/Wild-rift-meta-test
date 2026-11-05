/* Wild Rift Draft Intelligence V14.27 — evidence-first contextual item suitability.
 * The authoritative user client catalog supplies exact stats/passives/prices.
 * Only explicitly represented mechanics may influence heuristic suitability.
 * Does not simulate proc frequency, builds or combat DPS.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioItemContextV1427=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.27.0-alpha.1';
const safe=n=>Number.isFinite(Number(n))&&Number(n)>0?Math.min(5,Number(n)):0;
const nonneg=n=>Number.isFinite(Number(n))&&Number(n)>0?Number(n):0;
function inspect({itemName,prepared,threats}={}){
 const guard=prepared?.ok&&prepared.core;
 if(!guard)return {ok:false,reason:'Catalogue client et garde-fou indisponibles'};
 const key=String(itemName||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
 if(!key||prepared.collisions.has(key))return {ok:false,reason:'Nom absent ou ambigu'};
 const item=prepared.byName.get(key);
 if(!item)return {ok:false,reason:'Objet absent du catalogue client'};
 const documented=item?.completeness?.description==='documented';
 const priceConfirmed=['visible','visible_client_shop','user-confirmed'].includes(item?.completeness?.price);
 const usable=documented&&priceConfirmed&&nonneg(item.price_gold)>0&&item.item_type==='legendary'&&item.stats&&Array.isArray(item.passives);
 if(!usable)return {ok:false,reason:'Fiche incomplète ou objet non achetable directement'};
 const stats=item.stats,mechanics=item.passives.map(p=>p.mechanics).filter(Boolean);
 const why=[],signals=[],add=(score,reason,id)=>{if(score>0){signals.push({id,weight:score});why.push(reason);}};
 const armor=nonneg(stats.armor),mr=nonneg(stats.mr),hp=nonneg(stats.hp),ap=nonneg(stats.ap),ah=nonneg(stats.ah);
 const ad=safe(threats?.ad),magic=safe(threats?.ap),tank=safe(threats?.tank),heal=safe(threats?.heal);
 if(ad>=2&&armor>=30)add(Math.min(2,ad),'Armure documentée contre plusieurs sources de dégâts physiques','armor');
 if(magic>=2&&mr>=30)add(Math.min(2,magic),'Résistance magique documentée contre plusieurs sources de dégâts magiques','mr');
 const antiheal=mechanics.find(m=>nonneg(m.grievous_wounds_pct)>0);
 if(heal>=1&&antiheal)add(heal>=2?3:2,'Blessures graves '+antiheal.grievous_wounds_pct+' % documentées ; application conditionnelle à son déclencheur','antiheal');
 const hpBurn=mechanics.some(m=>typeof m.damage_per_tick_formula==='string'&&m.damage_per_tick_formula.includes('target_max_hp'));
 if(tank>=2&&hpBurn)add(3,'Passif documenté infligeant des dégâts selon les PV max de la cible ; déclenchement non simulé','maxhp');
 const ramp=mechanics.some(m=>nonneg(m.max_damage_amp_pct)>0||nonneg(m.max_amp_pct)>0);
 if(tank>=2&&ramp)add(1,'Amplification progressive documentée : pertinente à examiner en combat prolongé','ramp');
 const line=signals.reduce((sum,x)=>sum+x.weight,0);
 const statSummary={hp,armor,mr,ap,ah};
 return {ok:true,id:item.id,name:item.name_fr,priceGold:item.price_gold,
  source:'player_verified_client_7.3d',stats:statSummary,passives:item.passives.map(p=>p.name),
  indications:why,signals,suitabilityIndex:line,
  tacticalValidated:false,damageSimulated:false,winRate:null,
  note:'Indice de cohérence avec les menaces détectées, sans promesse de performance.'};
}
function rank({candidates,prepared,threats}={}){
 if(!Array.isArray(candidates))return {ok:false,reason:'Liste de candidats absente'};
 const evaluated=candidates.map((x,i)=>({candidate:x,originalIndex:i,review:inspect({itemName:x.name,prepared,threats})}));
 const sorted=[...evaluated].sort((a,b)=>{
  const score=x=>x.review.ok?x.review.suitabilityIndex:0;
  return score(b)-score(a)||a.originalIndex-b.originalIndex;
 });
 return {ok:true,entries:sorted,missing:evaluated.filter(x=>!x.review.ok).length,
  certifiedOptimal:false,status:'contextual_suitability_only'};
}
return Object.freeze({VERSION,inspect,rank});
});
