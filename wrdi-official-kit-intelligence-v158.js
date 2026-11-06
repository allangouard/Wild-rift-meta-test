/* WRDI V15.8 — Wild Rift official five-ability text -> evidence-backed draft mechanics.
 * Reads ONLY manually sourced Riot Wild Rift FR descriptions (125 champions).
 * Strong matches are explicitly quoted in evidence. No invented ratios, champion
 * builds, PC LoL kits, durations or precise damage magnitudes.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_OfficialKitIntelligenceV158=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.8.0';
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
// Labels are specific to observed phrases, rather than generic substring "soin"
// which could be present in a description of healing reduction.
const RULES=Object.freeze([
 {flag:'healing',re:/\b(soigne|soigner|soins?|regener(?:e|ation)|restaur(?:e|ent) (?:ses|des|les) (?:pv|points de vie)|vol de vie)\b/i,tag:'sustain',why:'Soin décrit dans une compétence'},
 {flag:'shield',re:/\b(bouclier|protege|protection contre les degats)\b/i,tag:'shield',why:'Bouclier ou protection décrite'},
 {flag:'cc',re:/\b(etourdit|etourdissement|projette|projettent|projetant|projection|provoque (?:un |les |et blesse les |les champions)|charme|immobilise|enracine|assomme|repousse|attire|apeure|terrorise)\b/i,tag:'cc',why:'Contrôle dur explicitement décrit'},
 {flag:'slow',re:/\b(ralentit|ralenti(?:e|s|es)?|ralentissement|ralentissent|vitesse de deplacement reduite)\b/i,tag:null,why:'Ralentissement décrit (distinct d’un contrôle dur)'},
 {flag:'mobility',re:/\b(se rue|ru[eé]e|bondit|bond|saute|dash|teleport|traverse le terrain|se deplace rapidement|vitesse de deplacement)\b/i,tag:null,why:'Mobilité décrite'},
 {flag:'max_hp_damage',re:/\b(pv max|pv maximum|points de vie max|points de vie maximum)\b/i,tag:null,why:'Référence explicite aux PV max'},
 {flag:'magic_damage',re:/\b(degats magiques?|blesse magiquement)\b/i,tag:null,why:'Dégâts magiques explicitement décrits'},
 {flag:'physical_damage',re:/\b(degats physiques?)\b/i,tag:null,why:'Dégâts physiques explicitement décrits'},
 {flag:'true_damage',re:/\b(degats bruts?)\b/i,tag:null,why:'Dégâts bruts explicitement décrits'},
 {flag:'burn',re:/\b(brulure|brule|enflamme|enflamment|en flammes|degats sur la duree|degats periodiques)\b/i,tag:'burn',why:'Dégâts persistants décrits'},
 {flag:'aoe',re:/\b(zone d'effet|zone|autour de|ennemis proches|dans un cone|plusieurs (?:ennemis|cibles))\b/i,tag:'aoe',why:'Zone d’effet décrite'},
 {flag:'long_range',re:/\b(tres longue portee|longue portee|a distance|lointain|de loin)\b/i,tag:null,why:'Portée ou distance explicite'},
 {flag:'crit',re:/\b(critique|critiques)\b/i,tag:null,why:'Critique intrinsèque ou de compétence décrit'},
 {flag:'untargetable',re:/\b(invisible|invulnerable|insaisissable|intouchable|ne peut pas mourir|contre la mort)\b/i,tag:null,why:'Fenêtre de survie/visibilité décrite'},
 {flag:'execute',re:/\b(execute|execution|acheve|cible affaiblie)\b/i,tag:null,why:'Exécution conditionnelle décrite'},
 {flag:'repeated_hits',re:/\b(chaque attaque|attaqu(?:e|er) (?:deux|trois) fois|troisieme attaque|plusieurs attaques|cumul(?:e|ent))\b/i,tag:null,why:'Effet à attaques répétées décrit'},
 {flag:'conditional_form',re:/\b(se transforme|transformation|forme darkin|forme assassin|darkin|rhaast|forme alternative)\b/i,tag:null,why:'Forme ou transformation décrite'}
]);
const ID=name=>String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]/g,'');
function prepare(payload){
 if(!payload||payload.schema!=='wrdi-official-wild-rift-extracted-v1'||!Array.isArray(payload.entries))
  return {ok:false,reason:'Catalogue officiel Wild Rift absent'};
 const byId=new Map(),byName=new Map();
 for(const rec of payload.entries){
  if(!rec?.id||!rec?.name||!/^https:\/\/wildrift\.leagueoflegends\.com\/fr-fr\/champions\//.test(rec.source_url||'')||
   !rec.skills||rec.allowedForScoring!==false) return {ok:false,reason:'Fiche sans source officielle ou statut non vérifié'};
  if(['passive','q','w','e','r'].some(k=>!rec.skills[k]?.name||typeof rec.skills[k]?.excerpt_fr!=='string'))
   return {ok:false,reason:'Fiche Wild Rift incomplète : '+rec.name};
  if(payload.entries.length>=100&&['passive','q','w','e','r'].some(k=>typeof rec.skills[k]?.description_fr!=='string'||!rec.skills[k].description_fr.trim()))
   return {ok:false,reason:'Description intégrale officielle manquante : '+rec.name};
  if(byId.has(String(rec.id))||byName.has(ID(rec.name)))
   return {ok:false,reason:'ID de champion dupliqué'};
  byId.set(String(rec.id),rec);byName.set(ID(rec.name),rec);
 }
 return Object.freeze({ok:true,version:VERSION,count:byId.size,find(key){
  return byId.get(String(key))||byName.get(ID(key))||null;
 }});
}
function analyze(record){
 if(!record)return {ok:false,reason:'Champion sans fiche Riot'};
 const evidence=[],flags={},totals={};
 for(const [slot,skill] of Object.entries(record.skills||{})){
  // Use full Riot text when present, never silently degrade to a 24-word excerpt.
  const passage=String(skill?.description_fr||skill?.excerpt_fr||'');
  const normalized=clean(passage);
  for(const rule of RULES){
   const match=normalized.match(rule.re);
   const full=Array.isArray(skill?.detected_mechanics)&&
    skill.detected_mechanics.includes(rule.flag);
   if(!match&&!full)continue;
   flags[rule.flag]=true;
   totals[rule.flag]=(totals[rule.flag]||0)+1;
   evidence.push({flag:rule.flag,tag:rule.tag,spell:slot,spellName:skill.name,
    match:match?.[0]||'official_full_text_rule',
    explanation:rule.why,source:record.source_url,
    fromFullDescription:!match&&full,
    truncated:skill.descriptionTruncated===true&&!skill.description_fr});
  }
 }
 // Never infer "has an AD item build" from physical damage descriptions;
 // do not turn "crit" into an assumed crit-item build.
 const traits=[...new Set(evidence.filter(x=>x.tag).map(x=>x.tag))];
 return {ok:true,id:String(record.id),name:record.name,traits,flags,totals,evidence,
  source:record.source_url,confidence:Object.values(record.skills||{}).every(s=>s.description_fr)?'explicit_full_official_text':'explicit_official_excerpt_only',
  patchVerified:false,damageQuantified:false,formVerified:false};
}
function enrich(base=[],record,reviewed=null){
 const normalized=Array.isArray(base)?base.filter(x=>typeof x==='string'):[];
 if(!record)return {traits:[...new Set(normalized)],intel:null};
 const intel=analyze(record);
 if(!intel.ok)return {traits:[...new Set(normalized)],intel};
 // Include explicit combat signals. Do not alter primary AD/AP identity based on
 // a single ability that deals the opposite damage type.
 const traits=[...new Set([...normalized,...intel.traits])];
 // Explicit client-like mechanic labels from previously reviewed Riot passive
 // sheets extend short official excerpts without guessing the missing words.
 const confirmed=Array.isArray(reviewed?.kit?.passive?.mechanics_from_passive)?
  reviewed.kit.passive.mechanics_from_passive:[];
 const healFromReview=confirmed.includes('conditional_self_healing')||
  confirmed.includes('self_healing')||confirmed.includes('ally_healing');
 const hasHealing=intel.flags.healing||healFromReview;
 if(hasHealing){
  if(!traits.includes('sustain'))traits.push('sustain');
  if(!traits.includes('heal'))traits.push('heal');
 }
 const conditional=confirmed.includes('conditional_self_healing')||
  (intel.flags.conditional_form&&hasHealing);
 if(conditional&&!traits.includes('conditional_sustain'))
  traits.push('conditional_sustain');
 if(healFromReview){
  intel.evidence.push({flag:'healing_reviewed',tag:'heal',spell:'passive',
   spellName:reviewed.kit.passive.name,match:'reviewed_official_kit',
   explanation:conditional?'Soin possible selon la forme':'Soin décrit par le passif officiel',
   source:reviewed.source.url,truncated:false});
 }
 return {traits,intel};
}
return Object.freeze({VERSION,RULES,prepare,analyze,enrich});
});
