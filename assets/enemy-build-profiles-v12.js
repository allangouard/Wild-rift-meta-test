/* Wild Rift Draft Intelligence V12.8 — orientations de cores adverses.
 * Ne modifie PAS les objets recommandés à Galio. Aucun appel à LoL PC.
 * Réutilise les cores strictement liés au poste, déjà contrôlés par V12.7.
 */
(function(root){
'use strict';
const VERSION='12.8.0';
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
const create=(tag,s,cls)=>{const e=document.createElement(tag);if(s!==undefined)e.textContent=s;if(cls)e.className=cls;return e};
const categories=['tank','ap','ad','crit','utilitaire'];
const labels={tank:'🛡️ Défense / tank',ap:'🔮 Puissance / magie',ad:'⚔️ Attaque / AD',crit:'🏹 Critique',utilitaire:'🧰 Utilitaire'};
// Identifications explicites : le nom d'un objet permet de relever une ORIENTATION,
// mais ni ses statistiques numériques ni la quantité de dégâts réellement infligés.
// Noms illustrés par les cores Wild Rift du relevé utilisateur du 03/11/2026.
const hints=[
 ['cotteepineuse',['tank','utilitaire'],'armure et anti-soins potentiels'],
 ['rookernkaenique',['tank'],'résistance magique et protection'],
 ['presagederanduin',['tank','utilitaire'],'réponse aux attaques critiques'],
 ['tourmentdeliandry',['ap'],'puissance et dégâts prolongés'],
 ['egidesolaire',['tank'],'défense et dégâts de proximité'],
 ['desespoirinfini',['tank'],'résistances et combat prolongé'],
 ['masqueabyssal',['tank','utilitaire'],'résistance magique et synergies de proximité'],
 ['coeurgele',['tank','utilitaire'],'armure et réduction de vitesse d’attaque'],
 ['forcedelatrinite',['ad'],'orientation combattant et attaques'],
 ['brisecoques',['ad'],'pression de voie et dégâts physiques'],
 ['crochetdeserpent',['ad','utilitaire'],'effet anti-bouclier potentiel'],
 ['gagedesterak',['ad','tank'],'offensif et survie sous conditions'],
 ['eclipse',['ad'],'offensif avec protection conditionnelle'],
 ['percepteur',['ad','crit'],'orientation physique / exécution'],
 ['lametempete',['ad','crit'],'attaque et critique selon le patch'],
 ['rappelmortel',['ad','crit','utilitaire'],'anti-soins et pénétration physique potentielle'],
 ['lunetteshextechc44',['ad','crit'],'attaque à distance et critique'],
 ['lamedinfini',['ad','crit'],'dégâts critiques'],
 ['flechesdesyuntal',['ad','crit'],'orientation attaques critiques'],
 ['salutationsdedominik',['ad','crit'],'orientation pénétration physique / critique'],
 ['createurdefailles',['ap','tank'],'puissance, PV et combat prolongé'],
 ['rayonnementduvide',['tank'],'résistance magique et dégâts de proximité'],
 ['coiffederabadon',['ap'],'puissance magique brute'],
 ['maledictiondusanguinaire',['ap','utilitaire'],'réduction de résistance magique sous conditions'],
 ['batonduvide',['ap'],'pénétration magique'],
 ['morellonomicon',['ap','utilitaire'],'effet anti-soins potentiel']
];
const dict=new Map(hints.map(([k,c,why])=>[k,{c,why}]));
function classification(names){
 const known=[],unknown=[],score=Object.fromEntries(categories.map(k=>[k,0]));
 for(const name of names){const match=dict.get(norm(name));if(!match){unknown.push(name);continue}
  for(const c of match.c)score[c]++;
  known.push({name,categories:match.c,reason:match.why,source:'repère qualitatif par nom, non certification statistique'});
 }
 const coverage=names.length?known.length/names.length:0;
 const ranked=categories.filter(k=>score[k]>0).sort((a,b)=>score[b]-score[a]);
 const primary=ranked.length?ranked[0]:null;
 const ties=primary?ranked.filter(k=>score[k]===score[primary]):[];
 let summary='Orientation indéterminée : aucun objet interprétable.';
 if(primary){summary=ties.length>1?'Orientation mixte / plusieurs familles : '+ties.map(k=>labels[k]).join(' + '):'Orientation indicative : '+labels[primary];}
 return {known,unknown,score,coverage,primary,ranked,ties,summary,confidence:coverage===1?'noms reconnus (classification qualitative seulement)':coverage>=2/3?'partielle':'faible'};
}
function classifyReport(report,resolve){
 return (Array.isArray(report)?report:[]).map(entry=>({champion:entry.champion,roleMatched:entry.roleMatched===true,error:entry.error||null,cores:(entry.cores||[]).map(core=>{
  const names=core.ids.map(code=>resolve(String(code))||null);
  const resolved=names.filter(Boolean);
  const cl=classification(resolved);
  return {...core,names,classification:cl,unresolvedIds:core.ids.filter((code,i)=>!names[i])};
 })}));
}
const base='https://wrchina.gg';
async function json(url){const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(url,{cache:'no-store',signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}finally{clearTimeout(timer)}}
function catalogName(names,items,code){const n=names?.[code];if(typeof n==='string'&&n.trim())return n;
 if(n?.fr)return n.fr;
 const item=items.get(code);return item?.name_fr||item?.name||item?.name_en||null}
function init(){if($('wrdiEnemyProfiles128'))return;
 const pane=$('wrdiPane_threats')||$('wrdiEnemyBuilds127')?.parentElement;
 if(!pane)return;
 const style=create('style');style.textContent=`#wrdiEnemyProfiles128{border:1px solid #477285;border-radius:14px;margin:15px 0;padding:15px;background:#102b39;color:#e2ebf2}#wrdiEnemyProfiles128 p{line-height:1.55}#wrdiEnemyProfiles128 .quiet128{color:#b7cad5;font-size:13px}#wrdiEnemyProfiles128 .warn128{color:#f6c690}#wrdiEnemyProfiles128 .champ128{border:1px solid #35586a;padding:12px;border-radius:10px;margin:10px 0}#wrdiEnemyProfiles128 .core128{padding:10px 0;border-top:1px solid #35586a}#wrdiEnemyProfiles128 .tag128{display:inline-block;padding:5px 7px;margin:2px;border:1px solid #496c79;border-radius:7px;font-size:12px}#wrdiEnemyProfiles128 button{background:#17796f;color:#fff;padding:11px 12px;border:1px solid #50a79c;border-radius:9px;font-weight:700}#wrdiEnemyProfiles128 details>summary{cursor:pointer;font-weight:700}#wrdiEnemyProfiles128 .item128{padding:4px 0;font-size:13px}`;document.head.appendChild(style);
 const box=create('section');box.id='wrdiEnemyProfiles128';box.appendChild(create('h3','🧭 Orientations des builds adverses — V12.8'));
 box.appendChild(create('p','Compare les trois cores affichés par poste et leurs familles d’objets. Repères fondés sur des noms identifiés, pas sur une simulation des statistiques, des passifs ou des dégâts.','quiet128'));
 const btn=create('button','Classer les variantes adverses');btn.type='button';box.appendChild(btn);
 const output=create('div');output.setAttribute('aria-live','polite');box.appendChild(output);
 const parent=$('wrdiEnemyBuilds127');if(parent?.parentElement===pane)parent.insertAdjacentElement('afterend',box);else pane.appendChild(box);
 let busy=false,lastSignature='';
 const say=(target,s,cls='quiet128')=>target.appendChild(create('p',s,cls));
 async function run(force=false){if(busy)return;busy=true;btn.disabled=true;output.replaceChildren();say(output,'Lecture des cores et résolution des noms…');
 try{
  let source=root.WRDIEnemyBuildsV127;
  // V12.7 n'expose un rapport qu'après exécution : on le lance sans inventer un core.
  const saved=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]');
  const stale=!Array.isArray(source?.lastReport)||source.lastReport.some((entry,i)=>String(entry.champion?.id)!==String(saved[i+5]??''));
  if(stale){if(typeof source?.run!=='function')throw Error('Module V12.7 absent.');await source.run();source=root.WRDIEnemyBuildsV127;}
  if(!Array.isArray(source?.lastReport))throw Error('V12.7 n’a pas produit de rapport exploitable.');
  const raw=source.lastReport;
  const draft=localStorage.getItem('wrdi_draft_v76')||'';
  const [catalogResult,namesResult]=await Promise.allSettled([json(base+'/api/items.json'),json(base+'/data/item_names.json?v=3')]);
  const catalog=catalogResult.status==='fulfilled'?catalogResult.value:null;
  const names=namesResult.status==='fulfilled'?namesResult.value:null;
  const items=new Map((catalog?.items||[]).map(x=>[String(x.id),x]));
  const resolved=classifyReport(raw,code=>catalogName(names,items,code));
  output.replaceChildren();
  say(output,'Source : WR China Wild Rift · catalogue '+String(catalog?.patch||'non confirmé')+' · cores issus du rapport V12.7, strictement par poste. Ces orientations ne prédisent pas les achats de la partie.');
  if(!catalog&&!names)say(output,'Les catalogues de noms sont indisponibles. Toute orientation reste inconnue.','warn128');
  for(const entry of resolved){const champ=create('details',undefined,'champ128');champ.open=entry.champion?.expected==='Jungle';
   champ.appendChild(create('summary',(entry.champion?.name||'?')+' · '+(entry.champion?.expected||'?')+' — '+entry.cores.length+' core(s)'));output.appendChild(champ);
   if(!entry.roleMatched){say(champ,entry.error||'Poste non confirmé : impossible de classer les cores.','warn128');continue}
   entry.cores.forEach((core,i)=>{const panel=create('div',undefined,'core128');panel.appendChild(create('strong','Core '+(i+1)+' · '+core.classification.summary));
    const tags=create('div');core.classification.ranked.forEach(k=>{tags.appendChild(create('span',labels[k]+' ('+core.classification.score[k]+' objet(s))','tag128'))});panel.appendChild(tags);
    core.ids.forEach((id,j)=>{const v=core.classification.known.find(x=>x.name===core.names[j]);panel.appendChild(create('div',(core.names[j]||'ID '+id)+' — '+(v?.reason||'catégorie non vérifiée'),'item128'))});
    if(core.unresolvedIds.length)say(panel,'IDs sans nom fiable : '+core.unresolvedIds.join(', ')+'. Non pris en compte.','warn128');
    if(core.classification.unknown.length)say(panel,'Sans classification vérifiée : '+core.classification.unknown.join(', ')+'.','warn128');
    say(panel,'Couverture des repères : '+core.classification.known.length+'/'+core.ids.length+' objets. Usage source : '+(core.pick??'?')+' · victoire : '+(core.win??'?')+'. Échantillon non communiqué.');
    champ.appendChild(panel);
   });
  }
  const summary=create('div',undefined,'champ128');summary.appendChild(create('strong','Conséquences pour la draft'));say(summary,'Les variantes de cores peuvent renforcer les dégâts, la protection ou l’utilité d’un adversaire. Elles ne remplacent pas son kit. Exemple : Amumu peut rester une menace magique même avec un core défensif.');say(summary,'Aucun score défensif ni build de Galio n’est modifié par cette version : il manque la validation des caractéristiques de tous les objets, des passifs et des probabilités de variantes.');output.appendChild(summary);
  root.WRDIEnemyBuildProfilesV128.last={report:resolved,patch:catalog?.patch||null,signature:draft};lastSignature=draft;
 }catch(e){output.replaceChildren();say(output,'Analyse impossible : '+e.message,'warn128')}finally{busy=false;btn.disabled=false}}
 btn.addEventListener('click',()=>run(true));
 // Un clic sur le bouton principal prépare les profils en parallèle des autres modules,
 // sans bloquer leurs résultats ni changer la navigation d’onglets.
 const main=$('simpleRun');if(main)main.addEventListener('click',()=>{const sig=localStorage.getItem('wrdi_draft_v76')||'';if(sig!==lastSignature)run();});
 root.WRDIEnemyBuildProfilesV128={run,classification,classifyReport,version:VERSION};
}
if(typeof document==='undefined'){root.WRDIEnemyBuildProfilesV128={classification,classifyReport,version:VERSION};return}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
