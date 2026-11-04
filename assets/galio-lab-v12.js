/* WRDI Galio Lab v12 — Wild Rift client 7.3d data, deliberately partial simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDIGalioLabV12=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const modeled=new Set(['rabadons_deathcap','riftmaker']);
const zero=()=>({hp:0,armor:0,mr:0,ap:0,ad:0,mana:0,ah:0,mpen_pct:0,mpen_flat:0});
const num=x=>Number.isFinite(Number(x))?Number(x):0;
function evaluate(ids,catalog,rules,scenario,validator){
 const validation=validator(ids,rules);
 const itemMap=new Map(catalog.map(i=>[i.id,i]));
 const chosen=ids.filter(Boolean).map(id=>itemMap.get(id)).filter(Boolean);
 const unknown=ids.filter(Boolean).filter(id=>!itemMap.has(id));
 const s=zero(), missing=[],prices=[];
 for(const it of chosen){for(const k of Object.keys(s)) if(it.stats&&it.stats[k]!==undefined) s[k]+=num(it.stats[k]);if(it.price_gold==null)missing.push(it.name_fr+' : prix');else prices.push(it.price_gold);}
 const hpBonus=s.hp, armorBonus=s.armor,mrBonus=s.mr;
 const totalApPre=s.ap+(ids.includes('riftmaker')?hpBonus*.02:0);
 const ap=totalApPre*(ids.includes('rabadons_deathcap')?1.3:1);
 const hp=num(scenario.baseHp)+hpBonus,armor=num(scenario.baseArmor)+armorBonus,mr=num(scenario.baseMr)+mrBonus;
 const meleeAd=num(scenario.baseAd)+s.ad;
 const effectiveMr=num(scenario.enemyMr)*(1-Math.min(100,s.mpen_pct)/100)-s.mpen_flat;
 const resistanceMultiplier=effectiveMr>=0?100/(100+effectiveMr):2-100/(100-effectiveMr);
 const level=Math.max(1,Math.min(15,Math.floor(num(scenario.level)||1)));
 // Coefficients from the user-supplied in-game Galio reference, not full rank-dependent current data.
 const passive=15+10*level+meleeAd+.45*ap+.60*mrBonus;
 const q=70+.75*ap+(num(scenario.enemyHp)*(.08+.02*(ap/100)));
 const e=90+.80*ap;
 const raw=passive+q+e;
 const physicalFraction=Math.min(1,Math.max(0,num(scenario.physicalPct)/100));
 const armorMult=armor>=0?100/(100+armor):2-100/(100-armor);
 const mrMult=mr>=0?100/(100+mr):2-100/(100-mr);
 const eHp=hp/(physicalFraction*armorMult+(1-physicalFraction)*mrMult);
 const unsupported=[];
 for(const it of chosen){if((it.passives||[]).length&&!modeled.has(it.id))unsupported.push(it.name_fr);}
 if(ids.includes('riftmaker'))unsupported.push('Créateur de failles : amplification/omnivamp non simulés');
 for(const id of unknown)missing.push(id+' : absent du catalogue');
 return {valid:validation.valid&&!unknown.length,validation,unknown,stats:{...s,ap,hp,armor,mr,bonusHp:hpBonus,bonusMr:mrBonus},rawDamage:raw,magicDamage:raw*resistanceMultiplier,effectiveMr,ehp:eHp,costKnown:prices.reduce((a,b)=>a+b,0),missingPrices:missing,notModeled:unsupported,damageComponents:{passive,q,e},assumptions:'A + E + une attaque passive ; tornade entière; sans ultime, runes ni autres passifs conditionnels.'};
}
return {evaluate};
});
