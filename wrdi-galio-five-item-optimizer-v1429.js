/* WRDI V14.29 — five-item Galio mid qualitative draft optimizer.
 * Sources: ONLY player-supplied Wild Rift client items + equip restrictions.
 * No observed/popular builds, external item metadata, damage forecasts or winrate.
 * Beam search explores full legal combinations rather than picking one of several
 * relevant options. Boots/enchantments handled separately (not in these 5 slots).
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioFiveItemOptimizerV1429=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.3.0-alpha.1';
const synergyEngine=(typeof require==='function'
 ? require('./wrdi-galio-kit-item-synergy-v1434.js')
 : (typeof globalThis!=='undefined'?globalThis.WRDI_GalioKitItemSynergyV1434:null));
const defenseBalance=(typeof require==='function'
 ? require('./wrdi-galio-defense-balance-v153.js')
 : (typeof globalThis!=='undefined'?globalThis.WRDI_GalioDefenseBalanceV153:null));
const num=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,v):0;
const count=v=>Math.min(5,num(v));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
function features(item){
 const stats=item.stats||{},passives=(item.passives||[]).map(p=>p.mechanics||{});
 const has=k=>passives.some(p=>num(p[k])>0);
 return {ap:num(stats.ap),hp:num(stats.hp),armor:num(stats.armor),mr:num(stats.mr),
  ah:num(stats.ah),ad:num(stats.ad),as:num(stats.as_pct),magicPen:num(stats.mpen_pct),
  antiheal:has('grievous_wounds_pct'),
  maxHp:passives.some(p=>String(p.damage_per_tick_formula||'').includes('target_max_hp')),
  ramp:has('max_amp_pct')||has('max_damage_amp_pct'),shred:has('mr_shred_per_stack_pct'),
  shieldCut:passives.some(p=>p.effect==='shield_reduction'||num(p.shield_reduction_pct)>0||typeof p.shield_reduction_aoe_pct_formula==='string'||typeof p.shield_reduction_single_pct_formula==='string'),
  slow:passives.some(p=>has('slow_pct')||p.effect==='slow'),
  protective:passives.some(p=>p.effect==='area_heal'||p.effect==='ally_shield'),
  active:passives.some(p=>p.active===true),
  stasis:passives.some(p=>p.active===true&&num(p.stasis_s)>0),
  critMitigation:passives.some(p=>num(p.physical_crit_damage_reduction_pct)>0),
  waveclear:passives.some(p=>num(p.minion_multiplier)>1||Array.isArray(p.minion_multiplier_range)),
  hybridDefense:num(stats.armor)>0&&num(stats.mr)>0};
}
function eligible(prepared){
 if(!prepared?.ok||!Array.isArray(prepared.catalog?.items))return [];
 return prepared.catalog.items.filter(item=>['legendary','active'].includes(item.item_type)&&
  item.completeness?.description==='documented'&&
  ['visible','visible_client_shop','user-confirmed'].includes(item.completeness?.price)&&
  Number.isFinite(item.price_gold)&&item.price_gold>0&&item.stats&&
  (item.passives||[]).every(p=>typeof p.description_fr==='string')&&
  num(item.stats.ad)===0&&num(item.stats.as_pct)<40&&
  (item.item_type!=='active'||item.price_gold>=2000)&&
  (num(item.stats.ap)>=40||num(item.stats.hp)>=200||num(item.stats.armor)>=40||num(item.stats.mr)>=40))
 .map(item=>({...item,feature:features(item)}));
}
function weights(threats={}){
 return {physical:count(threats.ad),magic:count(threats.ap),tank:count(threats.tank),
  heal:Math.max(count(threats.heal),count(threats.sustain)>=2?1:0),
  shield:count(threats.shield),cc:count(threats.cc),burst:count(threats.burst),
  assassin:count(threats.assassin),crit:count(threats.crit),
  frontlineNeed:count(threats.frontlineNeed),waveclearNeed:count(threats.waveclearNeed),
  lanePhysical:count(threats.lanePhysical),laneMagic:count(threats.laneMagic),
  laneAllIn:count(threats.laneAllIn),jungleAllIn:count(threats.jungleAllIn),
  peelNeed:count(threats.peelNeed),critPotential:count(threats.critPotential)};
}
function calculate(items,threats){
 const t=weights(threats),fs=items.map(x=>x.feature||features(x));
 const total=key=>fs.reduce((v,x)=>v+x[key],0);
 const n=key=>fs.filter(x=>x[key]).length;
 // Galio is an AP engage/peel mid. Prefer a coherent blend of offense and durability.
 // Explicit diminishing returns prevent blindly stacking five objects of the same role.
 let score=0;const reasons=[];
 const hp=Math.min(1500,total('hp')),ap=Math.min(260,total('ap'));
 const ah=Math.min(70,total('ah')),armor=total('armor'),mr=total('mr');
 const frontline=t.frontlineNeed>0?1:0;
 const assassination=t.assassin>=2||t.burst>=2;
 // Five-slot opportunity cost: overall team needs affect the AP/defense
 // balance. These weights are qualitative, not simulated damage.
 score+=ap/(frontline?70:41)+hp/(frontline?125:175)+ah/25;
 if(items.length>=3){
  if(ap<40)score-=frontline?1:5;
  if(hp<300)score-=frontline?8:5;
 }
 const physWeight=t.physical+(assassination?Math.min(t.assassin,3)*0.7:0)+
  (t.lanePhysical&&t.laneAllIn?1.2:0)+(t.jungleAllIn&&t.physical>=2?0.4:0);
 if(physWeight>=2)score+=Math.min(170,armor)*(frontline?0.075:0.055)*Math.min(1.6,physWeight/2.5);
 const magicWeight=t.magic+(t.laneMagic&&t.laneAllIn?1.2:0);
 if(magicWeight>=2)score+=Math.min(160,mr)*(frontline?0.073:0.055)*Math.min(1.5,magicWeight/2.5);
 if(frontline&&items.length>=4&&hp<700)score-=5;
 if(frontline&&items.length>=4&&armor+mr<80)score-=5;
 if(t.physical>=2&&armor>0)reasons.push('Armure face aux menaces physiques');
 if(t.magic>=2&&mr>0)reasons.push('Résistance magique face aux menaces magiques');
 if(frontline&&hp>0)reasons.push('Première ligne renforcée pour les alliés');
 if(t.heal>0&&n('antiheal')){score+=3+Math.min(2,t.heal);reasons.push('Blessures graves contre les soins');}
 if(t.tank>=2&&n('maxHp')){score+=5;reasons.push('Effet documenté sur les PV max des tanks');}
 if(t.tank>=2&&n('ramp')){score+=2;reasons.push('Passif de combat prolongé');}
 if(t.tank>=2&&n('shred')){score+=2;reasons.push('Réduction progressive de résistance magique');}
 if(t.shield>0&&n('shieldCut')){score+=3;reasons.push('Réduction de bouclier documentée');}
 if(assassination&&n('stasis')){score+=5;reasons.push('Stase active contre un engagement explosif');}
 if(assassination&&hp>=550)score+=2;
 if(t.crit>0&&n('critMitigation')){score+=3+Math.min(2,t.crit);reasons.push('Réduction de dégâts critiques documentée');}
 // Context-sensitive passive: Randuin without confirmed critical attacks has
 // less utility than an armor item with a generally applicable passive.
 if(!t.crit)score-=n('critMitigation')*7;
 if(t.waveclearNeed>0&&n('waveclear')){score+=3;reasons.push('Immolation facilitant la gestion des vagues');}
 if(t.cc>=2&&n('protective'))score+=1;
 if(t.peelNeed&&n('protective'))score+=Math.min(2,t.peelNeed);
 if(t.lanePhysical&&t.laneAllIn&&armor>0)reasons.push('Tenue de lane contre un engagement physique');
 if(t.laneMagic&&t.laneAllIn&&mr>0)reasons.push('Tenue de lane contre un engagement magique');
 if(frontline&&n('hybridDefense')&&t.physical>=1&&t.magic>=1)score+=2;
 score-=Math.max(0,n('antiheal')-1)*5;
 score-=Math.max(0,n('maxHp')-1)*3;
 score-=Math.max(0,n('shred')-1)*2;
 score-=Math.max(0,n('shieldCut')-1)*3;
 score-=Math.max(0,n('critMitigation')-1)*4;
 // Sustained tank Galio need not be punished for having only 1 AP item.
 if(!frontline&&items.length>=4&&total('ap')<90)score-=6;
 // Kit-to-passive compatibility: direct activations and conditional usefulness
 // use Galio's actual cast/taunt/knock-up/empowered attack/engage kit.
 // Nothing is assigned by the name of an enemy champion or popular build.
 let synergy=null;
 if(synergyEngine?.build){
  synergy=synergyEngine.build(items,t);
  if(synergy.ok){
   score+=synergy.score*0.7;
   if(synergy.combinations.length)reasons.push(...synergy.combinations.slice(0,2));
  }
 }
 // Full-composition defensive coverage is independent from lane-only pressure.
 // Apply progressively as five slots fill; no hard-coded mandatory items.
 const balance=defenseBalance?.evaluate?.(items,threats);
 if(balance){
  score+=balance.score;
  if(items.length===5)reasons.push(...balance.reasons.slice(0,2));
 }
 const stats={hp:total('hp'),ap:total('ap'),armor,mr,ah:total('ah')};
 return {score:Math.round(score*100)/100,reasons,stats,needs:t,synergy,balance};
}
function optimize({prepared,threats={},slots=5,beamWidth=100}={}){
 if(!prepared?.ok||!prepared.core?.validateEquipment)return {ok:false,reason:'Catalogue client indisponible'};
 if(slots!==5)return {ok:false,reason:'Ce moteur construit exactement cinq objets principaux'};
 const pool=eligible(prepared);
 if(pool.length<slots)return {ok:false,reason:'Pas assez de fiches d’objets achetables et pertinentes pour Galio',poolSize:pool.length};
 let beam=[{items:[],ids:[],score:0}];
 for(let depth=1;depth<=slots;depth++){
  const candidates=[];
  for(const partial of beam){
   const last=partial.items.length?pool.indexOf(partial.items.at(-1)):-1;
   for(let i=last+1;i<pool.length;i++){
    const item=pool[i];if(partial.ids.includes(item.id))continue;
    const ids=[...partial.ids,item.id];
    if(!prepared.core.validateEquipment(ids,prepared.catalog,prepared.rules).valid)continue;
    const items=[...partial.items,item],measure=calculate(items,threats);
    candidates.push({items,ids,score:measure.score,measure});
   }
  }
  if(!candidates.length)return {ok:false,reason:'Impossible de constituer cinq objets compatibles',depth};
  candidates.sort((a,b)=>b.score-a.score||a.ids.join('|').localeCompare(b.ids.join('|')));
  beam=candidates.slice(0,Math.max(20,Math.min(200,beamWidth)));
 }
 // Do not present duplicate combinations as situational options. Instead explain
 // how a legal alternative changes the needs addressed by the chosen five.
 const winner=beam[0];
 const others=beam.slice(1).filter(x=>x.ids.some(id=>!winner.ids.includes(id))).slice(0,3);
 const result=x=>({items:x.items.map((item,i)=>({
  id:item.id,name:item.name_fr,priceGold:num(item.price_gold)||null,
  slot:i+1,reason:reasonFor(item,threats)})),
  suitability:x.score,reasons:x.measure.reasons,stats:x.measure.stats,
  legal:true,source:'player_client_items_only'});
 return {ok:true,game:'Wild Rift mobile',version:VERSION,
  main:result(winner),alternatives:others.map(result),
  evaluatedPool:pool.length,slots:5,bootsSeparate:true,
  noPopularityData:true,noDamageForecast:true,winRate:null,activeItemsInFive:true,
  theoreticalOnly:true,method:'legal_five_item_beam_search'};
}
function reasonFor(item,threats){
 const f=item.feature||features(item),t=weights(threats),r=[];
 const synergy=synergyEngine?.evaluate?.(item,t);
 if(synergy?.ok){
  const direct=synergy.entries.find(x=>x.level==='direct');
  const conditional=synergy.entries.find(x=>x.level==='conditional');
  const chosen=direct||conditional;
  if(chosen)r.push(chosen.reason);
 }
 if(t.heal&&f.antiheal)r.push('Anti-soins');
 if(t.assassin>=2&&f.stasis)r.push('Stase contre assassins');
 if(t.crit&&f.critMitigation)r.push('Contre dégâts critiques confirmés');
 if(!t.crit&&f.critMitigation)r.push('Passif anti-critiques non confirmé (seule armure évaluée)');
 if(t.lanePhysical&&t.laneAllIn&&f.armor)r.push('Protection face au mid physique');
 if(t.laneMagic&&t.laneAllIn&&f.mr)r.push('Protection face au mid magique');
 if(t.frontlineNeed&&f.hybridDefense)r.push('Résistances pour première ligne');
 if(t.waveclearNeed&&f.waveclear)r.push('Nettoyage de vague');
 if(t.tank>=2&&f.maxHp)r.push('Contre les PV max');
 if(t.tank>=2&&f.shred)r.push('Réduction de RM');
 if(t.physical>=2&&f.armor)r.push('Protection physique');
 if(t.magic>=2&&f.mr)r.push('Protection magique');
 if(f.ap)r.push('Puissance pour Galio');
 if(f.hp)r.push('Survie en engagement');
 if(f.ah)r.push('Disponibilité des contrôles');
 return r.slice(0,2).join(' · ')||'Utilité situationnelle documentée';
}
return Object.freeze({VERSION,features,eligible,weights,calculate,optimize,reasonFor});
});
