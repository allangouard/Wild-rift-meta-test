/* Wild Rift Draft Intelligence V12.4 — audit des menaces depuis les kits.
 * Wild Rift mobile uniquement. Extraction indicative de texte chinois, PAS simulation.
 * Ne remplace pas les recommandations ou les règles d'objets existantes.
 */
(function(){
  'use strict';
  const VERSION='12.4', SOURCE='https://wrchina.gg';
  const PATTERNS=[
    {id:'magic', label:'Dégâts magiques',rx:/魔法伤害|魔法傷害/g},
    {id:'physical',label:'Dégâts physiques',rx:/物理伤害|物理傷害/g},
    {id:'true',label:'Dégâts véritables',rx:/真实伤害|真實傷害/g},
    {id:'stun',label:'Étourdissement',rx:/眩晕|暈眩|晕眩/g},
    {id:'knockup',label:'Projection',rx:/击飞|擊飛/g},
    {id:'root',label:'Immobilisation',rx:/禁锢|禁錮/g},
    {id:'slow',label:'Ralentissement',rx:/减速|減速/g},
    {id:'shield',label:'Bouclier',rx:/护盾|護盾/g},
    {id:'heal',label:'Soin / récupération de PV',rx:/治疗|治療|回复生命值|回復生命值|恢复生命值|恢復生命值/g},
    {id:'maxhp',label:'Référence aux PV max',rx:/最大生命值|最大生命/g},
    {id:'overtime',label:'Effet périodique (« par seconde »)',rx:/每秒/g},
    {id:'dash',label:'Déplacement / dash',rx:/冲刺|衝刺|位移|突进|突進/g}
  ];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function text(x){if(typeof x==='string')return x;if(typeof x==='number')return String(x);return '';}
  function abilities(raw){
    const a=raw?.abilities||raw?.skills||[];
    const arr=Array.isArray(a)?a:Object.entries(a).map(([slot,v])=>({...v,slot}));
    return arr.map((v,i)=>{
      const r=v?.raw||{};
      const slot=text(v?.slot||v?.key||v?.slot_name||(['P','Q','W','E','R'][i]||'?'));
      const desc=text(r.desc_cn||v?.desc_cn||r.description_cn||v?.description_cn||v?.desc||v?.description);
      const name=text(r.name_cn||v?.name_cn||v?.name||slot);
      return {slot,name,descriptionPresent:!!desc.trim(),description:desc};
    });
  }
  function infer(raw){
    const skills=abilities(raw), signals=[];
    for(const p of PATTERNS){
      const found=[];
      for(const s of skills){if(!s.descriptionPresent)continue;p.rx.lastIndex=0;if(p.rx.test(s.description))found.push(s.slot);}
      if(found.length)signals.push({id:p.id,label:p.label,skills:found,confidence:'mention dans une description source ; condition et importance non évaluées'});
    }
    return {skills,signals,sourceVersion:text(raw?.version)||'non indiquée'};
  }
  async function fetchJson(url){const c=new AbortController();const t=setTimeout(()=>c.abort(),14000);try{const r=await fetch(url,{signal:c.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}finally{clearTimeout(t)}}
  function selections(){
    const extract=(container,start)=>[...document.querySelectorAll('#'+container+' [data-simple-slot]')].map(b=>{
      const slot=Number(b.dataset.simpleSlot);
      const n=b.querySelector('.slot-text'),r=b.querySelector('.slot-role');
      const label=n?n.textContent.replace(r?.textContent||'','').trim():'';
      return {slot,id:'',name:label==='Choisir…'?'':label,side:start===0?'allie':'adversaire'};
    });
    let ids=[];try{ids=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]')}catch(e){}
    const visible=[...extract('simpleAllies',0),...extract('simpleEnemies',5)];
    return visible.map(c=>({...c,id:String(ids[c.slot]||'')})).filter(c=>c.id&&c.name);
  }
  function detailProfile(c,result){
    const signals=result.signals;
    const info=signals.length?signals.map(s=>'<li><strong>'+esc(s.label)+'</strong> — sort(s) '+esc(s.skills.join(', '))+'</li>').join(''):'<li>Aucun terme reconnu dans les descriptions disponibles. Cela ne prouve pas l’absence d’une menace.</li>';
    const coverage=result.skills.filter(x=>x.descriptionPresent).length;
    return '<details class="wrdi124-champion"><summary>'+esc(c.name)+' · '+coverage+'/'+result.skills.length+' descriptions · '+signals.length+' signaux</summary>'+ 
      '<p class="wrdi124-muted">Fiche source : '+esc(result.sourceVersion)+' · rôle dans la draft : '+esc(c.side)+' · identification lexicale non vérifiée comme calcul d’impact.</p><ul>'+info+'</ul>'+ 
      '<details><summary>Voir les preuves par compétence</summary>'+result.skills.map(s=>'<p><b>'+esc(s.slot)+' — '+esc(s.name)+'</b> : '+(s.descriptionPresent?esc(s.description):'Description absente')+'</p>').join('')+'</details></details>';
  }
  const css='#wrdi124{margin-top:16px;padding:14px;border:1px solid #456474;border-radius:16px;background:#102736;color:#e4eef6}#wrdi124 h3{margin:0 0 8px}#wrdi124 p{line-height:1.5}#wrdi124 .wrdi124-muted{color:#aac0d0;font-size:13px}#wrdi124 .wrdi124-champion{border:1px solid #375367;border-radius:12px;padding:10px;margin:10px 0}#wrdi124 summary{cursor:pointer;font-weight:700}#wrdi124 li{margin:7px 0}#wrdi124 button{padding:10px;border:1px solid #3b958c;border-radius:9px;background:#146f68;color:white;font-weight:700}';
  function init(){
    const host=document.getElementById('simpleApp');if(!host||document.getElementById('wrdi124'))return;
    const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    const box=document.createElement('section');box.id='wrdi124';box.hidden=true;
    box.innerHTML='<h3>🔍 Menaces déduites des compétences — V12.4</h3><p class="wrdi124-muted">Lecture des descriptions de Wild Rift. Les mentions trouvées ne déterminent ni le type de build réellement acheté ni la part des dégâts subis.</p><button id="wrdi124-run" type="button">Analyser les kits adverses</button><div id="wrdi124-out" aria-live="polite"></div>';
    // Inséré dans la zone de draft existante, pas comme un quatrième grand module.
    const section=host.querySelector('.simple-card');if(section)section.appendChild(box);else host.appendChild(box);
    const out=box.querySelector('#wrdi124-out');let data=[],running=false;
    box.querySelector('#wrdi124-run').addEventListener('click',async()=>{
      if(running)return;const picks=selections().filter(x=>x.side==='adversaire');
      if(!picks.length){out.textContent='Sélectionne des adversaires dans la draft.';return}
      running=true;out.textContent='Lecture des compétences adverses…';
      try{
        const results=await Promise.all(picks.map(async c=>{try{const raw=await fetchJson(SOURCE+'/api/champion/'+encodeURIComponent(c.id)+'.json');return {...c,result:infer(raw)}}catch(e){return {...c,error:String(e)}}}));
        data=results;
        let html='<p class="wrdi124-muted">'+results.filter(x=>x.result).length+'/'+picks.length+' fiches accessibles. Le module ne remplace pas encore le score d’objets de V12.</p>';
        const amumu=results.find(x=>x.name.toLowerCase()==='amumu');
        if(amumu?.result){const x=amumu.result.signals.map(s=>s.id);html+='<p><b>Contrôle Amumu :</b> '+(x.includes('magic')?'dégâts magiques mentionnés':'dégâts magiques non détectés')+' ; '+(x.includes('true')?'dégâts véritables mentionnés':'dégâts véritables non détectés')+' ; '+(x.includes('stun')?'étourdissements mentionnés':'étourdissements non détectés')+'. La classe Tank ne suffit donc pas à décrire son kit.</p>'}
        for(const c of results){html+=c.error?'<p>⚠ '+esc(c.name)+' : '+esc(c.error)+'</p>':detailProfile(c,c.result)}
        html+='<p class="wrdi124-muted">Prudence : texte source parfois ancien (fiche 7.3 vs index plus récent), chinois non traduit, regex susceptibles de manquer des synonymes ou de relever une condition. Aucun pourcentage de dégâts physiques/magiques n’est estimé. Les menaces ne changent pas encore les builds recommandés.</p>';
        out.innerHTML=html;
      }finally{running=false}
    });
    // Unification non intrusive : afficher dans l'onglet Menaces existant.
    const isThreatButton=b=>b.tagName==='BUTTON'&&/menaces/i.test(b.textContent||'');
    function wire(){const all=[...host.querySelectorAll('button')];for(const b of all){if(!isThreatButton(b)||b.dataset.wrdi124Wired)return;b.dataset.wrdi124Wired='1';b.addEventListener('click',()=>{box.hidden=false;},false)}
      for(const b of all){if(!/\bBuild\b|Champions/i.test(b.textContent||'')||b.dataset.wrdi124Other)return;b.dataset.wrdi124Other='1';b.addEventListener('click',()=>{box.hidden=true},false)}
    }
    wire();const observer=new MutationObserver(wire);observer.observe(host,{subtree:true,childList:true});
    // En cas de réorganisation de l'interface, le diagnostic reste accessible via l'onglet Menaces.
    window.WRDIChampionThreatsV124={infer,readDraft:selections,getLastAudit:()=>data};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
