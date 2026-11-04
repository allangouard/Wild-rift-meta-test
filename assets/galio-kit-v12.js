/* WRDI V12 step 14: Galio Wild Rift scenario adapter. Reference values from user screenshots, NOT patch certified. */
(function(root){'use strict';
const engine=typeof module==='object'&&module.exports?require('./combat-events-v12.js'):root.WRDI_CombatEventsV12;
if(!engine)throw Error('Load combat-events-v12.js before galio-kit-v12.js');
const finite=(v,n)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error('Invalid '+n);return v;};
const max0=(v,n)=>Math.max(0,finite(v,n));
const abilities=Object.freeze({
 passive:{base:15,perLevel:10,ad:1,ap:.45,bonusMr:.60},
 Q:{base:70,ap:.75,cd:11.5,tornadoBasePct:.08,tornadoPer100Ap:.02},
 W:{base:40,ap:.55,cd:18,tauntMin:.5,tauntMax:1.5},
 E:{base:90,ap:.80,cd:10},
 R:{base:150,ap:.70,cd:90}
});
function scenario(input){
 const cfg=input||{},level=finite(cfg.level,'level');if(!Number.isInteger(level)||level<1||level>15)throw Error('Galio level must be 1–15');
 const baseStats={...(cfg.baseStats||{})},items=cfg.items||[],target=cfg.target||{};
 if(!Array.isArray(items)||!Array.isArray(cfg.actions))throw Error('items and actions must be arrays');
 const itemBonus=items.reduce((s,i)=>{for(const [k,v] of Object.entries(i.baseStats||{}))s[k]=(s[k]||0)+finite(v,k);return s;},{});
 const stats={...baseStats};for(const [k,v] of Object.entries(itemBonus))stats[k]=(stats[k]||0)+v;
 const ap=max0(stats.abilityPower||0,'AP'),ad=max0(stats.attackDamage||0,'AD'),bonusMr=max0(itemBonus.magicResist||0,'bonus MR');
 const maxHp=max0(target.maxHealth||0,'target HP');
 const formulas={
  passive:abilities.passive.base+abilities.passive.perLevel*level+ad+abilities.passive.ap*ap+abilities.passive.bonusMr*bonusMr,
  Q:abilities.Q.base+abilities.Q.ap*ap,
  W:abilities.W.base+abilities.W.ap*ap,
  E:abilities.E.base+abilities.E.ap*ap,
  R:abilities.R.base+abilities.R.ap*ap
 };
 // The Q tornado is a separate, conditional damage event; its actual ticks depend on target exposure.
 const tornadoTotal=maxHp*(abilities.Q.tornadoBasePct+abilities.Q.tornadoPer100Ap*(ap/100));
 const timeline=[],warnings=[],lastCast={},passiveHits=new Set();let passiveReadyAt=0;
 const actions=cfg.actions.map((a,i)=>({...a,_i:i})).sort((a,b)=>a.at-b.at||a._i-b._i);
 for(const a of actions){const at=max0(a.at,'time'),key=a.ability;
  if(!['passive','Q','W','E','R','Q-tornado'].includes(key))throw Error('Unknown Galio action '+key);
  if(key==='passive'){
   if(at+1e-9<passiveReadyAt){warnings.push('Passive not ready at '+at+'s; skipped');continue;}
   passiveReadyAt=at+5;
  }else if(key!=='Q-tornado'){
   if(lastCast[key]!==undefined&&at-lastCast[key]<abilities[key].cd){warnings.push(key+' cooldown not ready at '+at+'s; skipped');continue;}
   lastCast[key]=at;
   // Only one reduction per ability cast, and only if that ability hit a champion or epic monster.
   if(a.hitChampion===true&&!passiveHits.has(key+':'+at)){
    passiveReadyAt=Math.max(at,passiveReadyAt-3);passiveHits.add(key+':'+at);
   }
  }
  if(key==='Q-tornado'){
   if(a.exposureFraction===undefined)throw Error('Q-tornado requires exposureFraction 0..1');
   const f=finite(a.exposureFraction,'exposureFraction');if(f<0||f>1)throw Error('Exposure fraction must be 0..1');
   timeline.push({at,id:'galio-Q-tornado',type:'hit',raw:tornadoTotal*f,damageType:'magic'});
  }else if(a.hitChampion===true||key==='passive'){
   timeline.push({at,id:'galio-'+key,type:'hit',raw:formulas[key],damageType:'magic'});
  }else timeline.push({at,id:'galio-'+key+'-miss',type:'cast'});
 }
 const result=engine.simulate({baseStats,items,target,timeline,rules:[],durationSeconds:cfg.durationSeconds??10});
 return {...result,galio:{level,formulas,tornadoFullExposureRaw:tornadoTotal,passiveReadyAt,warnings,reference:'User-provided skill screenshots; not patch-verified',excluded:['W damage reduction and shield','R ally shield','skill rank scaling','target movement, range and actual tornado tick behavior','item procs and runes','cast animations and crowd control','ability haste cooldown adjustments','passive reductions from multiple different ability hits outside supplied actions']}};
}
const api=Object.freeze({scenario,referenceCoefficients:abilities});if(typeof module==='object'&&module.exports)module.exports=api;root.WRDI_GalioKitV12=api;
})(typeof globalThis!=='undefined'?globalThis:this);
