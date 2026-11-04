/* Wild Rift Draft Intelligence — base champions V12, étape 1.
 * Audit de données source, PAS de simulation ni de classement automatique.
 * Réutilise les identifiants de la draft et les fiches WR China Meta de l'application.
 * Aucun endpoint LoL PC. Aucun tag déduit d'un texte non validé.
 */
(function(root){
'use strict';
const BASE='https://wrchina.gg';
const STORE='wrdi_draft_v76';
const roles=['Top','Jungle','Mid','ADC','Support'];
const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const str=v=>typeof v==='string'?v:JSON.stringify(v??'');
const limit=(s,n=1200)=>String(s||'').slice(0,n);
const el=(tag,text,className)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(className)x.className=className;return x};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
function picks(){try{const d=typeof draftPicks!=='undefined'?draftPicks:JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(d)&&d.length===10?d.map(x=>String(x||'')):Array(10).fill('')}catch{return Array(10).fill('')}}
function pool(){try{return typeof champions!=='undefined'&&Array.isArray(champions)?champions:[]}catch{return []}}
function threats(){try{return typeof threatProfiles!=='undefined'?threatProfiles:{}}catch{return {}}}
function currentPatch(){try{return typeof db!=='undefined'?(db.meta?.patch||db.items?.patch||null):null}catch{return null}}
function findName(id){const c=pool().find(x=>String(x.id)===String(id));return c?.name&&c.name!=='Nom en cours de chargement'?c.name:'Champion '+id}
function getFlags(name){const entries=Object.entries(threats());const k=normalize(name);return entries.find(([n])=>normalize(n)===k)?.[1]||null}
async function fetchJson(url){const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),13000);try{const r=await fetch(url,{cache:'no-store',signal:ctl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timeout)}}
function abilityRows(raw){const a=raw?.abilities;const entries=Array.isArray(a)?a.map((v,i)=>[String(i),v]):a&&typeof a==='object'?Object.entries(a):[];
 return entries.map(([slot,v])=>{const o=v&&typeof v==='object'?v:{desc:str(v)};return {slot,name:clean(o.name||o.key||o.slot||slot),description:clean(o.desc||o.description||''),cooldown:o.cooldown??o.cd??null,raw:o}})}
function buildSummary(raw){const arr=Array.isArray(raw?.positions)?raw.positions:[];return arr.map(p=>({role:String(p.pos_label||p.label||p.pos||p.position||p.pos_id||'inconnu'),cores:(p.core||[]).slice(0,3).map(x=>({itemIds:(x.items||[]).map(y=>String(y?.id??y)),pick:x.pick??null,win:x.win??null})),runes:(p.runes||[]).slice(0,2).map(x=>(x.runes||[]).map(y=>String(y?.id??y)))}))}
async function readChampion(id,name,withBuild){const url=BASE+'/api/champion/'+encodeURIComponent(id)+'.json';const result={id,name,source:url,requestedAt:new Date().toISOString(),patchDeclared:currentPatch(),kit:null,build:null,errors:[]};
 try{const raw=await fetchJson(url);result.kit={name:raw?.name||name,idReturned:raw?.id??null,version:raw?.version??null,roles:raw?.roles??null,abilities:abilityRows(raw),rawStats:{damage:raw?.damage??null,survive:raw?.survive??null,assist:raw?.assist??null}};if(result.kit.idReturned!=null&&String(result.kit.idReturned)!==String(id))result.errors.push('ID de la fiche différent de celui demandé : ne pas utiliser sans vérification.');}catch(e){result.errors.push('Fiche : '+e.message)}
 if(withBuild){const buildUrl=BASE+'/api/build/'+encodeURIComponent(id)+'_1.json';try{const b=await fetchJson(buildUrl);result.build={source:buildUrl,date:b?.date??null,rank:b?.rank_label??'Rang 1 (libellé non reçu)',positions:buildSummary(b)};}catch(e){result.errors.push('Build : '+e.message)}}
 return result}
