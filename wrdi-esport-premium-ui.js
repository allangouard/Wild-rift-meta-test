/* WRDI Esport Premium - progressive UX layer. No scoring or recommendation changes. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const draft=document.querySelector('section[aria-label="Saisie de la draft"]');
const grid=draft?.querySelector('.draft-grid'),result=$('wrdi-result');
if(!draft||!grid||!result)return;

const header=make('div','ep-draft-head');
const labels=make('div','ep-draft-head-labels');
labels.append(make('span','ep-overline','DRAFT CENTER'),make('strong','ep-draft-progress','Préparation de la composition'));
const progress=make('span','ep-progress-count','1 / 10');
header.append(labels,progress);
grid.before(header);
const track=make('div','ep-progress-track');track.setAttribute('role','progressbar');track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','10');
header.after(track);
const fill=make('span','ep-progress-fill');track.append(fill);
const hint=make('p','ep-progress-hint','Sélectionne les champions alliés et adverses pour commencer.');
track.after(hint);
function updateProgress(){
 const count=document.querySelectorAll('#wrdi-allies .wrdi-slot.selected,#wrdi-enemies .wrdi-slot.selected').length;
 progress.textContent=count+' / 10';
 fill.style.width=(count*10)+'%';
 track.setAttribute('aria-valuenow',String(count));
 hint.textContent=count===10?'Composition complète : tu peux lancer l’analyse.':count+' champion'+(count>1?'s':'')+' sélectionné'+(count>1?'s':'')+' · les cases restantes peuvent être renseignées.';
}
const targets=[$('wrdi-allies'),$('wrdi-enemies')];
const pickObserver=new MutationObserver(updateProgress);
targets.forEach(t=>{if(t)pickObserver.observe(t,{childList:true});});
updateProgress();

function upgradeResult(){
 if(result.querySelector('.ep-result-shell'))return;
 if(!result.querySelector('.build-list')||!result.querySelector('h2'))return;
 const title=result.querySelector('h2').textContent;
 const items=[...result.querySelectorAll('.build-item')];
 const runeName=result.querySelector('.wrdi-rune-keyname')?.textContent||'Rune non disponible';
 const alternatives=result.querySelectorAll('.wrdi-swap-card').length;
 const shell=make('div','ep-result-shell');
 const summary=make('div','ep-result-summary');
 summary.append(make('span','ep-overline','ANALYSE TERMINÉE'),make('h2','ep-result-heading',title));
 const sub=make('p','ep-summary-meta','Build calculé à partir des données disponibles · '+items.length+' objets principaux');
 summary.append(sub);
 const quick=make('section','ep-quick');
 quick.id='ep-quick-panel';
 const intro=make('div','ep-quick-intro');
 intro.append(make('strong',null,'Vue rapide'),make('span',null,'L’essentiel pour préparer la partie'));
 quick.append(intro);
 const itemRow=make('div','ep-item-row');
 items.forEach((item,i)=>{
  const tile=make('div','ep-item-tile');
  const picture=make('span','ep-item-frame');
  const oldImg=item.querySelector('.item-icon');
  if(oldImg){const img=oldImg.cloneNode(true);img.removeAttribute('style');img.addEventListener('error',()=>img.remove());picture.append(img);}
  else picture.append(make('span',null,String(i+1)));
  const number=make('small','ep-item-number',String(i+1));picture.append(number);
  const name=item.querySelector('.item-name')?.textContent||'Objet';
  const label=make('span','ep-item-label',name);label.title=name;
  tile.append(picture,label);itemRow.append(tile);
 });
 quick.append(itemRow);
 const chips=make('div','ep-quick-facts');
 chips.append(make('span','ep-quick-fact','✦ '+runeName),make('span','ep-quick-fact',alternatives+' adaptation'+(alternatives>1?'s':'')));
 quick.append(chips);
 quick.append(make('p','ep-quick-disclaimer','Bottes : non optimisées par cette version du moteur. Le détail conserve les raisons et conditions des cinq objets.'));
 const details=make('section','ep-expert');
 details.id='ep-expert-panel';
 details.hidden=true;
 const existing=[...result.childNodes];
 existing.forEach(node=>details.append(node));
 const switcher=make('div','ep-view-switch');
 const bQuick=make('button','ep-switch active','⚡ Rapide');
 const bExpert=make('button','ep-switch','◎ Expert');
 [bQuick,bExpert].forEach(b=>b.type='button');
 function show(expert){
  quick.hidden=expert;details.hidden=!expert;
  bQuick.classList.toggle('active',!expert);bExpert.classList.toggle('active',expert);
  bQuick.setAttribute('aria-pressed',String(!expert));bExpert.setAttribute('aria-pressed',String(expert));
 }
 bQuick.addEventListener('click',()=>show(false));
 bExpert.addEventListener('click',()=>show(true));
 switcher.append(bQuick,bExpert);
 shell.append(summary,switcher,quick,details);
 result.append(shell);show(false);
}
const resultObserver=new MutationObserver(upgradeResult);
resultObserver.observe(result,{childList:true});
upgradeResult();
})();
