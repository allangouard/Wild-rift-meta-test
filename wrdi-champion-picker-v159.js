/* WRDI V15.9 — Esport Premium: fast champion picker. UI only, draft scoring unchanged. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_ChampionPickerV151=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LANES=['Top','Jungle','Mid','ADC','Support','Tous'];
const CLASSES=['Toutes','Tank','Combattant','Assassin','Mage','Tireur','Support'];
const FAVORITES_KEY='wrdi_picker_favorites_v159';
const RECENTS_KEY='wrdi_picker_recent_v159';
const normalized=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
function filter(champions,{lane='Tous',roleClass='Toutes',query=''}={}){
 const q=normalized(query).trim();
 return champions.filter(c=>(q||lane==='Tous'||c.lanes?.includes(lane))&&
  (roleClass==='Toutes'||c.classes?.includes(roleClass))&&
  (!q||normalized(c.name).includes(q)))
  .sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function read(key){try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.map(String):[]}catch{return []}}
function save(key,ids){try{localStorage.setItem(key,JSON.stringify(ids))}catch{}}
function init({getChampions,getPicks,onSelect,onClear}={}){
 if(typeof document==='undefined'||typeof getChampions!=='function'||typeof getPicks!=='function'||typeof onSelect!=='function')
  return {ok:false,reason:'Picker dependencies missing'};
 const mk=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const overlay=mk('div','wrdi-picker-overlay ep-picker-overlay');
 overlay.id='wrdiChampionPicker';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
 const backdrop=mk('div','wrdi-picker-backdrop');
 const sheet=mk('section','wrdi-picker-sheet ep-picker-sheet');
 sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','wrdiPickerTitle');
 const top=mk('div','wrdi-picker-sticky ep-picker-sticky');
 const handle=mk('div','wrdi-picker-handle');
 const head=mk('div','wrdi-picker-header');
 const heading=mk('div');
 heading.append(mk('p','wrdi-picker-overline','SÉLECTION RAPIDE'),mk('h2',null,'Choisir un champion'));
 heading.querySelector('h2').id='wrdiPickerTitle';
 const subtitle=mk('p','ep-picker-context','');
 heading.append(subtitle);
 const close=mk('button','wrdi-picker-close','✕');close.type='button';close.setAttribute('aria-label','Fermer');
 head.append(heading,close);
 const searchWrap=mk('div','ep-search-wrap');
 const search=mk('input','wrdi-picker-search');search.type='search';
 search.placeholder='Rechercher un champion…';search.autocomplete='off';search.setAttribute('aria-label','Rechercher un champion');
 const searchClear=mk('button','ep-search-clear','✕');searchClear.type='button';searchClear.setAttribute('aria-label','Effacer la recherche');
 searchWrap.append(search,searchClear);
 top.append(handle,head,searchWrap);
 const scroll=mk('div','wrdi-picker-scroll ep-picker-scroll');
 const filters=mk('div','ep-picker-filter-group');
 const laneHeading=mk('p','wrdi-picker-label','LANE'),laneRow=mk('div','wrdi-picker-filters');
 const classDetails=mk('details','ep-class-details');
 const classHeading=mk('summary',null,'Filtrer par classe');
 const classRow=mk('div','wrdi-picker-filters');
 classDetails.append(classHeading,classRow);
 filters.append(laneHeading,laneRow,classDetails);
 const quick=mk('div','ep-picker-quick');
 const count=mk('div','wrdi-picker-count');
 const grid=mk('div','wrdi-picker-grid ep-picker-grid');
 const listHeading=mk('p','wrdi-picker-label ep-list-heading','CHAMPIONS');
 const remove=mk('button','ep-remove-pick','Retirer le champion de cette case');
 remove.type='button';remove.hidden=true;
 scroll.append(filters,quick,listHeading,count,grid,remove);
 sheet.append(top,scroll);overlay.append(backdrop,sheet);document.body.append(overlay);
 let slot=-1,lane='Tous',roleClass='Toutes',query='',previousFocus=null;
 let favorites=read(FAVORITES_KEY),recents=read(RECENTS_KEY);
 const visible=()=>!overlay.hidden;
 const available=c=>getPicks().findIndex((id,i)=>String(id)===String(c.id)&&i!==slot)<0;
 function portrait(c,cls){
  const wrap=mk('span','wrdi-portrait '+cls);
  wrap.append(mk('span','wrdi-portrait-fallback',c.name.slice(0,2).toLocaleUpperCase('fr')));
  if(c.portrait&&/^https:\/\//.test(c.portrait)){
   const img=mk('img');img.alt='';img.loading='lazy';img.decoding='async';img.src=c.portrait;
   img.addEventListener('load',()=>wrap.classList.add('ready'));
   img.addEventListener('error',()=>img.remove());
   wrap.append(img);
  }
  return wrap;
 }
 function toggleFavorite(id){
  favorites=favorites.includes(id)?favorites.filter(x=>x!==id):[id,...favorites].slice(0,60);
  save(FAVORITES_KEY,favorites);renderCards();
 }
 function choose(c){
  if(!available(c))return;
  recents=[String(c.id),...recents.filter(x=>x!==String(c.id))].slice(0,16);
  save(RECENTS_KEY,recents);
  const position=slot;hide();onSelect(position,String(c.id));
 }
 function card(c,compact=false){
  const wrapper=mk('div','ep-picker-card-wrap'+(compact?' compact':''));
  const taken=!available(c);
  const button=mk('button','wrdi-champion-card'+(taken?' is-taken':''));button.type='button';button.disabled=taken;
  button.setAttribute('aria-label',c.name+(taken?' déjà sélectionné':''));
  button.append(portrait(c,'card-portrait'),mk('strong','wrdi-champion-name',c.name));
  if(!compact)button.append(mk('span','wrdi-champion-sub',(c.classes||[]).join(' · ')));
  if(taken)button.append(mk('span','wrdi-champion-tag','Déjà choisi'));
  button.addEventListener('click',()=>choose(c));
  const fav=mk('button','ep-favorite'+(favorites.includes(String(c.id))?' is-active':''),favorites.includes(String(c.id))?'★':'☆');
  fav.type='button';fav.setAttribute('aria-label',(favorites.includes(String(c.id))?'Retirer des favoris : ':'Ajouter aux favoris : ')+c.name);
  fav.setAttribute('aria-pressed',String(favorites.includes(String(c.id))));
  fav.addEventListener('click',()=>toggleFavorite(String(c.id)));
  wrapper.append(button,fav);return wrapper;
 }
 function renderFilters(){
  laneRow.replaceChildren();classRow.replaceChildren();
  for(const value of LANES){
   const b=mk('button','wrdi-filter-chip'+(value===lane?' active':''),value);
   b.type='button';b.setAttribute('aria-pressed',String(value===lane));
   b.addEventListener('click',()=>{lane=value;renderFilters();renderCards();});
   laneRow.append(b);
  }
  for(const value of CLASSES){
   const b=mk('button','wrdi-filter-chip'+(value===roleClass?' active':''),value);
   b.type='button';b.setAttribute('aria-pressed',String(value===roleClass));
   b.addEventListener('click',()=>{roleClass=value;renderFilters();renderCards();});
   classRow.append(b);
  }
 }
 function quickSection(title,ids,champions){
  const mapped=ids.map(id=>champions.find(c=>String(c.id)===id)).filter(c=>c&&available(c)&&
   (lane==='Tous'||c.lanes?.includes(lane))).slice(0,6);
  if(!mapped.length)return;
  const section=mk('section','ep-quick-section');
  section.append(mk('p','wrdi-picker-label',title));
  const row=mk('div','ep-quick-row');
  mapped.forEach(c=>row.append(card(c,true)));section.append(row);quick.append(section);
 }
 function renderCards(){
  const all=getChampions();
  const matches=filter(all,{lane,roleClass,query});
  const isSearch=!!query.trim();
  quick.replaceChildren();
  if(!isSearch&&roleClass==='Toutes'){
   quickSection('★ FAVORIS',favorites,all);
   quickSection('↺ RÉCENTS',recents.filter(id=>!favorites.includes(id)),all);
  }
  count.textContent=matches.length+' champion'+(matches.length>1?'s':'')+(isSearch?' · Résultats de recherche':' · '+(lane==='Tous'?'Toutes les lanes':lane));
  listHeading.textContent=isSearch?'RÉSULTATS':'CHAMPIONS · '+(lane==='Tous'?'TOUTES LES LANES':lane.toUpperCase());
  grid.replaceChildren();
  matches.forEach(c=>grid.append(card(c)));
  if(!matches.length)grid.append(mk('p','wrdi-picker-empty','Aucun résultat. Essaie un autre nom ou filtre.'));
  searchClear.hidden=!search.value;
 }
 function show(slotIndex){
  if(!Number.isInteger(slotIndex)||slotIndex<0||slotIndex>9||slotIndex===2)return false;
  slot=slotIndex;lane=LANES[slotIndex%5];roleClass='Toutes';query='';
  const side=slotIndex<5?'allié':'adverse',role=LANES[slotIndex%5];
  subtitle.textContent=role+' '+side+' · sélection en un appui';
  previousFocus=document.activeElement;
  overlay.hidden=false;overlay.setAttribute('aria-hidden','false');document.body.classList.add('wrdi-picker-open');
  search.value='';classDetails.open=false;renderFilters();renderCards();scroll.scrollTop=0;
  remove.hidden=!getPicks()[slot]||typeof onClear!=='function';
  close.focus({preventScroll:true});
  return true;
 }
 function hide(){
  if(!visible())return;
  overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('wrdi-picker-open');
  slot=-1;
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 }
 close.addEventListener('click',hide);backdrop.addEventListener('click',hide);
 search.addEventListener('input',()=>{query=search.value;renderCards();scroll.scrollTop=0;});
 searchClear.addEventListener('click',()=>{search.value='';query='';renderCards();search.focus();});
 remove.addEventListener('click',()=>{const i=slot;hide();if(typeof onClear==='function')onClear(i);});
 document.addEventListener('keydown',event=>{
  if(!visible())return;
  if(event.key==='Escape'){event.preventDefault();hide();}
  if(event.key==='Tab'){
   const focusables=[...sheet.querySelectorAll('button:not([disabled]):not([hidden]), input:not([disabled])')].filter(e=>e.getClientRects().length);
   if(!focusables.length)return;
   const first=focusables[0],last=focusables[focusables.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 });
 return {ok:true,show,hide,refresh:()=>{if(visible())renderCards()},portrait,filter,LANES,CLASSES};
}
return Object.freeze({VERSION:'15.9.0',LANES,CLASSES,filter,init});
});
