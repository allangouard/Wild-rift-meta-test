/* Wild Rift Draft Intelligence V12.3 — Interface unifiée.
 * Présentation uniquement. Préserve le moteur existant, ses données et les actions déjà installées.
 * Prérequis : app.js + draft-advisor-v12.js + champion-intelligence-v12.js.
 */
(function (root) {
  'use strict';
  if (typeof document === 'undefined') return;
  const $ = id => document.getElementById(id);
  const create = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function init() {
    const app = $('simpleApp');
    const mainCard = app && app.querySelector('.simple-card');
    if (!mainCard || $('wrdiUnifiedV123')) return;

    const css = create('style');
    css.textContent = `
      #wrdiUnifiedV123 { margin-top:18px; }
      #wrdiUnifiedV123 .wrdi-tabs { display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:12px 0 14px; }
      #wrdiUnifiedV123 .wrdi-tab { min-width:0;border:1px solid #477681;border-radius:10px;background:#163443;color:#dceaf1;padding:12px 5px;font-size:clamp(12px,3.3vw,15px);font-weight:700; }
      #wrdiUnifiedV123 .wrdi-tab[aria-selected="true"] { background:#177b72;border-color:#51b8a9;color:white; }
      #wrdiUnifiedV123 .wrdi-pane[hidden] { display:none !important; }
      #wrdiUnifiedV123 .wrdi-pane { min-width:0; }
      #wrdiUnifiedV123 .wrdi-pane > #wrdiV12DraftAdvisor,
      #wrdiUnifiedV123 .wrdi-pane > #wrdiChampionIntelligenceV12 { margin:0 !important; }
      #wrdiUnifiedV123 .wrdi-pane > #simpleResults { margin:0 !important; }
      #wrdiUnifiedV123 .wrdi-message { color:#b8cbd3; padding:12px;border:1px dashed #4b6473;border-radius:10px; }
      #wrdiUnifiedV123 .wrdi-subnote { color:#b9cdd4;font-size:13px;line-height:1.5;margin:8px 0 14px; }
      #wrdiUnifiedV123 .wrdi-pane details { max-width:100%; overflow-wrap:anywhere; }
      #wrdiUnifiedV123 .wrdi-pane img { object-fit:contain; }
      @media(max-width:380px) { #wrdiUnifiedV123 .wrdi-tab { padding:10px 3px; } }
    `;
    document.head.appendChild(css);

    const workspace = create('section');
    workspace.id = 'wrdiUnifiedV123';
    workspace.setAttribute('aria-label', 'Analyse de la draft');
    const heading = create('h2', '', '🧠 Analyse de la draft');
    workspace.appendChild(heading);
    const hint = create('p', 'wrdi-subnote', 'Un seul bouton « Analyser ma draft » lance les analyses disponibles. Consulte les résultats dans les onglets ci-dessous. Les signaux de menaces restent heuristiques tant que les kits ne sont pas validés.');
    workspace.appendChild(hint);
    const tabs = create('div', 'wrdi-tabs');
    tabs.setAttribute('role', 'tablist');
    const definitions = [
      ['build', '⚔️ Build'],
      ['threats', '🛡️ Menaces'],
      ['champions', '🧬 Champions']
    ];
    const panes = {};
    const buttons = {};
    definitions.forEach(([id,label]) => {
      const button = create('button', 'wrdi-tab',label);
      button.type='button'; button.id='wrdiTab_'+id;
      button.setAttribute('role','tab'); button.setAttribute('aria-controls','wrdiPane_'+id);
      tabs.appendChild(button); buttons[id]=button;
    });
    workspace.appendChild(tabs);
    definitions.forEach(([id]) => {
      const pane = create('div', 'wrdi-pane');
      pane.id='wrdiPane_'+id;pane.setAttribute('role','tabpanel');
      pane.setAttribute('aria-labelledby','wrdiTab_'+id);
      panes[id]=pane;workspace.appendChild(pane);
    });
    // Déplacer les nœuds existants au lieu de les cloner : leurs écouteurs et états restent intacts.
    const existingBuild = $('simpleResults');
    if (existingBuild) panes.build.appendChild(existingBuild);
    else panes.build.appendChild(create('p','wrdi-message','Résultat Build indisponible : bloc de résultats non trouvé.'));

    const advisor = $('wrdiV12DraftAdvisor');
    if (advisor) {
      panes.threats.appendChild(advisor);
      // La V12 originale contient son propre bouton; le bouton principal de la draft le lance aussi.
      const oldButton=$('wrdiV12Analyze');
      if (oldButton) oldButton.hidden=true;
      const title=advisor.querySelector('h2');
      if (title) title.textContent='🛡️ Menaces et objets conditionnels — V12';
    } else {
      panes.threats.appendChild(create('p','wrdi-message','Module « Assistant de draft V12 » non trouvé. Vérifie le chargement de draft-advisor-v12.js.'));
    }

    const knowledge = $('wrdiChampionIntelligenceV12');
    if (knowledge) {
      panes.champions.appendChild(knowledge);
      const title=knowledge.querySelector('h2');
      if (title) title.textContent='🧬 Fiches et builds observés — V12.2';
    } else {
      panes.champions.appendChild(create('p','wrdi-message','Module « Connaissance des champions » non trouvé. Vérifie le chargement de champion-intelligence-v12.js.'));
    }

    mainCard.appendChild(workspace);
    // « Build » est l'écran principal. Les autres restent consultables sans écraser les résultats.
    function selectTab(id) {
      if(!panes[id])return;
      for(const key of Object.keys(panes)) {
        const active=key===id;
        panes[key].hidden=!active;
        buttons[key].setAttribute('aria-selected',String(active));
        buttons[key].tabIndex=active?0:-1;
      }
    }
    for(const key of Object.keys(buttons))buttons[key].addEventListener('click',()=>selectTab(key));
    tabs.addEventListener('keydown',event=>{
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      const keys=Object.keys(buttons);
      const current=keys.findIndex(id=>buttons[id].getAttribute('aria-selected')==='true');
      const next=(current+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;
      selectTab(keys[next]);buttons[keys[next]].focus();event.preventDefault();
    });
    selectTab('build');

    // Le bouton existant continue son analyse principale; on ajoute les deux modules sans changer son onclick.
    const mainRun=$('simpleRun');
    let lastAuditSignature='';
    const getSignature=()=>{try{return localStorage.getItem('wrdi_draft_v76')||''}catch{return ''}};
    if (mainRun)mainRun.addEventListener('click',()=>{
      selectTab('build');
      const advisorRun=$('wrdiV12Analyze');
      if(advisorRun)advisorRun.click();
      const signature=getSignature();
      const knowledgeRun=knowledge && [...knowledge.querySelectorAll('button')].find(b=>b.textContent.trim()==='Lire les 10 champions');
      // Un audit complet interroge dix fiches : ne le répéter que si la draft a changé.
      if(knowledgeRun && signature && signature!==lastAuditSignature && !knowledgeRun.disabled) {
        lastAuditSignature=signature;
        knowledgeRun.click();
      }
    });
    root.WRDIUnifiedInterfaceV123={selectTab};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})(typeof window!=='undefined'?window:globalThis);
