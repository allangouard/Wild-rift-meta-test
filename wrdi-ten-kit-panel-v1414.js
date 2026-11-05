/* WRDI V14.14 — ten-kit / Galio rune evidence viewer, independent of item gate. */
(function(root){
'use strict';
const STORE='wrdi_draft_v76', BASE='https://wrchina.gg';
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x};
const ids=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}};
function mount(){
 const host=document.getElementById('wrdiPane_runes')||document.getElementById('runes');
 if(!host||document.getElementById('wrdiAutoKit1414'))return;
 const section=el('section');section.id='wrdiAutoKit1414';section.style.cssText='margin:16px 0;padding:14px;border:1px solid #64a1a6;border-radius:12px;background:rgba(15,48,58,.75)';
 section.append(el('h3','🧠 V14.14 — Les 10 kits et les 5 runes de chaque page'));
 section.append(el('p','Galio + quatre alliés + cinq adversaires. Aucun réglage tactique obligatoire. Les signaux des fiches chinoises sont exploratoires et non validés contre le client actuel.'));
 const btn=el('button','Analyser automatiquement les 10 kits');btn.type='button';
 const out=el('div');out.style.cssText='margin-top:12px;line-height:1.5;overflow-wrap:anywhere';
 out.setAttribute('aria-live','polite');
 section.append(btn,out);host.append(section);
 let seq=0;
 async function fetchOne(id,signal,infer){
  const url=BASE+'/api/champion/'+encodeURIComponent(id)+'.json';
  try{
   const r=await fetch(url,{cache:'no-store',signal});
   if(!r.ok)throw Error('HTTP '+r.status);
   const raw=await r.json();
   if(raw?.id!=null&&String(raw.id)!==String(id))throw Error('Identifiant retourné différent');
   return {id:String(id),result:infer(raw)};
  }catch(e){return {id:String(id),error:String(e?.message||e)};}
 }
 btn.addEventListener('click',async()=>{
  const engine=root.WRDI_TenKitRunesV1412;
  const oldAdvisor=root.WRDI_GalioRuneAdvisorV1411;
  const bridge=root.WRDI_RuneBridgeV14;
  const kitEngine=root.WRDIChampionThreatsV125;
  const picks=ids();
  const fingerprint=JSON.stringify(picks);
  out.replaceChildren();
  if(!engine||!oldAdvisor||!bridge||typeof kitEngine?.infer!=='function'){
   out.append(el('p','Module de kits indisponible : vérifie que les scripts V14.12 sont chargés.'));
   return;
  }
  const check=engine.inspect(picks,[]);
  if(!check.ok){out.append(el('p',check.errors.join(' ; ')));return;}
  const token=++seq;
  btn.disabled=true;
  out.append(el('p','Lecture des fiches des 10 champions Wild Rift…'));
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),14000);
  try{
   const results=await Promise.all(picks.map(id=>fetchOne(id,controller.signal,kitEngine.infer)));
   if(token!==seq||JSON.stringify(ids())!==fingerprint){
    out.replaceChildren(el('p','La draft a changé : relance l’analyse des kits.'));return;
   }
   const inspected=engine.inspect(picks,results);
   const resp=await fetch('./data/rune-catalog-client-v14.json',{cache:'no-store'});
   if(!resp.ok)throw Error('Catalogue des runes indisponible : '+resp.status);
   const catalog=await resp.json();
   if(token!==seq||JSON.stringify(ids())!==fingerprint){
    out.replaceChildren(el('p','La draft a changé pendant le chargement du catalogue.'));return;
   }
   const comparison=engine.analyzeCandidates(inspected,{advisor:oldAdvisor,picks,catalog,bridge});
   out.replaceChildren();
   if(!comparison.ok){out.append(el('p','Comparaison bloquée : '+(comparison.errors||[]).join(' ; ')));return;}
   const matrix=root.WRDI_GalioRuneMatrixV1413;
   const evidenceEngine=root.WRDI_GalioRuneEvidenceV1414;
   if(!matrix||!evidenceEngine){
    out.append(el('p','Matrice de runes V14.14 indisponible.'));return;
   }
   let playerEvidence=null;
   try{
    const recorded=await fetch('./data/galio-rune-training-observations-v1415.json',{cache:'no-store'});
    if(recorded.ok && root.WRDI_GalioPlayerEvidenceV1416){
     playerEvidence=root.WRDI_GalioPlayerEvidenceV1416.summarize(await recorded.json());
    }
   }catch(e){/* Observations optionally unavailable; preserve exploratory analysis. */}
   if(token!==seq||JSON.stringify(ids())!==fingerprint){
    out.replaceChildren(el('p','Draft modifiée pendant la lecture des observations.'));return;
   }
   const evaluation=evidenceEngine.compare({kitData:inspected,comparison,matrix,catalog,bridge,playerEvidence});
   if(!evaluation.ok){out.append(el('p','Vérification des runes bloquée : '+evaluation.errors.join(' ; ')));return;}
   const draftEngine=root.WRDI_GalioDraftRuneV1418;
   const ordered=draftEngine?.compare({kitData:inspected,pages:evaluation.pages,playerEvidence,bridge,catalog});
   if(ordered && !ordered.ok){out.append(el('p','Analyse des menaces indisponible : '+ordered.error));return;}
   const specific=root.WRDI_GalioAbilityThreatV1419?.refine({kitData:inspected,baseline:ordered});
   const displayPages=specific?.ok?specific.pages:(ordered?.pages||evaluation.pages);
   const lookupNames=()=>{
    try{
     const roster=typeof champions!=='undefined'&&Array.isArray(champions)?champions:[];
     return picks.map(id=>{
      const c=roster.find(x=>String(x.id)===String(id));
      const meta=typeof db!=='undefined'?db?.meta?.champ_index?.[String(id)]:null;
      const raw=typeof meta==='string'?meta:meta?.name||meta?.en||meta?.champion||null;
      return c?.name&&!/^Champion [0-9]+$/.test(c.name)?c.name:raw||'';
     });
    }catch{return picks.map(()=>'');}
   };
   const names=lookupNames();
   const detailed=root.WRDI_GalioCuratedMatchupsV1420?.refine({tenKits:inspected,baseline:specific,championNames:names});
   const five=root.WRDI_GalioFiveRunesV1421?.analyze({kitData:inspected,championNames:names,pages:displayPages,bridge,catalog});
   const count=el('p',evaluation.coverage.available+'/10 kits exploitables · 7 pages légales · 5 runes examinées par page. Aucune meilleure page certifiée.');
   count.style.fontWeight='700';out.append(count);
   if(playerEvidence?.ok)out.append(el('p','✅ V14.17 — '+playerEvidence.positiveCount+' tests positifs et '+playerEvidence.negativeCount+' tests négatifs validés en jeu, dans les conditions rapportées. Aucun classement méta déduit.'));
   else out.append(el('p','Observations en jeu indisponibles : lecture documentaire uniquement.'));
   if(ordered?.comparisonAvailable){
    out.append(el('h3','🎯 V14.18 — Pages classées selon les menaces détectées'));
    out.append(el('p','Ordre exploratoire fondé sur les signaux des 10 kits. Ce n’est ni un winrate ni une preuve de supériorité. Les observations de runes en jeu restent validées uniquement dans leurs conditions.'));
   }else{
    out.append(el('p','V14.18 : classement contextuel suspendu (fiches de champions manquantes ou aucun signal utilisable). Les 7 pages restent consultables sans ordre de puissance.'));
   }
   if(specific?.ok){
    out.append(el('h3','🔍 V14.19 — Menaces par rôle et compétence'));
    if(specific.comparisonAvailable)out.append(el('p','Ordre expérimental recalculé à partir des combinaisons de compétences adverses, sans estimer la puissance ou les chances de victoire.'));
    else out.append(el('p','Aucun classement fiable par compétences : fiches absentes ou signaux insuffisants.'));
    const profileDetails=el('details');profileDetails.append(el('summary','Voir les menaces précises des 5 adversaires'));
    for(const p of specific.profiles){
     const box=el('div');box.style.cssText='padding:8px 0;border-bottom:1px solid #345661';
     box.append(el('strong',p.role+' · Champion '+p.id));
     if(!p.available)box.append(el('p','Compétences indisponibles : aucune menace inférée.'));
     else if(!p.findings.length)box.append(el('p','Aucun profil combiné détecté ; ne signifie pas champion inoffensif.'));
     else for(const f of p.findings)box.append(el('p',f.label+' · Compétences signalées : '+(f.abilities.join(', ')||'emplacement inconnu')+' · '+f.reason));
     profileDetails.append(box);
    }
    out.append(profileDetails);
   }
   if(detailed?.ok){
    out.append(el('h3','📖 V14.20 — Profil documenté du mid adverse'));
    const doc=el('div');doc.style.cssText='padding:10px;border:1px solid #456b79;border-radius:10px;margin:8px 0';
    if(detailed.profile){
     doc.append(el('p','Mid adverse : '+detailed.profile.name+' · Compétences documentées sur le site officiel Wild Rift.'));
     for(const t of detailed.profile.traits)doc.append(el('p',t.ability+' — '+t.name+' : '+t.fact+' Conséquence tactique envisagée : '+t.context));
     const sourceLink=el('a','Consulter la fiche Wild Rift officielle');sourceLink.href=detailed.profile.source;sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';sourceLink.style.color='#81e0dd';doc.append(sourceLink);
     const delta=el('details');delta.append(el('summary','Voir les adaptations exploratoires des 7 pages'));
     for(const p of detailed.pages)delta.append(el('p',p.label+' : '+(p.curatedFindings.length?p.curatedFindings.map(x=>(x.impact>0?'+':'')+x.impact+' · '+x.context).join(' ; '):'Aucune adaptation spécifique documentée')));
     doc.append(delta);
    }else doc.append(el('p','Aucun profil officiel réconcilié pour le mid adverse. Le classement général est conservé. Aucun profil inventé.'));
    out.append(doc);
   }
   if(five?.ok){
    out.append(el('h3','🛡️ V14.21 — Jungler, support et cinq runes'));
    if(five.profiles.length){
     for(const threat of five.profiles){
      const d=el('details');d.append(el('summary',threat.role+' · '+threat.name+' · kit documenté'));
      for(const t of threat.traits)d.append(el('p',t.ability+' · '+t.label+' : '+t.detail));
      const a=el('a','Fiche officielle Wild Rift');a.href=threat.source;a.target='_blank';a.rel='noopener noreferrer';a.style.color='#81e0dd';d.append(a);out.append(d);
     }
    }else out.append(el('p','Aucun jungler/support réconcilié parmi les profils documentés : pas de menace inventée.'));
    out.append(el('p','Chaque page détaille désormais les cinq runes, les indices tactiques et les activations réellement observées. Aucune note de puissance calculée.'));
   }
   const galio=el('p','Kit Galio : '+(comparison.galio.ccMentioned?'mentions de contrôle détectées':'contrôle non confirmé par la lecture lexicale')+' ; mobilité '+(comparison.galio.dashMentioned?'mentionnée':'non détectée')+' ; bouclier '+(comparison.galio.shieldMentioned?'mentionné':'non détecté')+'.');
   out.append(galio);
   const show=el('details');show.append(el('summary','Voir les 10 fiches et leurs limites'));
   for(const c of inspected.all)show.append(el('p',c.role+' · '+c.id+' · '+(c.available?c.signals.join(', ')||'aucun mot-clé reconnu':'indisponible : '+c.reason)));
   out.append(show);
   const evidence=el('details');evidence.append(el('summary','Voir les indices détectés chez les alliés et adversaires'));
   for(const e of comparison.evidence){
    evidence.append(el('p',e.trait+' : '+e.count+' mention(s) · '+e.note));
   }
   out.append(evidence);
   const renderPage=(c,full)=>{
    const box=el('section');box.style.cssText='padding:10px;margin:12px 0;border:1px solid #4a7b85;border-radius:10px';
    box.append(el('h4',c.label),
     el('p','Fondamentale : '+c.page.keystone),
     el('p','Principales ('+c.page.primaryTree+') : '+c.page.primary.join(' · ')),
     el('p','Secondaire : '+c.page.secondary));
    box.append(el('p',c.conditionalOrIndirectCount+'/5 runes avec une interaction étudiée · '+c.notYetStudiedCount+'/5 à étudier. Ce chiffre n’est pas une note de puissance.'));
    if(specific?.comparisonAvailable){
     box.append(el('p','Adéquation rôle/compétence (hypothèse) : '+(c.roleCompatibility??'non classée')));
     for(const threat of c.abilityThreats||[])box.append(el('p',(threat.impact>0?'+':'')+threat.impact+' · '+threat.role+' / '+threat.championId+' · '+threat.reason));
    }
    if(ordered?.comparisonAvailable){
     const exp=c.contributions||[];
     box.append(el('p','Adéquation tactique exploratoire : '+(exp.length?exp.map(x=>(x.impact>0?'+':'')+x.impact+' · '+x.label+' ('+x.count+')').join(' ; '):'Aucun signal particulier associé à cette page.')));
    }
    if(c.validatedCombos?.length)box.append(el('p','✅ Déclenchements confirmés en jeu : '+c.validatedCombos.map(x=>x.condition).join(' ; ')));
    if(c.validatedNonProcs?.length)box.append(el('p','⛔ Absences de déclenchement confirmées : '+c.validatedNonProcs.map(x=>x.condition).join(' ; ')));
    for(const f of c.kitEvidence)box.append(el('p','Indice composition (non vérifié) : '+f));
    if(!c.kitEvidence.length)box.append(el('p','Aucun indice contextualisé exploitable pour cette page.'));
    const details=el('details');details.append(el('summary','Voir les cinq runes et les déclenchements'));
    const enhanced=five?.pages?.find(p=>p.id===c.id);
    for(const rune of c.runes){
     const item=el('details');
     const confirmed=(rune.playerObservations||[]);
     item.append(el('summary',rune.name+' · '+(confirmed.length?confirmed.length+' observation(s) validée(s) en jeu':rune.evidenceStatus==='not_yet_studied'?'Interaction non étudiée':'Interaction documentaire conditionnelle')));
     for(const obs of confirmed)item.append(el('p',(obs.triggered?'✅ Activation observée':'⛔ Pas d’activation observée')+' · '+obs.condition+' (conditions testées uniquement)'));
     const runeContext=enhanced?.fiveRuneAnalysis?.find(x=>x.name===rune.name);
     for(const context of runeContext?.threatNotes||[])item.append(el('p','🧭 Hypothèse tactique ['+context.threat+'] : '+context.interpretation));
     if(runeContext && !runeContext.threatNotes.length)item.append(el('p','Aucune adaptation spécifique documentée pour cette rune contre ces profils.'));
     if(!rune.interactions.length)item.append(el('p','Aucune interaction directe documentée à ce stade ; cela ne signifie pas que la rune est inefficace.'));
     for(const link of rune.interactions)item.append(el('p',link.ability+' · '+link.status+' : '+link.condition+' '+link.reason));
     details.append(item);
    }
    box.append(details);
    if(full)for(const caveat of c.caveats)box.append(el('p','• '+caveat));
    return box;
   };
   for(const c of displayPages.slice(0,3))out.append(renderPage(c,true));
   const remaining=el('details');remaining.append(el('summary','Voir les 4 autres pages légales'));
   for(const c of displayPages.slice(3))remaining.append(renderPage(c,false));
   out.append(remaining);
   const warnings=el('details');warnings.append(el('summary','Limites et qualité des données'));
   for(const w of [...comparison.warnings,...evaluation.warnings,...(ordered?.warnings||[]),...(specific?.warnings||[]),...(detailed?.warnings||[]),...(five?.warnings||[])])warnings.append(el('p','• '+w));
   out.append(warnings);
   out.append(el('p',evaluation.interpretation));
  }catch(e){
   if(token===seq)out.replaceChildren(el('p','Erreur de lecture : '+String(e?.message||e)));
  }finally{clearTimeout(timeout);if(token===seq)btn.disabled=false;}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
