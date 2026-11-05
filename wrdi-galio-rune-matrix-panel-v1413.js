/* V14.13 — Galio kit / rune matrix inspection, isolated from object catalog. */
(function(root){
'use strict';
const mk=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e};
function boot(){
 const host=document.getElementById('wrdiPane_runes')||document.getElementById('runes');
 const engine=root.WRDI_GalioRuneMatrixV1413,bridge=root.WRDI_RuneBridgeV14;
 if(!host||!engine||!bridge||document.getElementById('wrdiGalioRuneMatrix1413'))return;
 const panel=mk('section');panel.id='wrdiGalioRuneMatrix1413';
 panel.style.cssText='margin:16px 0;padding:14px;border:1px solid #67b2a6;border-radius:12px';
 panel.append(mk('h3','🔬 V14.13 — Kit Galio ↔ runes'));
 panel.append(mk('p','Matrice de déclenchements potentiels, avec preuves, conditions et limites. Le moteur ne classe pas encore les meilleures runes.'));
 const result=mk('div');result.setAttribute('aria-live','polite');panel.append(result);
 host.append(panel);
 fetch('./data/rune-catalog-client-v14.json',{cache:'no-store'}).then(r=>{
  if(!r.ok)throw Error('Catalogue runes non trouvé : '+r.status);
  return r.json();
 }).then(catalog=>{
  const data=engine.inspect(catalog,bridge);
  if(!data.ok)throw Error(data.errors.join(' ; '));
  result.append(mk('p',data.abilities.length+' compétences de Galio · '+data.interactionCount+' interactions étudiées · '+data.runeCoverage+' runes analysées. Aucune interaction de combat certifiée.'));
  const summary=mk('details');summary.append(mk('summary','Voir les cinq compétences de Galio'));
  for(const a of data.abilities){
   const details=mk('details');
   details.append(mk('summary',a.slot+' · '+a.name+' · '+a.interactions.length+' pistes'));
   details.append(mk('p',a.detail));
   details.append(mk('p','Source : '+(a.verified==='riot_wild_rift'?'Riot Wild Rift':'Guide Wild Rift secondaire')));
   const url=mk('a','Consulter la source');url.href=a.source;url.target='_blank';url.rel='noopener noreferrer';details.append(url);
   for(const item of a.interactions){
    const row=mk('p','• '+item.rune+' — '+item.condition+' '+item.reason);
    details.append(row);
   }
   summary.append(details);
  }
  result.append(summary);
  const notes=mk('details');notes.append(mk('summary','Fiabilité et points à confirmer en jeu'));
  for(const n of data.warnings)notes.append(mk('p','• '+n));
  result.append(notes);
  result.append(mk('p','Étape suivante : valider les déclenchements réels, puis seulement pondérer les runes selon les dix champions.'));
 }).catch(err=>result.replaceChildren(mk('p','Matrice indisponible : '+String(err.message||err))));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})(typeof globalThis!=='undefined'?globalThis:this);
