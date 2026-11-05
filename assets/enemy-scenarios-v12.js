/* WRDI V12.9 — Scénarios de builds adverses et options Galio.
 * Wild Rift mobile uniquement. Comparaison indicative, aucun classement optimal.
 * Ne modifie ni app.js ni le build principal de l'utilisateur.
 */
(function(root){
'use strict';
const VERSION='12.9.0', $=id=>document.getElementById(id);
const mk=(tag,value,cls)=>{const e=document.createElement(tag);if(value!==undefined)e.textContent=value;if(cls)e.className=cls;return e};
const candidates=['hollow_radiance','unending_despair','thornmail','riftmaker','banshees_veil','liandrys_torment','morellonomicon','bloodletters_curse'];
const fmt=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1});
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const scenarioFlags={tank:'Défense',ap:'AP',ad:'AD',crit:'Critique',utilitaire:'Utilitaire'};
function coreType(core){
 const v=core?.classification;const score=v?.score||{};
 const keys=Object.keys(scenarioFlags).filter(k=>Number(score[k])>0);
 return {keys,unknown:!(core?.ids?.length)||Boolean(core.unresolvedIds?.length)||Boolean(v?.unknown?.length),coverage:v?.coverage||0};
}
function summarize(entries,indexes){
 const rows=[],tally={tank:0,ap:0,ad:0,crit:0,utilitaire:0};
 entries.forEach((entry,i)=>{const idx=indexes[i]??0,core=entry.cores?.[idx];if(!entry.roleMatched||!core){rows.push({name:entry.champion?.name||'?',valid:false});return;}
  const info=coreType(core);for(const k of info.keys)tally[k]++;
  rows.push({name:entry.champion?.name||'?',valid:true,index:idx,core,info});
 });return {rows,tally};
}
function itemStat(item,key){const v=item?.stats?.[key];return Number.isFinite(Number(v))?Number(v):null}
function itemOverview(item){
 if(!item)return null;const out={id:item.id,name:item.name_fr||item.id,price:item.price_gold,missing:[],stats:{}};
 for(const key of ['hp','armor','mr','ap','ah']){const n=itemStat(item,key);if(n===null)out.missing.push(key);else out.stats[key]=n}
 return out;
}
function candidateReasons(item,summary){
 const res=[],st=item.stats||{},t=summary.tally;
 if(st.mr>0)res.push('+'+st.mr+' RM : réponse partielle aux dégâts magiques (pas aux dégâts véritables)');
 if(st.armor>0)res.push('+'+st.armor+' armure : réponse partielle aux dégâts physiques (pas aux dégâts véritables)');
 if(st.hp>0)res.push('+'+st.hp+' PV : réserve de survie contre plusieurs types de dégâts');
 if(st.ap>0)res.push('+'+st.ap+' AP : potentiel offensif, dégâts réels du combo non calculés');
 if(t.crit&&st.armor>0)res.push('Variante critique observée : intérêt défensif de l’armure, passif anti-critique non supposé');
 if(t.tank>=2&&st.ap>0)res.push('Plusieurs variantes défensives : examiner pénétration et combat prolongé, non simulés');
 const notes={hollow_radiance:'Immolation : déclenchements et proximité non simulés',unending_despair:'Affliction : rythme, zone et soin non simulés',thornmail:'Blessures graves : vérifier le besoin réel et l’application',riftmaker:'Amplification progressive et omnivamp non simulés',banshees_veil:'Bouclier anti-sort : efficacité dépend du sort reçu',liandrys_torment:'Brûlure : dépend des PV de la cible et de la durée du combat',morellonomicon:'Anti-soins : seulement si une source adverse de soin importante est confirmée',bloodletters_curse:'Réduction de RM : dépend des impacts et des résistances réelles'};
 return {reasons:res.slice(0,4),caution:notes[item.id]||'Effets uniques non simulés'};
}
function init(){if($('wrdiScenarios129'))return;
 const pane=$('wrdiPane_threats')||$('wrdiEnemyProfiles128')?.parentElement;
 if(!pane)return;
 const css=mk('style',`#wrdiScenarios129{border:1px solid #456c80;border-radius:14px;padding:15px;margin:18px 0;background:#102b39;color:#e3edf5}#wrdiScenarios129 p{line-height:1.55}#wrdiScenarios129 .mut129{color:#b9cad5;font-size:13px}#wrdiScenarios129 .err129{color:#f9c996}#wrdiScenarios129 .entry129{border:1px solid #3a5c6d;border-radius:12px;padding:11px;margin:10px 0}#wrdiScenarios129 label{display:block;margin:8px 0}#wrdiScenarios129 select{display:block;width:100%;max-width:100%;padding:9px;background:#173b4b;color:white;border:1px solid #608293;border-radius:8px}#wrdiScenarios129 button{padding:11px;background:#177d73;color:white;border:1px solid #67afa7;border-radius:8px;font-weight:bold}#wrdiScenarios129 button:disabled{opacity:.5}#wrdiScenarios129 .stat129{display:flex;justify-content:space-between;gap:8px;border-bottom:1px solid #345669;padding:6px 0}#wrdiScenarios129 summary{cursor:pointer;font-weight:bold}`);document.head.appendChild(css);
 const box=mk('section');box.id='wrdiScenarios129';box.appendChild(mk('h3','⚖️ Scénarios adverses et options Galio — V12.9'));
 box.appendChild(mk('p','Choisis une variante observée pour chaque adversaire. Nous comparons les caractéristiques connues de quelques objets Galio, sans prédire les achats ni calculer leur efficacité totale.','mut129'));
 const btn=mk('button','Comparer les scénarios');btn.type='button';box.appendChild(btn);
 const out=mk('div');out.setAttribute('aria-live','polite');box.appendChild(out);
 const prior=$('wrdiEnemyProfiles128');if(prior?.parentElement===pane)prior.insertAdjacentElement('afterend',box);else pane.appendChild(box);
 const line=(parent,text,cls='mut129')=>parent.appendChild(mk('p',text,cls));
 let controls=[],loaded=null,selectionSignature='',busy=false;
 const draftSignature=()=>localStorage.getItem('wrdi_draft_v76')||'';
 function draw(){out.replaceChildren();controls=[];
  if(!loaded)return;
  const {report,catalog}=loaded;
  line(out,'Scénarios de trois objets observés par poste. Changer une variante n’indique pas ce que l’ennemi a réellement acheté.');
  for(const [i,entry] of report.entries()){
   const wrapper=mk('div',undefined,'entry129');wrapper.appendChild(mk('strong',(entry.champion?.name||'?')+' · '+(entry.champion?.expected||'?')));
   if(!entry.roleMatched||!entry.cores?.length){line(wrapper,'Aucun core au poste requis : scénario non disponible.','err129');out.appendChild(wrapper);controls.push(null);continue;}
   const label=mk('label','Variante à tester');const sel=mk('select');sel.setAttribute('aria-label','Variante '+(entry.champion?.name||'?'));
   entry.cores.forEach((core,j)=>{const info=coreType(core),o=mk('option');o.value=String(j);const flags=info.keys.map(k=>scenarioFlags[k]).join(' / ')||'non classé';o.textContent='Core '+(j+1)+' · '+flags+(info.unknown?' · incomplet':'')+' · usage '+(core.pick??'?');sel.appendChild(o)});
   sel.addEventListener('change',renderAssessment);label.appendChild(sel);wrapper.appendChild(label);out.appendChild(wrapper);controls.push(sel);
  }
  const results=mk('div');results.id='wrdiScenarioResult129';out.appendChild(results);renderAssessment();
 }
 function renderAssessment(){const dest=$('wrdiScenarioResult129');if(!dest||!loaded)return;dest.replaceChildren();const {report,catalog}=loaded;
  if(draftSignature()!==selectionSignature){line(dest,'La draft a changé. Relance « Comparer les scénarios » avant toute interprétation.','err129');return}
  const summary=summarize(report,controls.map(el=>el?Number(el.value):null));
  const total=summary.rows.filter(r=>r.valid).length;
  dest.appendChild(mk('h4','Synthèse des cinq variantes sélectionnées'));
  line(dest,total+'/5 postes documentés · familles d’objets présentes dans les cores : '+Object.entries(summary.tally).filter(([k,v])=>v).map(([k,v])=>scenarioFlags[k]+' '+v).join(' · ')+'.');
  line(dest,'Ces comptes décrivent les objets des cores, pas les proportions de dégâts infligés. Les mêmes cores peuvent compter dans plusieurs familles.');
  const unknown=summary.rows.filter(r=>!r.valid||r.info?.unknown);if(unknown.length)line(dest,'Vigilance : classification incomplète pour '+unknown.map(x=>x.name).join(', ')+'.','err129');
  const items=Array.isArray(catalog?.items)?catalog.items:[];const byId=new Map(items.map(x=>[x.id,x]));
  dest.appendChild(mk('h4','Options Galio — statistiques documentées'));
  for(const id of candidates){const src=byId.get(id);if(!src)continue;const item=itemOverview(src),why=candidateReasons(item,summary);
   const card=mk('details',undefined,'entry129');card.appendChild(mk('summary',item.name+' · '+(item.price??'prix inconnu')+' PO'));
   for(const [k,v] of Object.entries(item.stats))card.appendChild(mk('div',k.toUpperCase()+' : +'+fmt(v),'stat129'));
   why.reasons.forEach(t=>line(card,t));line(card,'Passif : '+why.caution,'err129');
   if(item.missing.length)line(card,'Champs non renseignés (ne signifient pas zéro) : '+item.missing.join(', ')+'.');
   dest.appendChild(card);
  }
  line(dest,'Aucun calcul de dégâts, réduction de dégâts, score d’efficacité ou classement optimal. Les statistiques viennent d’un catalogue de captures annoncé 7.3d : leur conformité au patch en jeu doit être confirmée.');
  line(dest,'Pour comparer des objets comme Rayonnement du vide et Désespoir infini, il faut ensuite valider les passifs, les déclenchements, le niveau du champion et un scénario de dégâts entrants.');
 }
 async function run(){if(busy)return;busy=true;btn.disabled=true;out.replaceChildren();line(out,'Chargement des profils V12.8 et du catalogue local…');
  try{
   const sig=draftSignature(),draft=JSON.parse(sig||'[]');if(!Array.isArray(draft)||draft.length!==10||draft.slice(5).some(x=>!x))throw Error('Complète les cinq adversaires dans la draft.');
   const api=root.WRDIEnemyBuildProfilesV128;if(!api?.run)throw Error('Module V12.8 absent ou non initialisé.');
   if(!api.last?.report||api.last.signature!==sig)await api.run();
   if(!api.last?.report||api.last.signature!==sig)throw Error('Le rapport V12.8 est indisponible : utilise « Classer les variantes adverses », puis réessaie.');
   const r=await fetch('./data/items-client-7.3d-v12.json',{cache:'no-store'});if(!r.ok)throw Error('Catalogue client : HTTP '+r.status);const catalog=await r.json();
   if(catalog.target_game!=='Wild Rift mobile'||!Array.isArray(catalog.items))throw Error('Catalogue local incompatible.');
   loaded={report:api.last.report,catalog};selectionSignature=sig;draw();
  }catch(e){loaded=null;out.replaceChildren();line(out,'Comparaison indisponible : '+e.message,'err129')}
  finally{busy=false;btn.disabled=false}
 }
 btn.addEventListener('click',run);
 root.WRDIEnemyScenariosV129={version:VERSION,run,summarize,coreType,itemOverview,candidateReasons};
}
if(typeof document==='undefined'){root.WRDIEnemyScenariosV129={version:VERSION,summarize,coreType,itemOverview,candidateReasons};return}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
