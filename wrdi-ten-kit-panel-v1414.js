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
   const evaluation=evidenceEngine.compare({kitData:inspected,comparison,matrix,catalog,bridge});
   if(!evaluation.ok){out.append(el('p','Vérification des runes bloquée : '+evaluation.errors.join(' ; ')));return;}
   const count=el('p',evaluation.coverage.available+'/10 kits exploitables · 7 pages légales · 5 runes examinées par page. Aucune meilleure page certifiée.');
   count.style.fontWeight='700';out.append(count);
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
    for(const f of c.kitEvidence)box.append(el('p','Indice composition (non vérifié) : '+f));
    if(!c.kitEvidence.length)box.append(el('p','Aucun indice contextualisé exploitable pour cette page.'));
    const details=el('details');details.append(el('summary','Voir les cinq runes et les déclenchements'));
    for(const rune of c.runes){
     const item=el('details');
     item.append(el('summary',rune.name+' · '+(rune.evidenceStatus==='not_yet_studied'?'Interaction non étudiée':'Interaction conditionnelle/non certifiée')));
     if(!rune.interactions.length)item.append(el('p','Aucune interaction directe documentée à ce stade ; cela ne signifie pas que la rune est inefficace.'));
     for(const link of rune.interactions)item.append(el('p',link.ability+' · '+link.status+' : '+link.condition+' '+link.reason));
     details.append(item);
    }
    box.append(details);
    if(full)for(const caveat of c.caveats)box.append(el('p','• '+caveat));
    return box;
   };
   for(const c of evaluation.pages.slice(0,3))out.append(renderPage(c,true));
   const remaining=el('details');remaining.append(el('summary','Voir les 4 autres pages légales'));
   for(const c of evaluation.pages.slice(3))remaining.append(renderPage(c,false));
   out.append(remaining);
   const warnings=el('details');warnings.append(el('summary','Limites et qualité des données'));
   for(const w of [...comparison.warnings,...evaluation.warnings])warnings.append(el('p','• '+w));
   out.append(warnings);
   out.append(el('p',evaluation.interpretation));
  }catch(e){
   if(token===seq)out.replaceChildren(el('p','Erreur de lecture : '+String(e?.message||e)));
  }finally{clearTimeout(timeout);if(token===seq)btn.disabled=false;}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
