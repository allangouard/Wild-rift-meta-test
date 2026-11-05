/* WRDI V12.10 — Coordination des modules existants, Wild Rift mobile uniquement.
 * Aucun remplacement de app.js, des données utilisateur ou du catalogue client.
 * Les scores sont des priorités heuristiques, jamais des dégâts calculés ou une preuve d'optimalité.
 */
(function(root){
'use strict';
const VERSION='12.10.0', KEY='wrdi_draft_v76';
const $=id=>document.getElementById(id);
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]/g,'');
const isStrong=t=>['primary','important'].includes(t);
const categoryNames={tank:'défense',ap:'AP',ad:'AD',crit:'critique',utilitaire:'utilitaire'};
const statNames={hp:'PV',armor:'armure',mr:'RM',ap:'AP',ah:'accélération',mpen_pct:'pénétration magique (%)'};
const CONFIG=[
 ['riftmaker','Combats prolongés : puissance et PV ; amplification dépend du temps au contact', {base:5,tank:2,magic:0,physical:0}],
 ['hollow_radiance','Résistance magique et dégâts de proximité ; Immolation exige de rester au contact',{base:2,magic:3,apCore:1,tank:1}],
 ['unending_despair','Défense mixte et soin conditionnel lors des combats rapprochés',{base:2,magic:1,physical:2,apCore:1,adCore:1,tank:1}],
 ['thornmail','Armure, riposte et Blessures graves ; intérêt si attaques reçues et soins pertinents',{base:1,physical:3,adCore:1,crit:1,heal:2}],
 ['randuins_omen','Armure et protection contre les coups critiques',{base:0,physical:1,adCore:1,crit:4}],
 ['force_of_nature','RM contre dégâts magiques répétés ; cumuls requis',{base:0,magic:3,apCore:1,periodic:2}],
 ['banshees_veil','Protection contre un sort, selon la menace à bloquer',{base:0,magic:1,cc:2}],
 ['liandrys_torment','Pression magique prolongée contre des cibles résistantes',{base:1,tank:3}],
 ['void_staff','Pénétration magique si les ennemis achètent suffisamment de RM',{base:1,tank:1}],
 ['bloodletters_curse','Réduction de RM sous conditions d’impacts répétés',{base:1,tank:2}],
 ['morellonomicon','Blessures graves à envisager uniquement contre des soins significatifs',{base:0,heal:4}],
 ['oceanids_trident','Effet anti-boucliers à vérifier selon les protections adverses',{base:0,shield:4}],
 ['rabadons_deathcap','Puissance offensive, si l’équipe permet de jouer moins défensif',{base:2}],
 ['abyssal_mask','Résistance magique et amplification de dégâts à proximité',{base:1,magic:2,tank:1}]
];
function parseDraft(raw){let arr;try{arr=typeof raw==='string'?JSON.parse(raw):raw}catch{return null}return Array.isArray(arr)&&arr.length===10?arr.map(x=>String(x||'')):null}
function restrictionsFor(ids,rules){const items=ids.filter(Boolean);const problems=[];if(new Set(items).size!==items.length)problems.push('doublon');
 for(const g of (rules?.groups||[])){const found=items.filter(id=>(g.members||[]).includes(id));if(found.length>(g.max??1))problems.push(g.label_fr||g.id)}
 for(const pair of (rules?.extra_exclusion_pairs||[]))if(pair.every(id=>items.includes(id)))problems.push('exclusion : '+pair.join(' + '));
 const act=new Set(rules?.known_active_item_ids||[]);if(items.filter(id=>act.has(id)).length>(rules?.max_active_items??1))problems.push('objets actifs');
 return problems;
}
function deriveSignals(hierarchy,report,coreIndexes=[]){const signals={magic:0,physical:0,crit:0,tank:0,apCore:0,adCore:0,cc:0,periodic:0,heal:0,shield:0,unknown:0};
 const byId=new Map((hierarchy||[]).map(x=>[String(x.id),x]));
 // Les dominantes de kit priment sur les simples mentions d'un sort.
 for(const x of byId.values()){
  if(isStrong(x.damage?.magic?.tier))signals.magic++;
  if(isStrong(x.damage?.physical?.tier))signals.physical++;
  if(x.control)signals.cc++;
  if(x.lexicalFlags?.includes('heal'))signals.heal++;
  if(x.lexicalFlags?.includes('shield'))signals.shield++;
  if(x.periodic)signals.periodic++;
  if(!x.baselineAvailable)signals.unknown++;
 }
 // Effets lexicaux de kit : leur présence ne quantifie pas leur efficacité.
 // Les familles des cores décrivent une orientation observée, pas une fréquence de dégâts.
 for(const [i,e] of (report||[]).entries()){const idx=Number.isInteger(coreIndexes[i])?coreIndexes[i]:0;const cl=e.roleMatched?e.cores?.[idx]?.classification:null;
  if(!cl)continue;
  if((cl.score?.crit||0)>0)signals.crit++;
  if((cl.score?.ap||0)>=2)signals.apCore++;
  if((cl.score?.ad||0)>=2)signals.adCore++;
  if((cl.score?.tank||0)>=2)signals.tank++;
 }
 return signals;
}
function suggest(catalog,rules,signals){const byId=new Map((catalog?.items||[]).map(x=>[x.id,x]));
 const ranked=CONFIG.filter(([id])=>byId.has(id)).map(([id,why,w])=>{
  const score=(w.base||0)+Object.entries(signals).reduce((n,[k,v])=>n+(w[k]||0)*v,0);
  return {id,item:byId.get(id),score,why};
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 const chosen=[],excluded=[];
 for(const x of ranked){const issues=restrictionsFor([...chosen.map(y=>y.id),x.id],rules);
  if(issues.length){excluded.push({...x,conflicts:issues});continue}
  if(chosen.length<5)chosen.push(x);else excluded.push(x);
 }
 return {chosen,alternatives:excluded,considered:ranked};
}
function buildSummary(catalog,rules,hierarchy,report,coreIndexes){const signals=deriveSignals(hierarchy,report,coreIndexes),proposal=suggest(catalog,rules,signals);return {signals,proposal,legal:restrictionsFor(proposal.chosen.map(x=>x.id),rules)};}
async function loadJson(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(path+' : HTTP '+r.status);return r.json()}
function init(){const pane=$('wrdiPane_build'),main=$('simpleRun');if(!pane||!main||$('wrdiIntegratedV1210'))return;
 const css=document.createElement('style');css.textContent='#wrdiIntegratedV1210{border:1px solid #457e80;padding:14px;border-radius:14px;background:#102e39;color:#e7f0f3;margin:12px 0}#wrdiIntegratedV1210 p{line-height:1.5}#wrdiIntegratedV1210 .wrdi-muted{color:#bad0da;font-size:13px}#wrdiIntegratedV1210 .wrdi-product{display:flex;align-items:center;gap:10px;border-top:1px solid #426372;padding:9px 0}#wrdiIntegratedV1210 .wrdi-product img{width:42px;height:42px;border-radius:8px;object-fit:contain}#wrdiIntegratedV1210 .wrdi-warn{color:#ffce98}#wrdiIntegratedV1210 details{margin:10px 0}';document.head.append(css);
 const card=document.createElement('section');card.id='wrdiIntegratedV1210';card.setAttribute('aria-live','polite');pane.prepend(card);
 let running=false,lastSignature='';
 const element=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e};
 const line=(parent,txt,cls='wrdi-muted')=>parent.append(element('p',txt,cls));
 function itemRow(parent,entry){const node=element('div',undefined,'wrdi-product'),icon=document.createElement('img');icon.alt='';icon.loading='lazy';icon.src='./assets/item-icons/'+entry.id+'.webp';icon.onerror=()=>icon.remove();node.append(icon);
 const content=element('div'),strong=element('strong',entry.item.name_fr||entry.id),details=element('div',entry.why+' · '+(Number.isFinite(entry.item.price_gold)?entry.item.price_gold+' PO':'prix à vérifier'),'wrdi-muted');content.append(strong,details);node.append(content);parent.append(node)}
 function render(report,catalog,rules,kit){const indexes=[...document.querySelectorAll("#wrdiScenarios129 .entry129 select")].map(x=>Number(x.value));const {signals,proposal,legal}=buildSummary(catalog,rules,kit,report,indexes);card.replaceChildren();card.append(element('h3','🧠 Synthèse croisée — V12.10'));
 line(card,'Croisement des kits adverses, des variantes d’équipement observées et du catalogue client. Les cinq choix ci-dessous sont une présélection conditionnelle, PAS un build optimal démontré.');
 line(card,`Dominantes probables : ${signals.magic} magie · ${signals.physical} physique ; ${signals.cc} champions avec contrôle mentionné · ${signals.crit} core(s) à orientation critique · ${signals.tank} core(s) très défensifs · ${signals.apCore} core(s) à orientation AP · ${signals.adCore} core(s) à orientation AD.`);
 if(signals.unknown)line(card,signals.unknown+' champion(s) sans hiérarchie de kit documentée : résultat partiel.','wrdi-warn');
 const unknownRoles=(report||[]).filter(x=>!x.roleMatched);if(unknownRoles.length)line(card,'Builds sans poste confirmé : '+unknownRoles.map(x=>x.champion?.name||'?').join(', ')+'. Pas de substitution d’un autre poste.','wrdi-warn');
 card.append(element('h4','5 objets candidats compatibles (ordre de priorité, pas ordre d’achat)'));
 proposal.chosen.forEach(x=>itemRow(card,x));
 line(card,legal.length?'Alerte restrictions : '+legal.join(', '):'Restrictions du client respectées parmi les objets de cette présélection.');
 const alternates=element('details');alternates.append(element('summary','Alternatives et substitutions'));const remaining=proposal.alternatives.slice(0,8);remaining.forEach(x=>{itemRow(alternates,x);if(x.conflicts?.length)line(alternates,'Incompatible avec la présélection : '+x.conflicts.join(', ')+'. Remplacer un objet de la même famille, ne pas cumuler.','wrdi-warn')});card.append(alternates);
 const data=element('details');data.append(element('summary','Sources, limites et critères utilisés'));line(data,'Les kits sont hiérarchisés qualitativement ; les variantes de trois objets proviennent des builds par poste WR China et ne prédisent pas les achats effectifs.');line(data,'Scores internes = règles de priorité explicites, non dégâts, win rates prédits ni calcul de survie. Les passifs complexes restent à intégrer au simulateur commun.');line(data,'Catalogue client déclaré 7.3d ; données source de builds plus récentes possibles, sans équivalence de patch certifiée.');line(data,'La V12.10 ne remplace ni les runes ni les bottes : les pages observées restent dans le résultat Build précédent.');card.append(data);
 root.WRDIIntegratedV1210.last={signals,selected:proposal.chosen.map(x=>x.id),alternatives:proposal.alternatives.map(x=>x.id),complete:unknownRoles.length===0&&signals.unknown===0,patch:catalog.patch_claimed_by_client_user||null};
 }
 async function until(check,max=16000){const start=Date.now();while(Date.now()-start<max){const v=check();if(v)return v;await new Promise(resolve=>setTimeout(resolve,200))}return null}
 async function run(){if(running)return;const raw=localStorage.getItem(KEY)||'';const draft=parseDraft(raw);if(!draft||!draft[2]||draft.slice(5).some(x=>!x)){card.replaceChildren();line(card,'Complète ton champion mid et les cinq adversaires avant l’analyse.','wrdi-warn');return}
 const self=document.querySelector('[data-simple-slot="2"] .slot-text')?.textContent||'';
 if(draft[2]!=='10099'&&!normalize(self).includes('galio')){card.replaceChildren();line(card,'Synthèse V12.10 calibrée pour Galio. Le moteur des autres champions reste inchangé ; aucun build inventé.');return}
 running=true;card.replaceChildren();line(card,'Croisement des menaces, builds observés et objets 7.3d en cours…');
 try{
  const [catalog,rules]=await Promise.all([loadJson('./data/items-client-7.3d-v12.json'),loadJson('./data/item-restrictions-client-7.3d-v12.json')]);
  if(catalog.target_game!=='Wild Rift mobile'||!Array.isArray(catalog.items))throw Error('Catalogue WR attendu absent.');
  // Le clic principal déclenche déjà V12.6 et V12.8 ; attendre leurs rapports sans requêtes doublonnées.
  let threat=root.WRDIChampionThreatsV125;
  if(threat?.analyze && (!threat.getLastAudit?.()?.length))await threat.analyze(false);
  const threatRows=await until(()=>{const a=threat?.getLastAudit?.();return Array.isArray(a)&&a.length===5&&a.every((e,i)=>String(e.id)===draft[5+i])?a:null});
  if(!threatRows)throw Error('Le rapport des kits V12.6 n’est pas disponible. Réessaie après « Analyser les kits adverses ».');
  const hierarchy=typeof threat.hierarchy==='function'?threat.hierarchy(threatRows):[];
  for(const [i,h] of hierarchy.entries()){const flags=threatRows[i]?.result?.signals||[];h.lexicalFlags=flags.map(x=>x.id);}
  let profiles=root.WRDIEnemyBuildProfilesV128;
  if(!profiles?.run)throw Error('Module V12.8 manquant.');
  let saved=profiles.last?.signature===raw?profiles.last.report:null;
  if(!saved){await profiles.run();saved=(await until(()=>profiles.last?.signature===raw?profiles.last.report:null,18000));}
  if(!saved)throw Error('Builds V12.8 indisponibles pour cette draft. Réessaie une fois le relevé terminé.');
  if((localStorage.getItem(KEY)||'')!==raw)throw Error('La draft a changé pendant l’analyse. Relance le bouton principal.');
  render(saved,catalog,rules,hierarchy);lastSignature=raw;
 }catch(error){card.replaceChildren();line(card,'Synthèse indisponible : '+error.message,'wrdi-warn')}
 finally{running=false}
 }
 // La même action conserve les anciens résultats et ajoute seulement la synthèse.
 main.addEventListener('click',()=>{run()});
 document.addEventListener('change',e=>{if(e.target?.closest?.('#wrdiScenarios129 .entry129') && lastSignature===localStorage.getItem(KEY))run();});
 root.WRDIIntegratedV1210={version:VERSION,run,parseDraft,deriveSignals,restrictionsFor,suggest,buildSummary,get lastSignature(){return lastSignature}};
 card.append(element('h3','🧠 Synthèse croisée — V12.10'));line(card,'Appuie sur « Analyser ma draft » pour croiser automatiquement les données des modules.');
}
if(typeof document==='undefined'){root.WRDIIntegratedV1210={version:VERSION,parseDraft,deriveSignals,restrictionsFor,suggest,buildSummary};return}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
