
const BASE='https://wrchina.gg', api={meta:BASE+'/api/data.json',items:BASE+'/api/items.json',runes:BASE+'/api/runes.json',namesItems:BASE+'/data/item_names.json?v=3',namesRunes:BASE+'/data/rune_names.json?v=2',abilityNames:BASE+'/data/ability_i18n.json?v=2'};let db={},errors={};const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function french(map,id,fallback){let o=map?.[String(id)];let v=typeof o==='string'?o:o?.fr;return typeof v==='string'&&v.trim()?v.trim():'Traduction française indisponible (ID '+String(id)+')'}function icon(path){if(!path)return '';let u=path.startsWith('http')?path:BASE+path;return '<img loading="lazy" alt="" src="'+esc(u)+'" onerror="this.style.display=\'none\'">'}async function get(url){let c=new AbortController(),t=setTimeout(()=>c.abort(),15000);try{let r=await fetch(url,{cache:'no-store',signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(t)}}function date(s){if(!s)return '?';let t=String(s);return /^\d{8}$/.test(t)?t.slice(6,8)+'/'+t.slice(4,6)+'/'+t.slice(0,4):t}function pct(v){if(v==null||v==='')return 'non communiqué';return (typeof v==='number'?v:Number(v)).toLocaleString('fr-FR',{maximumFractionDigits:2})+' %'}function itemChip(i){let obj=db.items?.items?.find(x=>String(x.id)===String(i?.id||i));let id=i?.id||i;return '<span class="chip">'+icon(i?.icon||obj?.icon)+'<span>'+esc(french(db.namesItems,id,obj?.name||i?.name||id))+'</span></span>'}function runeChip(i){let id=i?.id||i;let rune=db.runes?.paths?.flatMap(p=>p.runes||[]).find(r=>String(r.id)===String(id));return '<span class="chip">'+icon(i?.icon||rune?.icon)+'<span>'+esc(french(db.namesRunes,id,rune?.name||i?.name||id))+'</span></span>'}
async function init(){errors={};$('status').textContent='Connexion aux données…';let pairs=await Promise.allSettled(Object.entries(api).map(async([k,u])=>[k,await get(u)]));pairs.forEach((r,i)=>{let key=Object.keys(api)[i];if(r.status==='fulfilled')db[r.value[0]]=r.value[1];else errors[key]=String(r.reason)});$('status').innerHTML='Patch annoncé : <b>'+esc(db.meta?.patch||db.items?.patch||'inconnu')+'</b> · Objets : '+(db.items?.items?.length??'?')+' · Runes : '+(db.runes?.paths?.reduce((n,p)=>n+(p.runes?.length||0),0)??'?')+' · <span class="'+(Object.keys(errors).length?'warn':'good')+'">'+(Object.keys(errors).length?'Sources partielles':'Catalogues accessibles')+'</span>';renderSources();renderItems();populateRealItems();renderRunes();renderChampions();await loadBuild()}
function renderSources(){let s=Object.entries(api).map(([k,u])=>'<div class="item"><b>'+esc(k)+'</b> · <span class="'+(errors[k]?'bad':'good')+'">'+(errors[k]?'Échec : '+esc(errors[k]):'Accessible')+'</span><br><small>'+esc(u)+'</small></div>').join('');$('sourceList').innerHTML=s+'<p><b>Versions annoncées :</b> index '+esc(db.meta?.patch||'?')+' ; objets '+esc(db.items?.patch||'?')+' ; runes '+esc(db.runes?.patch||'?')+'.</p><p><b>Dates :</b> statistiques '+esc(db.meta?.stats_date||'?')+' ; données '+esc(db.meta?.data_date||'?')+'.</p>'}
// Classement de navigation : catégories de la source en priorité, puis noms connus.
// Les rôles sont des familles d'objets, pas une affirmation de compatibilité avec un champion.
const itemCategories=[['all','🗂️ Tous les objets'],['magic','🔮 Magie / AP'],['attack','⚔️ Dégâts physiques / AD'],['marksman','🏹 Tireur / critique / vitesse'],['bruiser','🥊 Bruiser / combattant'],['tank','🛡️ Tank / défense'],['support','💚 Support / utilitaire'],['assassin','🗡️ Assassin / létalité'],['boots','👢 Bottes / déplacement'],['other','📦 Autres / non classés']];
const itemTiers=[['all','Tous les niveaux'],['basic','Composants'],['epic','Intermédiaires'],['legendary','Objets complets']];
function itemTags(x){
 const type=String(x.type||'').toLowerCase(), name=(realLabel(x)+' '+(x.name||'')).toLowerCase();
 const tags=new Set();
 if(/magia|magic|spell|mago|mage/.test(type))tags.add('magic');
 if(/attacco|attack/.test(type))tags.add('attack');
 if(/difesa|defense|tank/.test(type))tags.add('tank');
 if(/supporto|support|sostegno/.test(type))tags.add('support');
 if(/movimento|movement|stivali|boots/.test(type))tags.add('boots');
 if(/tiratore|marksman/.test(type))tags.add('marksman');
 if(/combattente|fighter|bruiser/.test(type))tags.add('bruiser');
 if(/assassino|assassin/.test(type))tags.add('assassin');
 // Un même objet peut appartenir à plusieurs familles.
 if(/critique|critical|rapid fire|canon ultrarapide|ouragan|runaan|danseur fantôme|lame d.infini|statikk|terminus|lame du roi déchu|blade of the ruined|guinsoo|rageblade/.test(name))tags.add('marksman');
 if(/couperet noir|black cleaver|sterak|danse de la mort|death.s dance|trinité|trinity|hydre titanesque|titanic hydra|gage de sterak|sundered|éclipse|eclipse|shojin/.test(name))tags.add('bruiser');
 if(/létalité|lethality|youmuu|duskblade|draktharr|serpent|edge of night|manteau de la nuit|axiom|percepteur|collector/.test(name))tags.add('assassin');
 if(/rédemption|redemption|encensoir|ardent|harmonie|harmony|écho d.helia|helia|mandat impérial|imperial mandate|bénédiction de mikael|mikael|échos harmoniques|harmonic echo|bouclier relique|faucille spectrale/.test(name))tags.add('support');
 if(/bottes|boots|chaussures|greaves|jambières|souliers/.test(name))tags.add('boots');
 if(!tags.size)tags.add('other');return tags;
}
function itemTier(x){const t=String(x.tier||x.type_raw||'').toLowerCase();if(/basic|epic|legendary/.test(t))return t.match(/basic|epic|legendary/)[0];return 'unknown'}
function itemFiltered(category,tier,q){return (db.items?.items||[]).filter(x=>{
 const term=(realLabel(x)+' '+(x.name||'')+' '+x.id).toLocaleLowerCase('fr');
 return (term.includes(q)||String(realLabel(x)).toLocaleLowerCase('fr').includes(q))&& (category==='all'||itemTags(x).has(category))&&(tier==='all'||itemTier(x)===tier);
 });}
function itemFilterInit(){for(const [a,b] of [['itemPickerCategory','itemPickerTier'],['itemCatalogCategory','itemCatalogTier']]){
 $(a).innerHTML=itemCategories.map(([v,n])=>'<option value="'+v+'">'+esc(n)+'</option>').join('');
 $(b).innerHTML=itemTiers.map(([v,n])=>'<option value="'+v+'">'+esc(n)+'</option>').join('');
 }}
function renderItems(){let a=db.items?.items||[];$('itemsCount').textContent=a.length+' entrées dans la source (équipements, composants et autres catégories éventuelles). Patch annoncé : '+(db.items?.patch||'?');let q=$('itemSearch').value.trim().toLocaleLowerCase('fr'),v=itemFiltered($('itemCatalogCategory').value,$('itemCatalogTier').value,q);$('itemsList').innerHTML=v.slice(0,80).map(x=>'<details><summary>'+itemChip(x)+' <small>· '+esc(x.price??'?')+' PO · '+esc(frCategory(x.type))+'</small></summary><div><span class="pill">ID '+esc(x.id)+'</span><span class="pill">'+esc(frCategory(x.tier||x.type_raw))+'</span><p><b>Effets bruts (source) :</b></p><p>'+esc(frDescription(x.desc))+'</p><small>La description brute n’est pas nécessairement traduite ni validée pour ce patch.</small></div></details>').join('')+(v.length>80?'<p class="muted">80 premiers résultats affichés : affine la recherche.</p>':'')}
function renderRunes(){let paths=db.runes?.paths||[];let all=paths.flatMap(p=>(p.runes||[]).map(r=>({...r,path:p.path})));$('runesCount').textContent=all.length+' entrées dans '+paths.length+' branches. Patch annoncé : '+(db.runes?.patch||'?');let q=$('runeSearch').value.trim().toLowerCase();$('runesList').innerHTML=all.filter(x=>(french(db.namesRunes,x.id,x.name)+' '+x.name+' '+x.id).toLowerCase().includes(q)).map(x=>'<details><summary>'+runeChip(x)+' <small>· '+esc(frPath(x.path))+'</small></summary><p>'+esc(frDescription(x.desc))+'</p><span class="pill">ID '+esc(x.id)+'</span><span class="pill">'+esc(frDescription(x.attr))+'</span><p class="muted">Description brute non vérifiée.</p></details>').join('')}
let champions=[];function renderChampions(){let ci=db.meta?.champ_index||{};champions=Object.entries(ci).map(([id,v])=>({id,name:typeof v==='string'?v:v?.name||v?.en||v?.champion||v?.[0]?.name||id}));let sel=$('champ');sel.innerHTML=champions.map(c=>'<option value="'+esc(c.id)+'" '+(c.id==='10099'?'selected':'')+'>'+esc(c.name===''+c.id?'Champion '+c.id:c.name)+'</option>').join('');renderChampList()}
function renderChampList(){let q=$('champSearch').value.trim().toLowerCase();let arr=champions.filter(c=>(c.name+' '+c.id).toLowerCase().includes(q));$('champList').innerHTML='<p class="muted">'+arr.length+' champions correspondants · cliquez pour consulter une fiche.</p>'+arr.slice(0,60).map(c=>'<button class="secondary" style="margin:3px" data-hero="'+esc(c.id)+'">'+esc(c.name)+'</button>').join('');$('champList').querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>loadChampion(b.dataset.hero))}
async function loadChampion(id){$('champDetails').innerHTML='<div class="panel">Chargement de la fiche…</div>';try{let x=await get(BASE+'/api/champion/'+encodeURIComponent(id)+'.json');let a=x.abilities||[];let abilityHtml=Array.isArray(a)?a.map(z=>'<details><summary>'+esc(z.name||z.key||z.slot||'Compétence')+'</summary><p>'+esc(frDescription(z.desc||z.description))+'</p></details>').join(''):Object.entries(a).map(([k,z])=>'<details><summary>'+esc(z?.name||k)+'</summary><p>'+esc(frDescription(z?.desc||z?.description))+'</p></details>').join('');$('champDetails').innerHTML='<div class="panel"><h2>'+esc(x.name||id)+'</h2><p class="muted">'+esc(frDescription(x.title))+' · '+esc((x.roles||[]).map(frCategory).join(', '))+' · Version fiche : '+esc(x.version||'non indiquée')+'</p><p><span class="pill">Dégâts '+esc(x.damage??'?')+'</span><span class="pill">Résistance '+esc(x.survive??'?')+'</span><span class="pill">Utilité '+esc(x.assist??'?')+'</span></p><h3>Compétences</h3>'+abilityHtml+'<p class="warn">Les descriptions de compétences doivent être contrôlées avant toute recommandation.</p></div>'}catch(e){$('champDetails').innerHTML='<div class="panel bad">Fiche indisponible : '+esc(e)+'</div>'}}
let currentBuild=null;async function loadBuild(){let id=$('champ').value||'10099',rank=$('rank').value;$('buildInfo').textContent='Chargement…';$('buildResult').innerHTML='';try{currentBuild=await get(BASE+'/api/build/'+encodeURIComponent(id)+'_'+rank+'.json');let positions=currentBuild.positions||[];let roles=positions.map((p,i)=>({v:String(p.pos??p.position??p.pos_id??i),label:p.pos_label||p.label||'Rôle '+(i+1),index:i}));let sel=$('role'),prior=sel.value;sel.innerHTML=roles.map(x=>'<option value="'+x.index+'">'+esc(x.label)+'</option>').join('');sel.value=roles.some(x=>String(x.index)===prior)?prior:'0';$('buildInfo').textContent='Classement : '+(currentBuild.rank_label||rank)+' · Date : '+date(currentBuild.date)+' · '+positions.length+' rôle(s)';renderBuild()}catch(e){$('buildInfo').textContent='Impossible de récupérer les builds : '+String(e)}}function renderBuild(){if(!currentBuild)return;let p=(currentBuild.positions||[])[Number($('role').value)||0];if(!p){$('buildResult').textContent='Aucun rôle disponible.';return}let cores=p.core||[],runes=p.runes||[],shoes=p.shoes||[];let box='<div class="panel"><h2>⚔️ Cores méta observés</h2><p class="muted">Les valeurs correspondent à la source, pas à une prédiction contre une draft précise. Ordre des objets conservé.</p>';box+=cores.length?cores.map((c,i)=>'<div class="item"><b>Core '+(i+1)+'</b><div class="items">'+(c.items||[]).map(itemChip).join('')+'</div><span class="pill">Win rate : <span class="stat">'+pct(c.win)+'</span></span><span class="pill">Utilisation : '+pct(c.pick)+'</span></div>').join(''):'<p>Aucun core communiqué.</p>';box+='</div><div class="panel"><h2>✨ Pages de runes observées</h2><p class="muted">Pages conservées telles que publiées, sans assemblage artificiel de runes isolées.</p>';box+=runes.length?runes.map((r,i)=>'<div class="item"><b>Page '+(i+1)+'</b><div class="items">'+(r.runes||[]).map(runeChip).join('')+'</div><span class="pill">Win rate : <span class="stat">'+pct(r.win)+'</span></span><span class="pill">Utilisation : '+pct(r.pick)+'</span></div>').join(''):'<p>Aucune page communiquée.</p>';box+='</div><div class="panel"><h2>👟 Bottes</h2>'+(shoes.length?shoes.map(x=>'<div class="item">'+esc(JSON.stringify(x))+'</div>').join(''):'<p class="warn">Aucune donnée de bottes fournie pour ce rôle. Aucune recommandation inventée.</p>')+'</div>';$('buildResult').innerHTML=box}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('main>section').forEach(s=>s.classList.toggle('hidden',s.id!==b.dataset.tab))});$('itemSearch').oninput=renderItems;$('runeSearch').oninput=renderRunes;$('champSearch').oninput=renderChampList;$('loadBuild').onclick=loadBuild;$('rank').onchange=loadBuild;$('champ').onchange=loadBuild;$('role').onchange=renderBuild;$('refresh').onclick=init;
// V7.1 : ne jamais présenter un libellé italien, espagnol ou chinois comme français.
function frCategory(v){const k=String(v||'').trim().toLowerCase();return ({magia:'Magie',attacco:'Attaque',supporto:'Support',difesa:'Défense',movimento:'Déplacement',stivali:'Bottes',mago:'Mage',tank:'Tank',assassino:'Assassin',tiratore:'Tireur',combattente:'Combattant',sostegno:'Support',spell:'Magie',attack:'Attaque',defense:'Défense',support:'Support',movement:'Déplacement',boots:'Bottes',basic:'Composant',epic:'Intermédiaire',legendary:'Objet complet'})[k]||(/^[0-9]+$/.test(k)?'Niveau '+k:(v||'Catégorie non renseignée'))}
function frPath(v){const k=String(v||'').toLowerCase();return ({'pietra angolare':'Rune fondamentale','dominazione':'Domination','determinazione':'Volonté','ispirazione':'Inspiration','precisione':'Précision','rune_path_key_stone':'Rune fondamentale','rune_path_domination':'Domination','rune_path_resolve':'Volonté','rune_path_inspiration':'Inspiration','rune_path_precision':'Précision'})[k]||'Branche à vérifier'}
function frDescription(v){if(!v)return 'Description française non disponible';let t=String(v);if(/[\u3400-\u9fff]/.test(t)||/\b(?:magia|attacco|supporto|difesa|pietra angolare)\b/i.test(t))return 'Description française non vérifiée — consulter la source avant toute recommandation';return t}
// L'index de la source ne fournit pas les noms. Résolution via les fiches champions.
const knownChampions={'10099':'Galio'};
const roleAliases={mid:'mid',middle:'mid',top:'top',baron:'top',jungle:'jungle',jg:'jungle',adc:'adc',bottom:'adc',bot:'adc',dragon:'adc',support:'support',sup:'support',utility:'support'};
function normalizeRoles(v){let a=Array.isArray(v)?v:typeof v==='string'?v.split(/[,;/|]/):[];return [...new Set(a.map(x=>roleAliases[String(x).toLowerCase().trim()]).filter(Boolean))]}
let roleCache={};try{roleCache=JSON.parse(localStorage.getItem('wrdi_roles_v73')||'{}')}catch(e){}
roleCache['10099']=['mid','support'];let rolesResolving=false;let rolesChecked=0;
function filterChampionsByRole(){
 let filter=$('champRoleFilter').value,selected=$('champ').value;
 let confirmed=champions.filter(c=>filter==='all'||(roleCache[c.id]||[]).includes(filter));
 let unknown=champions.filter(c=>filter!=='all'&&!Array.isArray(roleCache[c.id]));
 let ordered=[...confirmed].sort((a,b)=>a.name.localeCompare(b.name,'fr'));
 // Ne jamais rendre le sélecteur inutilisable pendant la récupération des postes.
 if(filter!=='all'&&unknown.length){ordered.push(...unknown.sort((a,b)=>a.name.localeCompare(b.name,'fr')))}
 $('champ').innerHTML=ordered.map(c=>'<option value="'+esc(c.id)+'">'+(filter!=='all'&&!Array.isArray(roleCache[c.id])?'⏳ ':'')+esc(c.name==='Nom en cours de chargement'?'Chargement…':c.name)+'</option>').join('');
 if(ordered.some(c=>c.id===selected))$('champ').value=selected;
 else if(ordered.length)$('champ').value=ordered[0].id;
 else $('champ').innerHTML='<option value="">Aucun champion répertorié pour ce poste</option>';
 let info=$('roleFilterInfo');if(info)info.textContent=filter==='all'?champions.length+' champions — tous les postes':confirmed.length+' champion(s) confirmé(s) · '+unknown.length+' poste(s) en cours de vérification'+(unknown.length?' (⏳ affichés temporairement)':'');
}
async function resolveRolesFromBuilds(){
 if(rolesResolving)return;rolesResolving=true;
 const ids=champions.map(c=>c.id).filter(id=>!Array.isArray(roleCache[id]));let next=0,done=0;
 async function worker(){while(next<ids.length){let id=ids[next++];try{
 let x=await get(BASE+'/api/build/'+encodeURIComponent(id)+'_1.json');
 let r=(x.positions||[]).map(p=>p.pos_label||p.label||'').flatMap(v=>normalizeRoles(v));
 roleCache[id]=[...new Set(r)];
 }catch(e){/* Rôle inconnu : garder ce champion visible */}
 done++;if(done%6===0||done===ids.length){try{localStorage.setItem('wrdi_roles_v73',JSON.stringify(roleCache))}catch(e){}filterChampionsByRole()}
 }}
 await Promise.all(Array.from({length:Math.min(6,ids.length)},worker));rolesResolving=false;
}

