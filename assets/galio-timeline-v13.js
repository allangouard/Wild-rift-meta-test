/* WRDI V13.3 — Chronologie de combat Galio, Wild Rift uniquement.
 * Les instants de sorts sont des hypothèses modifiables, non des animations validées.
 * Ne remplace pas V13.0–V13.2 ; réutilise leurs objets et les descriptions structurées du catalogue 7.3d.
 */
(function(root){'use strict';
const VERSION='13.5B-13.3', CAT='./data/items-client-7.3d-v12.json', DRAFT='wrdi_draft_v76';
const SKILLS={q:{base:[70,115,160,205],ap:.75,name:'A/Q · impact initial'},w:{base:[40,80,120,160],ap:.55,name:'Z/W · relâchement'},e:{base:[90,140,190,240],ap:.80,name:'E · impact'},r:{base:[150,250,350],ap:.70,name:'R · impact'}};
const num=(x,d=0)=>x===null||x===undefined||x===''?d:Number.isFinite(Number(x))?Number(x):d;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,num(x,a)));
const round=x=>Math.round((x+Number.EPSILON)*10)/10;
const f=x=>Number.isFinite(x)?x.toFixed(1):'—';
const mult=mr=>mr>=0?100/(100+mr):2-mr/100;
function itemMap(data){return new Map((data?.items||[]).map(x=>[x.id,x]));}
function passive(item,name){return item?.passives?.find(p=>p.name===name)?.mechanics||null;}
function statsFor(ids,data,apExternal){const map=itemMap(data), stats={hp:0,ap:0,armor:0,mr:0,ah:0,mpen_pct:0},missing=[];
 for(const id of ids){const item=map.get(id);if(!item){missing.push(id);continue;}for(const k of Object.keys(stats))stats[k]+=num(item.stats?.[k]);}
 const rift=ids.includes('riftmaker')?passive(map.get('riftmaker'),'Infusion du Néant'):null;
 const conversion=rift?.bonus_ap_formula==='0.02 * bonus_hp'?stats.hp*.02:0;
 const rab=ids.includes('rabadons_deathcap')?passive(map.get('rabadons_deathcap'),'Démesure'):null;
 const ampRab=rab?.effect==='ap_multiplier'?num(rab.value,1):1;
 return {stats,missing,ap:(stats.ap+conversion+apExternal)*ampRab,conversion,ampRab};}
