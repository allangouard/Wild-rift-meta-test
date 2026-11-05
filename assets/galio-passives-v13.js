/* WRDI V13.2 — scénarios explicitement hypothétiques, catalogue client Wild Rift 7.3d.
   Aucun modèle de chronologie des sorts, réduction de soin, autres passifs ou cible réelle.
*/
(function(root){'use strict';
const VERSION='13.2.0',CAT='./data/items-client-7.3d-v12.json',KEY='wrdi_draft_v76';
const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,n(v,lo)));
const fmt=v=>Number.isFinite(v)?v.toFixed(1):'—';
const dmgMult=mr=>mr>=0?100/(100+mr):2-mr/100;
const byID=(catalog)=>new Map((catalog?.items||[]).map(x=>[x.id,x]));
const passive=(item,name)=>item?.passives?.find(p=>p.name===name)?.mechanics;
function buildStats(ids,catalog){const map=byID(catalog),tot={hp:0,ap:0,armor:0,mr:0,ah:0,mpen_pct:0},missing=[];
 for(const id of ids){let x=map.get(id);if(!x){missing.push(id);continue;}for(const k of Object.keys(tot))tot[k]+=n(x.stats?.[k]);}
 const rift=map.get('riftmaker'),rabadon=map.get('rabadons_deathcap');
 // Formula must match verified structured string; do not silently substitute unknown.
 const conversion=ids.includes('riftmaker')&&passive(rift,'Infusion du Néant')?.bonus_ap_formula==='0.02 * bonus_hp'?tot.hp*.02:0;
 const multiplier=ids.includes('rabadons_deathcap')&&passive(rabadon,'Démesure')?.effect==='ap_multiplier'?n(passive(rabadon,'Démesure').value,1):1;
 const totalAP=(tot.ap+conversion)*multiplier;
 return {tot,conversion,multiplier,totalAP,missing};}
