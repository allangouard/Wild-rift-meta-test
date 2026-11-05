/* Wild Rift Draft Intelligence V14.0 — fondation indépendante.
 * Audit/sécurité seulement : ne génère PAS de builds et ne charge PAS le catalogue
 * exploratoire dans les recommandations automatiques.
 * Compatible navigateur (window.WRDI_CoreV14) et Node.js (module.exports).
 */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WRDI_CoreV14 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const VERSION = '14.0.0-alpha.1';
  const GAME = 'Wild Rift mobile';
  const MAX_SLOTS = 6;
  const own = (x, k) => Object.prototype.hasOwnProperty.call(x, k);

  function validateSources(catalog, rules) {
    const errors = [], warnings = [];
    if (!catalog || catalog.target_game !== GAME || !Array.isArray(catalog.items))
      errors.push('Catalogue Wild Rift mobile absent ou invalide');
    if (!rules || rules.game !== GAME || !Array.isArray(rules.groups))
      errors.push('Restrictions Wild Rift mobile absentes ou invalides');
    if (errors.length) return {ok:false, errors, warnings, patch:null, recommendationEligible:false};
    const patch = catalog.patch_claimed_by_client_user;
    if (!patch || patch !== rules.patch_client_reported)
      errors.push('Versions de patch différentes ou inconnues');
    const ids = new Set();
    for (const item of catalog.items) {
      if (!item || typeof item.id !== 'string' || !item.id.trim()) errors.push('Objet sans identifiant');
      else if (ids.has(item.id)) errors.push('Identifiant dupliqué : '+item.id);
      else ids.add(item.id);
    }
    if (catalog.item_count !== catalog.items.length)
      errors.push('item_count différent du nombre réel de fiches');
    if (catalog.no_patch_deltas_applied) warnings.push('Correctifs de patch non intégrés');
    if (catalog.do_not_automatically_load_into_build_recommendations)
      warnings.push('Catalogue exploratoire : recommandations automatiques interdites');
    // Un patch correspondant ne prouve PAS qu'il est le patch actif du jeu.
    return {ok:errors.length===0, errors, warnings, patch:patch||null,
      recommendationEligible:errors.length===0 &&
        catalog.do_not_automatically_load_into_build_recommendations===false &&
        catalog.no_patch_deltas_applied===false};
  }

  function validateEquipment(ids, catalog, rules) {
    const source = validateSources(catalog, rules);
    const errors = [...source.errors], warnings = [...source.warnings];
    if (!Array.isArray(ids)) return {valid:false,errors:[...errors,'La sélection doit être un tableau'],warnings,checked:0};
    const names = ids.filter(Boolean);
    if (names.some(x => typeof x !== 'string')) errors.push('Les identifiants doivent être des chaînes');
    if (names.length > MAX_SLOTS) errors.push('Plus de six emplacements équipés');
    if (new Set(names).size !== names.length) errors.push('Objet équipé en double');
    if (!source.ok) return {valid:false,errors,warnings,checked:names.length};
    const map = new Map(catalog.items.map(x=>[x.id,x]));
    for (const id of names) {
      const item=map.get(id);
      if (!item) {errors.push('Objet absent du catalogue client : '+id);continue;}
      if (item.item_type === 'transformed')
        warnings.push('Objet transformé : '+id+' (ne pas proposer comme achat indépendant)');
      if (!['legendary','active','transformed'].includes(item.item_type))
        warnings.push('Type d’objet à vérifier : '+id);
    }
    for (const group of rules.groups) {
      const selected = names.filter(x=>(group.members||[]).includes(x));
      if (selected.length > (Number.isInteger(group.max)?group.max:1))
        errors.push('Famille incompatible '+group.id+' : '+selected.join(' + '));
    }
    for (const pair of rules.extra_exclusion_pairs||[]) {
      if (Array.isArray(pair) && pair.length>1 && pair.every(x=>names.includes(x)))
        errors.push('Exclusion : '+pair.join(' + '));
    }
    const active = new Set([...(rules.known_active_item_ids||[]), ...catalog.items.filter(x=>x.item_type==='active').map(x=>x.id)]);
    const activeFound=names.filter(x=>active.has(x));
    const maxActive=Number.isInteger(rules.max_active_items)?rules.max_active_items:1;
    if (activeFound.length > maxActive) errors.push('Trop d’objets actifs : '+activeFound.join(' + '));
    return {valid:errors.length===0,errors,warnings:[...new Set(warnings)],checked:names.length,
      patch:source.patch,recommendationEligible:source.recommendationEligible};
  }

  // Les 10 identifiants sont figés pour tous les modules d'une exécution.
  // Les quatre alliés autres que le mid restent optionnels dans l'interface actuelle.
  function createSnapshot({picks,patch,rank='1',sourceRevision='unknown'}={}) {
    if (!Array.isArray(picks)||picks.length!==10) throw Error('Draft de dix emplacements requise');
    const ids=picks.map(x=>String(x??'').trim());
    if (!ids[2]||ids.slice(5).some(x=>!x)) throw Error('Mid allié et cinq adversaires requis');
    const chosen=ids.filter(Boolean);
    if (new Set(chosen).size!==chosen.length) throw Error('Champion dupliqué dans la draft');
    if (typeof patch!=='string'||!patch.trim()) throw Error('Patch manquant');
    const snapshot={game:GAME,patch:patch.trim(),rank:String(rank),sourceRevision:String(sourceRevision),picks:Object.freeze(ids)};
    const signature=JSON.stringify([snapshot.game,snapshot.patch,snapshot.rank,snapshot.sourceRevision,...ids]);
    return Object.freeze({...snapshot,signature});
  }
  function isCurrent(snapshot, input) {
    if (!snapshot || typeof snapshot.signature!=='string') return false;
    try{return createSnapshot(input).signature===snapshot.signature;}catch{return false;}
  }
  return Object.freeze({VERSION,GAME,MAX_SLOTS,validateSources,validateEquipment,createSnapshot,isCurrent});
});
