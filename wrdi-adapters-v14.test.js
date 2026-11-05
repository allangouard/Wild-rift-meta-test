const assert = require('node:assert/strict');
const { test } = require('node:test');
const adapters = require('./wrdi-adapters-v14.js');

const picks = ['1','2','10099','','','6','7','8','9','10'];
const enemyIds = picks.slice(5);
const rawDraft = JSON.stringify(picks);

function fixture(changes = {}) {
  let config;
  let threatCalls = 0;
  let buildCalls = 0;

  const threats = changes.threats || enemyIds.map(id => ({
    id, name: 'Champion '+id,
    result: { signals: [], sourceVersion: 'test' }
  }));

  const profiles = changes.profiles || enemyIds.map(id => ({
    champion: {id}, roleMatched: true,
    cores: [{ ids: ['item1','item2','item3'] }]
  }));

  const root = {
    WRDIChampionThreatsV125: {
      getLastAudit: () => threats,
      analyze: async () => { threatCalls++; }
    },
    WRDIEnemyBuildProfilesV128: {
      last: {signature: changes.signature || rawDraft, patch:'7.3d', report:profiles},
      run: async () => { buildCalls++; }
    }
  };

  adapters.create({
    root,
    storage: {getItem: () => rawDraft},
    fetchJson: async () => ({}),
    core: {isCurrent: () => true},
    coordinator: {
      create: options => {
        config = options;
        return {run:async()=>({}),invalidate(){},getLast(){return null}};
      }
    }
  });

  return {
    config,
    counters: () => ({threatCalls,buildCalls}),
    snapshot: {picks}
  };
}

test('01 - Cinq kits adverses acceptes', async () => {
  const x = fixture();
  const rows = await x.config.loadThreats(x.snapshot);
  assert.deepEqual(rows.map(r => r.id), enemyIds);
  assert.equal(x.counters().threatCalls, 0);
});

test('02 - Kit incomplet refuse', async () => {
  const rows = enemyIds.map(id => ({id,error:'Indisponible'}));
  const x = fixture({threats:rows});
  await assert.rejects(x.config.loadThreats(x.snapshot), /incomplets/);
  assert.equal(x.counters().threatCalls, 1);
});

test('03 - Poste adverse non confirme refuse', async () => {
  const rows = enemyIds.map(id => ({
    champion:{id},roleMatched:true,cores:[{ids:['a','b','c']}]
  }));
  rows[2].roleMatched = false;
  const x = fixture({profiles:rows});
  await assert.rejects(x.config.loadEnemyBuilds(x.snapshot), /poste confirme/);
});

test('04 - Rapport associe a une autre draft refuse', async () => {
  const x = fixture({signature:'ancienne-draft'});
  await assert.rejects(x.config.loadEnemyBuilds(x.snapshot), /perime/);
  assert.equal(x.counters().buildCalls, 1);
});

test('05 - Noms transmis dans le meme ordre, sans modifier le rapport V12', async () => {
  const profiles = enemyIds.map(id => ({
    champion: {id}, roleMatched: true,
    cores: [{
      ids: ['a', 'b', 'c'], names: ['Cotte épineuse', null, 'Unknown item'],
      unresolvedIds: ['b'], classification: {primary: 'tank'}, pick: 12, win: 51
    }]
  }));
  const before = structuredClone(profiles);
  const x = fixture({profiles});
  const rows = await x.config.loadEnemyBuilds(x.snapshot);
  for (const row of rows) assert.deepEqual(row.cores, profiles[0].cores);
  assert.deepEqual(profiles, before);
  assert.equal(x.counters().buildCalls, 0);
});

test('06 - Ancien rapport sans noms accepte', async () => {
  const x = fixture();
  const rows = await x.config.loadEnemyBuilds(x.snapshot);
  assert.deepEqual(rows[0].cores[0].names, []);
  assert.deepEqual(rows[0].cores[0].ids, ['item1', 'item2', 'item3']);
});