function simulate(input,catalog){const ids=input.ids||[],map=byID(catalog),stats=buildStats(ids,catalog);if(stats.missing.length)return {valid:false,issues:['Objets absents : '+stats.missing.join(', ')]};
 const cfg={duration:clamp(input.duration,1,15),targetMr:clamp(input.targetMr,0,500),targetHp:clamp(input.targetHp,100,20000),baseHp:clamp(input.baseHp,1,10000),baseAp:clamp(input.baseAp,0,2000),proximity:input.proximity!==false,championCombat:input.championCombat!==false,hitRate:clamp(input.hitRate,0,1),ranks:input.ranks||{q:4,w:1,e:4,r:0},sequence:input.sequence||['e','q','w']};
 const ap=(stats.tot.ap+stats.conversion+cfg.baseAp)*stats.multiplier;
 const skills=root.WRDI_GalioV131?.SKILLS||{q:{base:[70,115,160,205],ap:.75},w:{base:[40,80,120,160],ap:.55},e:{base:[90,140,190,240],ap:.80},r:{base:[150,250,350],ap:.70}};
 let rawSkills=0;for(const id of cfg.sequence){const s=skills[id],rank=n(cfg.ranks[id]);if(s&&rank>=1&&rank<=s.base.length)rawSkills+=(s.base[rank-1]+s.ap*ap)*cfg.hitRate;}
 // Single simultaneous snapshot of skill impacts at chosen time; no fabricated cooldown timeline.
 const mpen=Math.max(0,Math.min(100,stats.tot.mpen_pct));const effectiveMr=Math.max(0,cfg.targetMr*(1-mpen/100)),mult=dmgMult(effectiveMr);
 const rift=ids.includes('riftmaker')?passive(map.get('riftmaker'),'Corruption du Néant'):null;
 // Amplification treated as end-of-window snapshot, not as time-integrated damage.
 const amp=rift&&cfg.championCombat?Math.min(n(rift.max_damage_amp_pct)/100,Math.floor(cfg.duration)*n(rift.damage_amp_per_s_pct)/100):0;
 const skillDamage=rawSkills*(1+amp)*mult;
 const hp=cfg.baseHp+stats.tot.hp;
 let radiance=0,radianceTicks=0,despair=0,despairTicks=0,despairHeal=0;
 if(cfg.proximity&&cfg.championCombat){
  const rad=ids.includes('hollow_radiance')?passive(map.get('hollow_radiance'),'Immolation'):null;
  if(rad?.tick_s===1&&rad?.duration_s===5&&rad.damage_formula==='base_20_to_30 + 0.01 * bonus_hp'){
    radianceTicks=Math.min(5,Math.floor(cfg.duration));
    // The client catalog provides 20–30 based on level, so return a bounded range.
    radiance=[20,30].map(base=>radianceTicks*(base+.01*stats.tot.hp)*mult*(1+amp));
  }
  const des=ids.includes('unending_despair')?passive(map.get('unending_despair'),'Affliction'):null;
  if(des?.tick_s===4&&des.damage_formula==='0.03 * own_max_hp'&&des.heal_multiplier_of_damage_dealt===2.5){
   despairTicks=Math.floor(cfg.duration/4);despair=despairTicks*.03*hp*mult*(1+amp);despairHeal=despair*2.5;
  }
 }
 const lower=skillDamage+(Array.isArray(radiance)?radiance[0]:0)+despair;
 const upper=skillDamage+(Array.isArray(radiance)?radiance[1]:0)+despair;
 const omnivamp=rift&&amp>=n(rift.max_damage_amp_pct)/100?n(rift.omnivamp_melee_pct)/100:0;
 // Omnivamp healing is NOT simulated: AoE and damage-type modifiers / multiple targets are unknown.
 const issues=['Sorts agrégés en un impact instantané en fin de fenêtre, sans chronologie ni délais de récupération.', 'Amplification de Créateur de failles appliquée au moment final, pas à chaque impact réel.', 'Rayonnement du vide : proximité et déclenchement supposés constants; base 20–30 non résolue par niveau.', 'Soins de Désespoir infini théoriques avant PV manquants, réductions et autres conditions.', 'Omnivampirisme non calculé (règles AoE et application non vérifiées).'];
 return {valid:true,ids,stats,ap,hp,magicPenPct:mpen,effectiveMr,amplificationPct:amp*100,skillDamage,radianceDamage:radiance,despairDamage:despair,despairHeal,despairTicks,radianceTicks,omnivampPotentialPct:omnivamp*100,totalDamageRange:[lower,upper],issues,config:cfg};
}
function el(tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);return e}
function init(){const host=document.getElementById('wrdiPane_build'),run=document.getElementById('simpleRun');if(!host||!run||document.getElementById('wrdiGalioV132'))return;
 const panel=el('section');panel.id='wrdiGalioV132';panel.style.cssText='border:1px solid #548f99;border-radius:14px;padding:14px;margin:16px 0;background:#112d38;color:#e6f1f5';host.prepend(panel);
 let catalog=null,fetchError='',timer=0;
 const state={duration:6,targetMr:60,targetHp:2500,baseHp:2000,baseAp:0,proximity:true};
 function p(s){const x=el('p',s);x.style.cssText='font-size:13px;line-height:1.5;color:#c6dce5';panel.append(x)}
 function inputRow(label,key,min,max){const wrap=el('label');wrap.style.cssText='display:flex;flex-direction:column;flex:1;min-width:125px;font-size:12px;gap:4px';wrap.append(el('span',label));const inp=el('input');inp.type='number';inp.min=min;inp.max=max;inp.value=state[key];inp.style.cssText='box-sizing:border-box;width:100%;background:#244b59;color:white;border:1px solid #7395a1;border-radius:6px;padding:9px';inp.addEventListener('change',()=>{state[key]=clamp(inp.value,min,max);render()});wrap.append(inp);return wrap}
 function isGalio(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');return Array.isArray(d)&&d.length===10&&String(d[2])==='10099'}catch{return false}}
 function render(){panel.replaceChildren(el('h3','⚗️ V13.2 · Passifs et scénarios Galio'));if(!isGalio()){p('Sélectionne Galio mid, puis lance « Analyser ma draft ».');return}if(fetchError){p('Catalogue inaccessible : '+fetchError);return}if(!catalog){p('Chargement du catalogue d’objets…');return}
 const v13=root.WRDI_GalioV13?.last?.results,v131=root.WRDI_GalioV131?.last;if(!Array.isArray(v13)||!v13.length||!v131){p('En attente des analyses V13.0 et V13.1. Lance « Analyser ma draft ».');return}
 p('Données d’objets du client 7.3d. Scénarios théoriques : mêmes compétences, mêmes résistances et même durée pour chaque build. Aucun meilleur build n’est encore déterminé.');
 const controls=el('div');controls.style.cssText='display:flex;flex-wrap:wrap;gap:8px';for(const [title,key,min,max] of [['Durée combat (s)','duration',1,15],['RM de la cible','targetMr',0,500],['PV de base Galio (hypothèse)','baseHp',1,10000],['AP hors objets','baseAp',0,2000]])controls.append(inputRow(title,key,min,max));panel.append(controls);
 const check=el('label');check.style.cssText='display:flex;align-items:center;gap:8px;font-size:12px;margin-top:10px';const cb=el('input');cb.type='checkbox';cb.checked=state.proximity;cb.addEventListener('change',()=>{state.proximity=cb.checked;render()});check.append(cb,el('span','Proximité constante pour les auras et Désespoir infini'));panel.append(check);
 const div=el('div');div.style.cssText='overflow-x:auto;margin-top:14px';const table=el('table');table.style.cssText='border-collapse:collapse;width:100%;min-width:690px;font-size:12px';const head=el('tr');for(const title of ['Variante','AP totale¹','RM effective','Dégâts directs²','Aura min–max','Désespoir','Soin théorique','Total min–max']){const th=el('th',title);th.style.cssText='padding:8px 5px;border-bottom:1px solid #7298a3;text-align:left';head.append(th)}table.append(head);
 const outputs=[];for(const row of v13){const result=simulate({ids:row.items||row.result?.ids||[],duration:state.duration,targetMr:state.targetMr,baseHp:state.baseHp,baseAp:state.baseAp,proximity:state.proximity,ranks:v131.state,sequence:v131.sequence,hitRate:n(v131.state?.hitRate,100)/100},catalog);if(!result.valid)continue;outputs.push({name:row.name,...result});const tr=el('tr');for(const s of [row.name,fmt(result.ap),fmt(result.effectiveMr),fmt(result.skillDamage),Array.isArray(result.radianceDamage)?result.radianceDamage.map(fmt).join('–'):'0',fmt(result.despairDamage),fmt(result.despairHeal),result.totalDamageRange.map(fmt).join('–')]){const td=el('td',s);td.style.cssText='padding:8px 5px;border-bottom:1px solid #375968';tr.append(td)}table.append(tr)}div.append(table);panel.append(div);
 if(!outputs.length)p('Aucun build exploitable : objets ou statistiques manquants.');
 p('¹ Coiffe de Rabadon : amplification de l’AP totale calculée; Créateur de failles : +2 % des PV bonus convertis en AP. ² Impacts directs V13.1 agrégés; bonus de Créateur de failles considéré à la fin de la durée. Pénétration magique % appliquée à la RM cible.');
 const details=el('details');details.append(el('summary','Conditions, déclenchements et limites'));for(const result of outputs){details.append(el('h4',result.name));details.append(el('p',`Créateur de failles : +${fmt(result.amplificationPct)} % au moment de référence; omnivamp potentiel ${fmt(result.omnivampPotentialPct)} % (soins non calculés). Rayonnement : ${result.radianceTicks} tick(s). Désespoir : ${result.despairTicks} déclenchement(s).`))}for(const note of simulate({ids:[],duration:state.duration,targetMr:state.targetMr,baseHp:state.baseHp,ranks:v131.state,sequence:v131.sequence},catalog).issues)details.append(el('p','• '+note));panel.append(details);
 p('Exclus : cooldowns et chronologie des sorts, tornade A/Q, passif Galio, runes, autres passifs, armure et dégâts physiques, soins effectifs limités aux PV manquants, dégâts véritables, cibles multiples et builds adverses réels. Valeurs d’objets revendiquées 7.3d, non validées pour les patchs ultérieurs.');
 root.WRDI_GalioV132.last={state:{...state},outputs};
 }
 async function load(){try{const response=await fetch(CAT);if(!response.ok)throw Error('HTTP '+response.status);catalog=await response.json();if(catalog.target_game!=='Wild Rift mobile')throw Error('Catalogue non Wild Rift');render()}catch(e){fetchError=e.message;render()}}
 function schedule(){clearTimeout(timer);timer=setTimeout(render,200)}
 for(const id of ['wrdiGalioV13','wrdiGalioV131']){const target=document.getElementById(id);if(target&&typeof MutationObserver!=='undefined'){new MutationObserver(schedule).observe(target,{subtree:true,childList:true})}}
 run.addEventListener('click',()=>setTimeout(render,1500));
 root.WRDI_GalioV132={version:VERSION,simulate,buildStats,refresh:render,last:null};load();
}
if(typeof document==='undefined'){root.WRDI_GalioV132={version:VERSION,simulate,buildStats};return}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
