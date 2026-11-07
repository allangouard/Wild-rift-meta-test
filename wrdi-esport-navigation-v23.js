/* WRDI Esport Premium — home / draft / local history navigation */
(function(){
'use strict';
const main=document.getElementById('wrdi-v15');
const draft=main?.querySelector('section[aria-label="Saisie de la draft"]');
const result=document.getElementById('wrdi-result');
if(!main||!draft||!result)return;
const HISTORY_KEY='wrdi_v159_history';
const m=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const views={};
const home=m('section','ep-page ep-home');
const draftPage=m('section','ep-page ep-draft-page');
const history=m('section','ep-page ep-history');
home.id='ep-home';draftPage.id='ep-draft';history.id='ep-history';
draft.before(home);
draftPage.append(draft,result);
main.append(draftPage,history);
home.innerHTML='<div class="ep-welcome"><span class="ep-overline">WILD RIFT DRAFT INTELLIGENCE</span><h2>Prépare ta prochaine victoire.</h2><p>Construis ta composition, comprends tes choix de builds et reprends tes dernières analyses.</p></div>';
const actions=m('div','ep-home-actions');
const start=m('button','primary ep-home-start','⚔ Nouvelle analyse');
const resume=m('button','secondary ep-home-resume','↪ Reprendre ma draft');
start.type='button';resume.type='button';
actions.append(start,resume);home.append(actions);
const recentSection=m('section','ep-home-recents');
recentSection.append(m('h3',null,'Dernières analyses'));
const recentList=m('div','ep-history-list');recentSection.append(recentList);
home.append(recentSection);
history.append(m('span','ep-overline','ARCHIVES LOCALES'),m('h2',null,'Historique des drafts'));
history.append(m('p','ep-history-help','Les compositions analysées sont enregistrées sur cet appareil (20 maximum). Ouvrir une draft relance une nouvelle analyse, sans réutiliser d’anciens résultats.'));
const historyList=m('div','ep-history-list');history.append(historyList);
const erase=m('button','ep-history-erase','Effacer l’historique');
erase.type='button';history.append(erase);

const nav=m('nav','ep-bottom-nav');
nav.setAttribute('aria-label','Navigation principale');
const tabs=[['home','⌂','Accueil'],['draft','⚔','Draft'],['history','◷','Historique']];
const buttons={};
for(const [id,glyph,label] of tabs){
 const button=m('button','ep-nav-button');
 button.type='button';
 button.append(m('span','ep-nav-icon',glyph),m('span','ep-nav-label',label));
 button.addEventListener('click',()=>show(id));
 nav.append(button);buttons[id]=button;
}
document.body.append(nav);
function readHistory(){
 try{const a=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(a)?a.filter(x=>Array.isArray(x.picks)&&x.picks.length===10).slice(0,20):[]}
 catch{return []}
}
function preview(entry){
 const names=Array.isArray(entry.names)?entry.names:[];
 return names.slice(0,5).filter(Boolean).join(' · ')||'Composition sans noms enregistrés';
}
function createHistoryRow(entry){
 const item=m('article','ep-history-card');
 const date=new Date(entry.at);
 const dateLabel=Number.isNaN(date.getTime())?'Date inconnue':date.toLocaleString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
 item.append(m('span','ep-history-date',dateLabel+(entry.patch?' · Patch '+entry.patch:'')));
 item.append(m('strong','ep-history-teams',preview(entry)));
 const enemies=Array.isArray(entry.names)?entry.names.slice(5).filter(Boolean).join(' · '):'';
 if(enemies)item.append(m('span','ep-history-opponents','Contre : '+enemies));
 const load=m('button','ep-history-load','Reprendre cette composition');
 load.type='button';
 load.addEventListener('click',()=>{
  window.dispatchEvent(new CustomEvent('wrdi:restore-draft',{detail:{picks:entry.picks}}));
  show('draft');
  document.getElementById('ep-draft')?.scrollIntoView({block:'start',behavior:'instant'});
 });
 item.append(load);return item;
}
function renderHistory(){
 const items=readHistory();
 recentList.replaceChildren();
 historyList.replaceChildren();
 if(!items.length){
  recentList.append(m('p','ep-history-empty','Tes analyses apparaîtront ici après un calcul réussi.'));
  historyList.append(m('p','ep-history-empty','Aucune analyse enregistrée pour le moment.'));
 }else{
  items.slice(0,3).forEach(e=>recentList.append(createHistoryRow(e)));
  items.forEach(e=>historyList.append(createHistoryRow(e)));
 }
 erase.hidden=!items.length;
}
function show(id){
 for(const [name,view] of Object.entries(views)){view.hidden=name!==id;}
 for(const [name,button] of Object.entries(buttons)){
  const active=name===id;
  button.classList.toggle('active',active);
  if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
 }
 if(id==='history'||id==='home')renderHistory();
 window.scrollTo({top:0,behavior:'instant'});
}
Object.assign(views,{home,draft:draftPage,history});
start.addEventListener('click',()=>{
 document.getElementById('wrdi-clear')?.click();
 show('draft');
});
resume.addEventListener('click',()=>show('draft'));
erase.addEventListener('click',()=>{
 if(!window.confirm('Effacer les analyses enregistrées sur cet appareil ?'))return;
 try{localStorage.removeItem(HISTORY_KEY)}catch{}
 renderHistory();
});
window.addEventListener('wrdi:history-updated',renderHistory);
renderHistory();
show('draft');
})();
