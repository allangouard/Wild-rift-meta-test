/* Wild Rift Draft Intelligence V15: clean, mobile-first, pregame-only UI.
 * No old calculators, no historical diagnostics or ranked build-fetch path.
 */
(function(){
'use strict';
const SLOT_NAMES=['Top allié','Jungle allié','Galio · Mid','ADC allié','Support allié',
 'Top adverse','Jungle adverse','Mid adverse','ADC adverse','Support adverse'];
const INDEX_URL='https://wrchina.gg/api/data.json';
const STORAGE='wrdi_v15_draft';
const el=(name,cls,text)=>{const n=document.createElement(name);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const $=id=>document.getElementById(id);
const app=$('wrdi-v15'),message=$('wrdi-message'),go=$('wrdi-analyze'),clear=$('wrdi-clear');
const root=window;
const data={champions:{'10099':'Galio'},catalog:null,rules:null,runes:null,ready:false};
const snapshot=()=>{try{const v=JSON.parse(localStorage.getItem(STORAGE)||'null');return Array.isArray(v)&&v.length===10?v.map(String):Array(10).fill('')}catch{return Array(10).fill('')}};
let picks=snapshot(),epoch=0;
picks[2]='10099';
function status(messageText,type='muted'){message.textContent=messageText;message.className='notice '+type;}
const labelText=(id)=>data.champions[id]||('ID '+id);
function makeOptions(select,index){
 select.replaceChildren();
 const empty=el('option',null,'Choisir un champion…');empty.value='';select.append(empty);
 for(const [id,name] of Object.entries(data.champions).sort((a,b)=>a[1].localeCompare(b[1],'fr'))){
  if(index!==2&&id==='10099')continue;
  const opt=el('option',null,name);opt.value=id;select.append(opt);
 }
 select.value=picks[index]||'';
 if(!select.value)picks[index]='';
}
function renderSlots(){
 const allies=$('wrdi-allies'),enemies=$('wrdi-enemies');allies.replaceChildren();enemies.replaceChildren();
 for(let i=0;i<10;i++){
  const target=i<5?allies:enemies,row=el('label','pick'),txt=el('span','pick-label',SLOT_NAMES[i]);
  const select=el('select','champ-select');select.id='wrdi-slot-'+i;
  select.setAttribute('aria-label',SLOT_NAMES[i]);
  if(i===2){const opt=el('option',null,'Galio');opt.value='10099';select.append(opt);select.disabled=true;}
  else makeOptions(select,i);
  select.addEventListener('change',()=>{picks[i]=select.value;localStorage.setItem(STORAGE,JSON.stringify(picks));$('wrdi-result').replaceChildren();status('Draft modifiée. Relance l’analyse pour une nouvelle recommandation.');});
  row.append(txt,select);target.append(row);
 }
 status(data.ready?'Données client chargées. Choisis les champions.':'Lecture du catalogue local et des noms de champions…');
}
function showResults(result){
 const box=$('wrdi-result');box.replaceChildren();
 const headline=el('h2',null,'Recommandation Galio · Mid');box.append(headline);
 const sub=el('p','muted','Wild Rift mobile · Fiches du client '+result.patch+' · Calcul qualitatif avant la partie');
 box.append(sub);
 const main=el('section','result-section'),buildTitle=el('h3',null,'Build principal · 5 objets');
 main.append(buildTitle);
 const ol=el('ol','build-list');
 for(const it of result.build.items){
  const li=el('li','build-item');const title=el('div','item-name',it.name);
  const why=el('p','muted',it.reason);
  const img=el('img','item-icon');img.src='./assets/item-icons/'+encodeURIComponent(it.id)+'.webp';img.alt='';
  img.loading='lazy';img.addEventListener('error',()=>{img.style.display='none'});
  const content=el('div','item-text');content.append(title,why);li.append(img,content);ol.append(li);
 }
 main.append(ol,el('p','caption','Priorité d’achat théorique ; la sélection des cinq objets est distincte de leur ordre. Les bottes ne sont pas encore optimisées.'));
 box.append(main);
 const contingent=el('section','result-section');contingent.append(el('h3',null,'Objets situationnels'));
 if(!result.build.alternatives.length)contingent.append(el('p','muted','Aucun remplacement suffisamment justifié parmi les scénarios testés.'));
 for(const option of result.build.alternatives){
  const div=el('div','alternative');
  div.append(el('strong',null,option.condition),el('p',null,'Remplacer '+option.remove.name+' par '+option.add.name+'.'));
  contingent.append(div);
 }
 box.append(contingent);
 const rune=el('section','result-section');rune.append(el('h3',null,'Runes'));
 if(result.runes.ok){
  rune.append(el('p','item-name',result.runes.page.keystone));
  const names=[...result.runes.page.primary,result.runes.page.secondary];
  const list=el('ul','rune-list');
  names.forEach(name=>list.append(el('li',null,name)));rune.append(list);
  rune.append(el('p','muted',result.runes.reason));
 }else rune.append(el('p','warning',result.runes.reason));
 box.append(rune);
 const notes=el('details','details');notes.append(el('summary',null,'Pourquoi cette recommandation ?'));
 result.draft.notes.forEach(t=>notes.append(el('p','muted',t)));
 notes.append(el('p','muted','Les choix restent heuristiques : aucun taux de victoire ni calcul de dégâts en partie n’est inventé.'));
 box.append(notes);
}
async function fetchJson(url){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),14000);
 try{const r=await fetch(url,{cache:'no-store',signal:ctrl.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}
 finally{clearTimeout(timer);}
}
async function boot(){
 renderSlots();
 try{
  const [catalog,rules,runes,champData]=await Promise.all([
   fetchJson('./data/items-client-7.3d-v12.json'),
   fetchJson('./data/item-restrictions-client-7.3d-v12.json'),
   fetchJson('./data/rune-catalog-client-v14.json'),
   fetchJson(INDEX_URL)
  ]);
  const ci=champData?.champ_index;
  if(!ci||typeof ci!=='object'||Object.keys(ci).length<60)throw Error('Index des champions Wild Rift non exploitable');
  data.champions=Object.fromEntries(Object.entries(ci).map(([id,x])=>[String(id),String(typeof x==='string'?x:(x?.name||x?.en||x?.champion||id))]));
  data.champions['10099']='Galio';
  data.catalog=catalog;data.rules=rules;data.runes=runes;data.ready=true;
  renderSlots();go.disabled=false;
  status('Catalogue client disponible : '+catalog.items?.length+' objets · '+Object.keys(data.champions).length+' champions · runes vérifiées.','good');
 }catch(e){go.disabled=true;status('Données requises indisponibles : '+String(e?.message||e)+'. Aucune recommandation inventée.','warning');}
}
go.addEventListener('click',()=>{
 if(!data.ready)return;
 const token=++epoch;
 const mod={profiles:root.WRDI_ChampionProfilesV15,team:root.WRDI_GalioTeamContextV1431,
  guard:root.WRDI_GalioItemGuardV1424,core:root.WRDI_CoreV14,
  optimizer:root.WRDI_GalioFiveItemOptimizerV1429,order:root.WRDI_GalioPurchaseOrderV1432,
  contingency:root.WRDI_GalioContingenciesV1433,runeBridge:root.WRDI_RuneBridgeV14,
  runeAdvisor:root.WRDI_GalioRuneAdvisorV1411};
 go.disabled=true;status('Analyse du build principal, de l’ordre et des situations possibles…');
 // Yield a frame so the status is visible before the local-only computation.
 setTimeout(()=>{
  if(token!==epoch)return;
  try{
   const r=root.WRDI_DraftEngineV15.analyze({picks,champions:data.champions,
    catalog:data.catalog,rules:data.rules,runes:data.runes,modules:mod});
   if(r.ok){showResults(r);status('Analyse terminée. Une seule recommandation, préparée avant la partie.','good');}
   else{$('wrdi-result').replaceChildren();status(r.reason,'warning');}
  }catch(e){$('wrdi-result').replaceChildren();status('Calcul interrompu : '+String(e?.message||e),'warning');}
  finally{go.disabled=false;}
 },0);
});
clear.addEventListener('click',()=>{epoch++;picks=Array(10).fill('');picks[2]='10099';localStorage.removeItem(STORAGE);renderSlots();$('wrdi-result').replaceChildren();go.disabled=!data.ready;});
boot();
})();
