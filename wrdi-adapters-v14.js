
/* WRDI V14.2 — adaptateur V12 en lecture seule */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports)
    module.exports = api;
  else root.WRDI_AdaptersV14 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
'use strict';

const VERSION = '14.2.0-alpha.1';
const KEY = 'wrdi_draft_v76';
const PATCH = '7.3d';
const REVISION = 'v12.6-threats+v12.8-profiles';

function create({root, storage, fetchJson, core, coordinator} = {}) {
  if (!root || !storage || typeof storage.getItem !== 'function')
    throw Error('Environnement de draft manquant');

  if (typeof fetchJson !== 'function')
    throw Error('fetchJson manquant');

  if (!core || !coordinator || typeof coordinator.create !== 'function')
    throw Error('Modules V14 manquants');

  const draftRaw = () => storage.getItem(KEY) || '';

  const parseDraft = () => {
    try {
      const x = JSON.parse(draftRaw());
      return Array.isArray(x) ? x : [];
    } catch {
      return [];
    }
  };

  const getInput = () => ({
    picks: parseDraft(),
    patch: PATCH,
    rank: '1',
    sourceRevision: REVISION
  });

  const matches = (rows, expected, getId) =>
    Array.isArray(rows) &&
    rows.length === 5 &&
    rows.every((row, i) =>
      row && String(getId(row)) === expected[i]
    );

  const unchanged = snap => core.isCurrent(snap, getInput());

  async function loadThreats(snap) {
    const api = root.WRDIChampionThreatsV125;

    if (!api || typeof api.analyze !== 'function' ||
        typeof api.getLastAudit !== 'function')
      throw Error('Module V12.6 absent');

    const expected = snap.picks.slice(5);
    let rows = api.getLastAudit();

    if (!matches(rows, expected, x => x.id) ||
        rows.some(x => !x.result || x.error)) {
      await api.analyze(true);
      rows = api.getLastAudit();
    }

    if (!unchanged(snap))
      throw Error('Draft modifiee pendant la lecture des kits');

    if (!matches(rows, expected, x => x.id) ||
        rows.some(x => !x.result || x.error))
      throw Error('Kits V12.6 incomplets ou perimes');

    return rows.map(x => ({
      id: String(x.id),
      name: x.name || null,
      signals: x.result.signals || [],
      sourceVersion: x.result.sourceVersion || null
    }));
  }

  async function loadEnemyBuilds(snap) {
    const api = root.WRDIEnemyBuildProfilesV128;

    if (!api || typeof api.run !== 'function')
      throw Error('Module V12.8 absent');

    const expected = snap.picks.slice(5);
    const raw = draftRaw();
    let last = api.last;

    if (!last || last.signature !== raw ||
        !matches(last.report, expected, x => x.champion?.id)) {
      await api.run();
      last = api.last;
    }

    if (!unchanged(snap) || draftRaw() !== raw)
      throw Error('Draft modifiee pendant la lecture des builds');

    if (!last || last.signature !== raw ||
        !matches(last.report, expected, x => x.champion?.id))
      throw Error('Rapport V12.8 absent ou perime');

    if (last.report.some(x =>
      !x.roleMatched ||
      !Array.isArray(x.cores) ||
      !x.cores.length
    ))
      throw Error('Build adverse sans poste confirme ou sans core exploitable');

    return last.report.map(x => ({
      id: String(x.champion.id),
      roleMatched: true,
      sourcePatch: last.patch || null,
      cores: x.cores.map(c => ({
        ids: c.ids || [],
        names: c.names || [],
        classification: c.classification || null,
        unresolvedIds: c.unresolvedIds || [],
        pick: c.pick ?? null,
        win: c.win ?? null
      }))
    }));
  }

  const engine = coordinator.create({
    core,
    getInput,
    loadCatalog: () =>
      fetchJson('./data/items-client-7.3d-v12.json'),
    loadRules: () =>
      fetchJson('./data/item-restrictions-client-7.3d-v12.json'),
    loadThreats,
    loadEnemyBuilds
  });

  return Object.freeze({
    run: () => engine.run(),
    invalidate: () => engine.invalidate(),
    getLast: () => engine.getLast(),
    getInput
  });
}

return Object.freeze({VERSION, create});
});
