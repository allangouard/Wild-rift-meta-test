/* WRDI V15.1 — standalone, accessible lane-first Wild Rift champion picker.
 * Only identity, portrait, lanes and classes; never influences item scores.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_ChampionPickerV151=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LANES=['Top','Jungle','Mid','ADC','Support','Tous'];
const CLASSES=['Toutes','Tank','Combattant','Assassin','Mage','Tireur','Support'];
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
function filter(champions,{lane='Tous',roleClass='Toutes',query=''}={}){
 const q=normal(query).trim();
 return champions.filter(c=>(lane==='Tous'||c.lanes?.includes(lane))&&
  (roleClass==='Toutes'||c.classes?.includes(roleClass))&&
  (!q||normal(c.name).includes(q)))
  .sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}
function init({getChampions,getPicks,onSelect}={}){
 if(typeof document==='undefined'||typeof getChampions!=='function'||typeof getPicks!=='function'||typeof onSelect!=='function')
  return {ok:false,reason:'Picker dependencies missing'};
 const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const overlay=mk('div','wrdi-picker-overlay');overlay.id='wrdiChampionPicker';
 overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
 const backdrop=mk('div','wrdi-picker-backdrop');
 const sheet=mk('section','wrdi-picker-sheet');sheet.setAttribute('role','dialog');
 sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','wrdiPickerTitle');
 const handle=mk('div','wrdi-picker-handle');
 const head=mk('div','wrdi-picker-header');
 const heading=mk('div');heading.append(mk('p','wrdi-picker-overline','SÉLECTION DE CHAMPION'),mk('h2',null,'Choisir un champion'));heading.querySelector('h2').id='wrdiPickerTitle';
 const close=mk('button','wrdi-picker-close','✕');close.type='button';close.setAttribute('aria-label','Fermer la sélection');
 head.append(heading,close);
 const search=mk('input','wrdi-picker-search');search.type='search';search.placeholder='Rechercher un champion…';
 search.setAttribute('aria-label','Rechercher un champion');search.autocomplete='off';
 const laneHeading=mk('p','wrdi-picker-label','LANE'),laneRow=mk('div','wrdi-picker-filters');
 const classHeading=mk('p','wrdi-picker-label','CLASSE (FACULTATIF)'),classRow=mk('div','wrdi-picker-filters');
 const count=mk('div','wrdi-picker-count'),grid=mk('div','wrdi-picker-grid');
 const scroll=mk('div','wrdi-picker-scroll');
 scroll.append(laneHeading,laneRow,classHeading,classRow,count,grid);
 const top=mk('div','wrdi-picker-sticky');top.append(handle,head,search);
 sheet.append(top,scroll);overlay.append(backdrop,sheet);document.body.append(overlay);
 let slot=-1,lane='Mid',roleClass='Toutes',query='',previousFocus=null;
 const visible=()=>!overlay.hidden;
 function renderFilters(){
  for(const [row,options,current,update] of [
   [laneRow,LANES,lane,v=>{lane=v;}],
   [classRow,CLASSES,roleClass,v=>{roleClass=v;}]
  ]){
   row.replaceChildren();
   for(const value of options){
    const button=mk('button','wrdi-filter-chip'+(current===value?' active':''),value);
    button.type='button';button.setAttribute('aria-pressed',String(current===value));
    button.addEventListener('click',()=>{update(value);renderFilters();renderCards();});
    row.append(button);
   }
  }
 }
 function portrait(champion,cls){
  const wrap=mk('span','wrdi-portrait '+cls);
  const letters=mk('span','wrdi-portrait-fallback',champion.name.slice(0,2).toLocaleUpperCase('fr'));
  wrap.append(letters);
  if(champion.portrait&&/^https:\/\//.test(champion.portrait)){
   const img=mk('img');img.alt='';img.loading='lazy';img.decoding='async';img.src=champion.portrait;
   img.addEventListener('load',()=>{wrap.classList.add('ready');});
   img.addEventListener('error',()=>img.remove());
   wrap.append(img);
  }
  return wrap;
 }
 function renderCards(){
  const all=getChampions(),matched=filter(all,{lane,roleClass,query});
  const picks=getPicks();
  count.textContent=matched.length+' champion'+(matched.length>1?'s':'')+' · '+(lane==='Tous'?'Toutes les lanes':lane);
  grid.replaceChildren();
  for(const c of matched){
   const occupied=picks.findIndex((id,i)=>String(id)===String(c.id)&&i!==slot);
   const taken=occupied>=0;
   const b=mk('button','wrdi-champion-card'+(taken?' is-taken':''));b.type='button';
   b.disabled=taken;
   b.setAttribute('aria-label',c.name+(taken?' déjà sélectionné':''));
   b.append(portrait(c,'card-portrait'),mk('strong','wrdi-champion-name',c.name),
    mk('span','wrdi-champion-sub',c.classes.join(' · ')));
   if(taken)b.append(mk('span','wrdi-champion-tag','Déjà choisi'));
   b.addEventListener('click',()=>{const position=slot;hide();onSelect(position,String(c.id));});
   grid.append(b);
  }
  if(!matched.length)grid.append(mk('p','wrdi-picker-empty','Aucun champion dans cette sélection. Change de lane ou utilise « Tous ».'));
 }
 function show(slotIndex){
  if(!Number.isInteger(slotIndex)||slotIndex<0||slotIndex>9||slotIndex===2)return false;
  slot=slotIndex;lane=LANES[slotIndex%5];roleClass='Toutes';query='';
  previousFocus=document.activeElement;overlay.hidden=false;
  overlay.setAttribute('aria-hidden','false');document.body.classList.add('wrdi-picker-open');
  search.value='';renderFilters();renderCards();scroll.scrollTop=0;
  close.focus({preventScroll:true});return true;
 }
 function hide(){
  if(!visible())return;
  overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
  document.body.classList.remove('wrdi-picker-open');slot=-1;
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 }
 close.addEventListener('click',hide);backdrop.addEventListener('click',hide);
 search.addEventListener('input',()=>{query=search.value;renderCards();scroll.scrollTop=0;});
 document.addEventListener('keydown',event=>{if(visible()&&event.key==='Escape'){event.preventDefault();hide();}});
 return {ok:true,show,hide,refresh:()=>{if(visible())renderCards()},portrait,filter,LANES,CLASSES};
}
return Object.freeze({VERSION:'15.1.0',LANES,CLASSES,filter,init});
});