let championNameRun=0;
function renderChampions(){let ci=db.meta?.champ_index||{};let cached={};try{cached=JSON.parse(localStorage.getItem('wrdi_champion_names_v71')||'{}')}catch(e){};
 champions=Object.keys(ci).map(id=>({id,name:knownChampions[id]||cached[id]||'Nom en cours de chargement'}));
 updateChampionUI();resolveRolesFromBuilds();resolveChampionNames(champions.filter(c=>c.name==='Nom en cours de chargement').map(c=>c.id));}
function updateChampionUI(){filterChampionsByRole();renderChampList()}
async function resolveChampionNames(ids){const run=++championNameRun;let next=0,done=0;let cached={};try{cached=JSON.parse(localStorage.getItem('wrdi_champion_names_v71')||'{}')}catch(e){};
 async function worker(){while(next<ids.length&&run===championNameRun){let id=ids[next++];try{let x=await get(BASE+'/api/champion/'+encodeURIComponent(id)+'.json');if(x.roles){let r=normalizeRoles(x.roles);if(r.length&&!Array.isArray(roleCache[id]))roleCache[id]=r}if(x.name&&typeof x.name==='string'&&!/[\u3400-\u9fff]/.test(x.name)){let c=champions.find(c=>c.id===id);if(c)c.name=x.name;cached[id]=x.name}}catch(e){}done++;if(done%8===0||done===ids.length){try{localStorage.setItem('wrdi_champion_names_v71',JSON.stringify(cached));localStorage.setItem('wrdi_roles_v73',JSON.stringify(roleCache))}catch(e){}updateChampionUI();$('status').textContent='Noms champions : '+(champions.length-ids.length+done)+'/'+champions.length+' vérifiés ou examinés · patch '+(db.meta?.patch||'?')}}}
 await Promise.all(Array.from({length:Math.min(8,ids.length)},worker));
}
// Le catalogue reste exploratoire : aucun texte non traduit ne doit guider un choix d'objet.


