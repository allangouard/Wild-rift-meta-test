/* WRDI V13.0 — Comparateur mesurable de builds Galio (Wild Rift, données client 7.3d).
 * Évite tout classement prétendument optimal : seules les statistiques documentées sont calculées.
 * Fonctionne avec V12.10, ne remplace aucun module et ne réécrit aucun build.
 */
(function(root){'use strict';
const VERSION='13.0.0';
const KEY='wrdi_draft_v76';
const IDS=['riftmaker','hollow_radiance','unending_despair','thornmail','banshees_veil','void_staff','cryptbloom','bloodletters_curse','morellonomicon','liandrys_torment','rabadons_deathcap','zhonyas_hourglass','rod_of_ages','oceanids_trident'];
const numeric=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,numeric(v)));
function conflicts(ids,rules){const out=[];if(new Set(ids).size!==ids.length)out.push('Objet en double');for(const group of (rules?.groups||[])){const hit=ids.filter(id=>(group.members||[]).includes(id));if(hit.length>(group.max??1))out.push(group.label_fr||group.id)}for(const p of (rules?.extra_exclusion_pairs||[])){if(p.every(id=>ids.includes(id)))out.push('Exclusion : '+p.join(' + '))}const active=rules?.known_active_item_ids||[];if(ids.filter(id=>active.includes(id)).length>(rules?.max_active_items??1))out.push('Objets actifs');return out}
function compute(ids,catalog,baseline){const byId=new Map((catalog?.items||[]).map(x=>[x.id,x]));const missing=ids.filter(id=>!byId.has(id));const totals={hp:0,armor:0,mr:0,ap:0,ah:0};for(const id of ids){const a=byId.get(id);if(!a)continue;for(const key of Object.keys(totals))totals[key]+=numeric(a.stats?.[key]);}
 // Ne pas calculer les passifs non modélisés. La conversion de PV en AP de Riftmaker est documentée.
 const bonusAP=ids.includes('riftmaker')?0.02*totals.hp:0;
 const hp=baseline.hp+totals.hp, armor=baseline.armor+totals.armor,mr=baseline.mr+totals.mr;
 const mitigation=res=>res>=0?100/(100+res):2-res/100; // multiplicateur dégâts après résistance WR, sous hypothèse de résistances >=0 dans l'UI.
 const physicalEhp=hp/mitigation(armor),magicEhp=hp/mitigation(mr);
 return {ids,missing,totals,bonusAP,hp,armor,mr,physicalEhp,magicEhp,apAdded:totals.ap+bonusAP,passivesNotSimulated:ids.flatMap(id=>(byId.get(id)?.passives||[]).filter(p=>!(id==='riftmaker'&&p.mechanics?.bonus_ap_formula)).map(p=>`${byId.get(id).name_fr} · ${p.name}`)),pricesMissing:ids.filter(id=>byId.get(id)&&!Number.isFinite(byId.get(id).price_gold))};
}
function compare(builds,catalog,rules,baseline){return builds.map(b=>({name:b.name,items:b.items,issues:conflicts(b.items,rules),result:compute(b.items,catalog,baseline),note:b.note||''}));}
function variants(selected,catalog,rules){const map=new Map((catalog?.items||[]).map(x=>[x.id,x]));const source=[...new Set(selected)].filter(id=>map.has(id)).slice(0,5);
 const patterns=[['Référence V12.10',source,'Cinq candidats du coordinateur, pas un ordre d’achat'],['Protection physique','thornmail','Renforcement de l’armure'],['Protection magique','hollow_radiance','Renforcement de la RM'],['Défense mixte','unending_despair','PV, armure et RM'],['Puissance','riftmaker','AP et PV avec conversion documentée']];
 const result=[];const seen=new Set();for(const [name,target,note] of patterns){let ids;if(Array.isArray(target)){ids=target;}else if(source.includes(target)){
   // Remplacer un objet différent afin de produire une variante mesurable.
   const other=IDS.find(id=>id!==target&&!source.includes(id)&&map.has(id)&&!conflicts([...source.slice(0,4).filter(x=>x!==target),id,target].slice(0,5),rules).length);
   ids=source.filter(id=>id!==target).slice(0,4);if(other)ids.push(other);else continue;
 }else{ids=[...source.slice(0,4),target]}
 if(ids.length!==5||ids.some(id=>!map.has(id))||conflicts(ids,rules).length)continue;const sig=ids.slice().sort().join('|');if(seen.has(sig))continue;seen.add(sig);result.push({name,items:ids,note});}
 return result;
}
function replaceVariants(selected,catalog,rules){const map=new Map((catalog?.items||[]).map(x=>[x.id,x]));const source=[...new Set(selected)].filter(id=>map.has(id)).slice(0,5);if(source.length!==5)return [];
 const out=[{name:'Référence V12.10',items:source,note:'Objets candidats du coordinateur, sans ordre d’achat'}],seen=new Set([source.slice().sort().join('|')]);
 const wants=[['Contre dégâts physiques','thornmail'],['Contre dégâts magiques','hollow_radiance'],['Résistances mixtes','unending_despair'],['Plus de puissance','rabadons_deathcap'],['PV et AP','riftmaker'],['Pénétration magique','void_staff']];
 for(const [name,id] of wants){if(!map.has(id)||source.includes(id))continue;
 const options=[];for(let i=0;i<5;i++){const ids=source.slice();ids[i]=id;if(conflicts(ids,rules).length)continue;const a=compute(ids,catalog,{hp:2000,armor:70,mr:50});options.push({ids,i,score:name.includes('physiques')?a.physicalEhp:name.includes('magiques')?a.magicEhp:name.includes('mixtes')?Math.min(a.physicalEhp,a.magicEhp):a.apAdded})}
 options.sort((a,b)=>b.score-a.score);if(!options.length)continue;const ids=options[0].ids,sig=ids.slice().sort().join('|');if(seen.has(sig))continue;seen.add(sig);out.push({name,items:ids,note:`Échange : ${map.get(source[options[0].i])?.name_fr||source[options[0].i]} → ${map.get(id).name_fr}. Échange illustratif basé sur les seules statistiques.`});}
 return out;
}
const safeText=(tag,text)=>{const e=document.createElement(tag);e.textContent=String(text);return e};
function init(){if(!document.getElementById('wrdiPane_build')||!document.getElementById('simpleRun')||document.getElementById('wrdiGalioV13'))return;
 const target=document.getElementById('wrdiPane_build'),card=document.createElement('section');card.id='wrdiGalioV13';card.style.cssText='border:1px solid #598b9e;border-radius:14px;padding:14px;margin:14px 0;background:#112d38;color:#e7f0f3';target.prepend(card);
 let catalog=null,rules=null,signature='',timer=0,rendering=false;
 const baseline={hp:2000,armor:70,mr:50};
 function line(msg){const p=safeText('p',msg);p.style.cssText='font-size:13px;line-height:1.5;color:#c7d8e0';card.append(p)}
 function draw(selected){if(!catalog||!rules)return;const d=localStorage.getItem(KEY)||'';let draft=[];try{draft=JSON.parse(d)}catch{}if(!Array.isArray(draft)||draft.length!==10){card.replaceChildren(safeText('h3','V13 · Comparateur Galio'));line('Renseigne ta draft avant de lancer l’analyse.');return}if(String(draft[2])!=='10099' && !/galio/i.test(document.querySelector('[data-simple-slot="2"] .slot-text')?.textContent||'')){card.replaceChildren(safeText('h3','V13 · Comparateur Galio'));line('Comparateur calibré pour Galio uniquement.');return}
 card.replaceChildren(safeText('h3','📐 V13 · Comparaison mesurable Galio'));line('Hypothèses modifiables : PV, armure et RM de base avant objets. Valeurs de départ ILLUSTRATIVES, pas statistiques confirmées de Galio. Dégâts, soins et boucliers des passifs non simulés.');
 const form=document.createElement('div');form.style.cssText='display:flex;gap:8px;flex-wrap:wrap';for(const [key,label] of [['hp','PV sans objets'],['armor','Armure sans objets'],['mr','RM sans objets']]){const wrap=document.createElement('label');wrap.style.cssText='display:flex;flex-direction:column;gap:4px;font-size:12px;flex:1;min-width:95px';wrap.append(safeText('span',label));const el=document.createElement('input');el.type='number';el.min=key==='hp'?'1':'0';el.max='10000';el.step='1';el.value=String(baseline[key]);el.style.cssText='width:100%;box-sizing:border-box;padding:8px;border-radius:6px;background:#234552;color:white;border:1px solid #7195a1';el.addEventListener('change',()=>{baseline[key]=clamp(el.value,key==='hp'?1:0,key==='hp'?10000:1000);draw(selected)});wrap.append(el);form.append(wrap)}card.append(form);
 const builds=replaceVariants(selected,catalog,rules);if(!builds.length){line('Aucun ensemble de cinq objets compatible et documenté n’a pu être constitué à partir de la V12.10. Aucun build inventé.');return}
 const results=compare(builds,catalog,rules,baseline);const byId=new Map(catalog.items.map(x=>[x.id,x]));const table=document.createElement('div');table.style.cssText='overflow-x:auto;margin-top:12px';const t=document.createElement('table');t.style.cssText='border-collapse:collapse;width:100%;font-size:12px;min-width:550px';const header=document.createElement('tr');for(const v of ['Scénario','PV totaux','Armure','RM','PV effectifs phys.','PV effectifs mag.','AP ajoutée']){const th=safeText('th',v);th.style.cssText='text-align:left;padding:8px 5px;border-bottom:1px solid #69818d';header.append(th)}t.append(header);
 for(const entry of results){const tr=document.createElement('tr');const a=entry.result;for(const v of [entry.name,Math.round(a.hp),Math.round(a.armor),Math.round(a.mr),Math.round(a.physicalEhp),Math.round(a.magicEhp),Math.round(a.apAdded)]){const td=safeText('td',v);td.style.cssText='padding:8px 5px;border-bottom:1px solid #355563';tr.append(td)}t.append(tr)}table.append(t);card.append(table);
 line('PV effectifs = PV × (1 + résistance / 100), uniquement contre des dégâts du type considéré, sans pénétration, véritables dégâts, régénération ni passifs adverses. « AP ajoutée » inclut la conversion de PV documentée de Créateur de failles, pas les dégâts des sorts.');
 const det=document.createElement('details');det.append(safeText('summary','Détails des échanges, objets et limites'));for(const entry of results){const h=safeText('h4',entry.name);det.append(h);const p=safeText('p',entry.items.map(id=>byId.get(id)?.name_fr||id).join(' · '));p.style.fontSize='12px';det.append(p);const note=safeText('p',entry.note);note.style.fontSize='12px';det.append(note);const notSim=entry.result.passivesNotSimulated;const missing=entry.result.pricesMissing;const warn=safeText('p',`Passifs non simulés : ${notSim.length}${notSim.length?' ('+notSim.slice(0,4).join('; ')+(notSim.length>4?'; …':'')+')':''}. Prix inconnus : ${missing.length}/${entry.items.length}.`);warn.style.cssText='font-size:12px;color:#f0cc9c';det.append(warn)}card.append(det);
 line(`Données : ${catalog.patch_claimed_by_client_user||'version inconnue'} (captures du client). Comparaison indicative, sans poids de rôle, probabilité de ciblage ni échantillon de parties. Ne constitue PAS un build optimisé ni un ordre d’achat.`);
 root.WRDI_GalioV13.last={signature:d,baseline:{...baseline},results};
 }
 async function load(){if(catalog&&rules)return;const [c,r]=await Promise.all(['./data/items-client-7.3d-v12.json','./data/item-restrictions-client-7.3d-v12.json'].map(async path=>{const response=await fetch(path);if(!response.ok)throw Error('Fichier absent : '+path);return response.json()}));if(c.target_game!=='Wild Rift mobile'||!Array.isArray(c.items))throw Error('Catalogue Wild Rift invalide');catalog=c;rules=r;}
 async function refresh(){if(rendering)return;rendering=true;try{await load();const selected=root.WRDIIntegratedV1210?.last?.selected;if(!Array.isArray(selected)||selected.length!==5){card.replaceChildren(safeText('h3','📐 V13 · Comparateur Galio'));line('Lance « Analyser ma draft ». Le comparateur attend les cinq candidats de la synthèse V12.10.');return}draw(selected);}catch(err){card.replaceChildren(safeText('h3','V13 · Comparateur Galio'));line('Données indisponibles : '+err.message)}finally{rendering=false}}
 function schedule(){clearTimeout(timer);timer=setTimeout(refresh,250)}
 const old=document.getElementById('wrdiIntegratedV1210');if(old&&typeof MutationObserver!=='undefined'){const observer=new MutationObserver(schedule);observer.observe(old,{childList:true,subtree:true})}
 document.getElementById('simpleRun').addEventListener('click',()=>setTimeout(refresh,650));
 card.append(safeText('h3','📐 V13 · Comparateur Galio'));line('En attente des cinq candidats du coordinateur V12.10.');
 root.WRDI_GalioV13={version:VERSION,refresh,compute,compare,conflicts,replaceVariants,get last(){return this._last||null},set last(v){this._last=v}};
 }
 if(typeof document==='undefined'){root.WRDI_GalioV13={version:VERSION,compute,compare,conflicts,replaceVariants};return}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
