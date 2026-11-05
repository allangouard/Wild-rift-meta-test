/* Wild Rift Draft Intelligence V14.22 — explainable rune substitutions.
 * Uses verified client rune row/tree structure; contextual choice is exploratory.
 * Player-confirmed proc evidence is unchanged. No PC data or invented win rates.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioRuneSwapV1422=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.22.0-alpha.1';
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const HARD=new Set(['stun','knockup','root']);
function threatContext({kitData,championNames,curatedMid,five}={}){
 if(!kitData?.ok||!Array.isArray(kitData.all)||kitData.all.length!==10||!Array.isArray(championNames)||championNames.length!==10)
  return {ok:false,error:'Dix champions Wild Rift et leur kit sont requis.'};
 const all=kitData.all,mid=all[7],jungle=all[6],support=all[9];
 const names={mid:championNames[7],jungle:championNames[6],support:championNames[9]};
 const profile=(curatedMid?.ok&&curatedMid?.profile&&normalize(curatedMid.profile.name)===normalize(names.mid))?curatedMid.profile:null;
 const midTraits=new Set(profile?.traits.map(t=>t.id)||[]);
 const profs=five?.ok?five.profiles||[]:[];
 const jungleProfiles=profs.filter(p=>p.role==='Jungle adverse'&&String(p.id)===String(jungle.id)&&normalize(p.name)===normalize(names.jungle));
 const supportProfiles=profs.filter(p=>p.role==='Support adverse'&&String(p.id)===String(support.id)&&normalize(p.name)===normalize(names.support));
 const jungleTraits=new Set(jungleProfiles.flatMap(p=>p.traits.map(t=>t.key)));
 const supportTraits=new Set(supportProfiles.flatMap(p=>p.traits.map(t=>t.key)));
 const midSignals=new Set(mid?.available?mid.signals||[]:[]);
 const danger=[];
 const put=(type,description,source,role)=>danger.push({type,description,source,role});
 if(mid?.available&&midTraits.has('assassin_burst'))put('lane_allin','Assassinat explosif documenté chez le mid adverse','official_wild_rift_mid_profile','Mid adverse');
 if(mid?.available&&midTraits.has('magic_burst'))put('lane_allin','Dégâts concentrés documentés chez le mid adverse','official_wild_rift_mid_profile','Mid adverse');
 if(mid?.available&&(midSignals.has('overtime')||midTraits.has('ranged_control')))
  put('lane_poke','Harcèlement possible ou contrôle à distance chez le mid : fréquence inconnue','wild_rift_kit_or_official_mid_profile','Mid adverse');
 if(jungle?.available&&(jungleTraits.has('dive')||jungleTraits.has('burst')))
  put('gank_allin','Jungler avec outils d’engagement documentés','official_wild_rift_jungle_profile','Jungle adverse');
 if(support?.available&&(supportTraits.has('hard_cc')||supportTraits.has('displacement')))
  put('team_cc','Support avec contrôle documenté','official_wild_rift_support_profile','Support adverse');
 if(support?.available&&supportTraits.has('peel'))
  put('enemy_peel','Support avec outils de protection documentés','official_wild_rift_support_profile','Support adverse');
 // Do not infer explicit control profiles from an unknown champion name.
 const ready=all.every(x=>x.available)&&!!championNames[7];
 return {ok:true,ready,signals:danger,midName:names.mid,
  recognizedProfiles:{mid:!!profile,jungle:jungleProfiles.length>0,support:supportProfiles.length>0},
  warnings:['Menaces qualitatives issues de descriptions de sorts, sans fréquence de déclenchement ni estimation de dégâts.',
   'Les cas incertains ne provoquent pas de remplacement automatique.']};
}
const choiceDefinitions=Object.freeze([
 {target:"Plaque d'os",from:['Second souffle'],primary:'lane_allin',secondary:'gank_allin',reason:'Menace d’engagement explosif : comparer la protection contre une séquence courte.'},
 {target:'Second souffle',from:["Plaque d'os"],primary:'lane_poke',secondary:null,reason:'Échanges répétés ou contrôle à distance : comparer la régénération entre les échanges.'},
 {target:'Persévérance',from:['Surcroissance','Revitalisation'],primary:'team_cc',secondary:null,reason:'Contrôles du support adverse : examiner l’intérêt de Persévérance plutôt qu’une rune de croissance ou de soutien.'}
]);
function pickReason(rule,ctx){
 const primary=ctx.signals.find(x=>x.type===rule.primary);
 const secondary=rule.secondary?ctx.signals.find(x=>x.type===rule.secondary):null;
 return primary||secondary||null;
}
function adapt({kitData,championNames,curatedMid,five,pages,bridge,catalog,playerEvidence}={}){
 const context=threatContext({kitData,championNames,curatedMid,five});
 if(!context.ok)return context;
 if(!Array.isArray(pages)||pages.length!==7||!bridge?.validate||!catalog)return {ok:false,error:'Sept pages légales et catalogue nécessaires.'};
 const result=[];
 for(const original of pages){
  const check=bridge.validate(original.page,catalog);
  if(!check.valid)return {ok:false,error:'Page de base invalide : '+original.id+' '+check.errors.join('; ')};
  const page={...original.page,primary:[...original.page.primary]};
  const changes=[];
  if(context.ready){
   const allin=context.signals.some(x=>x.type==='lane_allin');
   const poke=context.signals.some(x=>x.type==='lane_poke');
   for(const rule of choiceDefinitions){
    // Competing midlane damage patterns: do not infer a single best response.
    if((rule.primary==='lane_allin'||rule.primary==='lane_poke')&&allin&&poke)continue;
    const trigger=pickReason(rule,context);
    if(!trigger)continue;
    const names=[...page.primary,page.secondary];
    const from=rule.from.find(name=>names.includes(name));
    if(!from)continue;
    const isSecondary=page.secondary===from;
    const where=isSecondary?'secondary':'primary';
    const line=isSecondary?-1:page.primary.indexOf(from);
    const candidate={...page,primary:[...page.primary]};
    if(isSecondary)candidate.secondary=rule.target;
    else candidate.primary[line]=rule.target;
    if(!bridge.validate(candidate,catalog).valid)continue;
    if(isSecondary)page.secondary=rule.target;else page.primary[line]=rule.target;
    changes.push({from,to:rule.target,slot:where,primaryRow:isSecondary?null:line+1,
      threat:trigger.type,championRole:trigger.role,reason:rule.reason,
      evidence:trigger.description,status:'exploratory_tactical_swap'});
   }
  }
  const finalCheck=bridge.validate(page,catalog);
  if(!finalCheck.valid)return {ok:false,error:'Page adaptée invalide : '+original.id};
  // Attach confirmed procs for substituted or retained runes, without falsely
  // attributing all proc test scenarios to the draft itself.
  const evidence=playerEvidence?.ok===true&&playerEvidence?.game==='Wild Rift mobile'?playerEvidence.entries.filter(e=>e.valid&&e.status.startsWith('validated_')):[];
  const runeNames=[page.keystone,...page.primary,page.secondary];
  const confirmations=evidence.filter(e=>runeNames.includes(e.rune)).map(e=>({rune:e.rune,testId:e.testId,condition:e.condition,triggered:e.triggered}));
  result.push({id:original.id,label:original.label,originalPage:original.page,page,
    changes,hasAdaptation:changes.length>0,valid:true,
    confirmations,metaWinRate:null,certifiedBest:false,
    confidence:changes.length?'documented_threat_exploratory_choice':'no_evidence_for_change'});
 }
 return {ok:true,version:VERSION,game:'Wild Rift mobile',context,pages:result,
  changedPages:result.filter(x=>x.hasAdaptation).length,
  allLegal:true,automaticOptimalRecommendation:false,
  warnings:['Les remplacements sont légaux et explicables, pas prouvés meilleurs en victoire.',
   'Les tests en jeu du joueur restent confirmés, sans prétendre certifier les substitutions.',
   'Quand les menaces lane poke et all-in coexistent, le choix entre Second souffle et Plaque d’os est laissé intact.']};
}
return Object.freeze({VERSION,choiceDefinitions,threatContext,adapt});
});
