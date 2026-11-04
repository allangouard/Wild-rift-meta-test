/* Wild Rift Draft Intelligence — connaissance des champions V12.2.
 * Corrige la lecture des champs chinois réellement présents dans l'audit V12.1.
 * Audit et affichage uniquement : AUCUNE recommandation automatique, aucun appel LoL PC.
 */
(function(root){
'use strict';
const BASE='https://wrchina.gg', STORE='wrdi_draft_v76';
const roles=['Top','Jungle','Mid','ADC','Support'];
const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(cls)x.className=cls;return x};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
const containsChinese=s=>/[\u3400-\u9fff]/.test(String(s||''));
function picks(){try{const v=typeof draftPicks!=='undefined'?draftPicks:JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(v)&&v.length===10?v.map(x=>String(x||'')):Array(10).fill('')}catch{return Array(10).fill('')}}
function pool(){try{return typeof champions!=='undefined'&&Array.isArray(champions)?champions:[]}catch{return []}}
function threats(){try{return typeof threatProfiles!=='undefined'?threatProfiles:{}}catch{return {}}}
function currentPatch(){try{return typeof db!=='undefined'?(db.meta?.patch||db.items?.patch||null):null}catch{return null}}
function findName(id){const c=pool().find(x=>String(x.id)===String(id));return c?.name&&c.name!=='Nom en cours de chargement'?c.name:'Champion '+id}
function getFlags(name){const k=normalize(name);return Object.entries(threats()).find(([x])=>normalize(x)===k)?.[1]||null}
async function fetchJson(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),13000);try{const r=await fetch(url,{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}}
function abilityRows(raw){const a=raw?.abilities;const rows=Array.isArray(a)?a.map((v,i)=>[String(i),v]):a&&typeof a==='object'?Object.entries(a):[];
 return rows.map(([slot,v])=>{const o=v&&typeof v==='object'?v:{desc:String(v??'')};
 const fr=clean(o.desc_fr||o.description_fr||''),normal=clean(o.desc||o.description||''),cn=clean(o.desc_cn||'');
 const description=fr||normal||cn;
 const lang=fr?'fr':normal?(containsChinese(normal)?'zh':'non vérifiée'):cn?'zh':'absente';
 const name=clean(o.name_fr||o.name||o.name_cn||o.key||o.slot||slot);
 return {slot:String(o.slot??slot),name,description,descriptionLanguage:lang,cooldown:o.cooldown??o.cd??null,icon:o.icon||null,raw:o};
 });
}
function buildSummary(raw){const arr=Array.isArray(raw?.positions)?raw.positions:[];return arr.map(p=>({role:String(p.pos_label||p.label||p.pos||p.position||p.pos_id||'inconnu'),cores:(p.core||[]).slice(0,3).map(x=>({itemIds:(x.items||[]).map(y=>String(y?.id??y)),pick:x.pick??null,win:x.win??null})),runes:(p.runes||[]).slice(0,2).map(x=>(x.runes||[]).map(y=>String(y?.id??y)))}))}
async function readChampion(id,name,withBuild){const url=BASE+'/api/champion/'+encodeURIComponent(id)+'.json';const result={id,name,source:url,requestedAt:new Date().toISOString(),patchDeclared:currentPatch(),kit:null,build:null,errors:[]};
 try{const raw=await fetchJson(url);result.kit={name:raw?.name||name,idReturned:raw?.id??null,version:raw?.version??null,roles:raw?.roles??null,abilities:abilityRows(raw),rawStats:{damage:raw?.damage??null,survive:raw?.survive??null,assist:raw?.assist??null}};if(result.kit.idReturned!=null&&String(result.kit.idReturned)!==String(id))result.errors.push('Identifiant retourné différent de celui demandé : fiche non validée.');}catch(e){result.errors.push('Fiche : '+e.message)}
 if(withBuild){const u=BASE+'/api/build/'+encodeURIComponent(id)+'_1.json';try{const b=await fetchJson(u);result.build={source:u,date:b?.date??null,rank:b?.rank_label??'Rang 1 (libellé inconnu)',positions:buildSummary(b)}}catch(e){result.errors.push('Build : '+e.message)}}
 return result;
}
function appCatalog(){try{return typeof db!=='undefined'?db:{}}catch{return {}}}
async function itemCatalog(){const d=appCatalog();let items=Array.isArray(d.items?.items)?d.items.items:null;let names=d.namesItems&&typeof d.namesItems==='object'?d.namesItems:null;
 const errors=[];
 if(!items){try{const x=await fetchJson(BASE+'/api/items.json');items=Array.isArray(x?.items)?x.items:[];if(!items.length)errors.push('Catalogue source vide')}catch(e){items=[];errors.push('Objets : '+e.message)}}
 if(!names){try{names=await fetchJson(BASE+'/data/item_names.json?v=3')}catch(e){names={};errors.push('Traductions : '+e.message)}}
 return {items,names,errors};
}
function itemInfo(id,catalog){const item=catalog.items.find(x=>String(x.id)===String(id));const entry=catalog.names?.[String(id)];const fr=typeof entry==='string'?entry:entry?.fr;const label=typeof fr==='string'&&clean(fr)?clean(fr):item?.name&&clean(item.name)?clean(item.name):'Objet ID '+id;
 const rawIcon=item?.icon;let imageUrl='';if(typeof rawIcon==='string'&&rawIcon){try{const u=new URL(rawIcon,BASE+'/');if(u.protocol==='https:')imageUrl=u.href}catch{}}
 return {id:String(id),label,imageUrl,resolved:!!item,hasFrench:typeof fr==='string'&&!!clean(fr)};
}
function create(){const target=document.querySelector('#simpleApp .simple-card');if(!target||document.getElementById('wrdiChampionIntelligenceV12'))return;
 const panel=el('section');panel.id='wrdiChampionIntelligenceV12';panel.style.cssText='margin:20px 0 4px;padding:16px;border:1px solid #456b79;border-radius:14px;background:rgba(10,37,51,.32)';
 panel.append(el('h2','🧬 Connaissance des champions — V12.2'));
 panel.append(el('p','Audit des kits et builds Wild Rift. Les descriptions chinoises sont affichées comme telles, sans traduction automatique ni calcul de menaces non validé.','muted'));
 const controls=el('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px;align-items:center';
 const run=el('button','Lire les 10 champions');run.type='button';const exportBtn=el('button','Exporter l’audit JSON','secondary');exportBtn.type='button';exportBtn.disabled=true;
 controls.append(run,exportBtn);panel.append(controls);
 const status=el('p','Prêt : utilise la draft sélectionnée.','muted');status.setAttribute('aria-live','polite');panel.append(status);
 const results=el('div');panel.append(results);target.append(panel);
 let last=null;
 function note(text,parent=results){parent.append(el('p',text,'muted'))}
 function display(records,catalog){results.replaceChildren();const total=records.flatMap(x=>x.kit?.abilities||[]);const described=total.filter(x=>!!x.description);const fr=described.filter(x=>x.descriptionLanguage==='fr').length;
 note(`Audit : ${records.filter(x=>x.kit).length}/10 fiches chargées ; ${total.length} emplacements de compétences ; ${described.length} descriptions présentes (${fr} explicitement françaises). Données brutes ≠ effets validés.`);
 note(`Index source : ${currentPatch()||'inconnu'}. La version interne des fiches peut être différente ; les valeurs ne sont pas certifiées pour le patch actuel.`);
 if(catalog.errors.length)note('Catalogue objets partiel : '+catalog.errors.join(' ; '));
 records.forEach((rec,i)=>{const d=el('details');d.style.cssText='border-top:1px solid #45636b;padding:10px 0';const abilities=rec.kit?.abilities||[],nb=abilities.filter(a=>a.description).length;
 const summary=el('summary',`${i<5?'🟢':'🔴'} ${roles[i%5]} · ${rec.name} — ${nb}/${abilities.length} descriptions présentes`);summary.style.cssText='cursor:pointer;font-weight:600';d.append(summary);
 const k=rec.kit;if(k){note('Fiche source : '+(k.name||rec.name)+' · version interne : '+(k.version||'non indiquée'),d);note('Classe source : '+(k.roles?JSON.stringify(k.roles):'non indiquée')+' (ne prouve pas le poste joué)',d);note('Indices dégâts / survie / utilité : '+[k.rawStats.damage,k.rawStats.survive,k.rawStats.assist].map(x=>x??'?').join(' / ')+' (ne décrivent pas les types de dégâts)',d);
 k.abilities.forEach((a,j)=>{const s=el('details');s.style.cssText='border:1px solid #344f61;border-radius:10px;margin:6px 0;padding:8px';s.append(el('summary',`${['Passive','A/Q','Z/W','E','R'][j]||a.slot} — ${a.name}`));
 if(a.description){note(`Langue de la description : ${a.descriptionLanguage==='zh'?'chinois — texte source non traduit':a.descriptionLanguage==='fr'?'français':'non vérifiée'}`,s);note(a.description,s)}else note('Description réellement absente de la réponse source.',s);
 if(a.cooldown!=null)note('Récupération indiquée : '+String(a.cooldown),s);else note('Temps de récupération non fourni dans cette fiche.',s);
 d.append(s)});
 }else note('Fiche indisponible : aucun kit déduit.',d);
 const f=getFlags(rec.name);note('Anciens tags app.js, non déduits du kit : '+(f?f.join(' · '):'aucun'),d);
 if(rec.build){note(`Cores observés : ${rec.build.rank}, relevé ${rec.build.date||'inconnu'} (non prédictifs de cette draft).`,d);
 for(const pos of rec.build.positions){const pp=el('details');pp.append(el('summary',`Poste source : ${pos.role} — ${pos.cores.length} cores`));
 pos.cores.forEach((core,j)=>{const group=el('div');group.style.cssText='padding:8px 0;border-bottom:1px solid #344f61';group.append(el('div',`Core ${j+1} · utilisation : ${core.pick??'?'} % · victoire : ${core.win??'?'} %`));
 const bar=el('div');bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin:6px 0';
 core.itemIds.forEach(id=>{const info=itemInfo(id,catalog),chip=el('div');chip.style.cssText='display:flex;gap:6px;align-items:center;max-width:100%;padding:5px;border:1px solid #45636b;border-radius:8px';
 if(info.imageUrl){const img=el('img');img.src=info.imageUrl;img.alt='';img.loading='lazy';img.width=36;img.height=36;img.style.borderRadius='5px';img.onerror=()=>{img.style.display='none'};chip.append(img)}
 chip.append(el('span',info.label+(info.resolved?'':' (non résolu)')));bar.append(chip)});group.append(bar);pp.append(group)});d.append(pp)}
 }
 rec.errors.forEach(e=>note('⚠️ '+e,d));results.append(d)});
 note('Prochaine étape : vérifier les descriptions et les ratios contre le client Wild Rift actuel, traduire de manière contrôlée, puis seulement construire les profils de menaces et les variantes de builds.');
 }
 run.onclick=async()=>{if(run.disabled)return;const ids=picks();if(!ids[2]||ids.slice(5).some(x=>!x)){status.textContent='Sélectionne ton Mid et les cinq ennemis. Les quatre autres alliés restent facultatifs.';return}
 run.disabled=true;exportBtn.disabled=true;results.replaceChildren();status.textContent='Chargement des compétences et des objets…';let catalog={items:[],names:{},errors:[]};
 try{catalog=await itemCatalog();const records=new Array(10);let pos=0,done=0;
 const worker=async()=>{while(pos<10){const i=pos++,id=ids[i];records[i]=id?await readChampion(id,findName(id),true):{id:'',name:'Non sélectionné',kit:null,build:null,errors:['Case non renseignée']};done++;status.textContent=`Fiches examinées : ${done}/10`}};
 await Promise.all(Array.from({length:3},worker));last={schema:'wrdi-champion-audit-v12.2',note:'Descriptions source (notamment chinois), non validées au patch actif. Tags hérités heuristiques. Aucune simulation.',createdAt:new Date().toISOString(),declaredPatch:currentPatch(),catalog:{itemsCount:catalog.items.length,errors:catalog.errors},champions:records};
 display(records,catalog);status.textContent='Audit terminé. Ouvre Amumu pour consulter ses compétences, puis ses cores jungle.';exportBtn.disabled=false;
 }catch(e){status.textContent='Erreur inattendue : '+e.message}finally{run.disabled=false}
 };
 exportBtn.onclick=()=>{if(!last)return;const blob=new Blob([JSON.stringify(last,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='wrdi-audit-champions-v12-2.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)};
}
root.WRDIChampionIntelligenceV12={readChampion,abilityRows,buildSummary,getFlags,itemInfo};
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',create);else create()}
})(typeof window!=='undefined'?window:globalThis);