// V7.4 : sélection tactile avec recherche, filtres de rôle et favoris locaux.
let pickerFilter='mid', pickerFavorites=[];try{pickerFavorites=JSON.parse(localStorage.getItem('wrdi_favorites_v74')||'[]')}catch(e){}
const pickerRoles=[['favorites','⭐ Favoris'],['all','Tous'],['top','Top'],['jungle','Jungle'],['mid','Mid'],['adc','ADC'],['support','Support']];
// V7.8 : images tirées de la fiche du MÊME identifiant de champion, jamais d'une recherche approximative.
let portraitCache={};try{portraitCache=JSON.parse(localStorage.getItem('wrdi_portraits_v77')||'{}')}catch(e){}
function portraitUrl(raw){if(typeof raw!=='string'||!raw.trim())return '';try{const u=new URL(raw,BASE+'/');if(u.protocol!=='https:')return '';return u.href}catch(e){return ''}}
function championPortrait(id,name){const url=portraitCache[String(id)];const fallback=esc((name||'?').slice(0,2).toUpperCase());if(!url)return '<span class="avatar-fallback">'+fallback+'</span>';
return '<span class="avatar-fallback">'+fallback+'</span><img loading="lazy" decoding="async" src="'+esc(url)+'" alt="" onload="this.parentElement.classList.add(\'has-img\')" onerror="this.remove()">'}
let portraitRun=0;
async function resolvePortraits(){const run=++portraitRun;const ids=champions.map(c=>c.id).filter(id=>!portraitCache[id]);let next=0,completed=0;
async function worker(){while(next<ids.length&&run===portraitRun){const id=ids[next++];try{const x=await get(BASE+'/api/champion/'+encodeURIComponent(id)+'.json');const c=champions.find(c=>c.id===id);
// Une image est liée uniquement à l'identifiant de sa fiche source.
if(String(x.id)===String(id)&&c){const u=portraitUrl(x.avatar);if(u)portraitCache[id]=u;if(x.name&&typeof x.name==='string'&&!/[\u3400-\u9fff]/.test(x.name)&&c.name==='Nom en cours de chargement')c.name=x.name}
}catch(e){}completed++;if(completed%5===0||completed===ids.length){try{localStorage.setItem('wrdi_portraits_v77',JSON.stringify(portraitCache))}catch(e){}if(!$('pickerOverlay').classList.contains('hidden'))renderPicker();renderDraft()}}}
await Promise.all(Array.from({length:Math.min(6,ids.length)},worker))}
// Complément de rôles usuels pour les cas où la source n'a pas retourné de postes.
// Ne modifie pas les statistiques et n'est pas présenté comme une donnée de win rate.
const fallbackRoles={adc:new Set(['Ashe','Caitlyn','Corki','Draven','Ezreal','Jhin','Jinx','Kai’Sa',"Kai' Sa","Kai'Sa",'Kalista','Lucian','Miss Fortune','Nilah','Samira','Senna','Sivir','Smolder','Tristana','Twitch','Varus','Vayne','Xayah','Zeri'])};
const jungleNames=new Set(['Amumu','Diana','Ekko','Evelynn','Fiddlesticks','Graves','Hecarim','Jarvan IV','Kha’Zix',"Kha'Zix",'Kindred','Lee Sin','Lillia','Master Yi','Nidalee','Nocturne','Nunu et Willump','Nunu & Willump','Olaf','Rammus','Rengar','Shyvana','Talon','Vi','Viego','Volibear','Warwick','Wukong','Xin Zhao','Zac']);
function hasPickerRole(c,role){if((roleCache[c.id]||[]).includes(role))return true;if(role==='adc')return fallbackRoles.adc.has(c.name);if(role==='jungle')return jungleNames.has(c.name);return false}
function pickerName(c){return c.name==='Nom en cours de chargement'?'Champion '+c.id:c.name}
function syncPickedName(){const c=champions.find(x=>x.id===$('champ').value);$('pickedName').textContent=c?pickerName(c):'Choisir un champion'}
let pickerTarget=null;function openPicker(){pickerTarget=null;if(!$('pickerOverlay').classList.contains('hidden'))return;history.pushState({wrdiPicker:true},'','#selection-champion');pickerFilter=pickerTarget!==null?'all':($('champRoleFilter').value||'mid');$('pickerSearch').value='';$('pickerOverlay').classList.remove('hidden');document.body.style.overflow='hidden';renderPicker();$('pickerSearch').focus()}
function closePicker(){if($('pickerOverlay').classList.contains('hidden'))return;$('pickerOverlay').classList.add('hidden');document.body.style.overflow='';if(history.state&&history.state.wrdiPicker)history.back()}window.addEventListener('popstate',()=>{$('pickerOverlay').classList.add('hidden');document.body.style.overflow=''})
function renderPicker(){const q=$('pickerSearch').value.trim().toLocaleLowerCase('fr');$('pickerTabs').innerHTML=pickerRoles.map(([k,label])=>'<button type="button" data-picker-role="'+k+'" class="'+(pickerFilter===k?'on':'')+'">'+label+'</button>').join('');$('pickerTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{pickerFilter=b.dataset.pickerRole;renderPicker()});
let matches=champions.filter(c=>{const name=pickerName(c);if(q&&!name.toLocaleLowerCase('fr').includes(q))return false;if(pickerTarget!==null&&draftPicks.includes(c.id)&&draftPicks[pickerTarget]!==c.id)return false;if(pickerFilter==='favorites')return pickerFavorites.includes(c.id);if(pickerFilter==='all')return true;return hasPickerRole(c,pickerFilter)});
matches.sort((a,b)=>Number(pickerFavorites.includes(b.id))-Number(pickerFavorites.includes(a.id))||pickerName(a).localeCompare(pickerName(b),'fr'));
$('pickerCount').textContent=matches.length+' champion(s) · ⭐ pour ajouter aux favoris';
$('pickerGrid').innerHTML=matches.length?matches.map(c=>{let name=pickerName(c),fav=pickerFavorites.includes(c.id);return '<button type="button" class="picker-card '+(c.id===(pickerTarget!==null?draftPicks[pickerTarget]:$('champ').value)?'selected':'')+'" data-pick="'+esc(c.id)+'"><span class="picker-avatar">'+championPortrait(c.id,name)+'</span><span class="picker-name">'+esc(name)+'</span><span class="picker-star" role="button" aria-label="Favori" data-fav="'+esc(c.id)+'">'+(fav?'★':'☆')+'</span></button>'}).join(''):'<div class="picker-empty">Aucun champion pour ce filtre. Essaie « Tous » ou utilise la recherche.</div>';
$('pickerGrid').querySelectorAll('[data-pick]').forEach(b=>b.onclick=e=>{const star=e.target.closest('[data-fav]');if(star){const id=star.dataset.fav;pickerFavorites=pickerFavorites.includes(id)?pickerFavorites.filter(x=>x!==id):[...pickerFavorites,id];try{localStorage.setItem('wrdi_favorites_v74',JSON.stringify(pickerFavorites))}catch(e){}renderPicker();return}const id=b.dataset.pick;if(pickerTarget!==null){const duplicate=draftPicks.findIndex((v,i)=>v===id&&i!==pickerTarget);if(duplicate!==-1){$('pickerCount').textContent='Ce champion est déjà sélectionné dans cette draft.';return}draftPicks[pickerTarget]=id;saveDraft();renderDraft();closePicker();return}const currentFilter=$('champRoleFilter').value;if(currentFilter!=='all'&&!(roleCache[id]||[]).includes(currentFilter))$('champRoleFilter').value='all';filterChampionsByRole();$('champ').value=id;syncPickedName();closePicker();loadBuild()})}
$('openPicker').onclick=openPicker;$('pickerClose').onclick=closePicker;$('pickerSearch').oninput=renderPicker;$('pickerOverlay').addEventListener('click',e=>{if(e.target===$('pickerOverlay'))closePicker()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('pickerOverlay').classList.contains('hidden'))closePicker()});
const oldFilterChampionsByRole=filterChampionsByRole;filterChampionsByRole=function(){oldFilterChampionsByRole();syncPickedName();if(!$('pickerOverlay').classList.contains('hidden'))renderPicker()};


// V7.6 : composition de draft. Aucune recommandation inventée.
const draftRoles=['Top','Jungle','Mid','ADC','Support'];
let draftPicks=Array(10).fill('');try{const d=JSON.parse(localStorage.getItem('wrdi_draft_v76')||'[]');if(Array.isArray(d)&&d.length===10)draftPicks=d.map(x=>String(x||''))}catch(e){}
function saveDraft(){try{localStorage.setItem('wrdi_draft_v76',JSON.stringify(draftPicks))}catch(e){}}
function renderDraft(){for(const [id,start] of [['draftAllies',0],['draftEnemies',5]]){$(id).innerHTML=draftRoles.map((r,i)=>{const idx=start+i,c=champions.find(x=>x.id===draftPicks[idx]),name=c?pickerName(c):'Choisir…';return '<button type="button" class="draft-slot '+(c?'filled ':'')+(idx===2?'self':'')+'" data-slot="'+idx+'"><span class="slot-icon">'+(c?championPortrait(c.id,name):'+')+'</span><span class="slot-text"><span class="slot-role">'+(idx===2?'TON CHAMPION · ':'')+r+'</span>'+esc(name)+'</span>'+(c?'<span class="slot-x" data-clear="'+idx+'" aria-label="Retirer">×</span>':'')+'</button>'}).join('')}
 document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=e=>{const clear=e.target.closest('[data-clear]');if(clear){draftPicks[Number(clear.dataset.clear)]='';saveDraft();renderDraft();return}pickerTarget=Number(b.dataset.slot);openPicker();pickerTarget=Number(b.dataset.slot);pickerFilter='all';$('pickerSearch').value='';pickerFilter=draftRoles[Number(b.dataset.slot)%5].toLowerCase();renderPicker()});
 $('draftMessage').textContent=draftPicks.filter(Boolean).length+'/10 champions sélectionnés.';
}
$('draftClear').onclick=()=>{draftPicks=Array(10).fill('');saveDraft();renderDraft()};
$('draftCopy').onclick=async()=>{const fmt=(start)=>draftRoles.map((r,i)=>r+': '+(champions.find(c=>c.id===draftPicks[start+i])?.name||'Non choisi')).join('\n');const t='Mon équipe\n'+fmt(0)+'\n\nAdversaires\n'+fmt(5);try{await navigator.clipboard.writeText(t);$('draftMessage').textContent='Composition copiée.'}catch(e){$('draftMessage').textContent='Copie indisponible dans ce navigateur.'}};
$('draftToBuild').onclick=()=>{const id=draftPicks[2];if(id){$('champRoleFilter').value='all';filterChampionsByRole();$('champ').value=id;syncPickedName();loadBuild()}document.querySelector('[data-tab="builds"]').click();window.scrollTo({top:0,behavior:'smooth'})};
const oldUpdateChampionUI=updateChampionUI;updateChampionUI=function(){oldUpdateChampionUI();renderDraft()};
renderDraft();

const oldRenderChampionsV77=renderChampions;renderChampions=function(){oldRenderChampionsV77();resolvePortraits()};

