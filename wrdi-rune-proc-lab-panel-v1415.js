/* V14.15 — Optional, local-only Galio rune proc test notebook. */
(function(root){
'use strict';
const make=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
const KEY='wrdi_galio_rune_proc_observations_v1415';
function boot(){
 const host=document.getElementById('wrdiPane_runes')||document.getElementById('runes');
 const lab=root.WRDI_RuneProcLabV1415,bridge=root.WRDI_RuneBridgeV14,matrix=root.WRDI_GalioRuneMatrixV1413;
 if(!host||!lab||!bridge||!matrix||document.getElementById('wrdiRuneProcLab1415'))return;
 const panel=make('section');panel.id='wrdiRuneProcLab1415';
 panel.style.cssText='margin:16px 0;padding:14px;border:1px solid #66b6b0;border-radius:12px';
 panel.append(make('h3','🧪 V14.15 — Validation des runes en entraînement'));
 panel.append(make('p','Protocoles facultatifs à réaliser dans Wild Rift. Aucun résultat n’est présumé. Les observations restent enregistrées sur cet appareil et ne valent pas certification.'));
 const state=make('p','Chargement…');
 const list=make('div');panel.append(state,list);host.append(panel);
 let observations=[];
 try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(a))observations=a;}catch{}
 fetch('./data/rune-catalog-client-v14.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Catalogue runes HTTP '+r.status);
  return r.json();
 }).then(catalog=>{
  const result=lab.audit({catalog,bridge,matrix,observations});
  if(!result.ok)throw Error(result.errors.join(' ; '));
  state.textContent=result.total+' protocoles · 0 déclenchement certifié par le moteur. Les valeurs du client priment sur les sites externes.';
  const notes=make('details');notes.append(make('summary','Fiabilité des résultats'));
  for(const warning of result.warnings)notes.append(make('p','• '+warning));list.append(notes);
  for(const t of result.protocols){
   const section=make('details');section.style.cssText='margin:10px 0;padding:10px;border:1px solid #476f75;border-radius:9px';
   section.append(make('summary',t.rune+' · '+t.name));
   for(const [title,value] of [['Manipulation',t.instruction],['Résultat à observer',t.success],['Contrôle',t.controls],['Attention',t.uncertainty]]){
    const p=make('p',title+' : '+value);section.append(p);
   }
   const select=make('select');select.style.cssText='width:100%;margin:7px 0';
   for(const [v,label] of [['untested','Pas testé'],['observed_yes','Effet observé'],['observed_no','Effet non observé'],['inconclusive','Résultat incertain']]){
    const option=make('option',label);option.value=v;select.append(option);
   }
   const note=make('textarea');note.placeholder='Décris exactement ce que tu as vu dans le client (facultatif tant que non testé)';
   note.rows=2;note.style.cssText='width:100%;margin:7px 0';
   const previous=observations.find(x=>x.testId===t.id);
   if(previous){select.value=previous.result;note.value=previous.notes;}
   const save=make('button','Enregistrer cette observation');save.type='button';
   const feedback=make('p','');feedback.setAttribute('aria-live','polite');
   save.addEventListener('click',()=>{
    const v=lab.validateObservation(t.id,select.value,note.value);
    if(!v.ok){feedback.textContent=v.error;return;}
    observations=observations.filter(x=>x.testId!==t.id);
    if(v.record.result!=='untested')observations.push(v.record);
    try{localStorage.setItem(KEY,JSON.stringify(observations));feedback.textContent='Observation locale enregistrée (non certifiée).';}
    catch(e){feedback.textContent='Stockage indisponible : '+String(e.message||e);}
   });
   section.append(select,note,save,feedback);list.append(section);
  }
 }).catch(e=>{state.textContent='Laboratoire indisponible : '+String(e.message||e);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof globalThis!=='undefined'?globalThis:this);
