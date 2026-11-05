/* WRDI V14.12 — ten-kit mobile explorer, independent from item gate. */
(function(root){
'use strict';
const STORE='wrdi_draft_v76', BASE='https://wrchina.gg';
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x};
const ids=()=>{try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}};
function mount(){
 const host=document.getElementById('wrdiPane_runes')||document.getElementById('runes');
 if(!host||document.getElementById('wrdiAutoKit1412'))return;
 const section=el('section');section.id='wrdiAutoKit1412';section.style.cssText='margin:16px 0;padding:14px;border:1px solid #64a1a6;border-radius:12px;background:rgba(15,48,58,.75)';
 section.append(el('h3','🧠 V14.12 — Analyse automatique des 10 kits'));
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
   const count=el('p',comparison.coverage.available+'/10 fiches de kits exploitables. '+(comparison.rankedProvisionally?'Ordre heuristique exploratoire.':'Aucun classement : preuves insuffisantes.'));
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
   for(const c of comparison.options.slice(0,3)){
    const box=el('section');box.style.cssText='padding:10px;margin:12px 0;border:1px solid #4a7b85;border-radius:10px';
    box.append(el('h4',c.label),el('p','Fondamentale : '+c.page.keystone),
     el('p','Principales ('+c.page.primaryTree+') : '+c.page.primary.join(' · ')),
     el('p','Secondaire : '+c.page.secondary));
    if(!c.findings.length)box.append(el('p','Aucun indice contextuel exploitable pour cette stratégie.'));
    for(const f of c.findings)box.append(el('p','• '+f));
    const d=el('details');d.append(el('summary','Interactions et limites'));
    for(const note of [...c.interactions,...c.limits])d.append(el('p','• '+note));
    box.append(d);out.append(box);
   }
   const remaining=el('details');remaining.append(el('summary','Voir les 4 autres pages légales'));
   for(const c of comparison.options.slice(3))remaining.append(el('p',c.label+' : '+c.page.keystone+' · '+c.page.primary.join(' / ')+' · '+c.page.secondary));
   out.append(remaining);
   const warnings=el('details');warnings.append(el('summary','Limites et qualité des données'));
   for(const w of comparison.warnings)warnings.append(el('p','• '+w));
   out.append(warnings);
   out.append(el('p','Ce diagnostic ne constitue pas encore une recommandation de runes optimisée et certifiée.'));
  }catch(e){
   if(token===seq)out.replaceChildren(el('p','Erreur de lecture : '+String(e?.message||e)));
  }finally{clearTimeout(timeout);if(token===seq)btn.disabled=false;}
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})(typeof globalThis!=='undefined'?globalThis:this);
