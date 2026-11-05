/* WRDI V14.23 — one-screen recommendations with technical details collapsed.
 * Presentation only: no new item or rune predictions. Reads the existing
 * structured outputs from the item and rune engines independently.
 */
(function(root){
'use strict';
const VERSION='14.23.0-alpha.1';
const el=(tag,text)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;return x;};
function names(page){return page?[page.keystone,...page.primary,page.secondary]:[];}
function init(){
 const run=document.getElementById('simpleRun');
 const card=document.querySelector('#simpleApp > .simple-card');
 if(!run||!card||document.getElementById('wrdiCompactV1423'))return;
 root.WRDI_CompactV1423={version:VERSION};
 document.body.classList.add('wrdi-compact-v1423');
 const css=el('style');css.textContent=`
 body.wrdi-compact-v1423 #wrdiCompactV1423{margin:16px 0;padding:16px;border:1px solid #3b7d7b;border-radius:16px;background:#102c37;color:#e6f5f4}
 #wrdiCompactV1423 h2{margin:0 0 6px;font-size:21px}
 #wrdiCompactV1423 h3{font-size:16px;margin:15px 0 7px}
 #wrdiCompactV1423 p{line-height:1.45;margin:6px 0}
 #wrdiCompactV1423 .small{font-size:12px;color:#b8d1d4}
 #wrdiCompactV1423 .run-row{display:flex;flex-wrap:wrap;gap:7px;margin:7px 0}
 #wrdiCompactV1423 .run-pill{font-size:13px;border:1px solid #416a76;border-radius:10px;padding:8px 10px;background:#1b3e4b}
 #wrdiCompactV1423 .run-sub{padding:8px 0;border-top:1px solid #315562}
 #wrdiCompactV1423 details{margin:9px 0}#wrdiCompactV1423 summary{cursor:pointer}
 body.wrdi-compact-v1423 main>.note,body.wrdi-compact-v1423 main>div:has(>#wrdiOpenRunes149){display:none!important}
 body.wrdi-compact-v1423 main>div:has(>a[href="./catalogue-v12.html"]){display:none!important}
 body.wrdi-compact-v1423 #draft,body.wrdi-compact-v1423 #optimizer,body.wrdi-compact-v1423 #builds,
 body.wrdi-compact-v1423 #champions,body.wrdi-compact-v1423 #items,body.wrdi-compact-v1423 #runes,body.wrdi-compact-v1423 #sources{display:none!important}
 body.wrdi-compact-v1423 #simpleApp > details.simple-card{display:none}
 body.wrdi-compact-v1423 #simpleResults{display:none!important}
 body.wrdi-compact-v1423 #wrdiTechnicalV1423>summary{color:#b7ccd0;padding:10px 0;font-size:13px}
 body.wrdi-compact-v1423 #wrdiTechnicalV1423 #simpleResults{display:block!important}
 body.wrdi-compact-v1423 #wrdiTechnicalV1423 #wrdiUnifiedV123{max-width:100%}
 `;document.head.append(css);
 const shell=el('section');shell.id='wrdiCompactV1423';
 shell.append(el('h2','🎯 Ta recommandation'),el('p','Choisis ta draft, puis lance une seule analyse.'));
 const status=el('p','Aucune analyse lancée.');status.className='small';status.id='wrdiCompactStatus1423';shell.append(status);
 const core=el('section'),items=el('section'),runes=el('section');
 core.id='wrdiCompactCore1423';items.id='wrdiCompactItems1423';runes.id='wrdiCompactRunes1423';
 shell.append(core,items,runes);
 const advanced=el('details');advanced.id='wrdiTechnicalV1423';advanced.append(el('summary','Voir les calculs et analyses détaillés'));
 const workspace=document.getElementById('wrdiUnifiedV123');
 if(workspace)advanced.append(workspace);
 card.append(shell,advanced);
 const signature=()=>{try{return localStorage.getItem('wrdi_draft_v76')||'';}catch{return '';}};
 let activeSignature='',haveBuild=false,haveRunes=false;
 const fillRow=(parent,data)=>{const row=el('div');row.className='run-row';data.forEach(name=>{const p=el('span',name);p.className='run-pill';row.append(p);});parent.append(row);};
 root.addEventListener('wrdi:build-result',event=>{
  const d=event.detail;
  if(!d||!Array.isArray(d.core)||!d.core.length||signature()!==activeSignature)return;
  haveBuild=true;core.replaceChildren();
  core.append(el('h3','⚔️ Build conseillé'));
  fillRow(core,d.core.map(x=>x.name));
  const help=el('p','Core Mid observé dans les données disponibles ; ce n’est pas un build complet ni une supériorité de victoire démontrée.');help.className='small';core.append(help);
  items.replaceChildren(el('h3','🔄 Objets situationnels'));
  if(!d.situational?.length)items.append(el('p','Aucun objet complémentaire suffisamment documenté.'));
  for(const x of d.situational||[]){
   const item=el('div');item.className='run-sub';
   const headline=el('strong',x.name);item.append(headline);
   const why=el('p',x.reason||'Alternative conditionnelle');why.className='small';item.append(why);
   if(x.timing){const when=el('p','Quand : '+x.timing);when.className='small';item.append(when);}
   items.append(item);
  }
  status.textContent=haveRunes?'Build et runes prêts · choix expérimentaux':'Build prêt · analyse des runes en cours ou indisponible';
 });
 root.addEventListener('wrdi:rune-result',event=>{
  const d=event.detail;
  if(!d||d.draftFingerprint!==activeSignature)return;
  haveRunes=true;runes.replaceChildren(el('h3','✨ Runes conseillées'));
  if(!d.ok||!d.legal||!d.fullKitCoverage){
   runes.append(el('p','Page automatique indisponible : draft ou données incomplètes.'));return;
  }
  if(d.championId!=='10099'){runes.append(el('p','Adaptation automatique actuellement disponible uniquement pour Galio mid.'));return;}
  fillRow(runes,names(d.page));
  const caption=el('p','Page Galio tactique expérimentale · structure légale vérifiée.');caption.className='small';runes.append(caption);
  if(d.changes.length){
   for(const c of d.changes){const p=el('p',c.from+' → '+c.to+' : '+c.reason);p.className='small';runes.append(p);}
  }else{const p=el('p','Aucun remplacement justifié parmi les menaces reconnues.');p.className='small';runes.append(p);}
  if(d.alternatives?.length){
   const alt=el('details');alt.append(el('summary','Autres pages de runes'));
   for(const p of d.alternatives){alt.append(el('p',p.label));fillRow(alt,names(p.page));}
   runes.append(alt);
  }
  status.textContent=haveBuild?'Build et runes prêts · choix expérimentaux':'Runes prêtes · attente du build';
 });
 run.addEventListener('click',()=>{
  activeSignature=signature();haveBuild=false;haveRunes=false;
  core.replaceChildren();items.replaceChildren();
  runes.replaceChildren(el('h3','✨ Runes conseillées'),el('p','Analyse en cours…'));
  status.textContent='Analyse des objets et des runes…';
  const picks=(()=>{try{return JSON.parse(activeSignature);}catch{return [];}})();
  const lab=document.getElementById('wrdiAutoKit1414');
  const button=lab?.querySelector('button');
  if(picks.length===10&&picks.every(Boolean)&&String(picks[2])==='10099'&&button&&!button.disabled){
   button.click();
  }else{
   runes.replaceChildren(el('h3','✨ Runes conseillées'),el('p','Complète les dix champions avec Galio mid pour l’adaptation automatique.'));
  }
 });
 document.getElementById('simpleClear')?.addEventListener('click',()=>{
  activeSignature='';haveBuild=false;haveRunes=false;
  core.replaceChildren();items.replaceChildren();runes.replaceChildren();
  status.textContent='Aucune analyse lancée.';
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
