/* WRDI V15.2 — visual rune icon identities, not a scoring dependency.
 * Explicit mappings verified against Wild Rift Pocket rune image links.
 * Images are display-only; unavailable images fall back to the verified name.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_RuneImagesV152=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BASE='https://wrpocket.app/assets/img/runes/';
const names=Object.freeze({
 'Souverain des glaces':'Keystone_FrostLord.webp',
 "Poigne de l'immortel":'Keystone_GraspoftheUndying.webp',
 'Rush phasique':'Keystone_PhaseRush.webp',
 'Comète arcanique':'Keystone_ArcaneComet.webp',
 'Électrocution':'Keystone_Electrocute.webp',
 'Gardien':'Keystone_Guardian.webp',
 'Conquérant':'Keystone_Conqueror.webp',
 'Premier coup':'Keystone_FirstStrike.webp',
 'Courage du colosse':'Defence_CourageOfTheColossus.webp',
 'Second souffle':'Defense_Regeneration.webp',
 'Persévérance':'Defense_tenacity.webp',
 'Transcendance':'Utility_Detached.webp',
 'Démolition':'Defense_Demolish.webp',
 'Surcroissance':'Defense_Overgrowth.webp',
 'Ruée offensive':'Offense_SuddenImpact.webp',
 'Assaut enchaîné':'Domination_lp.webp',
 'Chasseur acharné':'Domination_RuthlessHunter.webp',
 'Ruban de mana':'Utility_ManaflowBand.webp',
 'Brûlure':'Utility_Scorch.webp',
 'Coup bas':'Domination_CheapSho.webp',
 'Fontaine de vie':'Keystone_FontofLife.webp',
 'Revitalisation':'Defencs_Revitalize.webp',
 'Zèle de combat':'Precision_572225001.webp',
 'Abattage':'Offense_CutDown.webp',
 'Légende : Accélération':'Precision_LegendHaste.webp'
});
function normalized(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").trim();}
const normMap=new Map(Object.entries(names).map(([k,v])=>[normalized(k),v]));
function url(name){const file=normMap.get(normalized(name));return file?BASE+file:null;}
function portrait(name,{large=false}={}){
 if(typeof document==='undefined')return null;
 const box=document.createElement('span');
 box.className='wrdi-rune-portrait'+(large?' is-large':'');
 const fallback=document.createElement('span');
 fallback.className='wrdi-rune-fallback';
 fallback.textContent=String(name||'?').slice(0,2).toUpperCase();
 box.append(fallback);
 const src=url(name);
 if(src){
  const img=document.createElement('img');img.alt='';
  img.loading='lazy';img.decoding='async';img.src=src;
  img.addEventListener('load',()=>box.classList.add('has-image'));
  img.addEventListener('error',()=>img.remove());
  box.append(img);
 }
 return box;
}
return Object.freeze({VERSION:'15.2.0',source:'Wild Rift Pocket images',names,url,portrait});
});
