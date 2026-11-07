/* WRDI Esport Premium Lab v2.4: verified client item-stat comparisons, not simulated combat damage. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_EsportLabV24=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STATS=[
 ['ap','Puissance','AP'],['hp','PV','PV'],['armor','Armure','ARM'],['mr','Résistance magique','RM'],['ah','Accélération de compétence','AH']
];
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n;};
const value=(v)=>typeof v==='number'&&Number.isFinite(v)?v:0;
function sums(items){const totals={price:0};for(const [key] of STATS)totals[key]=0;
 for(const item of items){if(!item)continue;for(const [key] of STATS)totals[key]+=value(item.stats?.[key]);totals.price+=value(item.price_gold);}
 return totals;
}
function buildPanel(result,catalog){
 if(!result?.ok||!Array.isArray(result.build?.items)||!Array.isArray(catalog?.items))return null;
 const byId=new Map(catalog.items.map(it=>[String(it.id),it]));
 const baseIds=result.build.items.map(it=>String(it.id));
 const base=baseIds.map(id=>byId.get(id));
 const wrap=el('section','ep-lab');
 wrap.id='ep-build-lab';
 wrap.append(el('span','ep-overline','LABORATOIRE EXPERT'),el('h3',null,'Comparer les builds'));
 wrap.append(el('p','ep-lab-sub','Statistiques brutes du catalogue client et adaptations réellement proposées par le moteur. Les passifs ne sont pas réduits à un score fictif.'));
 if(base.some(it=>!it)){
  wrap.append(el('p','ep-lab-warning','Comparaison indisponible : une fiche d’objet du build principal manque dans le catalogue.'));
  return wrap;
 }
 const options=(result.build.alternatives||[]).filter(o=>
  Array.isArray(o.newIds)&&o.newIds.length===baseIds.length&&
  o.newIds.every(id=>byId.has(String(id)))&&o.verifiedLegal===true);
 const choices=[{label:'Build principal',ids:baseIds,condition:'Composition initiale',reason:'Recommandation principale du moteur.'},
  ...options.map(o=>({label:o.add.name+' à la place de '+o.remove.name,ids:o.newIds.map(String),condition:o.condition,reason:o.reason||'Adaptation conditionnelle'}))];
 const choiceLabel=el('label','ep-lab-label','Scénario de comparaison');
 const select=el('select','ep-lab-select');
 select.setAttribute('aria-label','Choisir un scénario de build');
 choices.forEach((option,i)=>{const node=el('option',null,option.label);node.value=String(i);select.append(node);});
 const optionsWrap=el('div','ep-lab-selector');
 optionsWrap.append(choiceLabel,select);wrap.append(optionsWrap);
 const condition=el('p','ep-lab-condition');
 wrap.append(condition);
 const comparison=el('div','ep-lab-comparison');wrap.append(comparison);
 const icons=el('div','ep-lab-icons');wrap.append(icons);
 const note=el('p','ep-lab-warning','Dégâts de combo, DPS réel, soins reçus, mitigations, délais et activation des passifs : non calculés dans cette vue. Ces chiffres nécessitent une simulation distincte.');
 wrap.append(note);
 function statTable(current){
  const a=sums(base),b=sums(current);
  const table=el('div','ep-lab-table');
  const head=el('div','ep-lab-row ep-lab-table-head');
  ['Statistique','Principal','Scénario','Écart'].forEach(t=>head.append(el('span',null,t)));table.append(head);
  for(const [key,label] of STATS.concat([['price','Coût total']])) {
   const row=el('div','ep-lab-row');
   const delta=b[key]-a[key];
   row.append(el('span',null,label),
    el('span',null,a[key].toLocaleString('fr-FR')),
    el('span',null,b[key].toLocaleString('fr-FR')),
    el('span','ep-lab-delta'+(delta>0?' plus':delta<0?' minus':''),(delta>0?'+':'')+delta.toLocaleString('fr-FR')));
   table.append(row);
  }
  return table;
 }
 function picture(item){
  const tile=el('div','ep-lab-item');
  const img=el('img');img.alt='';img.loading='lazy';
  img.src='./assets/item-icons/'+encodeURIComponent(item.id)+'.webp';
  img.addEventListener('error',()=>{img.remove();tile.prepend(el('span','ep-lab-item-placeholder','•'));});
  tile.append(img,el('span',null,item.name_fr||item.name||'Objet'));
  return tile;
 }
 function render(){
  const idx=Number(select.value)||0;
  const selected=choices[idx]||choices[0];
  const items=selected.ids.map(id=>byId.get(id));
  if(items.some(x=>!x))return;
  condition.textContent=idx===0?'Build principal : aucune modification.':selected.condition+' — '+selected.reason;
  comparison.replaceChildren(statTable(items));
  icons.replaceChildren();
  items.forEach(item=>icons.append(picture(item)));
 }
 select.addEventListener('change',render);
 render();
 return wrap;
}
return Object.freeze({VERSION:'2.4.0',sums,buildPanel});
});