function create(){const target=document.querySelector('#simpleApp .simple-card');if(!target||document.getElementById('wrdiChampionIntelligenceV12'))return;
 const panel=el('section');panel.id='wrdiChampionIntelligenceV12';panel.style.cssText='margin:20px 0 4px;padding:16px;border:1px solid #456b79;border-radius:14px;background:rgba(10,37,51,.32)';
 panel.append(el('h2','🧬 Connaissance des champions — V12.1'));
 panel.append(el('p','Étape 1 : lecture des 10 fiches Wild Rift, compétences, rôles fournis par la source et builds observés. Aucun calcul d’optimalité à ce stade.','muted'));
 const controls=el('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center';
 const run=el('button','Lire les 10 champions');run.type='button';
 const exportBtn=el('button','Exporter l’audit JSON');exportBtn.type='button';exportBtn.className='secondary';exportBtn.disabled=true;
 controls.append(run,exportBtn);panel.append(controls);
 const status=el('p','Prêt. Sélectionne d’abord ta draft.','muted');status.setAttribute('aria-live','polite');panel.append(status);
 const results=el('div');panel.append(results);target.append(panel);
 let last=null;
 function note(text,parent=results){parent.append(el('p',text,'muted'))}
 function display(records){results.replaceChildren();const count=records.filter(x=>x.kit?.abilities.length>0).length;
 note(`Fiches avec au moins une compétence : ${count}/10. Version déclarée par l’index source : ${currentPatch()||'inconnue'}. Une fiche accessible ne prouve pas son actualité.`);
 records.forEach((rec,i)=>{const d=el('details');d.style.cssText='border-top:1px solid #45636b;padding:10px 0';const summary=el('summary',`${i<5?'🟢':'🔴'} ${roles[i%5]} · ${rec.name} — ${rec.kit?.abilities.length||0} compétence(s) lue(s)`);summary.style.cssText='cursor:pointer;font-weight:600';d.append(summary);
 const k=rec.kit;if(k){note('Fiche source : '+(k.name||rec.name)+' · version indiquée : '+(k.version||'non indiquée'),d);note('Rôles source : '+(k.roles?str(k.roles):'non indiqués'),d);note('Indices source dégâts / survie / utilité : '+[k.rawStats.damage,k.rawStats.survive,k.rawStats.assist].map(x=>x??'?').join(' / ')+' (pas une répartition de dégâts)',d);
 k.abilities.forEach(a=>{const s=el('details');const summ=el('summary',a.name||a.slot);s.append(summ);note(limit(a.description||'Description manquante.',1800),s);if(a.cooldown!=null)note('Récupération source : '+str(a.cooldown),s);d.append(s)});
 }else note('Fiche indisponible. Ne pas déduire le kit.',d);
 const f=getFlags(rec.name);note('Tags existants app.js (heuristiques, non vérifiés par les sorts) : '+(f?f.join(' · '):'aucun'),d);
 if(rec.build){note(`Builds observés : ${rec.build.rank}, relevé ${rec.build.date||'date inconnue'}. Usage ≠ meilleur build contre la draft.`,d);for(const pos of rec.build.positions){const pp=el('details');pp.append(el('summary','Poste source : '+pos.role+' · '+pos.cores.length+' cores'));pos.cores.forEach((c,j)=>note('Core '+(j+1)+' : '+c.itemIds.join(' / ')+' · utilisation : '+(c.pick??'inconnue')+' · victoire : '+(c.win??'inconnue'),pp));d.append(pp)}}
 rec.errors.forEach(e=>note('⚠️ '+e,d));results.append(d)});
 note('Prochaine étape : normaliser les kits et faire valider chaque interaction/règle de dégâts avant d’en déduire des menaces. Les builds observés restent des scénarios, non une certitude sur les achats adverses.');
 }
 run.onclick=async()=>{if(run.disabled)return;const ids=picks();if(!ids[2]||ids.slice(5).some(x=>!x)){status.textContent='Sélectionne ton champion Mid et les cinq ennemis avant l’audit (les quatre alliés restent facultatifs).';return}
 run.disabled=true;exportBtn.disabled=true;results.replaceChildren();status.textContent='Lecture des fiches de la draft…';const records=new Array(10);let pos=0,done=0;
 const worker=async()=>{while(pos<10){const i=pos++,id=ids[i];records[i]=id?await readChampion(id,findName(id),true):{id:'',name:'Non sélectionné',kit:null,build:null,errors:['Case non renseignée']};done++;status.textContent=`Fiches examinées : ${done}/10`;}};
 try{await Promise.all(Array.from({length:3},worker));last={schema:'wrdi-champion-audit-v12.1',note:'Données source brutes, non certifiées pour le patch actif. Tags hérités heuristiques.',createdAt:new Date().toISOString(),declaredPatch:currentPatch(),champions:records};status.textContent='Lecture terminée — consulte les fiches et les éventuels échecs.';display(records);exportBtn.disabled=false}
 catch(e){status.textContent='Erreur inattendue : '+e.message}
 finally{run.disabled=false}
 };
 exportBtn.onclick=()=>{if(!last)return;const blob=new Blob([JSON.stringify(last,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wrdi-audit-champions-v12-1.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)};
 }
 root.WRDIChampionIntelligenceV12={readChampion,abilityRows,buildSummary,getFlags};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create);else create();
})(typeof window!=='undefined'?window:globalThis);