// V7.9 : analyse prudente des compositions et comparaison de builds observés.
// Aucun modèle prédictif de winrate par draft, ni formule de dégâts inventée.
const threatProfiles={
 'syndra':['ap','burst','cc'],'orianna':['ap','poke','cc'],'ahri':['ap','burst','cc'],'veigar':['ap','burst','cc'],'brand':['ap','burn','aoe'],'zyra':['ap','burn','cc'],'vladimir':['ap','sustain','aoe'],'akali':['ap','assassin'],'katarina':['ap','assassin'],'fizz':['ap','assassin'],'ekko':['ap','assassin'],'kennen':['ap','aoe','cc'],'annie':['ap','burst','cc'],'lux':['ap','poke','cc'],'morgana':['ap','cc'],'galio':['ap','cc','tank'],'swain':['ap','sustain','cc'],'aurelion sol':['ap','aoe'],'teemo':['ap','poke'],'lillia':['ap','burn'],'gwen':['ap','sustain'],'evelynn':['ap','assassin'],'diana':['ap','assassin'],'gragas':['ap','cc'],'rumble':['ap','aoe'],'ziggs':['ap','poke'],'hwei':['ap','poke','cc'],
 'zed':['ad','assassin'],'yasuo':['ad','crit'],'yone':['ad','crit','cc'],'talon':['ad','assassin'],'qiyana':['ad','assassin'],'pantheon':['ad','burst','cc'],'jayce':['ad','poke'],'lucian':['ad','crit'],'tristana':['ad','crit'],'jinx':['ad','crit'],'caitlyn':['ad','crit','poke'],'draven':['ad','crit'],'samira':['ad','crit'],'miss fortune':['ad','aoe'],'ashe':['ad','cc'],'vayne':['ad','onhit'],'kai’sa':['hybrid','onhit'],'kai\'sa':['hybrid','onhit'],'ezreal':['hybrid','poke'],'varus':['hybrid','poke'],'kalista':['ad','onhit'],'xayah':['ad','crit'],'sivir':['ad','crit'],'twitch':['ad','onhit'],'zeri':['ad','crit'],'aphelios':['ad','crit'],'graves':['ad','crit'],'master yi':['ad','onhit'],'tryndamere':['ad','crit'],'viego':['ad','onhit'],'lee sin':['ad','burst'],'vi':['ad','cc'],'jarvan iv':['ad','cc'],'hecarim':['ad','engage'],'khazix':['ad','assassin'],"kha'zix":['ad','assassin'],'rengar':['ad','assassin'],'wukong':['ad','cc'],'xin zhao':['ad','engage'],'olaf':['ad','sustain'],'darius':['ad','sustain'],'garen':['ad','tank'],'sett':['ad','tank','cc'],'aatrox':['ad','sustain'],'riven':['ad','cc'],'fiora':['ad','sustain'],'camille':['ad','cc'],'irelia':['ad','onhit'],'nasus':['ad','tank'],'renekton':['ad','sustain'],'ambessa':['ad','assassin'],
 'ornn':['tank','cc'],'malphite':['tank','cc'],'nautilus':['tank','cc'],'leona':['tank','cc'],'alistar':['tank','cc'],'rell':['tank','cc'],'braum':['tank','cc'],'thresh':['tank','cc'],'blitzcrank':['tank','cc'],'sion':['tank','cc'],'maokai':['tank','cc'],'rammus':['tank','cc'],'amumu':['tank','cc'],'sejuani':['tank','cc'],'zac':['tank','cc'],'cho’gath':['tank','cc'],'chogath':['tank','cc'],'dr. mundo':['tank','sustain'],'mundo':['tank','sustain'],'volibear':['tank','sustain'],'shen':['tank','cc'],'poppy':['tank','cc'],'tahm kench':['tank','cc'],
 'soraka':['heal'],'sona':['heal','shield'],'yuumi':['heal','shield'],'nami':['heal','cc'],'milio':['heal','shield'],'janna':['shield','cc'],'lulu':['shield','cc'],'karma':['shield','poke'],'seraphine':['shield','heal','cc'],'rakan':['shield','cc'],'senna':['heal','ad'],'taric':['heal','tank'],'renata glasc':['shield','cc'],'bard':['ap','cc'],'pyke':['ad','assassin','cc'],'nilah':['ad','crit'],'smolder':['ad','poke'],'mel':['ap','poke'],'aurora':['ap','burst']
};
function normalName(n){return String(n||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").trim()}
function getThreat(n){return threatProfiles[normalName(n)]||null}
function engineNum(v){let x=Number(v);return Number.isFinite(x)?x:null}
function engineScore(x,mode){const v=engineNum(x?.[mode]);return v===null?-Infinity:v}
function engineEntry(items,tag){return '<div class="items">'+(items||[]).map(tag==='rune'?runeChip:itemChip).join('')+'</div>'}
function engineNotes(names){let counts={ap:0,ad:0,hybrid:0,tank:0,cc:0,heal:0,shield:0,assassin:0,burst:0,poke:0,sustain:0},unknown=[];names.forEach(n=>{let p=getThreat(n);if(!p)unknown.push(n);else p.forEach(t=>counts[t]=(counts[t]||0)+1)});return {counts,unknown}}
function engineReasons(c){let lines=[];if(c.ap>=2)lines.push('Plusieurs menaces à dominante magique identifiées : envisager une réponse défensive adaptée, selon le champion joué.');if(c.ad>=3)lines.push('Plusieurs menaces à dominante physique identifiées : la survie face aux dégâts physiques mérite une vérification.');if(c.tank>=2)lines.push('Au moins deux champions orientés tank : vérifier la valeur des objets anti-résistances et des dégâts prolongés.');if(c.heal>=1||c.sustain>=2)lines.push('Soins ou régénération présents : vérifier si un effet anti-soins est nécessaire et qui doit l’acheter.');if(c.shield>=2)lines.push('Plusieurs sources de boucliers : évaluer les réponses anti-boucliers réellement disponibles pour ce champion.');if(c.cc>=3)lines.push('Beaucoup de contrôles potentiels : considérer la ténacité et les options défensives compatibles.');if(c.assassin>=2)lines.push('Plusieurs assassins : privilégier la sécurité du positionnement et la valeur d’un achat défensif.');return lines.length?lines:['Aucun signal dominant fiable dans les profils disponibles ; comparer les builds observés sans forcer de contre-objet.']}
async function analyzeDraft(){const box=$('engineResult'),own=draftPicks[2],enemy=draftPicks.slice(5);if(!own){box.innerHTML='<p class="warn">Choisis d’abord ton champion dans l’emplacement Mid de ton équipe.</p>';return}if(enemy.some(x=>!x)){box.innerHTML='<p class="warn">Renseigne les cinq champions adverses pour analyser la composition complète.</p>';return}const c=champions.find(x=>x.id===own),names=enemy.map(id=>pickerName(champions.find(x=>x.id===id)||{id,name:id}));box.innerHTML='<p class="muted">Récupération des builds observés pour '+esc(c?.name||own)+'…</p>';try{const data=await get(BASE+'/api/build/'+encodeURIComponent(own)+'_'+$('engineRank').value+'.json');let positions=data.positions||[];let mid=positions.find(p=>/mid|middle|中路|中单/i.test(String(p.pos_label||p.label||'')))||positions.find(p=>String(p.pos)==='3'||String(p.position)==='3'||String(p.pos_id)==='3');if(!mid){box.innerHTML='<p class="warn">Poste mid non identifié dans les données de ce champion. Pour éviter de proposer le build d’un autre poste, consulte l’onglet Builds.</p>';return}let cores=(mid.core||[]).filter(x=>Array.isArray(x.items)&&x.items.length),runes=(mid.runes||[]).filter(x=>Array.isArray(x.runes)&&x.runes.length);const itemsIndex=new Set((db.items?.items||[]).map(x=>String(x.id)));
const runesIndex=new Set((db.runes?.paths||[]).flatMap(p=>p.runes||[]).map(x=>String(x.id)));
const itemID=x=>String(x?.id??x);
const patches=[db.meta?.patch,db.items?.patch,db.runes?.patch].filter(Boolean);
const patchOK=patches.length===3&&new Set(patches).size===1;
const oldCores=cores.length,oldRunes=runes.length;
const invalidCores=cores.filter(x=>x.items.length!==3||new Set(x.items.map(itemID)).size!==3||x.items.some(i=>!itemsIndex.has(itemID(i))));
const invalidRunes=runes.filter(x=>x.runes.length!==5||new Set(x.runes.map(itemID)).size!==5||x.runes.some(i=>!runesIndex.has(itemID(i))));
cores=cores.filter(x=>!invalidCores.includes(x));runes=runes.filter(x=>!invalidRunes.includes(x));
$('engineAudit').innerHTML='<b>🧪 Contrôle qualité</b><p>Patchs déclarés par les sources (égalité des libellés uniquement) : '+patches.map(esc).join(' / ')+' — <b class="'+(patchOK?'good':'bad')+'">'+(patchOK?'identiques':'divergents ou incomplets')+'</b></p><p>Cores structurellement cohérents : '+cores.length+'/'+oldCores+' · Pages de cinq runes structurellement cohérentes : '+runes.length+'/'+oldRunes+'</p><p>Écartés : '+invalidCores.length+' core(s), '+invalidRunes.length+' page(s) (identifiant absent, doublon ou structure incorrecte).</p><p class="muted">Les noms français manquants ne sont plus confondus avec des objets invalides. Structure cohérente ≠ légalité et effets vérifiés. Effets des objets, interactions et compétences : vérification manuelle encore nécessaire. Aucun calcul de dégâts ou de survie n’est revendiqué.</p>';
if(!patchOK){box.innerHTML='<p class="bad">Analyse bloquée : les catalogues ne sont pas confirmés sur le même patch. Actualise les sources.</p>';return}
let mode=$('enginePriority').value;const sorted=(arr)=>[...arr].sort((a,b)=>engineScore(b,mode)-engineScore(a,mode));let coreList=sorted(cores),runeList=sorted(runes),{counts,unknown}=engineNotes(names),notes=engineReasons(counts);let html='<div class="item"><b>🎯 Adversaire direct au mid</b><p>'+esc(names[2])+' contre '+esc(c?.name||own)+'</p><small>Identification du match-up seulement : ses interactions précises restent à valider.</small></div><div class="item"><b>Composition adverse</b><p>'+names.map(esc).join(' · ')+'</p><p class="muted">Profils identifiés : '+(5-unknown.length)+'/5 · magique '+counts.ap+' · physique '+counts.ad+' · hybride '+counts.hybrid+' · tanks '+counts.tank+' · contrôles '+counts.cc+'</p>'+(unknown.length?'<p class="warn">Profils non vérifiés : '+unknown.map(esc).join(', ')+'. Analyse partielle.</p>':'')+'</div>';html+='<h3>🔎 Points de vigilance de la draft</h3><div class="item">'+notes.map(n=>'<p>• '+esc(n)+'</p>').join('')+'<small>Ces signaux ne prouvent pas qu’un objet particulier est optimal.</small></div>';html+='<h3>⚔️ Cores observés — ordre '+(mode==='pick'?'par usage':'par taux de victoire')+'</h3>';html+=coreList.length?coreList.slice(0,3).map((x,i)=>'<div class="item"><b>'+(i===0?'Premier core selon le critère choisi':'Alternative '+i)+'</b>'+engineEntry(x.items,'item')+'<span class="pill">Victoire observée : '+pct(x.win)+'</span><span class="pill">Utilisation observée : '+pct(x.pick)+'</span></div>').join(''):'<p class="warn">Aucun core de trois objets communiqué.</p>';if(coreList.length>1){const baseIds=coreList[0].items.map(itemID);html+='<h3>🔄 Différences entre les cores</h3><div class="item"><p class="muted">Comparaison descriptive des objets, pas une preuve de supériorité.</p>';coreList.slice(1,3).forEach((v,i)=>{const ids=v.items.map(itemID),added=ids.filter(id=>!baseIds.includes(id)),removed=baseIds.filter(id=>!ids.includes(id));const fmt=id=>esc(french(db.namesItems,id,db.items?.items?.find(x=>String(x.id)===id)?.name||id));html+='<p><b>Alternative '+(i+1)+'</b> : '+(added.length?'Ajoute '+added.map(fmt).join(', '):'Même sélection d’objets')+(removed.length?' ; retire '+removed.map(fmt).join(', '):'')+'.</p>'});html+='</div>'}html+='<div class="item"><b>📋 Ce que le moteur ne sait pas encore vérifier</b><p>• Passifs, statistiques et coûts de chaque objet dans le patch actif.</p><p>• Règles exactes des cinq emplacements de runes et effets uniques.</p><p>• Calculs de dégâts, résistances effectives et délais de récupération.</p><p>• Synergies précises entre compétences, runes et objets.</p><p>• Taux de victoire spécifiques à cette composition et tailles d’échantillon.</p><p class="warn">En l’absence de ces vérifications, aucun core n’est étiqueté « optimal ».</p></div>';html+='<h3>✨ Pages de runes observées</h3>';html+=runeList.length?runeList.slice(0,2).map((x,i)=>'<div class="item"><b>Page '+(i+1)+'</b>'+engineEntry(x.runes,'rune')+'<span class="pill">Victoire observée : '+pct(x.win)+'</span><span class="pill">Utilisation observée : '+pct(x.pick)+'</span></div>').join(''):'<p class="warn">Aucune page complète communiquée.</p>';html+='<p class="warn"><b>Important :</b> classement statistique descriptif, PAS une prédiction contre cette draft. Échantillons non fournis, donc aucune significativité garantie. L’ordre d’achat complet, les bottes et les remplacements d’objets ne sont pas encore calculés.</p><p class="muted">Source : WR China Meta · patch données : '+esc(db.meta?.patch||'?')+' · date du relevé : '+esc(date(data.date))+' · poste : '+esc(mid.pos_label||mid.label||'mid')+'.</p>';box.innerHTML=html}catch(e){box.innerHTML='<p class="bad">Données indisponibles : '+esc(String(e))+'</p>'}}

let realSelection={A:null,B:null};
function realLabel(x){return french(db.namesItems,x.id,x.name||String(x.id))}
function realNumber(x){let v=Number(String(x).replace(/\s/g,'').replace(',','.'));return Number.isFinite(v)?v:null}
// V10.1 : normalisation déterministe FR/EN/ZH. Aucun passif n'est compté comme bonus permanent.
const statNames={Hp:'PV',Armor:'Armure',Mr:'Résistance magique',Ad:'Dégâts d’attaque',Ap:'Puissance',Haste:'Accélération de compétence',As:'Vitesse d’attaque',Crit:'Chance de critique',CritDamage:'Dégâts critiques',ArmorPen:'Pénétration d’armure fixe',ArmorPenPct:'Pénétration d’armure (%)',MagicPen:'Pénétration magique fixe',MagicPenPct:'Pénétration magique (%)',Lifesteal:'Vol de vie',Omnivamp:'Vampirisme',Mana:'Mana',ManaRegen:'Régénération du mana',HpRegen:'Régénération des PV',MoveSpeed:'Vitesse de déplacement',HealShield:'Puissance soins / boucliers'};
const statAliases={Hp:['生命值','最大生命值','health','max health','points de vie','pv'],Armor:['护甲','armor','armure'],Mr:['魔法抗性','magic resistance','résistance magique','rm'],Ad:['攻击力','attack damage','dégâts d’attaque'],Ap:['法术强度','ability power','puissance'],Haste:['技能急速','ability haste','accélération de compétence'],As:['攻击速度','attack speed','vitesse d’attaque'],Crit:['暴击率','critical strike chance','chance de critique'],CritDamage:['暴击伤害','critical strike damage','dégâts critiques'],ArmorPen:['固定护甲穿透','flat armor penetration','pénétration d’armure fixe'],ArmorPenPct:['百分比护甲穿透','armor penetration %','pénétration d’armure (%)'],MagicPen:['固定法术穿透','flat magic penetration','pénétration magique fixe'],MagicPenPct:['百分比法术穿透','magic penetration %','pénétration magique (%)'],Lifesteal:['物理吸血','lifesteal','life steal','vol de vie'],Omnivamp:['全能吸血','omnivamp','vampirisme'],Mana:['法力值','maximum mana','mana'],ManaRegen:['法力回复','mana regeneration','régénération du mana'],HpRegen:['生命回复','health regeneration','régénération des pv'],MoveSpeed:['移动速度','movement speed','vitesse de déplacement'],HealShield:['治疗和护盾强度','heal and shield power','puissance des soins et boucliers']};
// Les mises à jour officielles ont priorité sur une valeur contradictoire du catalogue tiers.
const official73d=[
 {names:['divine sunderer','pourfendeur divin'],field:'price',value:3300,source:'Riot 7.3d : prix 3400 → 3300'},
 {names:['essence reaver','faux spectrale'],field:'Ad',value:55,source:'Riot 7.3d : dégâts d’attaque 50 → 55'},
 {names:['fiendhunter bolts','chasseur de monstres'],field:'passive',source:'Riot 7.3d : Barrage d’ouverture, critique normal 85 % ; dégâts bruts 17,5 %'},
 {names:['whispering circlet','diadème des murmures'],field:'passive',source:'Riot 7.3d : efficacité des soins et boucliers 6 %'},
 {names:['diadem of songs','diadème musical'],field:'passive',source:'Riot 7.3d : efficacité des soins et boucliers 6 %'},
 {names:['stormrazor','lame tempête'],field:'passive',source:'Riot 7.3d : Éclair 100 dégâts ; vitesse de déplacement 35 %'}
];
function cleanText(x){return String(x||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim()}
function itemPatchNotes(x){const names=[realLabel(x),x.name,x.name_en,x.name_fr].filter(Boolean).map(v=>String(v).toLowerCase());return official73d.filter(p=>p.names.some(n=>names.some(v=>v.includes(n))))}
function readRealStats(x){
 const desc=cleanText(x.desc||x.description);
 // Les statistiques fixes se trouvent normalement en tête de description, avant les noms des passifs.
 // Arrêt volontaire au premier nom de passif connu ; si la structure est inconnue, on n'invente rien.
 let head=desc.split(/(?:献祭|荒芜|唯一被动|被动效果|唯一主动|passive:|unique passive|actif :|passif :)/i)[0];
 const values={},ambiguous=[];
 for(const [key,aliases] of Object.entries(statAliases)){
   let matches=[];
   for(const alias of aliases){const a=alias;
     for(const rx of [new RegExp(a+'\\s*[+:：]?\\s*(\\d+(?:[.,]\\d+)?)\\s*%?','ig'),new RegExp('\\+\\s*(\\d+(?:[.,]\\d+)?)\\s*'+a,'ig')]){
       for(const m of head.matchAll(rx))matches.push(Number(m[1].replace(',','.')));
     }
   }
   const unique=[...new Set(matches)];
   if(unique.length===1)values[key]=unique[0];else if(unique.length>1)ambiguous.push(key);
 }
 const patch=itemPatchNotes(x);for(const rule of patch)if(rule.field in statNames)values[rule.field]=rule.value;
 return {values,desc,ambiguous,patch,priceOverride:patch.find(p=>p.field==='price')?.value??null};
}
// V10.1 : tableau comparatif complet des statistiques reconnues ; absence ≠ zéro.
const itemStatGroups=[
 ['❤️ Défense',['Hp','Armor','Mr','HpRegen']],
 ['⚔️ Attaque',['Ad','As','Crit','CritDamage','Lifesteal','ArmorPen','ArmorPenPct']],
 ['🔮 Magie',['Ap','MagicPen','MagicPenPct','Omnivamp']],
 ['⏱️ Ressources et compétences',['Haste','Mana','ManaRegen']],
 ['👟 Mobilité et soutien',['MoveSpeed','HealShield']]
];
function itemFullComparison(){
 const chosen={};for(const side of ['A','B']){const id=$('realItem'+side)?.value;chosen[side]=db.items?.items?.find(x=>String(x.id)===String(id))||null}
 if(!chosen.A&&!chosen.B)return '<p class="muted">Sélectionne un objet A ou B pour afficher ses caractéristiques.</p>';
 const stats={A:chosen.A?readRealStats(chosen.A):null,B:chosen.B?readRealStats(chosen.B):null};
 let html='<h3>📋 Comparaison de toutes les caractéristiques identifiées</h3><p class="muted">« — » = non identifié dans la source, pas zéro. Les valeurs extraites restent à vérifier. Les passifs ne sont pas ajoutés aux bonus permanents.</p><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left">Caractéristique</th><th>Objet A</th><th>Objet B</th></tr></thead><tbody>';
 const cell=(side,key)=>stats[side]&&Object.prototype.hasOwnProperty.call(stats[side].values,key)?esc(String(stats[side].values[key])):'<span class="muted">—</span>';
 for(const [group,keys] of itemStatGroups){html+='<tr><th colspan="3" style="text-align:left;padding:11px 3px;color:#8ee9ce;border-top:1px solid #3a5271">'+esc(group)+'</th></tr>';for(const key of keys)html+='<tr><td style="padding:6px 3px">'+esc(statNames[key])+'</td><td style="text-align:center">'+cell('A',key)+'</td><td style="text-align:center">'+cell('B',key)+'</td></tr>'}
 html+='</tbody></table></div><h3>✨ Passifs et effets spéciaux</h3>';
 for(const side of ['A','B']){const x=chosen[side];if(!x)continue;const info=stats[side];html+='<details><summary>Objet '+side+' — '+esc(realLabel(x))+' : description et passifs source</summary><p class="muted">'+esc(info.desc||'Description indisponible')+'</p>'+(info.patch.length?'<p class="good">'+info.patch.map(q=>esc(q.source)).join('<br>')+'</p>':'')+'<p class="warn">Effets conditionnels non simulés. Traduction et conformité au patch à vérifier.</p></details>'}
 html+='<h3>⏱️ Effet de l’accélération de compétence</h3>';for(const side of ['A','B']){const h=stats[side]?.values?.Haste;if(h!==undefined)html+='<p>Objet '+side+' : +'+esc(h)+' accélération → '+(100*h/(100+h)).toFixed(1)+' % de réduction de récupération <em>sans autre accélération</em>.</p>'}return html+'<p class="warn">⚠️ Les passifs et les effets offensifs ne sont pas simulés automatiquement.</p>';
}
function refreshItemFullComparison(){const el=$('itemFullComparison');if(el)el.innerHTML=itemFullComparison()}
function statAuditHtml(x,info){const names=Object.entries(info.values).map(([k,v])=>esc(statNames[k]||k)+' : <b>+'+esc(v)+'</b>');
 return '<p><b>Statistiques repérées (FR / EN / 中文) :</b> '+(names.join(' · ')||'aucune extraction fiable')+'</p>'+
 (info.ambiguous.length?'<p class="warn">Valeurs ambiguës : '+info.ambiguous.map(k=>esc(statNames[k]||k)).join(', ')+'</p>':'')+
 (info.patch.length?'<p class="good"><b>Correctifs officiels 7.3d :</b><br>'+info.patch.map(p=>esc(p.source)).join('<br>')+'</p>':'')+
 '<p class="muted">Source catalogue : '+esc(db.items?.patch||'inconnue')+' · Extraction automatique à vérifier. Les passifs sont affichés, mais pas encore simulés.</p>';
}

// V8.7 : les <select> natifs Android ne prennent pas en charge les images.
// Un panneau personnalisé affiche les icônes réelles et conserve la sélection native en interne.
let itemPickerSide='A';
function itemVisual(x){const html=icon(x.icon);return html||'<span class="item-fallback">⚔️</span>'}
function itemPickerRender(){
 const q=$('itemPickerSearch').value.trim().toLocaleLowerCase('fr');
 const all=db.items?.items||[];
 const matched=itemFiltered($('itemPickerCategory').value,$('itemPickerTier').value,q);
 $('itemPickerCount').textContent=matched.length+' objet(s) trouvé(s) · '+(db.items?.patch||'patch inconnu');
 $('itemPickerGrid').innerHTML=matched.slice(0,100).map(x=>'<button type="button" class="item-pick" data-item="'+esc(x.id)+'"><span class="item-pick-img">'+itemVisual(x)+'</span><span class="item-pick-info"><strong>'+esc(realLabel(x))+'</strong><small>'+esc(x.price??'?')+' PO</small></span></button>').join('')+(matched.length>100?'<p class="muted">Affichage limité aux 100 premiers résultats. Affine la recherche.</p>':'');
 $('itemPickerGrid').querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{
   const side=itemPickerSide,id=b.dataset.item,sel=$('realItem'+side);
   sel.innerHTML='<option value="'+esc(id)+'">'+esc(realLabel((db.items?.items||[]).find(x=>String(x.id)===id)))+'</option>';
   sel.value=id;sel.dispatchEvent(new Event('change'));
   const x=(db.items?.items||[]).find(x=>String(x.id)===id);
   $('itemChosen'+side).innerHTML='<span class="item-pick-img">'+itemVisual(x)+'</span><span class="item-pick-info"><strong>'+esc(realLabel(x))+'</strong><small>'+esc(x.price??'?')+' PO · Modifier</small></span>';
   itemPickerClose();
 });
}
function itemPickerOpen(side){itemPickerSide=side;$('itemPickerSearch').value='';$('itemPickerOverlay').classList.remove('hidden');itemPickerRender();$('itemPickerSearch').focus()}
function itemPickerClose(){$('itemPickerOverlay').classList.add('hidden')}
function populateRealItems(){
 $('itemPickerSearch').oninput=itemPickerRender;
 $('itemPickerCategory').onchange=itemPickerRender;$('itemPickerTier').onchange=itemPickerRender;
 $('itemCatalogCategory').onchange=renderItems;$('itemCatalogTier').onchange=renderItems;
 $('itemPickerOverlay').addEventListener('click',e=>{if(e.target.id==='itemPickerOverlay')itemPickerClose()});
 const all=db.items?.items||[];
 for(const side of ['A','B']){
   const sel=$('realItem'+side);
   const fill=()=>{sel.innerHTML='<option value="">— Choisir un objet —</option>'+all.map(x=>'<option value="'+esc(x.id)+'">'+esc(realLabel(x))+' · '+esc(x.price??'?')+' PO</option>').join('');};
   sel.addEventListener('change',()=>{
     const x=all.find(v=>String(v.id)===sel.value);realSelection[side]=x||null;$('realStatsConfirmed').checked=false;
     if(!x){$('realItemAudit').textContent='Sélection incomplète.';return}
     $('calcName'+side).value=realLabel(x);const info=readRealStats(x);const cost=info.priceOverride??realNumber(x.price);if(cost!==null)$('calcCost'+side).value=cost;
     for(const key of ['Hp','Armor','Mr'])$('calc'+key+side).value=info.values[key]??0;
     const missing=['Hp','Armor','Mr'].filter(k=>info.values[k]===undefined);
     const other=side==='A'?'B':'A';
     $('realItemAudit').innerHTML='<p><b>'+esc(realLabel(x))+'</b> · ID '+esc(x.id)+' · prix corrigé : '+esc(cost??'non disponible')+' PO · patch catalogue : '+esc(db.items?.patch||'inconnu')+'</p>'+statAuditHtml(x,info)+'<p class="warn">'+(missing.length?'Bonus non identifiés : '+missing.join(', ')+'. Zéro = valeur provisoire, pas une preuve d’absence de bonus. ':'')+'Les passifs et effets uniques sont exclus. Contrôle les valeurs dans le jeu avant de confirmer.</p><details><summary>Description source</summary><p>'+esc(info.desc||'Aucune description')+'</p></details>';refreshItemFullComparison();
   });fill();
 }
}
function calculateItemValue(){
 if((realSelection.A||realSelection.B)&&!$('realStatsConfirmed').checked){$('calcResult').innerHTML='<p class="warn">⚠️ Confirme les statistiques des objets réels après vérification dans Wild Rift avant de calculer. Les champs à zéro peuvent correspondre à des données manquantes.</p>';return}

 const val=k=>{let e=$('calc'+k),n=Number(e?.value);return Number.isFinite(n)&&n>=0?n:NaN};
 const fields=['CostA','CostB','HpA','HpB','ArmorA','ArmorB','MrA','MrB','BaseHp','BaseArmor','BaseMr','Physical','Magic'];
 if(fields.some(k=>!Number.isFinite(val(k)))||val('BaseHp')<=0){$('calcResult').innerHTML='<p class="bad">Saisis des nombres positifs ou nuls, avec des PV de base supérieurs à zéro.</p>';return}
 const d=(res,raw)=>raw*100/(100+res);
 const baseD=d(val('BaseArmor'),val('Physical'))+d(val('BaseMr'),val('Magic'));
 function score(x){const hp=val('BaseHp')+val('Hp'+x),armor=val('BaseArmor')+val('Armor'+x),mr=val('BaseMr')+val('Mr'+x);const received=d(armor,val('Physical'))+d(mr,val('Magic'));const physEhp=hp*(1+armor/100),magicEhp=hp*(1+mr/100);return {hp,received,physEhp,magicEhp,remaining:hp-received,cost:val('Cost'+x),avoided:baseD-received};}
 const a=score('A'),b=score('B'),f=n=>Math.round(n).toLocaleString('fr-FR');
 const nA=esc($('calcNameA').value||'Objet A'),nB=esc($('calcNameB').value||'Objet B');
 const row=(label,aa,bb)=>'<tr><td>'+label+'</td><td>'+f(aa)+'</td><td>'+f(bb)+'</td></tr>';
 $('calcResult').innerHTML='<b>📐 Comparaison calculée</b><div style="overflow-x:auto"><table style="width:100%;font-size:13px;border-collapse:collapse"><thead><tr><th style="text-align:left">Indicateur</th><th>'+nA+'</th><th>'+nB+'</th></tr></thead><tbody>'+row('Coût (PO)',a.cost,b.cost)+row('PV totaux',a.hp,b.hp)+row('PV effectifs physiques',a.physEhp,b.physEhp)+row('PV effectifs magiques',a.magicEhp,b.magicEhp)+row('Dégâts reçus (scénario)',a.received,b.received)+row('PV restants (scénario)',a.remaining,b.remaining)+row('Dégâts évités vs sans objet',a.avoided,b.avoided)+'</tbody></table></div><p class="muted">PV effectifs = PV × (1 + résistance/100). Ce sont des résultats conditionnels, <b>pas une mesure de puissance globale ni un classement de builds</b>. Le coût n’est pas normalisé en valeur offensive ; les effets actifs/passifs, pénétration, soins et boucliers sont exclus.</p>';
 // Scénarios conditionnels : même volume de dégâts bruts, répartition différente.
 const total=val('Physical')+val('Magic');
 const scenarios=[['Dégâts physiques dominants',0.8],['Dégâts équilibrés',0.5],['Dégâts magiques dominants',0.2]];
 const projected=(x,physShare)=>{const hp=val('BaseHp')+val('Hp'+x);const received=d(val('BaseArmor')+val('Armor'+x),total*physShare)+d(val('BaseMr')+val('Mr'+x),total*(1-physShare));return hp-received};
 const scenarioRows=scenarios.map(([name,share])=>{const ra=projected('A',share),rb=projected('B',share),delta=ra-rb;const winner=Math.abs(delta)<0.5?'Égalité':delta>0?nA:nB;return '<tr><td>'+esc(name)+'</td><td>'+f(ra)+'</td><td>'+f(rb)+'</td><td>'+winner+'</td></tr>'}).join('');
 const winnerCurrent=a.remaining===b.remaining?'Égalité':a.remaining>b.remaining?nA:nB;
 $('calcResult').innerHTML+='<h3>⚖️ Sensibilité à la composition des dégâts</h3><p class="muted">Même total de '+f(total)+' dégâts bruts, réparti différemment. Les chiffres indiquent les PV restants : une valeur négative signifie que le personnage serait éliminé dans ce modèle.</p><div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr><th>Scénario</th><th>'+nA+'</th><th>'+nB+'</th><th>Plus de PV</th></tr></thead><tbody>'+scenarioRows+'</tbody></table></div><p><b>Scénario saisi :</b> '+winnerCurrent+' conserve le plus de PV ('+f(Math.abs(a.remaining-b.remaining))+' PV d’écart).</p><p class="warn">⚠️ Ces résultats ne déterminent PAS le meilleur objet global. Ils ignorent les dégâts infligés, passifs, soins, boucliers, pénétration, dégâts bruts véritables, CC et le timing des achats. Ne pas interpréter la répartition 80/20 comme une prédiction de la draft.</p>';
}
for(const side of ['A','B'])for(const k of ['Hp','Armor','Mr','Cost'])$('calc'+k+side).addEventListener('input',()=>{if(realSelection.A||realSelection.B)$('realStatsConfirmed').checked=false});
$('calcRun').onclick=calculateItemValue;refreshItemFullComparison();

$('engineAnalyze').onclick=analyzeDraft;

$('champRoleFilter').addEventListener('change',()=>{filterChampionsByRole();if($('champ').value)loadBuild()});itemFilterInit();init();

$('advRun').addEventListener('click',()=>{
 const n=id=>Number($(id)?.value);
 const ids=['calcBaseHp','calcBaseArmor','calcBaseMr','calcPhysical','calcMagic','calcHpA','calcHpB','calcArmorA','calcArmorB','calcMrA','calcMrB','advArmorFlat','advArmorPct','advMrFlat','advMrPct','advTrue','advShieldA','advShieldB'];
 if(ids.some(id=>!Number.isFinite(n(id))||n(id)<0)||n('calcBaseHp')<=0||n('advArmorPct')>100||n('advMrPct')>100){$('advResult').innerHTML='<p class="bad">Valeurs invalides : nombres positifs, pénétration en % limitée à 100.</p>';return}
 if((realSelection.A||realSelection.B)&&!$('realStatsConfirmed').checked){$('advResult').innerHTML='<p class="warn">Confirme d’abord les caractéristiques réelles des objets.</p>';return}
 const resistance=(base,pct,flat)=>Math.max(0,base*(1-pct/100)-flat);
 const result=side=>{
  const hp=n('calcBaseHp')+n('calcHp'+side);
  const armor=resistance(n('calcBaseArmor')+n('calcArmor'+side),n('advArmorPct'),n('advArmorFlat'));
  const mr=resistance(n('calcBaseMr')+n('calcMr'+side),n('advMrPct'),n('advMrFlat'));
  const taken=n('calcPhysical')*100/(100+armor)+n('calcMagic')*100/(100+mr)+n('advTrue');
  return {armor,mr,taken,remaining:hp+n('advShield'+side)-taken};
 };
 const a=result('A'),b=result('B'),f=v=>Math.round(v).toLocaleString('fr-FR');
 const row=(label,k)=>'<tr><td>'+label+'</td><td>'+f(a[k])+'</td><td>'+f(b[k])+'</td></tr>';
 const winner=Math.abs(a.remaining-b.remaining)<0.01?'Égalité':a.remaining>b.remaining?'A':'B';
 $('advResult').innerHTML='<h3>🧠 Résultat avancé</h3><div style="overflow-x:auto"><table style="width:100%;font-size:13px"><tr><th>Mesure</th><th>A</th><th>B</th></tr>'+row('Armure effective','armor')+row('RM effective','mr')+row('Dégâts subis','taken')+row('PV + bouclier restants','remaining')+'</table></div><p><b>Avantage dans ce scénario : '+winner+'</b> ('+f(Math.abs(a.remaining-b.remaining))+' points).</p><p class="warn">Hypothèses simplifiées : pas de résistances négatives, soins, passifs ou durée de bouclier. Ce résultat n’est pas un classement global d’objets.</p>';
});

// V10 — Optimiseur transparent : pas de ratios de champion inventés ni de statistiques de victoire fictives.
function optId(x){return String(x?.id??x)}
function optCost(x){const v=Number(x?.price);return Number.isFinite(v)?v:0}
function optStats(x){try{return readRealStats(x).values||{}}catch(e){return {}}}
function optVal(v,k){return Number(v?.[k])||0}
function optMeta(x){
 const name=realLabel(x).toLocaleLowerCase('fr'),desc=String(x?.desc||x?.description||'').toLocaleLowerCase('fr');
 return {name,desc,boots:/bottes|bottes de|boots|greaves|靴|鞋|enchante|enchant/i.test(name),antiheal:/morello|rappel mortel|mortal reminder|épineuse|thornmail|chempunk|anti.?heal|blessures graves/i.test(name),antishield:/crochet de serpent|serpent.fang|ombreflamme|shadowflame/i.test(name),dot:/liandry|tourment|torment|créateur de failles|riftmaker|lame du roi déchu|ruined king/i.test(name)};
}
function optWeights(mode,c){
 const w={Hp:0.07,Armor:0.7,Mr:0.7,Ad:0.9,Ap:0.55,Haste:1.1,As:0.45,Crit:0.65,ArmorPen:1.2,ArmorPenPct:1.1,MagicPen:1.2,MagicPenPct:1.1,Lifesteal:1.2,Omnivamp:1.3,Mana:0.018};
 if(mode==='damage'){for(const k of ['Ad','Ap','As','Crit','ArmorPen','ArmorPenPct','MagicPen','MagicPenPct'])w[k]*=1.7;w.Hp*=.45;w.Armor*=.45;w.Mr*=.45}
 if(mode==='survive'){for(const k of ['Hp','Armor','Mr'])w[k]*=2.5;for(const k of ['Ad','Ap','As','Crit'])w[k]*=.45}
 w.Armor*=1+Math.min(3,c.ad)*.22;w.Mr*=1+Math.min(3,c.ap)*.25;return w;
}
function optScore(x,mode,c,coreStats){
 const st=optStats(x),w=optWeights(mode,c);
 let score=Object.entries(w).reduce((n,[k,v])=>n+optVal(st,k)*v,0);
 // Prioritize compatibility with known observed core, not a universal class prediction.
 const ap=optVal(coreStats,'Ap'),ad=optVal(coreStats,'Ad');
 if(ap>ad*1.6){score+=optVal(st,'Ap')*.5;score-=optVal(st,'Ad')*.25}
 else if(ad>ap*1.6){score+=optVal(st,'Ad')*.65;score-=optVal(st,'Ap')*.25}
 const m=optMeta(x);
 if((c.heal||c.sustain>=2)&&m.antiheal)score+=15;
 if(c.shield>=2&&m.antishield)score+=12;
 if(c.tank>=2&&m.dot)score+=12;
 const cost=optCost(x);
 if(cost>0)score*=Math.max(.65,Math.min(1.15,3000/cost));
 return score;
}
function optIsFull(x){const cost=optCost(x),name=optMeta(x).name;return cost>=2000&&cost<=5000&&!/composant|component|elixir|consommable|trinket/i.test(name)}
function optSumStats(ids,items){const sum={};ids.forEach(id=>{const x=items.find(y=>String(y.id)===String(id));if(x)Object.entries(optStats(x)).forEach(([k,v])=>sum[k]=(sum[k]||0)+(Number(v)||0))});return sum}
function optStatSummary(ids,items){
 const st=optSumStats(ids,items);
 const keys=['Hp','Armor','Mr','Ad','Ap','Haste','As','Crit','ArmorPen','ArmorPenPct','MagicPen','MagicPenPct'];
 return keys.filter(k=>st[k]).map(k=>esc(statNames[k]||k)+' : <b>+'+Math.round(st[k]*10)/10+'</b>').join(' · ')||'Statistiques permanentes non identifiées';
}
function optSelect(core,items,mode,c){
 const ids=core.map(optId),used=new Set(ids),coreStats=optSumStats(ids,items);
 const pool=items.filter(x=>optIsFull(x)&&!used.has(String(x.id))&&!optMeta(x).boots);
 // Avoid adding items of an incompatible damage class when the observed core is clear.
 const ap=optVal(coreStats,'Ap'),ad=optVal(coreStats,'Ad');
 const viable=pool.filter(x=>{const st=optStats(x);return !(ap>ad*1.6&&optVal(st,'Ad')>0&&!optVal(st,'Ap'))&&!(ad>ap*1.6&&optVal(st,'Ap')>0&&!optVal(st,'Ad'))});
 const ranked=viable.map(x=>({x,score:optScore(x,mode,c,coreStats)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
 const extras=[];
 for(const r of ranked){if(extras.length>=2)break;const id=String(r.x.id);if(!used.has(id)){extras.push(r.x);used.add(id)}}
 return {ids:[...ids,...extras.map(x=>String(x.id))],extras,ranked};
}
function optPosition(data){
 return (data.positions||[]).find(p=>/mid|middle|中路|中单/i.test(String(p.pos_label||p.label||'')))||
 (data.positions||[]).find(p=>String(p.pos)==='3'||String(p.position)==='3'||String(p.pos_id)==='3');
}
async function optRun(){
 const box=$('optResult'),own=draftPicks[2],enemy=draftPicks.slice(5),items=db.items?.items||[];
 if(!own){box.innerHTML='<p class="warn">Sélectionne ton champion dans la case Mid de ta draft.</p>';return}
 if(enemy.some(x=>!x)){box.innerHTML='<p class="warn">Renseigne les cinq adversaires pour adapter les suggestions à la draft.</p>';return}
 if(!items.length){box.innerHTML='<p class="bad">Catalogue d’objets indisponible. Impossible de calculer.</p>';return}
 const patches=[db.meta?.patch,db.items?.patch,db.runes?.patch];
 if(patches.some(x=>!x)||new Set(patches).size!==1){box.innerHTML='<p class="bad">Catalogues de patchs divergents ou incomplets : optimisation bloquée.</p>';return}
 box.innerHTML='<p>Chargement des builds mid observés…</p>';
 try{
 const data=await get(BASE+'/api/build/'+encodeURIComponent(own)+'_'+$('optRank').value+'.json');
 const mid=optPosition(data);if(!mid){box.innerHTML='<p class="warn">Aucune donnée du poste Mid identifiable pour ce champion. Aucun build d’un autre poste ne sera substitué.</p>';return}
 const valid=new Set(items.map(x=>String(x.id)));
 const cores=(mid.core||[]).filter(x=>Array.isArray(x.items)&&x.items.length===3&&new Set(x.items.map(optId)).size===3&&x.items.every(i=>valid.has(optId(i))));
 if(!cores.length){box.innerHTML='<p class="warn">Aucun core Mid complet et cohérent pour ce champion à ce rang.</p>';return}
 const names=enemy.map(id=>pickerName(champions.find(x=>x.id===id)||{id,name:id}));
 const {counts:c,unknown}=engineNotes(names);
 const modes=[['balanced','⚖️ Équilibré'],['damage','⚔️ Agressif'],['survive','🛡️ Défensif']];
 const preferred=$('optMode').value;modes.sort((a,b)=>(a[0]===preferred?-1:0)-(b[0]===preferred?-1:0));
 const coreSorted=[...cores].sort((a,b)=>(engineNum(b.pick)||0)-(engineNum(a.pick)||0));
 let html='<p><b>Champion :</b> '+esc(pickerName(champions.find(x=>x.id===own)||{id:own,name:own}))+' · <b>Patch :</b> '+esc(patches[0])+' · <b>Rang :</b> '+esc(data.rank_label||$('optRank').value)+'</p>';
 html+='<p>Profils adverses identifiés : '+(5-unknown.length)+'/5 · physiques '+c.ad+' · magiques '+c.ap+' · tanks '+c.tank+' · soins '+c.heal+' · boucliers '+c.shield+'.</p>';
 if(unknown.length)html+='<p class="warn">Profils non identifiés : '+unknown.map(esc).join(', ')+'. Le classement est partiel.</p>';
 for(const [mode,title] of modes){
 const core=coreSorted[0].items,chosen=optSelect(core,items,mode,c);
 const boots=items.filter(x=>optIsFull(x)&&optMeta(x).boots).sort((a,b)=>optScore(b,mode,c,optSumStats(chosen.ids,items))-optScore(a,mode,c,optSumStats(chosen.ids,items)))[0];
 const cost=chosen.ids.reduce((sum,id)=>sum+optCost(items.find(x=>String(x.id)===id)),0)+(boots?optCost(boots):0);
 html+='<div class="panel"><h3>'+title+'</h3><p><b>Core Mid observé (3 objets) :</b></p>'+engineEntry(core,'item')+'<p><b>Compléments proposés (heuristique) :</b></p>';
 html+=chosen.extras.length?engineEntry(chosen.extras.map(x=>x.id),'item'):'<p class="warn">Pas assez de candidats compatibles vérifiables.</p>';
 html+='<p><b>Bottes candidates :</b> '+(boots?itemChip(boots.id):'non déterminées')+'</p>';
 html+='<p><b>Coût indicatif :</b> '+cost.toLocaleString('fr-FR')+' PO (objets reconnus uniquement ; les enchantements sont exclus).</p>';
 html+='<p><b>Statistiques identifiées, hors bottes :</b> '+optStatSummary(chosen.ids,items)+'</p>';
 html+='<p class="muted">Core choisi par usage observé ; compléments classés par bonus détectés, coût et profils adverses. Ce score est une heuristique, pas un calcul de DPS ou une preuve d’optimalité. Vérifier les effets uniques et la légalité des achats.</p></div>';
 }
 const pages=(mid.runes||[]).filter(r=>Array.isArray(r.runes)&&r.runes.length===5).sort((a,b)=>(engineNum(b.pick)||0)-(engineNum(a.pick)||0));
 html+='<h3>✨ Runes Mid observées</h3>'+(pages.length?engineEntry(pages[0].runes,'rune')+'<p>Page observée la plus utilisée parmi celles disponibles. Compatibilité exacte à vérifier.</p>':'<p class="warn">Aucune page de runes Mid complète disponible.</p>');
 html+='<details><summary>🔬 Méthode et limites importantes</summary><p>Le moteur exploite les cores Mid et runes observés, identifie certains profils adverses, extrait les statistiques de base des objets et classe des compléments. Il ne modélise pas encore les ratios de sorts, les déclenchements de passifs, les interactions d’effets uniques, la pénétration en combat, ni les variations de victoire selon les dix champions. Les descriptions multilingues peuvent être mal interprétées. Les objets de complément ne sont pas nécessairement joués au poste Mid ; leur légalité et leur pertinence doivent être vérifiées. Les prix ne représentent pas une trajectoire d’achat optimisée.</p></details>';
 box.innerHTML=html;
 }catch(e){box.innerHTML='<p class="bad">Optimisation indisponible : '+esc(String(e))+'</p>'}
}
$('optRun').addEventListener('click',optRun);

// V10.1 : une seule interface. Les anciens calculateurs restent dans le DOM pour compatibilité,
// mais ne sont plus affichés à l’utilisateur.
function simpleDraft(){
 for(const [target,start] of [['simpleAllies',0],['simpleEnemies',5]]){
  $(target).innerHTML=draftRoles.map((role,i)=>{
   const idx=start+i,c=champions.find(x=>String(x.id)===String(draftPicks[idx])),name=c?pickerName(c):'Choisir…';
   return '<button type="button" class="draft-slot '+(c?'filled':'')+'" data-simple-slot="'+idx+'"><span class="slot-icon">'+(c?championPortrait(c.id,name):'+')+'</span><span class="slot-text"><span class="slot-role">'+(idx===2?'TON MID · ':'')+esc(role)+'</span>'+esc(name)+'</span></button>';
  }).join('');
 }
 document.querySelectorAll('[data-simple-slot]').forEach(btn=>btn.onclick=()=>{
  const idx=Number(btn.dataset.simpleSlot);pickerTarget=idx;openPicker();pickerTarget=idx;pickerFilter=draftRoles[idx%5].toLowerCase();$('pickerSearch').value='';renderPicker();
 });
 $('simpleMessage').textContent=draftPicks.filter(Boolean).length+'/10 champions sélectionnés';
}
const originalRenderDraft=renderDraft;
renderDraft=function(){originalRenderDraft();simpleDraft()};
$('simpleClear').onclick=()=>{draftPicks=Array(10).fill('');saveDraft();renderDraft();$('simpleResults').style.display='none'};
function simpleItem(id){return (db.items?.items||[]).find(x=>String(x.id)===String(id))}
function simpleItemName(x){return x?realLabel(x):'Objet non identifié'}
function simpleCoreSignature(core){return core.items.map(optId).sort().join('-')}
function simpleWhy(x,c,own){
 const st=optStats(x),m=optMeta(x),why=[];
 if(optVal(st,'Armor')>0&&c.ad>=2)why.push('armure utile contre les '+c.ad+' menaces physiques identifiées');
 if(optVal(st,'Mr')>0&&c.ap>=2)why.push('résistance magique utile contre les '+c.ap+' menaces magiques identifiées');
 if(optVal(st,'Hp')>0)why.push('+'+optVal(st,'Hp')+' PV identifiés pour améliorer la survie');
 if(m.antiheal&&c.heal>0)why.push('réponse possible aux soins adverses (application des blessures graves à vérifier)');
 if(m.antishield&&c.shield>0)why.push('réponse possible aux boucliers adverses (effet exact à vérifier)');
 if(m.dot&&c.tank>=2)why.push('candidat contre les combats prolongés face aux tanks (passif non simulé)');
 if(optVal(st,'Haste')>0)why.push('+'+optVal(st,'Haste')+' accélération de compétence identifiée');
 if(optVal(st,'Ap')>0)why.push('+'+optVal(st,'Ap')+' puissance identifiée');
 if(optVal(st,'Ad')>0)why.push('+'+optVal(st,'Ad')+' dégâts d’attaque identifiés');
 return why.slice(0,2).join(' ; ')||'alternative issue du catalogue ; effet précis à vérifier en jeu';
}
function simpleCandidates(core,mode,c,items,own,enemyNames){
 const base=core.items.map(optId),known=new Set(base),stats=optSumStats(base,items),ap=optVal(stats,'Ap'),ad=optVal(stats,'Ad');
 const ctx=WRDIDraftIntelligence.context(own,enemyNames,c,base.map(simpleItem).filter(Boolean).map(realLabel));
 return items.filter(x=>{
  if(!optIsFull(x)||known.has(String(x.id))||optMeta(x).boots)return false;
  const st=optStats(x);if(!Object.keys(st).length)return false;
  if(ap>ad*1.6&&optVal(st,'Ad')>0&&!optVal(st,'Ap'))return false;
  if(ad>ap*1.6&&optVal(st,'Ap')>0&&!optVal(st,'Ad'))return false;
  return true;
 }).map(x=>{const rule=WRDIDraftIntelligence.evaluate(realLabel(x),optStats(x),ctx,mode);
  return {x,rule,score:optScore(x,mode,c,stats)*.35+rule.score};
 }).filter(v=>v.score>0&&v.rule.allowed).sort((a,b)=>b.score-a.score);
}
async function simpleAnalyze(){
 const out=$('simpleResults'),own=draftPicks[2],enemy=draftPicks.slice(5),items=db.items?.items||[];
 const reportFailure=(message)=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('wrdi:build-error',{detail:{message:String(message),draftFingerprint:JSON.stringify(draftPicks)}}));};
 out.style.display='block';
 if(!own||enemy.some(x=>!x)){out.innerHTML='<p class="warn">Choisis ton champion Mid et les cinq adversaires. Tu peux ajouter tes quatre alliés pour compléter la draft.</p>';reportFailure('Sélectionne ton mid et les cinq adversaires.');out.scrollIntoView({behavior:'smooth'});return}
 const patches=[db.meta?.patch,db.items?.patch,db.runes?.patch];
 if(!items.length||patches.some(x=>!x)||new Set(patches).size!==1){out.innerHTML='<p class="bad">Données indisponibles ou patchs incohérents : aucune recommandation non vérifiable.</p>';reportFailure('Sources d’objets indisponibles ou versions de patch divergentes.');return}
 out.innerHTML='<p>Analyse des cores Mid et du catalogue en cours…</p>';
 try{
 const data=await get(BASE+'/api/build/'+encodeURIComponent(own)+'_1.json'),mid=optPosition(data);
 if(!mid){out.innerHTML='<p class="warn">Aucun core Mid identifiable pour ce champion dans la source actuelle.</p>';reportFailure('Aucun core Mid identifié pour ce champion.');return}
 const valid=new Set(items.map(x=>String(x.id)));
 const cores=(mid.core||[]).filter(x=>Array.isArray(x.items)&&x.items.length===3&&x.items.every(y=>valid.has(optId(y)))&&new Set(x.items.map(optId)).size===3);
 const unique=[...new Map(cores.slice().sort((a,b)=>(engineNum(b.pick)||0)-(engineNum(a.pick)||0)).map(c=>[simpleCoreSignature(c),c])).values()].sort((a,b)=>(engineNum(b.pick)||0)-(engineNum(a.pick)||0));
 if(!unique.length){out.innerHTML='<p class="warn">Aucun core Mid complet et reconnu pour ce champion. Le moteur refuse de substituer un build d’un autre rôle.</p>';reportFailure('Aucun core Mid complet vérifiable dans les données externes.');return}
 // Le registre client est exclusivement un garde-fou de compatibilite.
 // Ne jamais convertir son contenu exploratoire en source de builds optimaux.
 let itemSafety=null,itemSafetyReason='Audit des restrictions indisponible.';
 try{
  if(window.WRDI_GalioItemGuardV1424&&window.WRDI_CoreV14){
   const [clientCatalog,clientRules]=await Promise.all([
    get('./data/items-client-7.3d-v12.json'),
    get('./data/item-restrictions-client-7.3d-v12.json')]);
   itemSafety=window.WRDI_GalioItemGuardV1424.prepare({
    catalog:clientCatalog,rules:clientRules,core:window.WRDI_CoreV14,livePatch:patches[0]});
   if(!itemSafety.ok)itemSafetyReason=itemSafety.reason;
  }
 }catch(e){itemSafetyReason=String(e?.message||e)}
 const enemyNames=enemy.map(id=>pickerName(champions.find(x=>String(x.id)===String(id))||{id,name:id})),{counts:c,unknown}=engineNotes(enemyNames);
 const title=pickerName(champions.find(x=>String(x.id)===String(own))||{id:own,name:own});
 let html='<h2>🏆 Tes recommandations — '+esc(title)+'</h2><p class="muted">Patch '+esc(patches[0])+' · Cores Mid observés · '+(5-unknown.length)+'/5 profils adverses identifiés.</p>';
 if(unknown.length)html+='<p class="warn">Profil(s) non reconnu(s) : '+unknown.map(esc).join(', ')+'. Analyse de draft partielle.</p>';
 const labels=['🥇 Core principal','⚔️ Alternative 2','🛡️ Alternative 3'];
 // Un core populaire peut encore comporter une incompatibilite ou un nom non resolu.
 // Privilegier les cores equipables uniquement si la correspondance est certaine.
 const verifiedCores=itemSafety?.ok?unique.filter(core=>{
  const names=core.items.map(optId).map(id=>simpleItemName(simpleItem(id)));
  return window.WRDI_GalioItemGuardV1424.validateSelection(names,itemSafety,{requireFullCore:true}).ok;
 }):[];
 const picks=(verifiedCores.length?verifiedCores:unique).slice(0,3);
 const coreCompatibilityKnown=verifiedCores.length>0;
 for(let i=0;i<picks.length;i++){
  const core=picks[i],ids=core.items.map(optId),why=[];
  if(i===0)why.push('core Mid le plus joué parmi les combinaisons disponibles dans les données chargées');
  else why.push('autre combinaison réellement observée au poste Mid, distincte du core principal');
  if(c.ad>=3)why.push('attention : '+c.ad+' menaces physiques, envisager de l’armure en complément');
  if(c.ap>=3)why.push('attention : '+c.ap+' menaces magiques, envisager de la résistance magique');
  if(c.tank>=2)why.push(c.tank+' tanks identifiés : privilégier les dégâts prolongés selon les interactions vérifiées');
  html+='<div class="simple-result"><h3>'+labels[i]+'</h3>'+engineEntry(ids,'item')+'<p class="simple-reason"><b>Pourquoi :</b> '+esc(why.join(' ; '))+'.</p><p class="muted">Ces trois objets sont un core observé, pas une preuve de supériorité contre cette draft.</p></div>';
 }
 if(!coreCompatibilityKnown)html+='<p class="warn">Aucun core Mid rapproché et certifié compatible dans le catalogue client : core affiché uniquement comme observation historique.</p>';
 if(picks.length<3)html+='<p class="muted">Seulement '+picks.length+' core(s) Mid distinct(s) vérifiables : aucune alternative inventée.</p>';
 html+='<div class="simple-result"><h3>🔄 Objets situationnels</h3><p class="muted">Candidats pour compléter ou adapter le core principal. Le moteur tient compte des statistiques reconnues, du coût et des profils adverses.</p>';
 const base=picks[0],candidateGroups=[['🛡️ Défense','survive'],['⚔️ Dégâts','damage'],['⚖️ Polyvalence','balanced']];
 const baseItemNames=base.items.map(optId).map(id=>simpleItemName(simpleItem(id)));
 const baseCheck=itemSafety?.ok?window.WRDI_GalioItemGuardV1424.validateSelection(baseItemNames,itemSafety,{requireFullCore:true}):null;
 const canAudit=!!baseCheck?.ok;
 if(!canAudit)html+='<p class="warn">Objets situationnels suspendus : '+esc(baseCheck?.reason||itemSafetyReason)+' . Le core reste une combinaison observée, sans compatibilité certifiée.</p>';
 else html+='<p class="muted">Restrictions client '+esc(itemSafety.patch)+' vérifiées pour les objets rapprochés ; pas de simulation complète des passifs.</p>';
 const used=new Set(base.items.map(optId));let count=0;
 const chosen=[];
 for(const [label,mode] of candidateGroups){
  const ranked=simpleCandidates(base,mode,c,items,own,enemyNames);
  const contextEngine=window.WRDI_GalioItemContextV1427;
  if(canAudit&&contextEngine){
   for(const v of ranked)v.clientContext=contextEngine.inspect({
    itemName:simpleItemName(v.x),prepared:itemSafety,threats:c
   });
   ranked.sort((a,b)=>{
    const confidence=x=>x.clientContext?.ok?x.clientContext.suitabilityIndex:0;
    return confidence(b)-confidence(a)||b.score-a.score;
   });
  }
  const eligible=canAudit?ranked.filter(v=>{
   if(used.has(String(v.x.id))||chosen.some(z=>z.rule.family&&z.rule.family===v.rule.family))return false;
   const names=[...baseItemNames,...chosen.map(z=>simpleItemName(z.x)),simpleItemName(v.x)];
   return window.WRDI_GalioItemGuardV1424.validateSelection(names,itemSafety).ok;
  }):[];
  const comparator=window.WRDI_GalioItemComparatorV1428;
  const comparison=comparator&&eligible.length?comparator.compare({
    candidates:eligible.slice(0,30).map(v=>({name:simpleItemName(v.x),refId:String(v.x.id)})),
    prepared:itemSafety,threats:c,
    coreNames:[...baseItemNames,...chosen.map(z=>simpleItemName(z.x))]
  }):null;
  const pick=comparison?.ok?eligible.find(v=>String(v.x.id)===comparison.choice.refId):eligible[0];
  if(!pick)continue;
  pick.relativeComparison=comparison?.ok?comparison:null;
  used.add(String(pick.x.id));chosen.push(pick);count++;
  const passiveReasons=pick.clientContext?.ok?pick.clientContext.indications:[];
  const contextualReason=pick.relativeComparison?.relativeReason||
   (passiveReasons.length?passiveReasons.join(' ; '):(pick.rule.reasons.join(' ; ')||simpleWhy(pick.x,c,own)));
  html+='<div class="simple-sub">'+label+'</div>'+itemChip(pick.x.id)+'<p class="simple-reason"><b>Pourquoi :</b> '+esc(contextualReason)+'. <b>Quand :</b> '+esc(pick.rule.timing)+'. <b>Emplacement :</b> compléter le core, ou remplacer un objet dont le passif est devenu moins utile. Pas de remplacement automatique sans données vérifiées.</p>';
 }
 if(!count&&canAudit)html+='<p class="warn">Aucun complément à la fois documenté et compatible avec le core.</p>';
 html+='</div>';
 const pages=(mid.runes||[]).filter(r=>Array.isArray(r.runes)&&r.runes.length===5).sort((a,b)=>(engineNum(b.pick)||0)-(engineNum(a.pick)||0));
 html+='<div class="simple-result"><h3>✨ Runes</h3>'+(pages.length?engineEntry(pages[0].runes,'rune')+'<p class="simple-reason">Page Mid observée. Son adaptation exacte à la draft n’est pas encore calculée.</p>':'<p class="warn">Pas de page Mid complète vérifiable.</p>')+'</div>';
 html+='<details><summary>🔬 Ce qui est calculé en arrière-plan</summary><p class="muted">Classement des cores Mid observés ; contrôle de leurs identifiants ; extraction de statistiques des objets ; scores de compléments selon coût, PV, résistances, statistiques offensives et profils de menaces. Les profils anti-critiques, anti-soins, tanks, la compatibilité du champion et la redondance sont évalués par des règles explicites ; les passifs, synergies uniques et ratios de compétences ne sont pas encore simulés de façon exhaustive. Les suggestions situationnelles restent heuristiques. Les données de catalogue et les profils adverses peuvent être incomplets.</p></details>';
 out.innerHTML=html;
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('wrdi:build-result',{
  detail:{champion:title,patch:patches[0],core:base.items.map(optId).map(id=>({id,name:simpleItemName(simpleItem(id))})),
   situational:chosen.map(v=>({id:String(v.x.id),name:simpleItemName(v.x),
    reason:v.relativeComparison?.relativeReason||
     (v.clientContext?.indications?.length?v.clientContext.indications.join(' ; '):(v.rule.reasons.join(' ; ')||simpleWhy(v.x,c,own))),
    clientPassiveEvidence:v.clientContext?.ok===true,
    timing:v.rule.timing})),
   coreType:coreCompatibilityKnown?'most_observed_mid_compatible':'observed_mid_unverified',runeSource:'observed_mid',itemRestrictionsChecked:canAudit,itemRestrictionsMessage:canAudit?'Restrictions du client vérifiées pour les objets proposés':(baseCheck?.reason||itemSafetyReason)} }));
 if(!window.WRDI_CompactV1423)out.scrollIntoView({behavior:'smooth',block:'start'});
 }catch(e){out.innerHTML='<p class="bad">Impossible de charger les cores Mid : '+esc(String(e))+'</p>';reportFailure('Analyse des objets interrompue : '+String(e?.message||e));}
}
$('simpleRun').onclick=simpleAnalyze;
simpleDraft();
