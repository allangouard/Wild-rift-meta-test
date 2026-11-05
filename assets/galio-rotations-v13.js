/* WRDI V13.4 — extensions prudentes à la chronologie Galio, Wild Rift MOBILE seulement.
   A/Q tornade, passif (attaques explicitement datées), rotations selon accélération de compétence.
   Les coefficients ne sont pas certifiés sur un sous-patch identique aux objets 7.3d.
*/
(function(root){'use strict';
const VERSION='13.5B-13.4';
const BASE={q:[70,115,160,205],w:[40,80,120,160],e:[90,140,190,240],r:[150,250,350]};
const RATIO={q:.75,w:.55,e:.8,r:.7};
const CD={q:[12,10,9,7],w:[18,17,16,15],e:[10,9,8,7],r:[90,80,70]};
const label={q:'A/Q · impact',w:'Z/W · relâchement',e:'E · impact',r:'R · impact'};
const number=(x,d=0)=>x===null||x===undefined||x===''?d:Number.isFinite(Number(x))?Number(x):d;
const limit=(x,min,max)=>Math.max(min,Math.min(max,number(x,min)));
const fmt=n=>Number.isFinite(n)?n.toFixed(1):'—';
const resistance=mr=>mr>=0?100/(100+mr):2-mr/100;
const deep=o=>JSON.parse(JSON.stringify(o));
function mapItems(d){return new Map((d?.items||[]).map(v=>[v.id,v]));}
function itemPass(i,name){return i?.passives?.find(p=>p.name===name)?.mechanics||null;}
function totals(ids,catalog,extraAP){
 const map=mapItems(catalog),stat={hp:0,ap:0,mr:0,armor:0,ah:0,mpen_pct:0},missing=[];
 for(const id of ids){const it=map.get(id);if(!it){missing.push(id);continue;}for(const k of Object.keys(stat))stat[k]+=number(it.stats?.[k]);}
 const convert=ids.includes('riftmaker')&&itemPass(map.get('riftmaker'),'Infusion du Néant')?.bonus_ap_formula==='0.02 * bonus_hp'?stat.hp*.02:0;
 const rabadon=ids.includes('rabadons_deathcap')?itemPass(map.get('rabadons_deathcap'),'Démesure'):null;
 const ap=(stat.ap+convert+number(extraAP))*(rabadon?.effect==='ap_multiplier'?number(rabadon.value,1):1);
 return {stat,ap,missing};
}
function parseAttacks(raw){if(Array.isArray(raw))return raw.map(Number).filter(Number.isFinite).sort((a,b)=>a-b);return String(raw??'').trim().split(/[;,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);}
function calculate(input,catalog){
 const ids=input.ids||[],s=totals(ids,catalog,input.apExternal);if(s.missing.length)return {valid:false,issues:['Objets introuvables : '+s.missing.join(', ')]};
 const duration=limit(input.duration??10,1,30),mr=limit(input.targetMr??60,0,500),hpTarget=limit(input.targetHp??2500,100,15000);
 const level=Math.floor(limit(input.level??13,1,15)),ad=limit(input.totalAd??100,0,1000);
 const hitRate=limit(input.hitRate??1,0,1),tornadoFraction=limit(input.tornadoFraction??1,0,1);
 const effMr=Math.max(0,mr*(1-limit(s.stat.mpen_pct,0,100)/100)),mit=resistance(effMr);
 const skills=input.ranks||{q:4,w:1,e:4,r:0};
 const start=input.timestamps||{e:.5,q:1.2,w:2,r:3};
 const sequence=Array.isArray(input.sequence)?input.sequence:['e','q','w'];
 const rift=ids.includes('riftmaker')?itemPass(mapItems(catalog).get('riftmaker'),'Corruption du Néant'):null;
 const amp=t=>rift&&number(rift.damage_amp_per_s_pct)>0?Math.min(number(rift.max_damage_amp_pct),Math.floor(Math.max(0,t))*number(rift.damage_amp_per_s_pct))/100:0;
 const events=[],issues=[];const repeat=input.repeat!==false;
 if(hitRate<1)issues.push('Taux de touches inférieur à 100 % : réductions de recharge du passif NON attribuées automatiquement (succès de chaque lancement non connu).');
 for(const id of [...new Set(sequence)]){
  const rank=Math.floor(number(skills[id])),at=number(start[id],NaN);if(!BASE[id]||!rank)continue;
  if(rank<1||rank>BASE[id].length){issues.push('Rang incorrect : '+id);continue;}
  if(!Number.isFinite(at)||at<0){issues.push('Timing incorrect : '+id);continue;}
  const interval=CD[id][rank-1]/(1+s.stat.ah/100);
  for(let idx=0;idx<(repeat?20:1);idx++){
   const t=at+idx*interval;if(t>duration+1e-8)break;
   const raw=BASE[id][rank-1]+RATIO[id]*s.ap;
   events.push({time:t,kind:'spell',id,label:label[id]+(idx?' (rotation '+(idx+1)+')':''),rotation:idx+1,damage:raw*(1+amp(t))*mit*hitRate,amp:amp(t)});
   // La tornade dure 1,5s. Le pourcentage représente les ticks réellement subis.
   if(id==='q')for(let j=1;j<=3;j++){
    const tick=t+j*.5;if(tick>duration+1e-8)continue;
    const rawTick=hpTarget*(.08+.0002*s.ap)/3*tornadoFraction;
    events.push({time:tick,kind:'tornado',id:'q_tornado',label:'A/Q · tornade ('+j+'/3)',rotation:idx+1,damage:rawTick*(1+amp(tick))*mit*hitRate,amp:amp(tick)});
   }
  }
 }
 // Le passif se déclenche UNIQUEMENT sur les attaques demandées et disponibles.
 // Réduction de récupération de 3s par sort TOUCHANT un champion (une fois par lancement).
 // Traitement chronologique sur les impacts et attaques, sans attribuer d'attaques automatiques implicites.
 const passiveRequests=parseAttacks(input.attacks??'0.8,3.2,7.0').filter(t=>t>=0&&t<=duration);
 const timeline=[...events.filter(e=>e.kind==='spell').map(e=>({time:e.time,kind:'hit',id:e.id})),...passiveRequests.map(t=>({time:t,kind:'attack'}))].sort((a,b)=>a.time-b.time||(a.kind==='hit'?-1:1));
 let readyAt=0,passiveCount=0;const passiveCD=5;
 for(const evt of timeline){
  if(evt.kind==='hit'){
   // Réduction uniquement si le passif est en recharge (sinon l'état prêt ne s'accumule pas).
   if(hitRate===1&&readyAt>evt.time)readyAt=Math.max(evt.time,readyAt-3);
  }else if(evt.time+1e-8>=readyAt){
   passiveCount++;
   // Données Wild Rift croisées : 15 + 10*(niveau-1) + AD totale +45% AP +60% RM bonus.
   const raw=15+10*(level-1)+ad+.45*s.ap+.60*s.stat.mr;
   events.push({time:evt.time,kind:'passive',id:'passive',label:'Frappe colossale · attaque renforcée',damage:raw*(1+amp(evt.time))*mit*hitRate,amp:amp(evt.time)});
   readyAt=evt.time+passiveCD;
  }else issues.push('Attaque à '+fmt(evt.time)+' s : passif non disponible, frappe renforcée non comptée.');
 }
 const typeOrder={spell:0,tornado:1,passive:2};events.sort((a,b)=>a.time-b.time||(typeOrder[a.kind]??3)-(typeOrder[b.kind]??3)||a.id.localeCompare(b.id));
 const subtotals={spells:0,tornado:0,passive:0};for(const e of events)subtotals[e.kind==='spell'?'spells':e.kind]+=e.damage;
 const extras=subtotals.tornado+subtotals.passive;
 return {valid:true,events,subtotals,extras,ap:s.ap,ah:s.stat.ah,effMr,passiveCount,level,targetHp:hpTarget,issues,
  assumptions:['Coefficient de tornade : 8 % des PV max + 2 % supplémentaires par 100 AP sur 1,5 s, modélisé en 3 ticks égaux.','Le pourcentage de présence dans la tornade est une hypothèse : 100 % suppose les 3 ticks subis.','Passif : les instants d’attaque sont MANUELS ; sa formule et ses délais sont ceux des fiches Wild Rift croisées, non certifiés sur le même sous-patch que les objets.','Passif : une compétence qui touche réduit la récupération de 3 s une fois par lancement ; on suppose chaque sort retenu réussi contre un champion.','Rotations : même séquence de départ, délais 7.3e proposés, accélération de compétence des objets ; le modèle ne simule pas les animations, temps de charge, mana ou interruptions.','Les dégâts supplémentaires sont des valeurs modélisées contre une cible fictive, et pas des dégâts réels garantis.','Les dégâts directs précédents sont réutilisés ; seuls les impacts des rotations additionnelles, de la tornade et du passif doivent être ajoutés au total V13.3.']};
}
function el(tag,text){const d=document.createElement(tag);if(text!==undefined)d.textContent=String(text);return d;}
function init(){const parent=document.getElementById('wrdiPane_build'),v133=document.getElementById('wrdiGalioV133');if(!parent||!v133||document.getElementById('wrdiGalioV134'))return;
 const panel=el('section');panel.id='wrdiGalioV134';panel.style.cssText='border:1px solid #5a9ba3;border-radius:14px;padding:14px;margin:16px 0;background:#112d38;color:#e7f0f3';parent.insertBefore(panel,v133);
 const state={level:13,targetHp:2500,totalAd:root.WRDI_GalioV135?.levelStats(13)?.ad??101.2,manualAd:false,tornadoFraction:100,attacks:'0.8,3.2,7.0',repeat:true};let catalog=null,err='';
 function field(host,title,key,min,max,step){const l=el('label');l.style.cssText='display:flex;flex-direction:column;gap:5px;min-width:125px;flex:1';l.append(el('span',title));const i=el('input');i.type=key==='attacks'?'text':'number';i.value=state[key];if(key!=='attacks'){i.min=min;i.max=max;i.step=step||1;}i.style.cssText='width:100%;box-sizing:border-box;padding:9px;background:#244b59;color:#fff;border:1px solid #7395a1;border-radius:6px';i.addEventListener('change',()=>{state[key]=key==='attacks'?i.value:limit(i.value,min,max);if(key==='totalAd')state.manualAd=true;if(key==='level'){root.WRDI_GalioV135&&(root.WRDI_GalioV135.level=state.level);if(!state.manualAd)state.totalAd=root.WRDI_GalioV135?.levelStats(state.level)?.ad??state.totalAd;root.WRDI_GalioV133?.refresh?.();}render()});l.append(i);host.append(l);}
 function note(s){const p=el('p',s);p.style.cssText='line-height:1.55;color:#c5dbe3;font-size:13px';panel.append(p);}
 function render(){panel.replaceChildren(el('h3','🗿 V13.4 · Passif, tornade et rotations Galio'));
  const old=root.WRDI_GalioV133?.last,baselines=old?.outputs;if(err){note('Catalogue indisponible : '+err);return;}if(!catalog||!Array.isArray(baselines)||!baselines.length){note('En attente de V13.3 : sélectionne Galio mid puis appuie sur « Analyser ma draft ».');return;}
  note('Extension des combats V13.3. Les statistiques ci-dessous sont des hypothèses de test modifiables, pas les valeurs officielles d’un Galio à un niveau donné. Les objets restent ceux du catalogue 7.3d.');
  const controls=el('div');controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap';field(controls,'Niveau Galio','level',1,15);field(controls,'PV maximum cible','targetHp',100,15000);field(controls,'AD Galio estimée (modifiable)','totalAd',0,1000);field(controls,'Présence tornade (%)','tornadoFraction',0,100);field(controls,'Attaques prévues (secondes)','attacks');panel.append(controls);
  const c=el('label');c.style.cssText='display:flex;align-items:center;gap:9px;margin:12px 0';const ck=el('input');ck.type='checkbox';ck.checked=state.repeat;ck.addEventListener('change',()=>{state.repeat=ck.checked;render()});c.append(ck,el('span','Autoriser les secondes rotations selon les délais et l’accélération'));panel.append(c);
  note('PV niveau '+state.level+' : '+(root.WRDI_GalioV135?.levelStats(state.level)?.hp??'—')+' (notes Riot 7.3). AD '+fmt(state.totalAd)+' : estimation secondaire, à contrôler en client. Les cooldowns de secondes rotations restent hypothétiques ; l’AP et les objets sont lus depuis V13.3.');
  const report=root.WRDI_GalioV135?.catalogReport(catalog);if(report)note('Catalogue : '+report.items+' objets, '+report.priced+' prix connus via price_gold, '+report.missingPrices.length+' prix manquants. Les prix ne servent pas encore au classement.');
  const variants=root.WRDI_GalioV13?.last?.results||[],rank=root.WRDI_GalioV131?.last||{},outputs=[];
  const wrap=el('div');wrap.style.cssText='overflow-x:auto';const tb=el('table');tb.style.cssText='border-collapse:collapse;min-width:660px;font-size:12px;width:100%';const tr=el('tr');for(const h of ['Build','Sorts (toutes rotations)','Tornade','Passif','Supplément vs V13.3','Total partiel combiné']){const th=el('th',h);th.style.cssText='padding:8px 5px;border-bottom:1px solid #7595a0;text-align:left';tr.append(th)}tb.append(tr);
  for(const b of baselines){const variant=variants.find(v=>v.name===b.name);if(!variant)continue;const ids=variant.items||variant.result?.ids||[];
   const result=calculate({ids,level:state.level,targetHp:state.targetHp,totalAd:state.totalAd,tornadoFraction:state.tornadoFraction/100,attacks:state.attacks,repeat:state.repeat,duration:old.state.duration,targetMr:old.state.targetMr,apExternal:old.state.apExternal,hitRate:old.state.hitRate/100,ranks:rank.state,sequence:rank.sequence,timestamps:old.state.timestamps},catalog);
   if(!result.valid)continue;const firstRotation= result.events.filter(e=>e.kind==='spell'&&e.rotation===1).reduce((sum,e)=>sum+e.damage,0);
   const beyond=result.subtotals.spells-firstRotation;const plus=beyond+result.extras;
   // Base V13.3 already includes direct damage of first spell rotation, aura and despair.
   const combined=[b.totals.min+plus,b.totals.max+plus];outputs.push({name:b.name,result,plus,combined});const row=el('tr');for(const val of [b.name,fmt(result.subtotals.spells),fmt(result.subtotals.tornado),fmt(result.subtotals.passive),fmt(plus),fmt(combined[0])+'–'+fmt(combined[1])]){const td=el('td',val);td.style.cssText='padding:9px 5px;border-bottom:1px solid #375968';row.append(td)}tb.append(row);
  }wrap.append(tb);panel.append(wrap);
  const detail=el('details');detail.append(el('summary','Voir les impacts ajoutés et leur horaire'));for(const o of outputs){detail.append(el('h4',o.name));for(const e of o.result.events){const p=el('p',`${fmt(e.time)} s · ${e.label} · ${fmt(e.damage)} dégâts · amplification +${fmt(e.amp*100)} %`);p.style.cssText='font-size:12px;margin:6px 0';detail.append(p)}for(const i of o.result.issues)detail.append(el('p','⚠ '+i));}panel.append(detail);
  const rules=el('details');rules.append(el('summary','Formules et limites de validation'));for(const a of outputs[0]?.result.assumptions||[])rules.append(el('p','• '+a));rules.append(el('p','Sources croisées : Riot Wild Rift (kit), WildRiftFire 7.3e et WildRiftCore chinois 7.3b. Les coefficients de passif diffèrent dans des historiques de patch ; vérification en client nécessaire.'));panel.append(rules);
  root.WRDI_GalioV134.last={state:deep(state),outputs};
 }
 let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,250)};new MutationObserver(schedule).observe(v133,{subtree:true,childList:true});const v131=document.getElementById('wrdiGalioV131');if(v131)new MutationObserver(schedule).observe(v131,{subtree:true,childList:true});
 root.WRDI_GalioV134={version:VERSION,calculate,totals,refresh:render,last:null};fetch('./data/items-client-7.3d-v12.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{if(d.target_game!=='Wild Rift mobile')throw Error('Données non Wild Rift');catalog=d;render()}).catch(e=>{err=e.message;render()});render();
}
if(typeof document==='undefined'){root.WRDI_GalioV134={version:VERSION,calculate,totals,BASE,CD};return;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
