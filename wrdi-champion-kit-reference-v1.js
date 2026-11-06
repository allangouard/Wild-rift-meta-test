/* WRDI: read-only official Wild Rift champion-kit reference.
 * Intentionally isolated from the quantitative draft engine until all five
 * abilities and patch validity have been validated for a given champion.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_ChampionKitsReferenceV1=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
function prepare(payload){
 if(!payload||payload.schema!=='wrdi-official-wild-rift-abilities-v1'||!Array.isArray(payload.profiles))return {ok:false,reason:'Invalid official Wild Rift collection'};
 const byId=new Map(),byName=new Map();
 for(const row of payload.profiles){
  if(!row?.id||!row?.champion||!row?.source?.url?.startsWith('https://wildrift.leagueoflegends.com/fr-fr/champions/'))return {ok:false,reason:'Missing official source'};
  if(!row.coverage?.wildRiftOnly||row.allowedForEngine!==false)return {ok:false,reason:'Unverified or actively scored record'};
  const abilities=['passive','q','w','e','r'].map(k=>row.kit?.[k]?.name);
  if(abilities.some(x=>!x)||byId.has(row.id)||byName.has(normalize(row.champion)))return {ok:false,reason:'Invalid or duplicated skill names'};
  byId.set(String(row.id),row);byName.set(normalize(row.champion),row);
 }
 return {ok:true,version:'1.0',size:byId.size,find(x){return byId.get(String(x))||byName.get(normalize(x))||null;},
  eligibleForScoring(){return [];},dataQuality:'ability names and passive confirmed; active ability details pending'};
}
return Object.freeze({prepare});
});
