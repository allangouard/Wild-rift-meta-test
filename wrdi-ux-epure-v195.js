/* Esport Premium UI only — V19.5 source. Never reads or changes engine decisions.
   Enhances rendered DOM; all original reporting is preserved in collapsible expert section. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
const result=$('wrdi-result'),draft=document.querySelector('section[aria-label="Saisie de la draft"]');
if(!result||!draft)return;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const sections=()=>[...result.querySelectorAll(':scope > section.result-section')];
const findSection=term=>sections().find(s=>clean(s.querySelector('h3')?.textContent).toLowerCase().includes(term));
const field=(label,value)=>{const b=make('span','ep-field');b.append(make('small',null,label),make('strong',null,value));return b;};
const addDivider=()=>make('div','ep-sep');
function decorateDraft(){
 if(draft.querySelector('.ep-draft-progress'))return;
 const grid=draft.querySelector('.draft-grid');
 if(!grid)return;
 const box=make('div','ep-draft-progress');
 box.innerHTML='<div class="ep-progress-row"><span>COMPOSITION</span><strong id="ep-progress-value">1/10</strong></div><div class="ep-progress-track"><span id="ep-progress-fill"></span></div>';
 grid.before(box);
 const count=()=>{
  const n=draft.querySelectorAll('.wrdi-slot.selected').length;
  const counter=$('ep-progress-value'),fill=$('ep-progress-fill');
  if(counter)counter.textContent=n+'/10';
  if(fill)fill.style.width=(10*n)+'%';
 };
 ['wrdi-allies','wrdi-enemies'].forEach(id=>{const node=$(id);if(node)new MutationObserver(count).observe(node,{childList:true});});
 count();
}
function runeSummary(rune){
 if(!rune)return null;
 const block=make('section','ep-summary-section');
 block.append(make('h3',null,'Runes'));
 const key=rune.querySelector('.wrdi-rune-keystone');
 if(key){const cloned=key.cloneNode(true);block.append(cloned);}
 const grid=rune.querySelector('.wrdi-rune-grid');
 if(grid)block.append(grid.cloneNode(true));
 const detail=make('details','ep-why');
 detail.append(make('summary',null,'Pourquoi ces runes ?'));
 const note=rune.querySelector('.wrdi-rune-note');
 if(note)detail.append(make('p',null,clean(note.textContent)));
 block.append(detail);
 return block;
}
function makeBuild(build){
 if(!build)return null;
 const block=make('section','ep-summary-section');
 block.append(make('h3',null,'Build principal'));
 const cards=make('div','ep-item-grid');
 for(const [i,li] of [...build.querySelectorAll('.build-item')].entries()){
  const card=make('div','ep-build-card');
  const media=make('div','ep-build-media');
  const old=li.querySelector('img.item-icon');
  if(old){const img=make('img');img.src=old.src;img.alt='';img.loading='lazy';img.addEventListener('error',()=>img.classList.add('ep-missing'));media.append(img);}
  else media.append(make('span',null,String(i+1)));
  media.append(make('span','ep-build-number',String(i+1)));
  card.append(media,make('strong','ep-build-name',clean(li.querySelector('.item-name')?.textContent)||'Objet'));
  const d=make('details','ep-item-detail');
  const reason=clean(li.querySelector('.item-text .muted')?.textContent);
  d.append(make('summary',null,'Pourquoi ?'),make('p',null,reason||'Détail disponible dans le rapport complet.'));
  card.append(d);cards.append(card);
 }
 block.append(cards);
 const foot=make('p','ep-footnote','Ordre d’achat établi par le moteur · Appuie sur « Pourquoi ? » pour chaque objet.');
 block.append(foot);return block;
}
function makeBoots(boots){
 if(!boots)return null;
 const paras=[...boots.querySelectorAll('p')].map(p=>clean(p.textContent)).filter(Boolean);
 const block=make('section','ep-summary-section');
 block.append(make('h3',null,'Bottes'));
 const rec=paras.find(p=>p.startsWith('Recommandées :'));
 const list=make('div','ep-boot-list');
 const items=[];
 if(rec)items.push({name:rec.replace(/^Recommandées\s*:\s*/,''),preferred:true,reason:paras[paras.indexOf(rec)+1]||''});
 for(const p of paras.filter(p=>p.startsWith('Alternative :'))){
  const body=p.replace(/^Alternative\s*:\s*/,'');
  const cut=body.indexOf(' — ');
  items.push({name:cut>=0?body.slice(0,cut):body,preferred:false,reason:cut>=0?body.slice(cut+3):''});
 }
 for(const it of items){
  const row=make('div','ep-boot'+(it.preferred?' recommended':''));
  row.append(make('span','ep-boot-icon','🥾'));
  const meta=make('div','ep-boot-meta');meta.append(make('small',null,it.preferred?'RECOMMANDÉES':'ALTERNATIVE'),make('strong',null,it.name));row.append(meta);
  const info=make('details','ep-boot-why');info.append(make('summary',null,'Détails'),make('p',null,it.reason));row.append(info);
  list.append(row);
 }
 if(!items.length)list.append(make('p','ep-footnote','Consulter les choix dans le rapport complet.'));
 block.append(list);return block;
}
function makeSwaps(swaps){
 if(!swaps)return null;
 const block=make('section','ep-summary-section');block.append(make('h3',null,'Adaptations possibles'));
 const originals=[...swaps.querySelectorAll('.wrdi-swap-card')];
 if(!originals.length){block.append(make('p','ep-footnote','Aucun remplacement justifié par les scénarios étudiés.'));return block;}
 for(const old of originals){
  const card=old.cloneNode(true);
  card.querySelectorAll('img').forEach(img=>{img.addEventListener('load',()=>img.parentElement?.classList.add('has-image'));});
  block.append(card);
 }
 return block;
}
function enhance(){
 if(result.querySelector('.ep-result-layout'))return;
 const title=result.querySelector(':scope > h2');
 const build=findSection('build principal');
 if(!title||!build)return;
 const mission=findSection('mission de galio');
 const boots=findSection('bottes');
 const rune=findSection('runes');
 const swaps=findSection('objets situationnels');
 const reliability=findSection('fiabilité des données');
 const threats=findSection('menaces documentées');
 const layout=make('div','ep-result-layout');
 const hero=make('section','ep-result-hero');
 const over=make('span','ep-overline','ANALYSE DE DRAFT');
 hero.append(over,make('h2',null,'Galio · Mid'));
 const missionTitle=clean(mission?.querySelector('h3')?.textContent).replace(/^Mission de Galio\s*·\s*/,'');
 if(missionTitle)hero.append(make('strong','ep-mission',missionTitle));
 const missionWhy=clean(mission?.querySelector('p.muted')?.textContent);
 if(missionWhy)hero.append(make('p','ep-hero-caption',missionWhy));
 const patch=clean(reliability?.querySelector('p.warning')?.textContent);
 if(patch){const d=make('details','ep-source-info');d.append(make('summary',null,'ⓘ Sources et limites'),make('p',null,patch));hero.append(d);}
 layout.append(hero);
 const buildBlock=makeBuild(build);if(buildBlock)layout.append(buildBlock);
 const bootsBlock=makeBoots(boots);if(bootsBlock)layout.append(bootsBlock);
 const runeBlock=runeSummary(rune);if(runeBlock)layout.append(runeBlock);
 const swapsBlock=makeSwaps(swaps);if(swapsBlock)layout.append(swapsBlock);
 if(threats){
  const text=clean(threats.querySelector('p.muted')?.textContent);
  const matches=[...text.matchAll(/(\d+)\s+sources? de (soin sur alliés|soin personnel|dégâts en % PV max)/g)];
  if(matches.length){
   const b=make('section','ep-summary-section ep-threats');b.append(make('h3',null,'Menaces documentées'));
   const row=make('div','ep-stat-row');
   for(const match of matches)row.append(field(match[2],match[1]));
   b.append(row);layout.append(b);
  }
 }
 const report=make('details','ep-full-report');
 report.append(make('summary',null,'Voir le rapport technique complet'));
 const original=make('div','ep-report-content');
 // Keep *all* original DOM text and sections, in the same order, under disclosure.
 while(result.firstChild)original.append(result.firstChild);
 report.append(original);
 layout.append(report);
 result.append(layout);
}
decorateDraft();
const obs=new MutationObserver(enhance);
obs.observe(result,{childList:true});
enhance();
})();
