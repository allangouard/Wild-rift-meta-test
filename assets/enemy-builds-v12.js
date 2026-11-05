/* Wild Rift Draft Intelligence V12.7 — audits des cores ennemis, PAS une prédiction.
 * Source WR China Wild Rift, poste strict, identifiants exacts, provenance visible.
 * Module indépendant des calculateurs et du choix d'objets existants.
 */
(function(root){
'use strict';
if(typeof document==='undefined')return;
const BASE='https://wrchina.gg';
const ROLES=['Top','Jungle','Mid','ADC','Support'];
const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const id=x=>String(x&&typeof x==='object'?x.id:x??'');
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
function roleOf(p){const raw=clean([p.pos_label,p.label,p.pos,p.position,p.pos_id].filter(Boolean).join(' '));
 if(/giungla|jungle|forest|野/.test(raw))return 'Jungle';
 if(/support|sup|sostegno|辅助/.test(raw))return 'Support';
 if(/botadc|bottom|dragon|adc|tiratore|射手|下路/.test(raw))return 'ADC';
 if(/middle|mid|中心|中路|中单/.test(raw))return 'Mid';
 if(/top|baron|solo|上路/.test(raw))return 'Top';return null;
}
function picks(){let a;try{a=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]')}catch{a=[]}return Array.isArray(a)&&a.length===10?a:[]}
function slotName(i,code){const btn=document.querySelector('[data-simple-slot="'+i+'"]');const label=btn?.querySelector('.slot-text');const role=btn?.querySelector('.slot-role');return (label?.textContent||'').replace(role?.textContent||'','').trim()||('Champion '+code)}
async function json(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),14000);try{const r=await fetch(url,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}
function date(v){const x=String(v||'');return /^\d{8}$/.test(x)?x.slice(6,8)+'/'+x.slice(4,6)+'/'+x.slice(0,4):x||'non indiquée'}
function uri(input){if(typeof input!=='string'||!input.trim())return null;try{const u=new URL(input,BASE);return u.protocol==='https:'?u.href:null}catch{return null}}
function init(){const pane=$('wrdiPane_threats')||$('wrdiV12DraftAdvisor');if(!pane||$('wrdiEnemyBuilds127'))return;
 const css=el('style',`#wrdiEnemyBuilds127{background:#102b3a;border:1px solid #456677;border-radius:14px;padding:14px;margin:18px 0;color:#e3edf4}#wrdiEnemyBuilds127 .muted127{color:#bacbd5;font-size:13px;line-height:1.55}#wrdiEnemyBuilds127 .entry127{border:1px solid #3e6374;border-radius:11px;padding:12px;margin:12px 0}#wrdiEnemyBuilds127 .core127{padding:9px 0;border-top:1px solid #335464}#wrdiEnemyBuilds127 .items127{display:flex;flex-wrap:wrap;gap:7px;margin:7px 0}#wrdiEnemyBuilds127 .item127{display:inline-flex;gap:5px;align-items:center;border:1px solid #34596a;border-radius:8px;padding:5px;max-width:100%;font-size:12px}#wrdiEnemyBuilds127 .item127 img{width:30px;height:30px;object-fit:contain}#wrdiEnemyBuilds127 details>summary{cursor:pointer;font-weight:700}#wrdiEnemyBuilds127 button{padding:10px 13px;border-radius:9px;border:1px solid #4ba69c;background:#16776f;color:white;font-weight:700}#wrdiEnemyBuilds127 .warn127{color:#f0c690}#wrdiEnemyBuilds127 .entry127 p{line-height:1.5}`);document.head.appendChild(css);
 const box=el('section');box.id='wrdiEnemyBuilds127';box.appendChild(el('h3','🧩 Variantes de builds adverses — V12.7'));
 box.appendChild(el('p','Compare les cores de trois objets réellement publiés pour le poste de chaque adversaire. Ce sont des scénarios observés, jamais des inventaires connus en partie. Aucun changement automatique du build Galio.','muted127'));
 const button=el('button','Examiner les builds adverses');button.type='button';box.appendChild(button);
 const output=el('div');output.setAttribute('aria-live','polite');box.appendChild(output);
 pane.appendChild(box);
 function p(to,s,cls){to.appendChild(el('p',s,cls))}
 async function run(){const selection=picks();output.replaceChildren();if(!selection.length||selection.slice(5).some(x=>!x)){p(output,'Complète les cinq adversaires dans la draft.','warn127');return}
 button.disabled=true;p(output,'Lecture des catalogues et des cinq postes ennemis…','muted127');
 try{
  const catalogResults=await Promise.allSettled([json(BASE+'/api/items.json'),json(BASE+'/data/item_names.json?v=3')]);
  const itemCatalog=catalogResults[0].status==='fulfilled'?catalogResults[0].value:null;
  const nameCatalog=catalogResults[1].status==='fulfilled'?catalogResults[1].value:null;
  const itemRows=Array.isArray(itemCatalog?.items)?itemCatalog.items:[];
  const itemMap=new Map(itemRows.map(x=>[String(x.id),x]));
  const inputs=selection.slice(5).map((v,j)=>({id:id(v),name:slotName(j+5,id(v)),expected:ROLES[j]}));
  const calls=await Promise.allSettled(inputs.map(x=>json(BASE+'/api/build/'+encodeURIComponent(x.id)+'_1.json')));
  output.replaceChildren();p(output,'Catalogue : '+(itemCatalog?.patch||'patch non indiqué')+' · Builds : relevés individuels ci-dessous · fiches de sorts : versions indépendantes. Versions identiques non garanties.','muted127');
  if(!itemRows.length)p(output,'Le catalogue d’objets WR China est indisponible : les identifiants restent visibles, sans résolution inventée.','warn127');
  let totalValid=0,totalUnknown=0;
  const report=[];
  inputs.forEach((x,i)=>{
   const section=el('details',undefined,'entry127');section.open=i===1;
   section.appendChild(el('summary',x.name+' · '+x.expected));output.appendChild(section);
   const r=calls[i];if(r.status!=='fulfilled'){p(section,'Builds indisponibles : '+String(r.reason),'warn127');report.push({champion:x,error:String(r.reason)});return}
   const b=r.value,positions=Array.isArray(b.positions)?b.positions:[];
   const pos=positions.find(q=>roleOf(q)===x.expected);
   p(section,'Rang de la source : '+String(b.rank_label||b.rank||'Diamant+ (requête rang 1)')+' · Relevé : '+date(b.date)+' · Poste exigé : '+x.expected+'.','muted127');
   if(!pos){p(section,'Aucun poste '+x.expected+' reconnu dans cette réponse. Refus d’utiliser un autre poste. Postes retournés : '+positions.map(z=>z.pos_label||z.label||z.pos||'?').join(', '),'warn127');report.push({champion:x,roleMatched:false});return}
   const cores=Array.isArray(pos.core)?pos.core:[];
   const valid=[];let discarded=0;
   for(const c of cores){const ids=Array.isArray(c.items)?c.items.map(id):[];
     if(ids.length!==3||ids.some(z=>!z)||new Set(ids).size!==3){discarded++;continue}valid.push({ids,pick:c.pick,win:c.win});
   }
   const unique=new Map();for(const c of valid){const key=[...c.ids].sort().join('|');if(!unique.has(key))unique.set(key,c)}
   const list=[...unique.values()].slice(0,3);
   p(section,list.length+' core(s) distinct(s) affiché(s) sur '+cores.length+' publiés · '+discarded+' structure(s) écartée(s).','muted127');
   if(!list.length)p(section,'Aucun core utilisable à ce poste.','warn127');
   const local=[];
   list.forEach((c,k)=>{
    const e=el('div',undefined,'core127');e.appendChild(el('strong','Core observé '+(k+1)));
    const strip=el('div',undefined,'items127');e.appendChild(strip);
    const unknown=[];
    for(const code of c.ids){const item=itemMap.get(code);const chip=el('span',undefined,'item127');
      const named=nameCatalog?.[code];const display=typeof named==='string'?named:(named?.fr||item?.name||null);
      const url=uri(item?.icon);if(url){const img=el('img');img.alt='';img.loading='lazy';img.src=url;img.onerror=()=>img.remove();chip.appendChild(img)}
      chip.appendChild(el('span',display||'ID '+code));strip.appendChild(chip);
      if(!item){unknown.push(code);totalUnknown++}
    }
    if(unknown.length)p(e,'Objets absents du catalogue source : '+unknown.join(', ')+'. Identifiants conservés, interprétation bloquée.','warn127');
    p(e,'Usage source : '+(c.pick??'non indiqué')+' · Victoire source : '+(c.win??'non indiqué')+'. Taille d’échantillon et significativité non fournies.','muted127');
    const unavailable=c.ids.some(z=>!itemMap.has(z));
    p(e,unavailable?'Variante non classable : objets non résolus.':'Variante distincte d’équipement observée. Son orientation tank/AP/AD reste à vérifier à partir des statistiques et passifs de ces trois objets.','muted127');
    section.appendChild(e);local.push({ids:c.ids,pick:c.pick,win:c.win,unknown});totalValid++;
   });
   if(list.length>=2){const baseline=new Set(list[0].ids);for(let j=1;j<list.length;j++){const added=list[j].ids.filter(z=>!baseline.has(z));p(section,'Différence core '+(j+1)+' contre core 1 : '+(added.length?'objets substitués '+added.join(', '):'mêmes objets, ordre différent')+'.','muted127')}}
   report.push({champion:x,roleMatched:true,position:pos.pos_label||pos.label||null,rank:b.rank_label||null,date:b.date||null,cores:local});
  });
  const conclusion=el('div',undefined,'entry127');conclusion.appendChild(el('strong','Interprétation pour Galio'));
  p(conclusion,'Un core de trois objets et son usage ne prouvent ni le build final de l’ennemi ni son type de dégâts réel. Les variantes identifiées sont des hypothèses à comparer aux kits, à la composition et aux achats observés en partie.','muted127');
  p(conclusion,'Qualité : '+totalValid+' cores affichés ; '+totalUnknown+' occurrences d’objets non résolus. Aucun ratio de dégâts, efficacité défensive ou classement de build Galio n’est extrapolé.','muted127');output.appendChild(conclusion);
  root.WRDIEnemyBuildsV127={lastReport:report,buildsSource:BASE,metaPatch:itemCatalog?.patch||null};
 }catch(error){output.replaceChildren();p(output,'Lecture impossible : '+String(error),'warn127')}finally{button.disabled=false}
 }
 button.addEventListener('click',run);
 // Un seul bouton principal, mais ne relancer cet audit détaillé que si l'utilisateur ouvre le module.
 root.WRDIEnemyBuildsV127={run};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
