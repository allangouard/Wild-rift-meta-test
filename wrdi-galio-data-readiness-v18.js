/* V18.2: fail closed on missing draft facts BEFORE calculating item combinations.
 * Patch-unverified numeric values remain advisory, never fabricated.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_GalioDataReadinessV18=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='18.2.0',SLOTS=['passive','q','w','e','r'];
function inspect({picks=[],championMeta=[],officialKits,numericKits,items,runes,boots}={}){
 const reasons=[],warnings=[];
 if(!Array.isArray(picks)||picks.length!==10||new Set(picks.map(String)).size!==10)reasons.push('Draft de dix champions uniques requise');
 const meta=new Map((Array.isArray(championMeta)?championMeta:[]).map(x=>[String(x.id),x]));
 const official=new Map((officialKits?.entries||[]).map(x=>[String(x.id),x]));
 const numeric=new Map((numericKits?.entries||[]).map(x=>[String(x.id),x]));
 let fullyDescribed=0,numericPresent=0;
 for(const id of picks){
  const key=String(id),name=meta.get(key)?.name||key;
  if(!meta.has(key))reasons.push('Identité absente : '+name);
  const sheet=official.get(key);
  if(!sheet||SLOTS.some(slot=>!String(sheet.skills?.[slot]?.description_fr||'').trim()))reasons.push('Compétences officielles incomplètes : '+name);
  else fullyDescribed++;
  if(numericKits){
   const entry=numeric.get(key);
   if(!entry||SLOTS.some(slot=>!entry.skills?.[slot]))warnings.push('Formules numériques incomplètes : '+name);
   else numericPresent++;
  }
 }
 if(!Array.isArray(items?.items)||items.items.length<5)reasons.push('Catalogue d’objets non disponible');
 if(!Array.isArray(runes?.fundamental)||runes.fundamental.length!==13||!Array.isArray(runes?.minor)||runes.minor.length!==39)
  reasons.push('Catalogue de runes incomplet');
 const names=new Set((boots?.records||[]).filter(x=>x.client_description_visible&&x.stats).map(x=>x.name_fr));
 for(const name of ['Bottes de mana','Sandales de Mercure','Coques en acier'])
  if(!names.has(name))reasons.push('Fiche client bottes absente : '+name);
 if(numericKits&&numericPresent<10)warnings.push('Données numériques partielles : les valeurs incertaines seront exclues des calculs concernés');
 if(items?.patch_claimed_by_client_user)warnings.push('Objets client '+items.patch_claimed_by_client_user+' : vérifier la correspondance avec le patch actuellement joué');
 return {ok:reasons.length===0,version:VERSION,checkedChampions:10,fullyDescribed,
  numericPresent,numericSourceUsed:Boolean(numericKits),itemRecords:items?.items?.length||0,
  runeRecords:(runes?.fundamental?.length||0)+(runes?.minor?.length||0),
  bootRecords:names.size,reasons,warnings,
  status:reasons.length?'blocked':'ready_with_source_qualifications'};
}
return Object.freeze({VERSION,inspect});
});
