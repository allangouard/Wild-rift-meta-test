/* WRDI V15 — single explicit pregame decision pipeline.
 * The only item input is the user-verified Wild Rift client catalogue.
 * No legacy app, observed cores, Chinese ranked builds or live match signals.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_DraftEngineV15=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='15.7.0';
function chooseRune({bridge,catalog,advisor,needs}){
 if(!bridge?.audit?.(catalog)?.ok)return {ok:false,reason:'Catalogue des runes non valide'};
 const profiles=advisor?.STRATEGIES||[];
 const t=needs||{};
 // A role-first rule: rune templates are taken from the verified client page
 // structure, never from observed usage or rank-based winrates.
 // The team-composition role is evaluated BEFORE generic peel or tank
 // signals. Three allied tanks must not force Galio into Guardian when he is
 // responsible for magic damage. Galio can apply Comet with Q against a
 // ranged/poke mid; Electrocute remains a candidate for short all-in trades.
 const offensiveDuty=t.damageDuty>=2&&t.frontlineProvided>=2&&t.frontlineNeed===0;
 const choices=offensiveDuty?
  (t.lanePoke||t.laneMagic&&!t.laneAllIn?
   ['poke','burst','longfight','engage']:
   t.tank>=2?['longfight','burst','poke','engage']:
   ['burst','poke','longfight','engage']):
  t.frontlineNeed>=1?['engage','resilience','peel']:
  t.laneAllIn?['resilience','burst','engage']:
  t.peelNeed>=1?['peel','engage','resilience']:
  t.tank>=2?['longfight','engage','resilience']:
  ['engage','resilience','roam'];
 const accepted=[];
 for(const id of choices){
  const template=profiles.find(x=>x.id===id);
  if(!template)continue;
  const page={keystone:template.keystone,primaryTree:template.tree,primary:[...template.primary],secondary:template.secondary};
  const validation=bridge.validate(page,catalog);
  if(validation.valid)accepted.push({page,label:template.label,reason:template.pros?.[0]||'Interaction conditionnelle',id,legal:true});
 }
 if(!accepted.length)return {ok:false,reason:'Aucune page de runes du catalogue client entièrement valide'};
 const picked=accepted[0];
 const why=offensiveDuty&&picked.id==='poke'?
  'Galio est chargé d’apporter les dégâts magiques : sa compétence A peut déclencher Comète arcanique contre un mid à distance. Les touches et le délai ne sont pas garantis.':
  offensiveDuty&&picked.id==='burst'?
  'Galio joue dégâts AP : Électrocution peut renforcer un échange court après trois touches, si le combo atteint la cible.':
  picked.reason;
 return {ok:true,id:picked.id,label:picked.label,page:picked.page,reason:why,
  alternatives:accepted.slice(1),selection:'heuristique_tactique_non_certifiee'};
}
function analyze({picks,champions,championMeta,catalog,rules,runes,modules}={}){
 const fail=(stage,reason)=>({ok:false,stage,reason});
 if(!Array.isArray(picks)||picks.length!==10||picks.some(x=>!String(x||'').trim()))return fail('draft','Les dix champions sont requis');
 if(String(picks[2])!=='10099')return fail('draft','Galio mid uniquement pour le moment');
 if(new Set(picks.map(String)).size!==10)return fail('draft','Un champion ne peut pas être sélectionné deux fois');
 const m=modules||{},profile=m.profiles,team=m.team,guard=m.guard,core=m.core,
  optimizer=m.optimizer,order=m.order,contingency=m.contingency;
 if(!profile?.lookup||!team?.make||!guard?.prepare||!core?.validateEquipment||!optimizer?.optimize||!order?.order||!contingency?.plan)
  return fail('modules','Moteur incomplet : aucune substitution par les anciens calculs');
 const names=picks.map(id=>String(champions?.[String(id)]||''));
 if(names.some(x=>!x))return fail('champions','Un champion choisi n’est pas présent dans l’index des noms');
 const metadataByName=new Map((Array.isArray(championMeta)?championMeta:[])
  .filter(x=>x?.name).map(x=>[String(x.name).toLocaleLowerCase('fr'),x]));
 const lookup=name=>profile.lookup(name,metadataByName.get(String(name).toLocaleLowerCase('fr')));
 const context=team.make({allies:names.slice(0,5),enemies:names.slice(5),lookup});
 if(!context.ok)return fail('threats',context.reason);
 const prepared=guard.prepare({catalog,rules,core,livePatch:catalog?.patch_claimed_by_client_user});
 if(!prepared.ok)return fail('client_catalogue',prepared.reason);
 const need=context.threats;
 const main=optimizer.optimize({prepared,threats:need});
 if(!main.ok)return fail('five_items',main.reason);
 const sequence=order.order({prepared,items:main.main.items,threats:need});
 if(!sequence.ok)return fail('purchase_order',sequence.reason);
 const conditional=contingency.plan({prepared,optimizer,items:main.main.items,threats:need,max:3});
 if(!conditional.ok)return fail('contingencies',conditional.reason);
 const rune=chooseRune({bridge:m.runeBridge,catalog:runes,advisor:m.runeAdvisor,needs:need});
 const notes=[...context.reasons];
 if(context.missingEnemyRoles.length)notes.push('Profils adverses partiels : '+context.missingEnemyRoles.join(', '));
 return {ok:true,version:VERSION,game:'Wild Rift mobile',patch:catalog.patch_claimed_by_client_user,
  draft:{ids:[...picks],names,threats:need,notes,confidence:context.confidence},
  build:{items:sequence.items,alternatives:conditional.options,legal:true,
   orderCertified:false,combinationsExamined:main.evaluatedPool,
   sourced:'player_client_items_only',noPopularBuilds:true},
  runes:rune,
  methods:{kitPassiveSynergy:'inferred_from_client_text',selection:'qualitative_heuristic',
   exactOptimalityProven:false,liveTracking:false},
  warnings:rune.ok?[]:['Runes indisponibles : '+rune.reason]};
}
return Object.freeze({VERSION,chooseRune,analyze});
});
