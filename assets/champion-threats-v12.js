/* WRDI V12.6 — hiérarchisation prudente des menaces Wild Rift.
 * Remplace V12.5 ; aucune modification de l'optimiseur d'objets.
 * Extraction linguistique indicative, valeurs des patchs NON certifiées.
 */
(function(root){
'use strict';
const VERSION='12.6', SOURCE='https://wrchina.gg';
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
// Les dominantes ci-dessous sont des repères qualitatifs éditoriaux, NON calculés
// depuis les descriptions chinoises ni extrapolés de taux de victoire.
// Une mention lexicale seule ne prouve jamais une dominante de dégâts.
const BASELINES = {
  amumu:{magic:'primary',physical:'none',true:'conditional',note:'Tank de contrôle à dégâts magiques prolongés ; dégâts véritables dépendants de sa malédiction.'},
  ahri:{magic:'primary',physical:'none',true:'conditional',note:'Mage mobile à dominante magique ; ses dégâts véritables sont conditionnels.'},
  camille:{magic:'secondary',physical:'primary',true:'important',note:'Combattante principalement physique, avec une composante de dégâts véritables importante sous conditions.'},
  caitlyn:{magic:'minor',physical:'primary',true:'none',note:'Tireuse principalement physique ; une mention magique ne suffit pas à lui attribuer une menace magique majeure.'},
  braum:{magic:'minor',physical:'secondary',true:'none',note:'Support protecteur : ses contrôles et sa protection sont en général plus déterminants que ses dégâts.'},
  aatrox:{magic:'none',physical:'primary',true:'none',note:'Combattant à dominante physique, soins et présence en mêlée.'},
  leesin:{magic:'secondary',physical:'primary',true:'none',note:'Combattant principalement physique, fort potentiel de déplacement/engagement.'},
  galio:{magic:'primary',physical:'secondary',true:'none',note:'Mage/tank de contrôle à dominante magique ; sa résistance varie selon le build.'},
  ashe:{magic:'minor',physical:'primary',true:'none',note:'Tireuse principalement physique, avec ralentissements et contrôle à distance.'},
  alistar:{magic:'secondary',physical:'minor',true:'none',note:'Tank de soutien dont les contrôles et la protection priment sur les dégâts.'},
  syndra:{magic:'primary',physical:'none',true:'none',note:'Mage à dominante magique, dégâts explosifs et contrôle.'},
  brand:{magic:'primary',physical:'none',true:'none',note:'Mage à dominante magique et dégâts périodiques/de zone.'},
  yasuo:{magic:'secondary',physical:'primary',true:'none',note:'Combattant à dominante physique avec coups critiques et mobilité.'},
  yone:{magic:'secondary',physical:'primary',true:'conditional',note:'Profil de dégâts mêlés et mobilité, à confirmer selon les compétences et le build.'}
};
const normalizeName = n=>String(n||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const tierNames={primary:'dominante probable',important:'contribution importante',secondary:'contribution secondaire probable',minor:'mention annexe / poids inconnu',conditional:'conditionnel',none:'non identifié comme majeur'};
function hierarchy(last){
  return last.map(entry=>{
    const baseline=BASELINES[normalizeName(entry.name)]||null;
    const signals=entry.result?.signals||[];
    const has=id=>signals.some(x=>x.id===id);
    const damage={};
    for(const id of ['physical','magic','true']){
      const lexical=has(id);
      const tier=baseline?.[id]|| (lexical?'unknown':'unconfirmed');
      damage[id]={tier,mentioned:lexical,source:baseline?'repère qualitatif de kit, à revalider sur le patch':'mention de compétence seule'};
    }
    return {name:entry.name,id:entry.id,version:entry.result?.sourceVersion||null,available:!!entry.result,damage,
      control:['stun','root','knockup'].some(has),periodic:has('overtime'),maxHp:has('maxhp'),
      warning:baseline?.note||'Aucun profil de dominante validé pour ce champion. Les mentions ne sont pas une répartition de dégâts.',
      baselineAvailable:!!baseline};
  });
}
function selections(){let ids=[];try{ids=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]')}catch(_){}if(!Array.isArray(ids))return [];return ids.slice(5,10).map((id,i)=>{const slot=document.querySelector('[data-simple-slot="'+(i+5)+'"]');const n=slot?.querySelector('.slot-text')?.textContent||'';const role=slot?.querySelector('.slot-role')?.textContent||'';return {id:String(id||''),name:n.replace(role,'').trim()||('ID '+id)};}).filter(x=>x.id);}
async function get(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),14000);try{const r=await fetch(url,{signal:c.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}finally{clearTimeout(t)}}
function node(tag,text,cls){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function init(){const stale=document.getElementById('wrdi124');if(stale)stale.remove();const advisor=document.getElementById('wrdiV12DraftAdvisor');const host=advisor||document.getElementById('wrdiPane_threats');if(!host||document.getElementById('wrdi125'))return;
 const style=node('style',`#wrdi125{margin-top:16px;padding:14px;border:1px solid #456474;border-radius:14px;background:#102736;color:#e4eef6}#wrdi125 p{line-height:1.5}#wrdi125 .quiet{color:#b6ccd7;font-size:13px}#wrdi125 .ch{padding:10px;margin:10px 0;border:1px solid #426273;border-radius:10px}#wrdi125 summary{cursor:pointer;font-weight:700}#wrdi125 button{border:1px solid #3b958c;background:#146f68;color:white;border-radius:9px;padding:11px;font-weight:700}#wrdi125 li{margin:7px 0;overflow-wrap:anywhere}`);document.head.appendChild(style);
 const box=node('section','');box.id='wrdi125';box.appendChild(node('h3','🧠 Hiérarchie des menaces — V12.6'));box.appendChild(node('p','Distingue dominantes probables, contributions secondaires et effets conditionnels. Repères qualitatifs de kits séparés des mentions automatiques ; pas de DPS chiffré ni d’optimisation automatique.','quiet'));
 const run=node('button','Analyser les kits adverses');run.type='button';box.appendChild(run);const out=node('div','');out.setAttribute('aria-live','polite');box.appendChild(out);host.appendChild(box);
 let last=[],busy=false,signature='';
 const render=()=>{out.replaceChildren();out.appendChild(node('p',`${last.filter(x=>x.result).length}/${last.length} fiches lues · effets extraits à partir de descriptions chinoises (patch de chaque fiche non certifié).`,'quiet'));
 const ranked=hierarchy(last),summary=node('div','');
 summary.appendChild(node('h4','Profils de dégâts : importance probable et incertitudes'));
 const table=document.createElement('div');table.style.cssText='display:grid;gap:9px;margin:10px 0';
 for(const r of ranked){
  const c=node('div','');c.style.cssText='border:1px solid #436472;border-radius:10px;padding:10px';
  c.appendChild(node('strong',r.name+' — '+(r.baselineAvailable?'repère qualitatif':'profil non hiérarchisé')));
  const label=id=>{const x=r.damage[id];const state=tierNames[x.tier]|| (x.mentioned?'mention détectée, poids inconnu':'non confirmé');return state+(x.mentioned?' (sort mentionné)':' (non détecté)');};
  c.appendChild(node('p','Magique : '+label('magic')+' · Physique : '+label('physical')+' · Véritable : '+label('true')));
  c.appendChild(node('p',r.warning,'quiet'));
  if(r.control||r.periodic||r.maxHp)c.appendChild(node('p','Autres effets repérés : '+[r.control?'contrôles':'',r.periodic?'effets périodiques':'',r.maxHp?'références aux PV maximum':''].filter(Boolean).join(' · ')+'. Ces mentions ne mesurent ni leur fréquence ni leur impact.','quiet'));
  if(!r.available)c.appendChild(node('p','Fiche inaccessible : analyse non vérifiable.','quiet'));
  table.appendChild(c);
 }
 summary.appendChild(table);
 const dominant=(type)=>ranked.filter(r=>['primary','important'].includes(r.damage[type].tier)).map(r=>r.name);
 const secondary=(type)=>ranked.filter(r=>['secondary','minor','conditional','unknown'].includes(r.damage[type].tier)&&r.damage[type].mentioned).map(r=>r.name);
 const magical=dominant('magic'),physical=dominant('physical'),trueNames=ranked.filter(r=>r.damage.true.mentioned).map(r=>r.name);
 summary.appendChild(node('h4','Conséquences défensives pour Galio'));
 summary.appendChild(node('p','Dégâts magiques dominants ou importants (repères) : '+(magical.join(', ')||'aucun profil hiérarchisé')+'. Les autres mentions magiques ne suffisent pas à recommander davantage de RM.'));
 summary.appendChild(node('p','Dégâts physiques dominants ou importants (repères) : '+(physical.join(', ')||'aucun profil hiérarchisé')+'. Ne pas ignorer les attaques automatiques, particulièrement celles des tireurs.'));
 if(trueNames.length)summary.appendChild(node('p','Dégâts véritables mentionnés : '+trueNames.join(', ')+'. Ni armure ni RM ne réduisent directement ces dégâts ; il faut vérifier leur condition de déclenchement.'));
 const cc=ranked.filter(r=>r.control).map(r=>r.name);
 if(cc.length)summary.appendChild(node('p','Contrôles mentionnés : '+cc.join(', ')+'. Le choix de ténacité, de protection ou de positionnement dépend du type de contrôle.'));
 summary.appendChild(node('p','Objets situationnels : évaluer la RM contre les menaces magiques dominantes, l’armure contre les menaces physiques dominantes, et la survie/positionnement contre les contrôles et dégâts véritables. Aucun objet n’est classé ou ajouté automatiquement par ce module.','quiet'));
 summary.appendChild(node('p','Builds adverses : non pris en compte dans cette hiérarchie. Un build AP, tank ou hybride peut modifier la dominante réelle. Les builds observés, leurs postes et leurs patchs doivent être rapprochés du catalogue d’objets avant tout pondération.','quiet'));
 summary.appendChild(node('p','Méthode : les mentions proviennent des descriptions chinoises du kit ; les dominantes probables proviennent de repères qualitatifs explicitement séparés. Elles ne sont ni des pourcentages, ni des taux de victoire, ni des mesures de dégâts de ce match.','quiet'));
 out.appendChild(summary);
 for(const c of last){const d=document.createElement('details');d.className='ch';d.appendChild(node('summary',c.name+(c.result?' · '+c.result.descriptionCount+'/'+c.result.skills.length+' descriptions · '+c.result.signals.length+' types détectés':' · échec de lecture')));if(c.error){d.appendChild(node('p',c.error));out.appendChild(d);continue;}d.appendChild(node('p','Version interne de fiche : '+c.result.sourceVersion+'. Une mention dans un sort ne représente pas une proportion de dégâts.','quiet'));
 if(!c.result.signals.length)d.appendChild(node('p','Aucun mot-clé reconnu. Cela ne prouve pas l’absence de menace.'));
 for(const signal of c.result.signals){const detail=document.createElement('details');detail.appendChild(node('summary',signal.label+' — '+signal.skills.join(', ')));for(const hit of signal.evidence){detail.appendChild(node('p',hit.slot+' : '+hit.evidence));detail.appendChild(node('p',hit.qualifier,'quiet'));}d.appendChild(detail);}out.appendChild(d);}
 out.appendChild(node('p','Interprétation lexicale indicative. Un texte peut mentionner la réduction de dégâts reçus, un bonus conditionnel ou des dégâts liés à un objet. Les compétences à plusieurs formes, les ratios, les passifs et les mises à jour de patch nécessitent encore une validation.','quiet'));
 };
 async function analyze(force=false){const picks=selections();const sig=picks.map(x=>x.id).join(',');if(!picks.length){out.textContent='Sélectionne les adversaires dans la draft.';return;}if(busy||(!force&&sig===signature&&last.length))return;busy=true;run.disabled=true;out.textContent='Lecture des kits adverses…';try{last=await Promise.all(picks.map(async c=>{try{return {...c,result:infer(await get(SOURCE+'/api/champion/'+encodeURIComponent(c.id)+'.json'))}}catch(e){return {...c,error:String(e)}}}));signature=sig;render();}finally{busy=false;run.disabled=false;}}
 run.addEventListener('click',()=>analyze(true));const main=document.getElementById('simpleRun');if(main)main.addEventListener('click',()=>analyze(false));
 root.WRDIChampionThreatsV125={infer,detectSkill,interpret,analyze,getLastAudit:()=>last,version:VERSION,hierarchy,baselines:BASELINES};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=='undefined'?window:globalThis);
