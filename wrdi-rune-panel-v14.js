/* V14.7 — Visual rune page test in the existing Runes tab.
 * This is a legality/catalogue preview, NOT a draft recommendation engine.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x};
const unique=(xs)=>[...new Set(xs)];
function boot(){
 const host=$('runes');
 const bridge=root.WRDI_RuneBridgeV14;
 if(!host||!bridge||$('wrdiRunePanel147'))return;
 const card=make('section');card.id='wrdiRunePanel147';card.className='panel';
 card.style.cssText='margin:12px 0;border:1px solid #438c8c';
 card.appendChild(make('h2','🧬 V14.7 — Catalogue client vérifié'));
 const status=make('p','Chargement du catalogue des 52 runes…');status.className='muted';card.appendChild(status);
 const description=make('p','Vérifie une page de runes possible sur Wild Rift. Ce module ne recommande pas encore de runes selon la draft.');description.className='muted';card.appendChild(description);
 const controls=make('div');card.appendChild(controls);
 const result=make('p','');result.setAttribute('aria-live','polite');card.appendChild(result);
 const existing=host.querySelector('.panel');
 if(existing)existing.appendChild(card);else host.appendChild(card);
 const field=(label,values)=>{
  const wrap=make('label');wrap.style.cssText='display:block;margin:10px 0';
  wrap.appendChild(make('span',label+' '));
  const select=make('select');select.style.cssText='width:100%;max-width:480px;display:block;margin-top:4px';
  wrap.appendChild(select);controls.appendChild(wrap);
  const fill=(entries)=>{
   const old=select.value;select.replaceChildren();
   for(const [value,text] of entries){const op=make('option',text);op.value=value;select.appendChild(op)}
   if([...select.options].some(op=>op.value===old))select.value=old;
  };
  fill(values);
  return {select,fill};
 };
 const load=async()=>{
  const response=await fetch('./data/rune-catalog-client-v14.json',{cache:'no-store'});
  if(!response.ok)throw Error('Catalogue introuvable : HTTP '+response.status);
  return response.json();
 };
 load().then(catalog=>{
  const check=bridge.audit(catalog);
  if(!check.ok)throw Error(check.errors.join(' ; '));
  const allFund=catalog.fundamental.map(x=>[x.name_fr,x.name_fr]);
  const tree=catalog.trees.map(x=>[x,x]);
  const fundamental=field('Rune fondamentale',allFund);
  const primaryTree=field('Branche principale',tree);
  const primary=[1,2,3].map(n=>field('Rune principale — ligne '+n,[]));
  const secondary=field('Rune secondaire (autre branche)',[]);
  const sync=()=>{
   const branch=primaryTree.select.value;
   primary.forEach((p,i)=>p.fill(bridge.options(catalog,branch,i+1).map(x=>[x.name_fr,x.name_fr])));
   secondary.fill(catalog.minor.filter(x=>x.tree!==branch).map(x=>[x.name_fr,x.name_fr+' · '+x.tree]));
   validate();
  };
  const validate=()=>{
   const page={keystone:fundamental.select.value,primaryTree:primaryTree.select.value,
     primary:primary.map(x=>x.select.value),secondary:secondary.select.value};
   const r=bridge.validate(page,catalog);
   result.textContent=r.valid?
     '✓ Page autorisée : 1 fondamentale + 3 principales (lignes 1/2/3) + 1 secondaire d’une autre branche. Ce n’est pas une recommandation de draft.':
     'Page invalide : '+r.errors.join(' ; ');
   result.style.color=r.valid?'#83dabc':'#ffc5b4';
  };
  primaryTree.select.addEventListener('change',sync);
  for(const field of [fundamental,...primary,secondary])field.select.addEventListener('change',validate);
  status.textContent='52/52 runes chargées (13 fondamentales, 39 secondaires) · 39/39 lignes confirmées · identifiants officiels non réconciliés.';
  sync();
  // V14.8: comparaison contextuelle des pages Galio depuis la draft existante.
  const explorer=make('section');
  explorer.style.cssText='margin-top:16px;padding:12px;border:1px solid #527c91;border-radius:10px';
  explorer.appendChild(make('h3','🔎 V14.8 — Pages de runes Galio face à la draft'));
  explorer.appendChild(make('p','Trois scénarios de runes à comparer, sans classement de winrate ni garantie de meilleur choix.'));
  const runButton=make('button','Examiner les runes avec la draft');
  runButton.type='button';
  const explorerOutput=make('div');
  explorerOutput.setAttribute('aria-live','polite');
  explorerOutput.style.cssText='margin-top:10px;line-height:1.5;overflow-wrap:anywhere';
  explorer.append(runButton,explorerOutput);
  card.appendChild(explorer);
  let sequence=0;
  runButton.addEventListener('click',async()=>{
   const token=++sequence;
   explorerOutput.replaceChildren();
   const scenarios=root.WRDI_GalioRuneScenariosV14;
   const core=root.WRDI_CoreV14;
   const coordinator=root.WRDI_CoordinatorV14;
   const adapters=root.WRDI_AdaptersV14;
   const summaryApi=root.WRDI_ThreatSummaryV14;
   if(!scenarios||!core||!coordinator||!adapters||!summaryApi){
    explorerOutput.appendChild(make('p','Modules V14.8 et diagnostic V14 manquants.'));
    return;
   }
   let picks=[];
   try{picks=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]');}catch{}
   if(!Array.isArray(picks)||picks.length!==10||String(picks[2])!=='10099'||picks.slice(5).some(x=>!x)){
    explorerOutput.appendChild(make('p','Sélectionne Galio au mid et les cinq adversaires dans la draft.'));
    return;
   }
   const fingerprint=JSON.stringify(picks);
   runButton.disabled=true;
   explorerOutput.appendChild(make('p','Lecture des données de draft…'));
   try{
    const app=adapters.create({root,storage:localStorage,fetchJson:load,core,coordinator});
    const report=await app.run();
    if(token!==sequence)return;
    if(localStorage.getItem('wrdi_draft_v76')!==fingerprint){
     explorerOutput.replaceChildren(make('p','La draft a changé : relance la comparaison.'));
     return;
    }
    if(!report.ok){
     explorerOutput.replaceChildren(make('p','Rapport V14 indisponible : '+(report.reason||report.errors?.join(' ; ')||report.status)));
     return;
    }
    const summary=summaryApi.summarize(report);
    const result=scenarios.evaluate({championId:picks[2],summary,catalog,bridge});
    explorerOutput.replaceChildren();
    if(!result.ok){
     explorerOutput.appendChild(make('p','Comparaison impossible : '+result.blockers.join(' ; ')));
     return;
    }
    for(const c of result.candidates){
     const box=make('section');box.style.cssText='margin:12px 0;padding:12px;border:1px solid #4b6976;border-radius:8px';
     box.appendChild(make('h4',c.label));
     box.appendChild(make('p','Fondamentale : '+c.page.keystone));
     box.appendChild(make('p','Principales ('+c.page.primaryTree+') : '+c.page.primary.join(' · ')));
     box.appendChild(make('p','Secondaire : '+c.page.secondary));
     box.appendChild(make('p',c.status==='signal_contextuel_a_examiner'?'Signal de draft à examiner : '+c.evidence:'À tester : '+c.evidence));
     const detail=make('details');detail.appendChild(make('summary','Interactions et limites'));
     for(const note of [...c.interactions,...c.limits])detail.appendChild(make('p','• '+note));
     box.appendChild(detail);explorerOutput.appendChild(box);
    }
    const notes=make('details');notes.appendChild(make('summary','Avertissements et qualité des sources'));
    for(const warning of result.warnings)notes.appendChild(make('p','• '+warning));
    explorerOutput.appendChild(notes);
    explorerOutput.appendChild(make('p','Ces trois pages sont légales selon le catalogue client. Elles ne constituent PAS encore une recommandation automatique optimale.'));
   }catch(error){
    if(token===sequence)explorerOutput.replaceChildren(make('p','Comparaison indisponible : '+String(error.message||error)));
   }finally{if(token===sequence)runButton.disabled=false;}
  });
 }).catch(error=>{status.textContent='V14.7 indisponible : '+String(error.message||error)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();
})(typeof globalThis!=='undefined'?globalThis:this);
