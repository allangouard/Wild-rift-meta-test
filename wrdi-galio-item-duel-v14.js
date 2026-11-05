/* WRDI V14.6 — comparateur descriptif Cotte epineuse / Desespoir infini.
 * Hypotheses explicites : stats de catalogue client 7.3d, aucune recommandation.
 * Les degats des passifs sont des expressions brutes conditionnelles, pas des DPS reels.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioItemDuelV14=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.6.0-alpha.1',IDS=['thornmail','unending_despair'];
const REQUIRED={
 thornmail:[{name:'Épines',trigger:'attacked',damage_formula:'20 + 0.06 * bonus_armor + 0.01 * bonus_hp'},
           {name:'Entrelacs',grievous_wounds_pct:50,duration_s:3}],
 unending_despair:[{name:'Affliction',tick_s:4,damage_formula:'0.03 * own_max_hp',heal_multiplier_of_damage_dealt:2.5}]
};
const finite=(x,min)=>typeof x==='number'&&Number.isFinite(x)&&x>=min;
const err=x=>Object.freeze({ok:false,status:'incomplete-evidence',errors:[x],recommendationEligible:false});
function evaluate({catalog,rules,core,base}={}){
 if(!core||typeof core.validateSources!=='function'||typeof core.validateEquipment!=='function')
   return err('Moteur V14.0 requis.');
 const sources=core.validateSources(catalog,rules);
 if(!sources.ok)return err('Catalogue client et restrictions incompatibles.');
 if(sources.patch!=='7.3d')return err('Comparateur documenté uniquement pour le catalogue client 7.3d.');
 const hp=base?.hp,armor=base?.armor,mr=base?.mr;
 if(!finite(hp,1)||!finite(armor,0)||!finite(mr,0))
   return err('PV, armure et RM avant achat doivent être des nombres finis positifs ou nuls.');
 const map=new Map(catalog.items.map(x=>[x.id,x]));
 const results=[];
 for(const id of IDS){
   const item=map.get(id);
   if(!item||!core.validateEquipment([id],catalog,rules).valid)
     return err('Objet absent ou interdit : '+id);
   const {stats={},passives=[]}=item;
   if(!finite(item.price_gold,1)||!finite(stats.hp,0)||!finite(stats.armor??0,0)||
      !finite(stats.mr??0,0)||!finite(stats.ah??0,0))
     return err('Statistiques client absentes ou invalides pour '+id);
   for(const req of REQUIRED[id]){
     const p=passives.find(x=>x.name===req.name);
     if(!p||Object.entries(req).some(([k,v])=>k!=='name'&&p.mechanics?.[k]!==v))
       return err('Mécanique documentée absente ou différente pour '+id+' / '+req.name);
   }
   const ownHp=hp+stats.hp,ownArmor=armor+(stats.armor||0),ownMr=mr+(stats.mr||0);
   // EHP contre un type de degat constant, sans penetration, bouclier, regen ni effets uniques.
   const physicalEhp=ownHp*(1+ownArmor/100);
   const magicEhp=ownHp*(1+ownMr/100);
   const physicalGain=physicalEhp-hp*(1+armor/100);
   const magicGain=magicEhp-hp*(1+mr/100);
   results.push(Object.freeze({
     id,name:item.name_fr,priceGold:item.price_gold,
     bonus:Object.freeze({hp:stats.hp,armor:stats.armor||0,mr:stats.mr||0,ah:stats.ah||0}),
     post:Object.freeze({hp:ownHp,armor:ownArmor,mr:ownMr}),
     ehp:Object.freeze({physical:physicalEhp,magic:magicEhp,
                       physicalGain,magicGain}),
     mechanics:id==='thornmail'
       ?Object.freeze({
         onAttackReturnRaw:20+0.06*(stats.armor||0)+0.01*stats.hp,
         healingReductionPct:50,durationSeconds:3,
         description:'Retour par attaque subie, brut conditionnel ; le renvoi ne garantit pas un dégât réel.'
       })
       :Object.freeze({
         oneProcRaw:0.03*ownHp,tickSeconds:4,
         healMultiplier:2.5,
         description:'Un proc de dégâts magiques bruts après 4 s de combat conditionnel ; soin dépendant des dégâts réellement infligés.'
       })
   }));
 }
 return Object.freeze({
   ok:true,status:'scenario-only',patch:'7.3d',game:'Wild Rift mobile',
   base:Object.freeze({hp,armor,mr}),
   items:Object.freeze(results),
   recommendationEligible:false,
   assumptions:Object.freeze([
     'Les PV, armure et RM de départ sont une hypothèse entrée manuellement, pas des statistiques de Galio relevées automatiquement.',
     'EHP isolés contre un seul type de dégâts : sans pénétration, dégâts véritables, soins, bouclier, résistances réduites ou déclenchement de passifs.',
     'Les PV et résistances des deux objets proviennent du catalogue client déclaré 7.3d, dont les interactions ne sont pas totalement testées.',
     'Épines : calcul brut pour une attaque qui déclenche le passif, sans mitigation de la cible.',
     'Affliction : calcul brut pour un déclenchement conditionnel après 4 secondes de combat, sans mitigation ni garanties de contact.',
     'Aucun soin ou DPS réel prédit ; les deux passifs ne sont pas comparables directement par leur chiffre brut.',
     'Aucun avantage contre la draft ni ordre d’achat recommandé ; patchs des sources adverses non nécessairement alignés.'
   ])
 });
}
return Object.freeze({VERSION,IDS,evaluate});
});
