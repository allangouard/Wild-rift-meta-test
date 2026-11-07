/* V18.5 — grounded opponent threat evidence from complete Riot Wild Rift kits.
 * Categorical heuristics only, NOT estimates of enemy build or actual proc rate.
 * Unknown conditions stay qualified; do not force counters from a single keyword.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioThreatEvidenceV185=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.5.0';
const normalize=s=>String(s||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").trim();
function evaluate(sheet){
 if(!sheet||!sheet.skills)return {ok:false,reason:'Fiche de compétences officielle absente'};
 const hits={healing:[],allyHealing:[],selfHealing:[],shields:[],allyShielding:[],selfShielding:[],
  maxHpDamage:[],trueDamage:[],control:[],formConditional:[]};
 for(const [slot,spell] of Object.entries(sheet.skills)){
  const raw=String(spell?.description_fr||'');
  const d=normalize(raw);
  if(!d)continue;
  const note={slot,source:'riot_wild_rift_official_description',text:raw.slice(0,160)};
  // Word boundaries and verbs matter: don't turn "deals more damage to
  // healing champions" into a self-heal. "drain" and "fragments d'âme"
  // are documented self-sustain expressions in the client descriptions.
  const heals=/\bsoign(?:e|ent|er|ant|es|eant)\b|\bsoins?\b|\brecuper(?:e|ent)\b.{0,35}\bpv\b|\bregen(?:ere|eration)\b|\brend\b.{0,20}\bpv\b|\bdrain(?:e|ent)\b.{0,30}\bpv\b|\brendent?\b.{0,30}\bpv\b/.test(d);
  const allyHeal=heals&&/\bsoign(?:e|ent|er|ant)\b.{0,65}\balli(?:e|es)\b|\bsoins?\b.{0,65}\balli(?:e|es)\b|\balli(?:e|es)\b.{0,65}\bsoign/.test(d);
  // Negated descriptions like "n'accorde pas de bouclier" describe the
  // ABSENCE of a shield. Do not convert that disclaimer into shield pressure.
  const shieldText=d.replace(/\\b(?:n'accorde pas de|ne confere pas de|sans)\\s+boucliers?\\b/g,'');
  const shields=/\\bbouclier\\b|\\bboucliers\\b/.test(shieldText);
  const allyShield=shields&&/\\bbouclier\\b.{0,100}\\balli(?:e|es)\\b|\\balli(?:e|es)\\b.{0,100}\\bbouclier\\b|\\bbouclier\\b.{0,100}\\bcoequipier/.test(shieldText);
  if(heals){hits.healing.push(note);hits[allyHeal?'allyHealing':'selfHealing'].push(note);}
  if(shields){hits.shields.push(note);hits[allyShield?'allyShielding':'selfShielding'].push(note);}
  if(/\bpv max\b|\bpv maximum\b/.test(d)&&/\bdegat|\binflig|\bbless/.test(d))hits.maxHpDamage.push(note);
  if(/\bdegats? bruts?\b/.test(d))hits.trueDamage.push(note);
  if(/\betourdi|\bimmobilis|\bprojett|\brepouss|\bneutralis|\bcharme|\bprovoc/.test(d))hits.control.push(note);
  if(/\bdarkin\b|\bforme\b|\btransformation\b|\btransforme\b/.test(d))hits.formConditional.push(note);
 }
 // A healing ally and a combat self-heal have different draft consequences.
 // A self-heal whose only source is a conditional form is downweighted.
 const formOnly=hits.selfHealing.length>0&&hits.selfHealing.every(x=>hits.formConditional.some(y=>y.slot===x.slot));
 const allyHeal=hits.allyHealing.length>0;
 const selfHeal=hits.selfHealing.length>0;
 const pressure=allyHeal?2.0:selfHeal?(formOnly?0.35:0.9):0;
 const shieldPressure=hits.allyShielding.length?2:hits.selfShielding.length?0.25:0;
 return {ok:true,name:sheet.name||'',version:VERSION,
  healing:{ally:allyHeal,self:selfHeal,conditionalFormOnly:formOnly,pressure,
   evidence:hits.healing.slice(0,4)},
  shielding:{ally:hits.allyShielding.length>0,self:hits.selfShielding.length>0,
   pressure:shieldPressure,evidence:hits.shields.slice(0,4)},
  mechanics:{maxHpDamage:hits.maxHpDamage.length>0,trueDamage:hits.trueDamage.length>0,
   hardControl:hits.control.length>0,
   evidence:[...hits.maxHpDamage,...hits.trueDamage,...hits.control].slice(0,5)},
  caveat:'Client skill text is not observed combat effectiveness; no enemy builds or guaranteed casts'};
}
function summarize({enemies=[],byName}={}){
 if(!Array.isArray(enemies)||enemies.length!==5||typeof byName!=='function')
  return {ok:false,reason:'Cinq adversaires et un accès aux compétences requis'};
 const profiles=enemies.map(name=>({name,details:evaluate(byName(name))}));
 if(profiles.some(x=>!x.details.ok))return {ok:false,reason:'Compétences officielles manquantes pour un adversaire'};
 const alliedHealers=profiles.filter(x=>x.details.healing.ally).length;
 const personalHealers=profiles.filter(x=>x.details.healing.self).length;
 const healingPressure=Math.min(5,profiles.reduce((sum,x)=>sum+x.details.healing.pressure,0));
 return {ok:true,version:VERSION,profiles,healingPressure,alliedHealers,personalHealers,
  maxHpThreats:profiles.filter(x=>x.details.mechanics.maxHpDamage).length,
  trueDamageThreats:profiles.filter(x=>x.details.mechanics.trueDamage).length,
  evidenceType:'riot_wild_rift_ability_descriptions_not_enemy_builds'};
}
return Object.freeze({VERSION,evaluate,summarize});
});
