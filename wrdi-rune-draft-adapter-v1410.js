/* WRDI V14.10 — Rune draft adapter independent of the item catalogue.
 * Only consumes the draft + optional V12 champion kit signals.
 * Graceful, explicitly non-personalized fallback if enemy kits are unavailable.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_RuneDraftAdapterV1410=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.10.0-alpha.1';
const CC=new Set(['stun','knockup','root']);
const signalIds=entry=>[...new Set((Array.isArray(entry?.result?.signals)?entry.result.signals:[]).map(x=>String(x?.id||'')).filter(Boolean))];

function validatePicks(picks){
 if(!Array.isArray(picks)||picks.length!==10)return {ok:false,reason:'Dix emplacements de draft nécessaires.'};
 const ids=picks.map(x=>String(x??'').trim());
 if(ids[2]!=='10099')return {ok:false,reason:'Galio doit être sélectionné au mid pour cette analyse expérimentale.'};
 if(ids.slice(5).some(x=>!x))return {ok:false,reason:'Les cinq adversaires doivent être sélectionnés.'};
 if(new Set(ids.filter(Boolean)).size!==ids.filter(Boolean).length)return {ok:false,reason:'Des champions sont présents plusieurs fois dans la draft.'};
 return {ok:true,ids};
}

function summarizeKitAudit(picks,audit){
 const valid=validatePicks(picks);
 if(!valid.ok)return {ok:false,error:valid.reason};
 const expected=valid.ids.slice(5);
 const matched=Array.isArray(audit)&&audit.length===5&&audit.every((r,i)=>
   r&&String(r.id)===expected[i]&&r.result&&!r.error&&Array.isArray(r.result.signals));
 const enemies=expected.map((id,i)=>({
   id,name:matched?String(audit[i].name||'Champion '+id):'Champion '+id,
   mentioned:matched?signalIds(audit[i]):[]
 }));
 const counts=matched?{
   cc:enemies.filter(e=>e.mentioned.some(x=>CC.has(x))).length,
   magic:enemies.filter(e=>e.mentioned.includes('magic')).length,
   physical:enemies.filter(e=>e.mentioned.includes('physical')).length,
   heal:enemies.filter(e=>e.mentioned.includes('heal')).length,
   shield:enemies.filter(e=>e.mentioned.includes('shield')).length,
   overtime:enemies.filter(e=>e.mentioned.includes('overtime')).length
 }:null;
 return {
   ok:true,game:'Wild Rift mobile',patch:null,enemies,counts,
   enemyKitSignalsAvailable:matched,enemyKitSignalsVerified:false,
   notices:matched?[
     'Signaux linguistiques V12 disponibles, mais non validés comme mesures de la composition réelle.',
     'Aucun contrôle des patchs ou des objets V14 n’est impliqué dans cet aperçu de runes.'
   ]:[
     'Kits adverses indisponibles ou incomplets : trois pages génériques affichées sans personnalisation à la draft.',
     'Aucun signal de contrôle, dégâts ou soins n’est supposé en l’absence de données.'
   ]
 };
}

async function run({picks,getAudit,analyze,isCurrent}={}){
 const validity=validatePicks(picks);
 if(!validity.ok)return {ok:false,status:'invalid-draft',reason:validity.reason};
 const fingerprint=JSON.stringify(validity.ids);
 const current=()=>typeof isCurrent!=='function'||isCurrent(fingerprint);
 if(!current())return {ok:false,status:'stale',reason:'Draft modifiée.'};
 let audit=typeof getAudit==='function'?getAudit():null;
 const matches=rows=>Array.isArray(rows)&&rows.length===5&&rows.every((r,i)=>
   r&&String(r.id)===validity.ids[i+5]&&r.result&&!r.error&&Array.isArray(r.result.signals));
 if(!matches(audit)&&typeof analyze==='function'){
  try{await analyze(true);}catch(e){/* optional enemy-kit data, not a rune blocker */}
  if(!current())return {ok:false,status:'stale',reason:'Draft modifiée pendant la lecture.'};
  audit=typeof getAudit==='function'?getAudit():null;
 }
 if(!current())return {ok:false,status:'stale',reason:'Draft modifiée pendant la lecture.'};
 const summary=summarizeKitAudit(validity.ids,audit);
 return {ok:true,status:summary.enemyKitSignalsAvailable?'enemy-kit-signals-available':'generic-scenarios-only',summary};
}
return Object.freeze({VERSION,validatePicks,summarizeKitAudit,run});
});
