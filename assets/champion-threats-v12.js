/* WRDI V12.5 — lecture contextuelle des kits Wild Rift.
 * Remplace V12.4.1 ; aucune modification de l'optimiseur d'objets.
 * Extraction linguistique indicative, valeurs des patchs NON certifiées.
 */
(function(root){
'use strict';
const VERSION='12.5', SOURCE='https://wrchina.gg';
const fmt={magic:'Dégâts magiques infligés',physical:'Dégâts physiques infligés',true:'Dégâts véritables conditionnels ou infligés',stun:'Étourdissement',knockup:'Projection',root:'Immobilisation',slow:'Ralentissement',shield:'Bouclier',heal:'Soin',maxhp:'Dégâts liés aux PV maximum (mention)',overtime:'Dégâts/effet périodique (mention)',dash:'Mobilité / rapprochement',physicalMitigation:'Réduction de dégâts physiques reçus'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const txt=v=>typeof v==='string'?v:'';
function abilities(raw){const a=raw?.abilities||raw?.skills||[];const arr=Array.isArray(a)?a:Object.entries(a).map(([slot,v])=>({...v,slot}));return arr.map((v,i)=>{const r=v?.raw||{};const slot=txt(v?.slot||v?.key||v?.slot_name||(['P','Q','W','E','R'][i]||'?'));return {slot:({'0':'P','1':'Q','2':'W','3':'E','4':'R',Passiva:'P'}[slot]||slot),name:txt(r.name_cn||v?.name_cn||v?.name||slot),description:txt(r.desc_cn||v?.desc_cn||r.description_cn||v?.description_cn||v?.desc||v?.description)};});}
function detectSkill(s){
 const chunks=s.description.split(/[。；;\n]/).map(x=>x.trim()).filter(Boolean),found=[];
 function add(id,evidence,qualifier){if(!found.some(x=>x.id===id))found.push({id,slot:s.slot,evidence:evidence.slice(0,190),qualifier:qualifier||'mention lexicale ; effet/impact à valider'});}
 for(const clause of chunks){
  // Mitigations and damage descriptions must not be conflated.
  const received=/所受|受到|承受|减免|減免|抵御|抵禦|减少|減少|降低伤害|降低傷害/.test(clause);
  const physical=/物理伤害|物理傷害/.test(clause),magic=/魔法伤害|魔法傷害/.test(clause),trueD=/真实伤害|真實傷害/.test(clause);
  if(physical && received && /所受物理伤害|所受物理傷害|受到的物理伤害|承受物理伤害|物理伤害减少|物理傷害減少/.test(clause))add('physicalMitigation',clause,'réduction des dégâts reçus, pas des dégâts infligés');
  // Damage on the enemy can mention the enemy "receiving" damage: distinguish the subject.
  const wearerReceived=/^(?:被动[:：])?\s*(?:自身|自己|所受|受到|承受)/.test(clause)||/所受物理伤害|所受物理傷害/.test(clause);
  if(physical && !wearerReceived && !(/物理伤害减少|物理傷害減少/.test(clause)))add('physical',clause);
  if(magic && !(/自身受到魔法伤害|自身承受魔法伤害|所受魔法伤害减少/.test(clause)))add('magic',clause);
  if(trueD && !(/自身受到真实伤害|所受真实伤害减少/.test(clause)))add('true',clause,/额外|額外|其后续|其後續|时|時|若|如果/.test(clause)?'déclenchement conditionnel à vérifier':'dégâts mentionnés, condition à vérifier');
  if(/击晕|擊暈|眩晕|暈眩|晕眩/.test(clause))add('stun',clause);
  if(/击飞|擊飛/.test(clause))add('knockup',clause);
  if(/禁锢|禁錮/.test(clause))add('root',clause);
  if(/减速|減速|移速降低|移动速度降低|移動速度降低/.test(clause))add('slow',clause);
  if(/护盾|護盾/.test(clause))add('shield',clause);
  if(/治疗|治療|回复生命值|回復生命值|恢复生命值|恢復生命值/.test(clause))add('heal',clause);
  if(/最大生命值|最大生命/.test(clause))add('maxhp',clause);
  if(/每秒|持续造成|持續造成/.test(clause))add('overtime',clause);
  if(/冲刺|衝刺|位移|突进|突進|拉向|位移至/.test(clause))add('dash',clause);
 }
 return found;
}
function infer(raw){const skills=abilities(raw),all=skills.flatMap(detectSkill),signals=[];for(const id of Object.keys(fmt)){const hits=all.filter(x=>x.id===id);if(hits.length)signals.push({id,label:fmt[id],skills:[...new Set(hits.map(x=>x.slot))],evidence:hits});}return {skills,signals,sourceVersion:txt(raw?.version)||'non indiquée',descriptionCount:skills.filter(x=>x.description.trim()).length};}
function interpret(results){const found=results.filter(x=>x.result),get=id=>found.filter(c=>c.result.signals.some(s=>s.id===id)).map(x=>x.name);return {magic:get('magic'),physical:get('physical'),true:get('true'),cc:[...new Set([...get('stun'),...get('root'),...get('knockup')])],mitigation:get('physicalMitigation'),missing:results.filter(x=>x.error).map(x=>x.name)};}
function selections(){let ids=[];try{ids=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]')}catch(_){}if(!Array.isArray(ids))return [];return ids.slice(5,10).map((id,i)=>{const slot=document.querySelector('[data-simple-slot="'+(i+5)+'"]');const n=slot?.querySelector('.slot-text')?.textContent||'';const role=slot?.querySelector('.slot-role')?.textContent||'';return {id:String(id||''),name:n.replace(role,'').trim()||('ID '+id)};}).filter(x=>x.id);}
async function get(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),14000);try{const r=await fetch(url,{signal:c.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}finally{clearTimeout(t)}}
function node(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function init(){const advisor=document.getElementById('wrdiV12DraftAdvisor');const host=advisor||document.getElementById('wrdiPane_threats');if(!host||document.getElementById('wrdi125'))return;
 const style=node('style',`#wrdi125{margin-top:16px;padding:14px;border:1px solid #456474;border-radius:14px;background:#102736;color:#e4eef6}#wrdi125 p{line-height:1.5}#wrdi125 .quiet{color:#b6ccd7;font-size:13px}#wrdi125 .ch{padding:10px;margin:10px 0;border:1px solid #426273;border-radius:10px}#wrdi125 summary{cursor:pointer;font-weight:700}#wrdi125 button{border:1px solid #3b958c;background:#146f68;color:white;border-radius:9px;padding:11px;font-weight:700}#wrdi125 li{margin:7px 0;overflow-wrap:anywhere}`);document.head.appendChild(style);
 const box=node('section','');box.id='wrdi125';box.appendChild(node('h3','🔎 Analyse contextuelle des kits — V12.5'));box.appendChild(node('p','Détecte les effets des sorts ennemis et leur contexte. Pas de simulation de DPS ni de classement automatique des équipements.','quiet'));
 const run=node('button','Analyser les kits adverses');run.type='button';box.appendChild(run);const out=node('div','');out.setAttribute('aria-live','polite');box.appendChild(out);host.appendChild(box);
 let last=[],busy=false,signature='';
 const render=()=>{out.replaceChildren();out.appendChild(node('p',`${last.filter(x=>x.result).length}/${last.length} fiches lues · effets extraits à partir de descriptions chinoises (patch de chaque fiche non certifié).`,'quiet'));
 const s=interpret(last);const summary=node('div','');summary.appendChild(node('h4','Conséquences possibles pour Galio'));
 if(s.magic.length)summary.appendChild(node('p','Menaces magiques décrites : '+s.magic.join(', ')+'. La RM peut réduire leurs dégâts magiques, mais pas les dégâts véritables.'));
 if(s.physical.length)summary.appendChild(node('p','Menaces physiques décrites : '+s.physical.join(', ')+'. L’armure peut être pertinente selon les dégâts réellement subis.'));
 if(s.true.length)summary.appendChild(node('p','Dégâts véritables mentionnés : '+s.true.join(', ')+'. Ni armure ni RM ne les réduisent directement ; vérifier les conditions d’application.'));
 if(s.cc.length)summary.appendChild(node('p','Contrôles détectés : '+s.cc.join(', ')+'. Examiner les possibilités de protection/anti-contrôle disponibles et réellement compatibles.'));
 if(s.mitigation.length)summary.appendChild(node('p','Effets défensifs contre le physique : '+s.mitigation.join(', ')+'. Ce n’est PAS une menace physique infligée.'));
 if(!last.some(x=>x.result))summary.appendChild(node('p','Aucune fiche accessible : pas de conclusion défensive possible.'));
 const note=node('p','Liaison avec les objets : Rayonnement du vide ou d’autres objets de RM peuvent devenir des candidats si le danger magique est pertinent ; aucun choix n’est automatique tant que les quantités de dégâts, leurs déclenchements et les builds ennemis ne sont pas validés.','quiet');summary.appendChild(note);out.appendChild(summary);
 for(const c of last){const d=document.createElement('details');d.className='ch';d.appendChild(node('summary',c.name+(c.result?' · '+c.result.descriptionCount+'/'+c.result.skills.length+' descriptions · '+c.result.signals.length+' types détectés':' · échec de lecture')));if(c.error){d.appendChild(node('p',c.error));out.appendChild(d);continue;}d.appendChild(node('p','Version interne de fiche : '+c.result.sourceVersion+'. Une mention dans un sort ne représente pas une proportion de dégâts.','quiet'));
 if(!c.result.signals.length)d.appendChild(node('p','Aucun mot-clé reconnu. Cela ne prouve pas l’absence de menace.'));
 for(const signal of c.result.signals){const detail=document.createElement('details');detail.appendChild(node('summary',signal.label+' — '+signal.skills.join(', ')));for(const hit of signal.evidence){detail.appendChild(node('p',hit.slot+' : '+hit.evidence));detail.appendChild(node('p',hit.qualifier,'quiet'));}d.appendChild(detail);}out.appendChild(d);}
 out.appendChild(node('p','Interprétation lexicale indicative. Un texte peut mentionner la réduction de dégâts reçus, un bonus conditionnel ou des dégâts liés à un objet. Les compétences à plusieurs formes, les ratios, les passifs et les mises à jour de patch nécessitent encore une validation.','quiet'));
 };
 async function analyze(force=false){const picks=selections();const sig=picks.map(x=>x.id).join(',');if(!picks.length){out.textContent='Sélectionne les adversaires dans la draft.';return;}if(busy||(!force&&sig===signature&&last.length))return;busy=true;run.disabled=true;out.textContent='Lecture des kits adverses…';try{last=await Promise.all(picks.map(async c=>{try{return {...c,result:infer(await get(SOURCE+'/api/champion/'+encodeURIComponent(c.id)+'.json'))}}catch(e){return {...c,error:String(e)}}}));signature=sig;render();}finally{busy=false;run.disabled=false;}}
 run.addEventListener('click',()=>analyze(true));const main=document.getElementById('simpleRun');if(main)main.addEventListener('click',()=>analyze(false));
 root.WRDIChampionThreatsV125={infer,detectSkill,interpret,analyze,getLastAudit:()=>last,version:VERSION};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
