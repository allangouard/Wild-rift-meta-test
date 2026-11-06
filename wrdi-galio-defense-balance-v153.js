/* WRDI V15.3: distinguish early lane resist from whole-draft defensive coverage.
 * Fully qualitative: no opponent item builds, damage forecasts or champion names.
 * Resistances may coexist when their threats justify it; they are never banned.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioDefenseBalanceV153=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const n=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,v):0;
const cap=(x,max)=>Math.min(max,n(x));
function evaluate(items,threats={}){
 const t=threats||{},length=Array.isArray(items)?items.length:0;
 if(!length)return {score:0,reasons:[],targets:{armor:0,mr:0}};
 const stats=items.reduce((sum,x)=>{
  const s=x.stats||{};
  return {armor:sum.armor+n(s.armor),mr:sum.mr+n(s.mr)};
 },{armor:0,mr:0});
 const physical=cap(t.ad,5)+0.5*cap(t.hybrid,5);
 const magical=cap(t.ap,5)+0.5*cap(t.hybrid,5);
 const lanePhysical=Boolean(t.lanePhysical),laneMagic=Boolean(t.laneMagic);
 // One AP lane opponent creates a first-item MR reason, but does not mean
 // three AP defenses are desirable against three other physical threats.
 const armorBase=physical>=2?Math.min(110,45+(physical-2)*32):lanePhysical?35:0;
 // Allied tanks can absorb a portion of teamfight duty. Galio still needs
 // baseline defense to survive lane and mixed-damage dives, not a full tank set.
 const armorTarget=t.frontlineProvided>=2&&!t.frontlineNeed?
  Math.max(40,armorBase-15):armorBase;
 const magicTarget=magical>=2?Math.min(110,45+(magical-2)*32):laneMagic?40:0;
 const progress=length<=2?0:length===3?0.55:length===4?0.78:1;
 const deficit=(target,current)=>Math.max(0,target-current)/10;
 let score=0;const reasons=[];
 if(progress&&armorTarget){
  score-=progress*deficit(armorTarget,stats.armor)*2.4;
  if(stats.armor>=armorTarget)reasons.push('Armure suffisante pour les menaces physiques de la draft');
 }
 if(progress&&magicTarget){
  score-=progress*deficit(magicTarget,stats.mr)*1.8;
  if(stats.mr>=magicTarget)reasons.push('RM suffisante face aux menaces magiques identifiées');
 }
 // Diminishing returns for the excess defense against an underrepresented
 // damage type. The threshold is contextual rather than a fixed "only one MR".
 if(progress&&physical>magical+0.5){
  const acceptableMr=Math.max(55,magicTarget+15);
  score-=progress*Math.max(0,stats.mr-acceptableMr)*0.095;
 }
 if(progress&&magical>physical+0.5){
  const acceptableArmor=Math.max(55,armorTarget+15);
  score-=progress*Math.max(0,stats.armor-acceptableArmor)*0.07;
 }
 if(progress&&physical>=2&&magical>=1&&stats.armor>=35&&stats.mr>=35){
  score+=progress*1.5;reasons.push('Couverture défensive mixte sans abandonner le matchup de lane');
 }
 return {score:Math.round(score*100)/100,targets:{armor:armorTarget,mr:magicTarget},
  stats,physical,magical,reasons,
  rationale:'Résistances réparties sur les cinq objets selon les menaces de toute la draft, et non le seul mid'};
}
return Object.freeze({VERSION:'15.6.0',evaluate});
});
