/* Wild Rift Draft Intelligence V15: clean, mobile-first, pregame-only UI.
 * No old calculators, no historical diagnostics or ranked build-fetch path.
 */
(function(){
'use strict';
const SLOT_NAMES=['Top allié','Jungle allié','Galio · Mid','ADC allié','Support allié',
 'Top adverse','Jungle adverse','Mid adverse','ADC adverse','Support adverse'];
const CHAMPION_CATALOG='./data/champions-picker-v151.json';
const STORAGE='wrdi_v15_draft';
const el=(name,cls,text)=>{const n=document.createElement(name);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const $=id=>document.getElementById(id);
const app=$('wrdi-v15'),message=$('wrdi-message'),go=$('wrdi-analyze'),clear=$('wrdi-clear');
const root=window;
const data={champions:{'10099':'Galio'},championList:[],catalog:null,rules:null,runes:null,
 officialKits:null,reviewedKits:null,numericKits:null,numericPatch:null,numericClient:null,ready:false};
let pickerUI=null;
const snapshot=()=>{try{const v=JSON.parse(localStorage.getItem(STORAGE)||'null');return Array.isArray(v)&&v.length===10?v.map(String):Array(10).fill('')}catch{return Array(10).fill('')}};
let picks=snapshot(),epoch=0;
picks[2]='10099';
function status(messageText,type='muted'){message.textContent=messageText;message.className='notice '+type;}
function renderSlots(){
 const allies=$('wrdi-allies'),enemies=$('wrdi-enemies');allies.replaceChildren();enemies.replaceChildren();
 const byId=new Map(data.championList.map(c=>[String(c.id),c]));
 for(let i=0;i<10;i++){
  const target=i<5?allies:enemies;
  const champion=i===2?byId.get('10099')||{id:'10099',name:'Galio'}:byId.get(String(picks[i]));
  if(i!==2&&picks[i]&&!champion)picks[i]='';
  const button=el('button','wrdi-slot'+(champion?' selected':' empty'));
  button.type='button';button.id='wrdi-slot-'+i;
  button.setAttribute('aria-label',SLOT_NAMES[i]+' : '+(champion?.name||'Choisir un champion'));
  if(i===2){button.disabled=true;button.classList.add('locked');}
  const portrait=champion&&pickerUI?.portrait?pickerUI.portrait(champion,'slot-portrait'):el('span','wrdi-slot-plus',champion?.name?.slice(0,2)||'+');
  const label=el('span','wrdi-slot-text');
  label.append(el('span','wrdi-slot-role',SLOT_NAMES[i]),
   el('strong','wrdi-slot-name',champion?.name||'Choisir…'));
  button.append(portrait,label);
  if(i!==2)button.addEventListener('click',()=>{if(pickerUI)pickerUI.show(i);});
  target.append(button);
 }
 if(data.ready)localStorage.setItem(STORAGE,JSON.stringify(picks));
}
function selectChampion(slot,id){
 if(slot===2)return;
 if(picks.some((other,i)=>i!==slot&&String(other)===String(id)))return;
 const match=data.championList.find(c=>String(c.id)===String(id));
 if(!match)return;
 epoch++;picks[slot]=String(id);
 localStorage.setItem(STORAGE,JSON.stringify(picks));renderSlots();
 $('wrdi-result').replaceChildren();status(match.name+' sélectionné · '+picks.filter(Boolean).length+'/10 champions.','good');
}
function showResults(result){
 const box=$('wrdi-result');box.replaceChildren();
 const headline=el('h2',null,'Recommandation Galio · Mid');box.append(headline);
 const sub=el('p','muted','Wild Rift mobile · Fiches du client '+result.patch+' · Calcul qualitatif avant la partie');
 box.append(sub);
 const main=el('section','result-section'),buildTitle=el('h3',null,'Build principal · 5 objets');
 main.append(buildTitle);
 const ol=el('ol','build-list');
 const phases={lane:'1 · Phase de lane',transition:'2 · Sortie de lane',escarmouches:'3 · Escarmouches',teamfights:'Combats d’équipe'};
 for(const it of result.build.items){
  const li=el('li','build-item');
  const phase=el('div','wrdi-buy-phase',phases[it.phase]||'Complément du build');
  const title=el('div','item-name',it.name);
  const why=el('p','muted',it.reason);
  const img=el('img','item-icon');img.src='./assets/item-icons/'+encodeURIComponent(it.id)+'.webp';img.alt='';
  img.loading='lazy';img.addEventListener('error',()=>{img.style.display='none'});
  const content=el('div','item-text');content.append(phase,title,why);li.append(img,content);ol.append(li);
 }
 main.append(ol,el('p','caption','D’abord tenir et gérer la lane contre le mid adverse. Ensuite renforcer Galio pour les escarmouches et les combats d’équipe. Bottes non encore optimisées.'));
 box.append(main);
 function itemImage(it,role){
  const picture=el('span','wrdi-item-portrait');
  const fallback=el('span','wrdi-item-fallback',(it?.name||'?').slice(0,2).toUpperCase());
  picture.append(fallback);
  const img=el('img');img.src='./assets/item-icons/'+encodeURIComponent(it.id)+'.webp';
  img.alt='';img.loading='lazy';img.decoding='async';
  img.addEventListener('load',()=>picture.classList.add('has-image'));
  img.addEventListener('error',()=>img.remove());
  picture.append(img);
  picture.setAttribute('aria-label',role+' : '+it.name);
  return picture;
 }
 const contingent=el('section','result-section');
 contingent.append(el('h3',null,'Objets situationnels'));
 contingent.append(el('p','section-intro','Des remplacements à envisager seulement si la situation décrite se produit.'));
 if(!result.build.alternatives.length){
  contingent.append(el('p','muted','Aucun remplacement suffisamment justifié parmi les scénarios testés.'));
 }
 for(const option of result.build.alternatives){
  const card=el('article','wrdi-swap-card');
  const condition=el('p','wrdi-swap-condition',option.condition);
  const line=el('div','wrdi-swap-line');
  const before=el('div','wrdi-swap-item');
  before.append(itemImage(option.remove,'À remplacer'),
   el('span','wrdi-swap-item-name',option.remove.name),
   el('span','wrdi-swap-item-state','À remplacer'));
  const arrow=el('span','wrdi-swap-arrow','→');arrow.setAttribute('aria-hidden','true');
  const after=el('div','wrdi-swap-item is-new');
  after.append(itemImage(option.add,'À acheter'),
   el('span','wrdi-swap-item-name',option.add.name),
   el('span','wrdi-swap-item-state','À acheter'));
  line.append(before,arrow,after);
  card.append(condition,line);
  contingent.append(card);
 }
 box.append(contingent);
 const rune=el('section','result-section');rune.append(el('h3',null,'Runes'));
 if(result.runes.ok){
  const portrait=(name,large)=>root.WRDI_RuneImagesV152?.portrait(name,{large})||
   el('span','wrdi-rune-fallback',name.slice(0,2).toUpperCase());
  const key=el('div','wrdi-rune-keystone');
  key.append(portrait(result.runes.page.keystone,true));
  const keyText=el('div','wrdi-rune-keytext');
  keyText.append(el('span','wrdi-rune-kicker','RUNE FONDAMENTALE'),
   el('strong','wrdi-rune-keyname',result.runes.page.keystone));
  key.append(keyText);rune.append(key);
  const names=[...result.runes.page.primary,result.runes.page.secondary];
  const grid=el('div','wrdi-rune-grid');
  names.forEach((name,i)=>{
   const card=el('div','wrdi-rune-tile');
   card.append(portrait(name,false));
   const label=el('span','wrdi-rune-tile-text');
   label.append(el('strong',null,name),
    el('span','wrdi-rune-sub',i===3?'Secondaire':'Principale · '+(i+1)));
   card.append(label);grid.append(card);
  });
  rune.append(grid);
  const note=el('p','wrdi-rune-note',result.runes.reason);
  rune.append(note);
 }else rune.append(el('p','warning',result.runes.reason));
 box.append(rune);
 const numerical=result.calculations?.numericCoverage;
 if(numerical){
  const section=el('section','result-section');
  section.append(el('h3',null,'Calculs à partir des compétences Wild Rift'));
  section.append(el('p','muted',numerical.champions+' fiches chiffrées · '+
   numerical.abilities+' sorts collectés · '+numerical.patchCorrections+
   ' corrections Riot appliquées · '+numerical.clientVerifications+' fiches vérifiées · '+numerical.patchConflicts+' divergences en vérification'));
  const galio=result.calculations?.numericGalio;
  if(galio){
   section.append(el('p','section-intro','Exemple de dégâts directs de Galio avec '+galio.ap+
    ' AP issus des objets (A rang 4, Z rang 1, E rang 4).'));
   const list=el('ul','build-list');
   for(const hit of galio.details){
    const spell={q:'A · Vents de guerre',w:'Z · Bouclier de Durand',e:'E · Horion de la justice'}[hit.slot]||hit.slot;
    list.append(el('li','muted',spell+' : '+hit.amount.toFixed(1)+' dégâts magiques bruts (base '+
     hit.base+' + '+Math.round(hit.apRatio*100)+' % AP)'));
   }
   section.append(list);
   section.append(el('p','caption','Comparaison théorique : sans passif, tornade, ultime, résistances adverses, déclenchements des objets ou runes.'));
  }
  if(numerical.patchConflicts||!numerical.patchComplete)
   section.append(el('p','warning','Attention : toutes les différences de patch ne sont pas encore résolues. Les valeurs conflictuelles sont exclues des calculs concernés.'));
  const interactions=result.calculations?.combatScenarios;
  if(interactions?.ok){
   const title=el('h3',null,'Interactions des cinq objets et combats');
   section.append(title);
   const duration=el('p','section-intro','Comparaison : combat court 2,5 s / prolongé 8 s. '+
    'Temps au contact hypothétiques : 35 % / 65 %. Les déclenchements et dégâts réels ne sont pas garantis.');
   section.append(duration);
   const summary=el('ul','build-list');
   const v=interactions.long.values;
   if(v.riftmaker)summary.append(el('li','muted','Créateur de failles : +'+
    v.riftmaker.bonusApFromHp.toFixed(1)+' AP grâce aux PV bonus · amplification maximale '+
    v.riftmaker.damageAmplificationAtDurationPct+' % après montée en puissance.'));
   if(v.unendingDespair)summary.append(el('li','muted','Désespoir infini : '+
    interactions.short.values.unendingDespair.possibleTriggersIfContinuousCombat+
    ' déclenchement possible à 2,5 s contre '+
    v.unendingDespair.possibleTriggersIfContinuousCombat+' à 8 s. Dégâts réels et soins inconnus.'));
   if(v.amaranth)summary.append(el('li','muted','Amaranth : '+
    (interactions.short.values.amaranth.activeInScenario?'actif':'inactif')+' à 2,5 s, '+
    (v.amaranth.activeInScenario?'actif':'inactif')+' à 8 s ; bonus armure '+
    v.amaranth.additionalBonusArmorIfActive.toFixed(1)+' et RM '+
    v.amaranth.additionalBonusMrIfActive.toFixed(1)+' sur les seules résistances des objets.'));
   if(v.trident)summary.append(el('li','muted','Trident : réduction de boucliers monocible '+
    v.trident.singleTargetShieldReductionPct.toFixed(1)+' % ou zone '+
    v.trident.aoeShieldReductionPct.toFixed(1)+' %, seulement si les dégâts de compétence touchent.'));
   if(v.hollowRadiance)summary.append(el('li','muted','Rayonnement : '+
    v.hollowRadiance.damagePerSecondRawRange.map(n=>n.toFixed(1)).join('–')+
    ' dégâts magiques bruts par seconde de proximité (avant résistances).'));
   section.append(summary);
   if(interactions.combinations.length)for(const why of interactions.combinations.slice(0,3))
    section.append(el('p','muted',why));
   section.append(el('p','caption','Scénarios de passifs conditionnels, non simulation de combat : statistiques de base, cible, portée, résistances et nombre de touches restent inconnus.'));
  }
  box.append(section);
 }
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
  const [catalog,rules,runes,champData,officialKits,reviewedKits,numericKits,numericPatch,numericClient]=await Promise.all([
   fetchJson('./data/items-client-7.3d-v12.json'),
   fetchJson('./data/item-restrictions-client-7.3d-v12.json'),
   fetchJson('./data/rune-catalog-client-v14.json'),
   fetchJson(CHAMPION_CATALOG),
   fetchJson('./data/champion-ability-extract-official-v1.json'),
   fetchJson('./data/champion-kits-official-fr-v1.json'),
   fetchJson('./data/champion-ability-numeric-wiki-wr-v1.json'),
   fetchJson('./data/wr-champion-numeric-patch-overrides-v1.json'),
   fetchJson('./data/wr-client-verified-abilities-7.3d.json')
  ]);
  const list=champData?.champions;
  if(!Array.isArray(list)||list.length<100)throw Error('Catalogue de champions local incomplet');
  if(list.some(c=>!c.id||!c.name||/^\d+$/.test(c.name)||!Array.isArray(c.lanes)||!Array.isArray(c.classes)))
   throw Error('Le catalogue contient des noms ou rôles invalides');
  if(new Set(list.map(c=>String(c.id))).size!==list.length)throw Error('Identifiants de champions dupliqués');
  data.championList=list;
  data.champions=Object.fromEntries(list.map(c=>[String(c.id),c.name]));
  if(!root.WRDI_OfficialKitIntelligenceV158?.prepare(officialKits)?.ok)
   throw Error('Compétences officielles Wild Rift indisponibles ou invalides');
  data.catalog=catalog;data.rules=rules;data.runes=runes;
  const numericCheck=root.WRDI_NumericKitsV162?.prepare?.(numericKits,numericPatch,numericClient);
  if(!numericCheck?.ok||numericCheck.count!==list.length)
   throw Error(numericCheck?.reason||'Catalogue numérique Wild Rift indisponible');
  data.officialKits=officialKits;data.reviewedKits=reviewedKits;
  data.numericKits=numericKits;data.numericPatch=numericPatch;data.numericClient=numericClient;
  pickerUI=root.WRDI_ChampionPickerV151?.init({
   getChampions:()=>data.championList,getPicks:()=>picks,onSelect:selectChampion
  });
  if(!pickerUI?.ok)throw Error('Sélecteur mobile indisponible');
  data.ready=true;renderSlots();go.disabled=false;
  status(list.length+' champions · '+officialKits.entries.length+' fiches Riot Wild Rift · catalogue client chargé.','good');
 }catch(e){
  go.disabled=true;status('Chargement interrompu : '+String(e?.message||e)+'. Aucune recommandation inventée.','warning');
 }
}
go.addEventListener('click',()=>{
 if(!data.ready)return;
 const token=++epoch;
 const mod={profiles:root.WRDI_ChampionProfilesV15,team:root.WRDI_GalioTeamContextV1431,
  guard:root.WRDI_GalioItemGuardV1424,core:root.WRDI_CoreV14,
  optimizer:root.WRDI_GalioFiveItemOptimizerV1429,order:root.WRDI_GalioPurchaseOrderV1432,
  contingency:root.WRDI_GalioContingenciesV1433,runeBridge:root.WRDI_RuneBridgeV14,
  runeAdvisor:root.WRDI_GalioRuneAdvisorV1411,
  kitIntelligence:root.WRDI_OfficialKitIntelligenceV158,
  mechanicsCalculator:root.WRDI_MechanicsCalculatorV159,
  numericEngine:root.WRDI_NumericKitsV162};
 go.disabled=true;status('Analyse du build principal, de l’ordre et des situations possibles…');
 // Yield a frame so the status is visible before the local-only computation.
 setTimeout(()=>{
  if(token!==epoch)return;
  try{
   const r=root.WRDI_DraftEngineV15.analyze({picks,champions:data.champions,
    catalog:data.catalog,rules:data.rules,runes:data.runes,championMeta:data.championList,
    officialKits:data.officialKits,reviewedKits:data.reviewedKits,
    numericKits:data.numericKits,numericPatch:data.numericPatch,numericClient:data.numericClient,modules:mod});
   if(r.ok){showResults(r);status('Analyse terminée. Une seule recommandation, préparée avant la partie.','good');}
   else{$('wrdi-result').replaceChildren();status(r.reason,'warning');}
  }catch(e){$('wrdi-result').replaceChildren();status('Calcul interrompu : '+String(e?.message||e),'warning');}
  finally{go.disabled=false;}
 },0);
});
clear.addEventListener('click',()=>{epoch++;picks=Array(10).fill('');picks[2]='10099';localStorage.removeItem(STORAGE);renderSlots();$('wrdi-result').replaceChildren();go.disabled=!data.ready;});
boot();
if('serviceWorker' in navigator){
 navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
})();
