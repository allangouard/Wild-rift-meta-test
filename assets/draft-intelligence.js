/* V11.2 — conservative draft-aware heuristics, NOT verified passive simulation. */
(function(g){'use strict';
const norm=x=>String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'");
function context(champ,enemies,c,coreNames){
 const names=enemies.map(norm),core=coreNames.map(norm),galio=norm(champ)==='10099'||norm(champ)==='galio';
 const crit=names.some(x=>/caitlyn|yasuo|yone|jinx|tristana|draven|xayah|tryndamere|aphelios|sivir/.test(x));
 const sustain=names.some(x=>/aatrox|vladimir|soraka|mundo|warwick|swain|fiora|renekton|volibear|yuumi|nami/.test(x));
 const coreAntiHeal=core.some(x=>/epineuse|thornmail|morello|rappel mortel|mortal reminder/.test(x));
 return {galio,crit,sustain,coreAntiHeal,tanks:c.tank||0,ad:c.ad||0,ap:c.ap||0,cc:c.cc||0,enemy:names};
}
function evaluate(name,st,ctx,mode){
 const n=norm(name),reasons=[],armor=Number(st.Armor)||0,mr=Number(st.Mr)||0,hp=Number(st.Hp)||0,ap=Number(st.Ap)||0,haste=Number(st.Haste)||0;
 let score=0,allowed=true,family='',timing='si cette menace devient prioritaire';
 const has=(...parts)=>parts.some(x=>n.includes(x));
 const critDefense=has('randuin','presage de randuin');
 const spellblade=has('fleau de liche','lich bane','gantelet givrant','iceborn gauntlet','trinite','trinity force','divine sunderer');
 const antiheal=has('cotte epineuse','thornmail','morellonomicon','morello','rappel mortel','mortal reminder');
 const burn=has('liandry','tourment','torment','creature de failles','createur de failles','riftmaker');
 if(armor>0&&ctx.ad>=2){score+=Math.min(armor,90)*.7;reasons.push('armure contre les menaces physiques identifiées')}
 if(mr>0&&ctx.ap>=2){score+=Math.min(mr,90)*.7;reasons.push('résistance magique contre les menaces magiques identifiées')}
 if(hp>0){score+=Math.min(hp,650)*.025;reasons.push('PV supplémentaires')}
 if(critDefense){family='anti-crit';if(ctx.crit){score+=75;reasons.unshift('passif orienté contre les coups critiques : pertinent si le tireur adverse investit dans les critiques');timing='si les coups critiques adverses deviennent dangereux'}else score-=55}
 if(antiheal){family='anti-heal';if(ctx.coreAntiHeal){score-=120;reasons.push('effet anti-soins déjà présent dans le core : éviter la redondance')}else if(ctx.sustain){score+=50;reasons.unshift('soins adverses identifiés : effet anti-soins à vérifier sur cet objet');timing='si les soins adverses sont significatifs'}else score-=35}
 if(burn&&ctx.tanks>=1){score+=32;reasons.unshift('option à examiner contre les champions résistants ; passif non simulé');timing='si les combats contre les tanks se prolongent'}
 if(spellblade){family='spellblade';if(ctx.galio){if(has('fleau de liche','lich bane')){score-=125;reasons.unshift('passif nécessitant des attaques après compétence : priorité réduite sur Galio tank sans simulation de ses attaques de base')}else if(has('gantelet givrant','iceborn gauntlet')){score+=24;reasons.unshift('armure et utilité de contrôle possibles ; déclenchement après compétence à confirmer')}}}
 if(ctx.galio&&mode==='damage'){
  // A tank Galio core should not be converted into a glass-cannon build solely from AP stat weights.
  if(ap>0&&armor===0&&mr===0&&hp===0)score-=55;
  if(has('fleau de liche','lich bane'))score-=45;
 }
 if(ctx.galio&&mode==='survive'&&armor+mr+hp===0)score-=80;
 if(mode==='damage'&&ap>0)score+=Math.min(ap,150)*.2;
 if(mode==='balanced'&&has('gantelet givrant','iceborn gauntlet')&&ctx.ad>=2)score+=28;
 if(has('gantelet givrant','iceborn gauntlet'))family='iceborn';
 if(has('fleau de liche','lich bane'))family='lichbane';
 if(!reasons.length)reasons.push('statistiques compatibles avec le besoin retenu ; effet unique non vérifié');
 return {allowed,score,reasons,timing,family};
}
g.WRDIDraftIntelligence=Object.freeze({context,evaluate});
})(window);
