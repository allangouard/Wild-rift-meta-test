/* WRDI V14.3 — diagnostic Galio, lecture seule. */
(function(root){
'use strict';
const VERSION='14.3.0-alpha.1';
const $=id=>document.getElementById(id);
const el=(tag,content)=>{const x=document.createElement(tag);if(content!==undefined)x.textContent=String(content);return x;};
function init(){
  if($('wrdiDiagnostic143'))return;
  const host=$('simpleApp');
  if(!host)return;
  const panel=el('section');
  panel.id='wrdiDiagnostic143';
  panel.className='simple-card';
  panel.style.cssText='max-width:960px;margin:16px auto;padding:16px;border:1px solid #397d80;border-radius:12px;background:#102b39;color:#e9f4f4';
  const title=el('h2','🔬 V14.3 — Diagnostic Galio');
  const description=el('p','Audit expérimental des cinq adversaires, des kits et des builds observés. Ne change aucun objet, aucune rune ni aucun résultat actuel.');
  description.style.cssText='font-size:13px;line-height:1.6;color:#c1d7db';
  const button=el('button','Analyser la draft avec V14');
  button.type='button';
  const output=el('div','Sélectionne Galio au mid et cinq adversaires, puis lance le diagnostic.');
  output.style.cssText='margin-top:12px;line-height:1.6;overflow-wrap:anywhere';
  output.setAttribute('aria-live','polite');
  panel.append(title,description,button,output);
  const actions = $('simpleRun')?.closest('.simple-actions');
if (actions) actions.insertAdjacentElement('afterend', panel);
else host.appendChild(panel);
  const line=(text,parent=output)=>parent.appendChild(el('p',text));
  const list=(label,items,parent=output)=>{
    const d=el('details');
    d.appendChild(el('summary',label));
    for(const item of items)line(item,d);
    parent.appendChild(d);
  };
  const fetchJson=async path=>{
    const r=await fetch(path,{cache:'no-store'});
    if(!r.ok)throw Error('HTTP '+r.status+' : '+path);
    return r.json();
  };
  let runNumber=0;

  button.addEventListener('click',async()=>{
    const run=++runNumber;
    output.replaceChildren();
    const core=root.WRDI_CoreV14;
    const coord=root.WRDI_CoordinatorV14;
    const adapters=root.WRDI_AdaptersV14;
    if(!core||!coord||!adapters){
      line('Modules V14.0 / V14.1 / V14.2 absents. Vérifier les scripts.');
      return;
    }
    let picks;
    try{
      picks=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]');
    }catch{picks=[];}
    if(!Array.isArray(picks)||picks.length!==10||
       String(picks[2])!=='10099'){
      line('Diagnostic réservé à Galio mid. Sélectionne Galio et les cinq adversaires.');
      return;
    }
    if(picks.slice(5).some(id=>!id)){
      line('Les cinq adversaires doivent être renseignés.');
      return;
    }
    button.disabled=true;
    line('Analyse V14 en cours…');
    try{
      const app=adapters.create({
        root,storage:localStorage,fetchJson,core,coordinator:coord
      });
      const report=await app.run();
      if(run!==runNumber)return;
      output.replaceChildren();
      const status=report.status||'inconnu';
      line('Statut : '+status);
      if(!report.ok){
        line('Diagnostic interrompu : '+(report.reason||
          (report.errors||[]).join(' ; ')||'Données incomplètes.'));
        return;
      }
      line('Jeu : Wild Rift mobile · catalogue client déclaré : '+report.patch);
      line('Cinq adversaires reconnus : '+report.threats.length+'/5');
      line('Recommandations automatiques V14 : désactivées.');
      line('Attention : version des sources WR China non certifiée identique au patch client.');
      const summaryApi=root.WRDI_ThreatSummaryV14;
      if(summaryApi?.summarize){
        const summary=summaryApi.summarize(report);
        if(summary.ok){
          const overview=el('section');
          overview.style.cssText='margin:12px 0;padding:12px;border:1px solid #4d8180;border-radius:10px';
          overview.appendChild(el('h3','🛡️ V14.4 — Synthèse descriptive de la draft'));
          line('Mentions dans les cinq kits : magie '+summary.counts.magic+'/5 · physique '+summary.counts.physical+'/5 · dégâts véritables '+summary.counts.true+'/5.',overview);
          line('Contrôles (étourdissement, projection, immobilisation) '+summary.counts.cc+'/5 · soins '+summary.counts.heal+'/5 · boucliers '+summary.counts.shield+'/5.',overview);
          line('Mentions liées aux PV maximum '+summary.counts.maxhp+'/5 · effets périodiques '+summary.counts.overtime+'/5.',overview);
          list('Orientations indicatives des cores adverses',summary.enemies.map(e=>
            e.name+' : '+(e.orientations.length?e.orientations.join(' / '):'non classée')+
            ' · '+e.coreCount+' core(s) · '+e.missingNames+' nom(s) d’objet manquant(s)'
          ),overview);
          list('Versions et limites de fiabilité',summary.notices,overview);
          line('Aucun build Galio n’est calculé ni recommandé par cette synthèse.',overview);
          output.appendChild(overview);
        }else line('Synthèse V14.4 indisponible : '+summary.error);
      }else line('Module V14.4 non chargé : synthèse des menaces absente.');
      report.threats.forEach((t,i)=>{
        const b=report.enemyBuilds[i];
        const card=el('div');
        card.style.cssText='padding:10px;margin:10px 0;border:1px solid #446b77;border-radius:9px';
        card.appendChild(el('h3',(i+1)+'. '+(t.name||'Champion '+t.id)));
        line('ID : '+t.id+' · fiche : '+(t.sourceVersion||'version inconnue'),card);
        line('Poste du build : '+(b.roleMatched?'confirmé':'non confirmé'),card);
        line('Cores observés : '+b.cores.length,card);
        const signals=(t.signals||[]).map(s=>s.label||s.id);
        list('Signaux de compétences (qualitatifs)',signals.length?signals:['Aucun signal documenté'],card);
        const cores=b.cores.map((c,j)=>{
          const names=(c.ids||[]).map((id,k)=>{
            const name=c.names?.[k];
            return typeof name==='string'&&name.trim()?name.trim():'ID '+id;
          });
          return 'Core '+(j+1)+' : '+names.join(' + ')+
            (c.unresolvedIds?.length?' · IDs non résolus : '+c.unresolvedIds.join(', '):'')+
            ' · usage : '+(c.pick??'inconnu')+
            ' · victoire : '+(c.win??'inconnue');
        });
        list('Variantes de builds observées',cores,card);
        if(b.sourcePatch!==report.patch)line('Patch de la source builds : '+(b.sourcePatch||'inconnu')+' — non confirmé',card);
        output.appendChild(card);
      });
      line('Résultat descriptif uniquement : aucun calcul de dégâts ni build optimal démontré.');
    }catch(e){
      if(run===runNumber){output.replaceChildren();line('Erreur de diagnostic : '+String(e.message||e));}
    }finally{
      if(run===runNumber)button.disabled=false;
    }
  });
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
}
root.WRDI_DiagnosticV14={VERSION,init};
})(typeof window!=='undefined'?window:globalThis);