function simulate(input,data){
 const ids=Array.isArray(input.ids)?input.ids:[], stat=statsFor(ids,data,clamp(input.apExternal,0,2000));
 if(stat.missing.length)return {valid:false,issues:['Objets absents du catalogue : '+stat.missing.join(', ')]};
 const map=itemMap(data), dur=clamp(input.duration,1,20), targetMr=clamp(input.targetMr,0,500), baseHp=clamp(input.baseHp,1,10000), hitRate=clamp(input.hitRate,0,1), proximity=input.proximity!==false;
 const effMr=Math.max(0,targetMr*(1-clamp(stat.stats.mpen_pct,0,100)/100)),mitigation=mult(effMr);
 const rift=ids.includes('riftmaker')?passive(map.get('riftmaker'),'Corruption du Néant'):null;
 const riftEnabled=!!(rift&&num(rift.damage_amp_per_s_pct)>0&&num(rift.max_damage_amp_pct)>0);
 // t=0 marks sustained champion combat onset; intervals must not be invented as spell cooldowns.
 const amplification=t=>riftEnabled?Math.min(num(rift.max_damage_amp_pct),Math.floor(Math.max(0,t))*num(rift.damage_amp_per_s_pct))/100:0;
 const ranks=input.ranks||{q:4,w:1,e:4,r:0};
 const timestamps=input.timestamps||{e:.5,q:1.2,w:2,r:3};
 const sequence=Array.isArray(input.sequence)?input.sequence:['e','q','w'];
 const events=[],issues=[];
 for(const id of [...new Set(sequence)]){
  const s=SKILLS[id],rank=Math.floor(num(ranks[id]));if(!s||rank<=0)continue;
  if(rank>s.base.length){issues.push('Rang non valide : '+id);continue;}
  const at=num(timestamps[id],NaN);if(!Number.isFinite(at)||at<0||at>dur)continue;
  const raw=s.base[rank-1]+s.ap*stat.ap;
  events.push({time:at,type:'sort',id,label:s.name,raw,ampPct:amplification(at)*100,damage:raw*(1+amplification(at))*mitigation*hitRate});
 }
 const rad=ids.includes('hollow_radiance')?passive(map.get('hollow_radiance'),'Immolation'):null;
 if(proximity&&rad?.tick_s===1&&rad?.duration_s===5&&rad?.damage_formula==='base_20_to_30 + 0.01 * bonus_hp'){
  // 5 s maximum is an explicitly chosen non-refreshing activation window.
  for(let t=1;t<=Math.min(5,Math.floor(dur));t++){
   const b=0.01*stat.stats.hp;const m=(1+amplification(t))*mitigation;
   events.push({time:t,type:'aura',id:'radiance',label:'Rayonnement du vide · Immolation',ampPct:amplification(t)*100,damageRange:[(20+b)*m,(30+b)*m]});
  }
 }
 const despair=ids.includes('unending_despair')?passive(map.get('unending_despair'),'Affliction'):null;
 if(proximity&&despair?.tick_s===4&&despair?.damage_formula==='0.03 * own_max_hp'&&despair?.heal_multiplier_of_damage_dealt===2.5){
  for(let t=4;t<=Math.floor(dur);t+=4){
   const damage=(baseHp+stat.stats.hp)*.03*mitigation*(1+amplification(t));
   events.push({time:t,type:'despair',id:'despair',label:'Désespoir infini · Affliction',ampPct:amplification(t)*100,damage,healPotential:damage*2.5});
  }
 }
 const priority={sort:0,aura:1,despair:2};events.sort((a,b)=>a.time-b.time||priority[a.type]-priority[b.type]||a.id.localeCompare(b.id));
 const totals={direct:0,auraMin:0,auraMax:0,despair:0,healPotential:0,min:0,max:0};
 for(const ev of events){if(ev.type==='sort')totals.direct+=ev.damage;if(ev.type==='aura'){totals.auraMin+=ev.damageRange[0];totals.auraMax+=ev.damageRange[1];}if(ev.type==='despair'){totals.despair+=ev.damage;totals.healPotential+=ev.healPotential;}}
 totals.min=totals.direct+totals.auraMin+totals.despair;totals.max=totals.direct+totals.auraMax+totals.despair;
 return {valid:true,ids,ap:stat.ap,conversion:stat.conversion,effMr,events,totals,duration:dur,issues,
 assumptions:['Les instants des compétences sont des hypothèses modifiables, non des timings client vérifiés.','Un seul lancement de chaque compétence : aucun cooldown ni deuxième rotation simulés.','Combat contre champion actif depuis t=0 et cible touchée par les sorts retenus.','Immolation : activation unique supposée de 5 s, pas de rafraîchissement ni procs de Désolation.','Désespoir infini : cible unique proche, soins potentiels avant PV manquants et réduction de soins.','Tornade du A/Q, passif de Galio, attaques de base, boucliers, autres passifs, runes, anti-soins et omnivampirisme exclus.','Source des objets : catalogue client déclaré 7.3d ; les valeurs ne sont pas certifiées pour les patchs ultérieurs.']};
}
function node(tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);return e;}
function init(){const host=document.getElementById('wrdiPane_build'),button=document.getElementById('simpleRun');if(!host||!button||document.getElementById('wrdiGalioV133'))return;
 const panel=node('section');panel.id='wrdiGalioV133';panel.style.cssText='border:1px solid #5a9ba3;border-radius:14px;padding:14px;margin:16px 0;background:#112d38;color:#e7f0f3';host.prepend(panel);
 const state={duration:10,targetMr:60,baseHp:2406,autoHp:true,apExternal:0,hitRate:100,proximity:true,timestamps:{e:.5,q:1.2,w:2,r:3}};
 let catalog=null,error='',renderTimer=0;
 function info(s){const p=node('p',s);p.style.cssText='font-size:13px;line-height:1.55;color:#c5dbe3';panel.append(p);}
 function field(container,label,get,set,min,max,step='1'){const l=node('label');l.style.cssText='display:flex;flex-direction:column;gap:4px;min-width:126px;flex:1;font-size:12px';l.append(node('span',label));const el=node('input');el.type='number';el.step=step;el.min=min;el.max=max;el.value=get();el.style.cssText='box-sizing:border-box;width:100%;background:#244b59;color:white;border:1px solid #7395a1;border-radius:6px;padding:9px';el.addEventListener('change',()=>{set(clamp(el.value,min,max));render()});l.append(el);container.append(l);}
 function galio(){try{const d=JSON.parse(localStorage.getItem(DRAFT)||'null');return Array.isArray(d)&&d.length===10&&String(d[2])==='10099';}catch{return false}}
 function render(){panel.replaceChildren(node('h3','⏱️ V13.3 · Chronologie des impacts Galio'));if(!galio()){info('Sélectionne Galio mid et analyse ta draft.');return;}if(error){info('Catalogue inaccessible : '+error);return;}if(!catalog){info('Chargement du catalogue…');return;}
 const variants=root.WRDI_GalioV13?.last?.results, previous=root.WRDI_GalioV131?.last;
 if(!Array.isArray(variants)||!variants.length||!previous){info('En attente de V13.0 et V13.1 : lance « Analyser ma draft ».');return;}
 info('Chaque impact est calculé à son instant supposé. Galio : PV de base Riot 7.3 par niveau en mode automatique ; autres statistiques restant à valider en jeu. Objets catalogue déclaré 7.3d.');
 if(state.autoHp)state.baseHp=root.WRDI_GalioV135?.levelStats(root.WRDI_GalioV135.level)?.hp??2406;
 const c=node('div');c.style.cssText='display:flex;flex-wrap:wrap;gap:9px';for(const [k,label,min,max] of [['duration','Durée du combat (s)',1,20],['targetMr','RM de la cible',0,500],['apExternal','AP hors objets',0,2000],['hitRate','Impacts réussis (%)',0,100]])field(c,label,()=>state[k],v=>state[k]=v,min,max);panel.append(c);
 const hpBox=node('div');hpBox.style.cssText='margin:8px 0';const hpToggle=node('label');const hpCheck=node('input');hpCheck.type='checkbox';hpCheck.checked=state.autoHp;hpCheck.addEventListener('change',()=>{state.autoHp=hpCheck.checked;render()});hpToggle.append(hpCheck,node('span',' PV de Galio automatiques selon le niveau V13.4 (Riot 7.3)'));hpBox.append(hpToggle);const hpL=node('label');hpL.append(node('span','PV de Galio hors objets : '));const hpInput=node('input');hpInput.type='number';hpInput.min=1;hpInput.max=10000;hpInput.value=state.baseHp;hpInput.disabled=state.autoHp;hpInput.style.cssText='max-width:125px;padding:8px;background:#244b59;color:#fff';hpInput.addEventListener('change',()=>{state.baseHp=clamp(hpInput.value,1,10000);render()});hpL.append(hpInput);hpBox.append(hpL);panel.append(hpBox);
 const times=node('div');times.style.cssText='display:flex;flex-wrap:wrap;gap:9px;margin-top:10px';for(const [k,label] of [['e','E · impact à (s)'],['q','A/Q · impact à (s)'],['w','Z/W · impact à (s)'],['r','R · impact à (s)']])field(times,label,()=>state.timestamps[k],v=>state.timestamps[k]=v,0,20,'.1');panel.append(times);
 const box=node('label');box.style.cssText='display:flex;gap:8px;align-items:center;margin-top:10px;font-size:12px';const check=node('input');check.type='checkbox';check.checked=state.proximity;check.addEventListener('change',()=>{state.proximity=check.checked;render()});box.append(check,node('span','Cible toujours à portée des auras et de Désespoir'));panel.append(box);
 const outputs=[];const wrap=node('div');wrap.style.cssText='overflow-x:auto;margin:14px 0';const table=node('table');table.style.cssText='border-collapse:collapse;min-width:650px;width:100%;font-size:12px';const hdr=node('tr');for(const label of ['Build V13.0','AP','Dégâts directs','Aura min–max','Désespoir','Soins potentiels','Total partiel min–max']){const th=node('th',label);th.style.cssText='padding:8px 5px;border-bottom:1px solid #7199a5;text-align:left';hdr.append(th)}table.append(hdr);
 for(const row of variants){const ids=row.items||row.result?.ids||[];const r=simulate({ids,duration:state.duration,targetMr:state.targetMr,baseHp:state.baseHp,apExternal:state.apExternal,hitRate:state.hitRate/100,proximity:state.proximity,ranks:previous.state,sequence:previous.sequence,timestamps:state.timestamps},catalog);if(!r.valid)continue;outputs.push({name:row.name,...r});const tr=node('tr');const t=r.totals;for(const v of [row.name,f(r.ap),f(t.direct),f(t.auraMin)+'–'+f(t.auraMax),f(t.despair),f(t.healPotential),f(t.min)+'–'+f(t.max)]){const td=node('td',v);td.style.cssText='padding:8px 5px;border-bottom:1px solid #375968';tr.append(td)}table.append(tr)}wrap.append(table);panel.append(wrap);
 if(!outputs.length)info('Aucune variante complète issue de V13.0.');
 const details=node('details');const summ=node('summary','Voir la chronologie détaillée par build');details.append(summ);for(const result of outputs){details.append(node('h4',result.name));if(!result.events.length)details.append(node('p','Aucun impact dans cette fenêtre.'));for(const ev of result.events){const interval=ev.damageRange?f(ev.damageRange[0])+'–'+f(ev.damageRange[1]):f(ev.damage);const h=ev.healPotential?' · soin théorique '+f(ev.healPotential):'';details.append(node('p',`${f(ev.time)} s · ${ev.label} · ${interval} dégâts · bonus Créateur +${f(ev.ampPct)} %${h}`));}}panel.append(details);
 const limits=node('details');limits.append(node('summary','Hypothèses et exclusions'));for(const s of outputs[0]?.assumptions||[])limits.append(node('p','• '+s));limits.append(node('p','Les dégâts des compétences V13.1 ne sont pas tous validés sur le sous-patch actuel. Comparaison théorique, pas un classement du meilleur build.'));panel.append(limits);
 root.WRDI_GalioV133.last={state:JSON.parse(JSON.stringify(state)),outputs};
 }
 function schedule(){clearTimeout(renderTimer);renderTimer=setTimeout(render,180)}
 for(const id of ['wrdiGalioV13','wrdiGalioV131']){const target=document.getElementById(id);if(target&&typeof MutationObserver!=='undefined')new MutationObserver(schedule).observe(target,{subtree:true,childList:true});}
 button.addEventListener('click',()=>setTimeout(render,1600));
 root.WRDI_GalioV133={version:VERSION,simulate,statsFor,refresh:render,last:null};
 fetch(CAT).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(d=>{if(d.target_game!=='Wild Rift mobile')throw Error('Catalogue non Wild Rift');catalog=d;render()}).catch(e=>{error=e.message;render()});render();
}
if(typeof document==='undefined'){root.WRDI_GalioV133={version:VERSION,simulate,statsFor,SKILLS};return;}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
