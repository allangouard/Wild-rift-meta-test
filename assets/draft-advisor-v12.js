/* Wild Rift Draft Intelligence V12 — première liaison à la draft.
   Conseils conditionnels, NON optimisation démontrée. Aucun appel LoL PC.
   Utilise l'inventaire en jeu 7.3d et les restrictions confirmées.
*/
(function (root) {
  'use strict';
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]/g, '');
  const have = (a, f) => a.some(x => x.flags.includes(f));
  function validate(ids, restrictions) {
    const chosen = ids.filter(Boolean), problems = [];
    if (new Set(chosen).size !== chosen.length) problems.push('Objet présent plusieurs fois');
    for (const g of restrictions.groups || []) {
      const matching = chosen.filter(x => g.members.includes(x));
      if (matching.length > (g.max || 1)) problems.push(`${g.label_fr} : ${matching.join(', ')}`);
    }
    for (const pair of restrictions.extra_exclusion_pairs || []) {
      if (pair.every(x => chosen.includes(x))) problems.push(`Incompatibilité : ${pair.join(' + ')}`);
    }
    const active = new Set(restrictions.known_active_item_ids || []);
    if (chosen.filter(x => active.has(x)).length > (restrictions.max_active_items || 1)) problems.push('Plusieurs objets actifs');
    return problems;
  }
  function analyze(own, enemies, profileMap, catalog, restrictions) {
    const known = [], unknown = [];
    for (const c of enemies.filter(Boolean)) {
      const name = typeof c === 'string' ? c : (c.name || c.id || '');
      const id = typeof c === 'string' ? c : (c.id || c.name || '');
      const flags = profileMap[normalize(id)] || profileMap[normalize(name)];
      if (Array.isArray(flags)) known.push({name, flags});
      else unknown.push(name);
    }
    const count = flag => known.filter(x => x.flags.includes(flag)).length;
    const signals = {ap:count('ap'),ad:count('ad'),tank:count('tank'),heal:count('heal')+count('sustain'),shield:count('shield'),crit:count('crit'),cc:count('cc'),assassin:count('assassin'),burn:count('burn')};
    const byId = new Map((catalog.items || []).map(x => [x.id,x]));
    const choices = [];
    const add = (id, why, priority) => {if (byId.has(id) && !choices.some(x=>x.id===id)) choices.push({id, why, priority});};
    const ownNorm = normalize(own.id || own.name || own);
    if (ownNorm === 'galio') {
      add('riftmaker','PV, puissance et dégâts prolongés (effets partiellement simulés)',80);
      if (signals.ap >= 2 || signals.burn >= 1) add('hollow_radiance','résistance magique et dégâts de proximité',75);
      if (signals.ad >= 2 || signals.crit >= 1) add('unending_despair','résistances mixtes et survie au contact',72);
      if (signals.tank >= 2) add('bloodletters_curse','réduction progressive de RM si plusieurs impacts magiques',83);
      else add('void_staff','pénétration magique ; intérêt dépend de la RM réellement achetée',64);
      if (signals.heal >= 1) add('morellonomicon','anti-soins contre les champions identifiés comme soigneurs',86);
      if (signals.shield >= 1) add('oceanids_trident','réduction des boucliers contre les protections adverses',85);
      if (signals.crit >= 2) add('randuins_omen','protection contre les coups critiques',86);
      if (signals.ap >= 3) add('force_of_nature','résistance aux dégâts magiques répétés',82);
      if (signals.ad >= 3) add('thornmail','armure contre une forte menace physique',82);
      if (signals.cc >= 3) add('banshees_veil','protection contre un sort engageant, si applicable',66);
      add('rabadons_deathcap','puissance brute, si la survie est suffisante',60);
      add('unending_despair','résistances mixtes et combat prolongé au contact',51);
      add('hollow_radiance','résistance magique et dégâts de proximité',49);
      add('liandrys_torment','pression magique en combat prolongé',48);
    }
    choices.sort((a,b)=>b.priority-a.priority);
    const selected = [], alternates = [];
    for (const item of choices) {
      if (validate([...selected.map(x=>x.id),item.id],restrictions).length) {alternates.push({...item,excluded:true});continue;}
      if (selected.length < 5) selected.push(item); else alternates.push(item);
    }
    const equipmentValid = validate(selected.map(x=>x.id),restrictions);
    return {own:ownNorm, picked:enemies.filter(Boolean).length,known,unknown,signals,selected,alternates,equipmentValid,byId};
  }
  root.WRDIDraftAdvisorV12 = {analyze,validate,normalize};
  if (typeof document === 'undefined') return;
  function start() {
    const draftSection = document.querySelector('#simpleApp .simple-card');
    if (!draftSection || document.getElementById('wrdiV12DraftAdvisor')) return;
    const box = document.createElement('div');
    box.className='panel'; box.id='wrdiV12DraftAdvisor';
    box.innerHTML='<h2>🎯 Assistant de draft V12 — première intégration</h2>'+
      '<p class="muted">Récupère automatiquement les champions déjà sélectionnés. Conseils conditionnels pour <b>Galio mid</b> seulement ; pas encore un classement optimal ni des runes validées.</p>'+
      '<button type="button" id="wrdiV12Analyze">Analyser ma draft</button><div id="wrdiV12Result" aria-live="polite" style="margin-top:12px"></div>';
    draftSection.insertBefore(box,draftSection.children[1] || null);
    const out=document.getElementById('wrdiV12Result');
    const renderItem=(entry,data)=>{
      const item=data.byId.get(entry.id), price=Number.isFinite(item.price_gold)? `${item.price_gold} PO`:'prix non confirmé';
      const image=document.createElement('img');image.src='./assets/item-icons/'+item.id+'.webp';image.alt='';image.loading='lazy';image.width=44;image.height=44;
      image.onerror=()=>{image.style.display='none'};
      const row=document.createElement('div');row.style.cssText='display:flex;gap:10px;align-items:center;border-bottom:1px solid #45636b;padding:8px 0';
      row.appendChild(image);
      const text=document.createElement('div');
      const strong=document.createElement('strong');strong.textContent=item.name_fr;
      const desc=document.createElement('div');desc.className='muted';desc.textContent=entry.why+' · '+price;
      text.append(strong,desc);row.appendChild(text);return row;
    };
    document.getElementById('wrdiV12Analyze').onclick=async()=>{
      out.textContent='Lecture des données client…';
      try {
        const [items,restrictions]=await Promise.all(['./data/items-client-7.3d-v12.json','./data/item-restrictions-client-7.3d-v12.json'].map(async url=>{
          const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error(url+' : HTTP '+r.status);return r.json();
        }));
        const picks=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]');
        if(!Array.isArray(picks)||picks.length!==10)throw Error('Aucune draft enregistrée dans cette version de l’application.');
        const list=typeof champions!=='undefined'?champions:[];
        const resolve=id=>{const c=list.find(x=>x.id===id);return {id,name:c?.name||id}};
        const our=picks[2]?resolve(picks[2]):{id:''}, enemy=picks.slice(5).filter(Boolean).map(resolve);
        const base=typeof threatProfiles!=='undefined'?threatProfiles:{};
        const profiles={};for(const [k,v] of Object.entries(base))profiles[normalize(k)]=v;
        const result=analyze(our,enemy,profiles,items,restrictions);
        out.replaceChildren();
        const p=t=>{const e=document.createElement('p');e.className='muted';e.textContent=t;out.appendChild(e)};
        if(!our.id){p('Sélectionne ton champion mid dans la draft (troisième case alliée).');return}
        if(result.own!=='galio'){p('Champion sélectionné : '+our.name+'. Les règles de construction détaillées ne sont pas encore validées pour ce champion. Aucun build inventé.');return}
        p(`Adversaires sélectionnés : ${result.picked}/5 · profils reconnus : ${result.known.length}/5.`);
        if(result.picked<5)p('Draft incomplète : les propositions évolueront une fois les cinq adversaires choisis.');
        if(result.unknown.length)p('Profil non reconnu : '+result.unknown.join(', ')+' ; ces champions ne comptent pas dans les signaux.');
        const sig=result.signals;p(`Signaux indicatifs (catégories pouvant se recouper) : ${sig.ap} magie · ${sig.ad} physique · ${sig.tank} tanks · ${sig.heal} soins/sustain · ${sig.shield} boucliers · ${sig.crit} critiques · ${sig.cc} contrôles.`);
        const h=document.createElement('h3');h.textContent='5 objets candidats (ordre provisoire, non ordre d’achat)';out.appendChild(h);
        result.selected.forEach(x=>out.appendChild(renderItem(x,result)));
        const remain=document.createElement('p');remain.className='muted';remain.textContent='Le 6e objet, les bottes et les runes restent à déterminer. Les données de champions et les passifs ne suffisent pas encore à garantir le meilleur choix.';out.appendChild(remain);
        if(result.alternates.length){const a=document.createElement('h3');a.textContent='Options situationnelles / remplacements possibles';out.appendChild(a);result.alternates.slice(0,6).forEach(x=>out.appendChild(renderItem(x,result)))}
        p(result.equipmentValid.length?'Attention : '+result.equipmentValid.join(' ; '):'Restrictions du client vérifiées : aucune incompatibilité détectée parmi les cinq propositions.');
        p('Cette présélection repose sur des tags de menaces et des règles explicites. Elle ne simule pas encore les dix kits, le niveau de partie, les builds adverses ni la valeur précise des passifs.');
      }catch(err){out.textContent='Analyse indisponible : '+err.message+' . Vérifie les fichiers de données et la connexion.'}
    };
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})(typeof window!=='undefined'?window:globalThis);
