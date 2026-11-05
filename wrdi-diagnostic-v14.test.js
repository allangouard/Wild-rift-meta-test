const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {test} = require('node:test');
const core = require('./wrdi-core-v14.js');
const coordinator = require('./wrdi-coordinator-v14.js');
const adapters = require('./wrdi-adapters-v14.js');

class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.style = {};
    this.listeners = {};
    this.textContent = '';
  }
  append(...children) { this.children.push(...children); }
  appendChild(child) { this.append(child); return child; }
  replaceChildren() { this.children = []; this.textContent = ''; }
  setAttribute() {}
  addEventListener(event, callback) { this.listeners[event] = callback; }
}
const descendants = node => [node, ...node.children.flatMap(descendants)];

async function render(cores, {legacyReport = false} = {}) {
  const host = new Element('main');
  const document = {
    readyState: 'complete',
    createElement: tag => new Element(tag),
    getElementById: id => id === 'simpleApp' ? host :
      descendants(host).find(node => node.id === id) || null
  };
  const picks = ['1','2','10099','','','6','7','8','9','10'];
  const rawDraft = JSON.stringify(picks);
  const context = {
    document,
    localStorage: {getItem: () => rawDraft},
    fetch: async path => ({ok: true, json: async () =>
      JSON.parse(fs.readFileSync(path, 'utf8'))}),
    WRDI_CoreV14: core,
    WRDI_CoordinatorV14: coordinator,
    WRDI_AdaptersV14: {
      create(options) {
        const app = adapters.create(options);
        return {async run() {
          const report = await app.run();
          if (legacyReport) {
            for (const build of report.enemyBuilds) {
              for (const itemCore of build.cores) delete itemCore.unresolvedIds;
            }
          }
          return report;
        }};
      }
    },
    WRDIChampionThreatsV125: {
      analyze: async () => {},
      getLastAudit: () => picks.slice(5).map(id => ({
        id, name: 'Champion '+id, result: {signals: [], sourceVersion: 'test'}
      }))
    },
    WRDIEnemyBuildProfilesV128: {
      run: async () => {},
      last: {signature: rawDraft, patch: '7.3d', report: picks.slice(5).map(id => ({
        champion: {id}, roleMatched: true, cores
      }))}
    }
  };
  vm.runInNewContext(fs.readFileSync('wrdi-diagnostic-v14.js', 'utf8'), context);
  const button = descendants(host).find(node => node.tag === 'button');
  await button.listeners.click();
  assert.equal(button.disabled, false);
  const lines = descendants(host).map(node => node.textContent);
  assert.ok(lines.includes('Statut : audit-only'));
  assert.ok(lines.includes('Recommandations automatiques V14 : désactivées.'));
  assert.ok(lines.includes('Résultat descriptif uniquement : aucun calcul de dégâts ni build optimal démontré.'));
  return lines.filter(text => text.startsWith('Core '));
}

test('Noms V12 transmis jusqu au rendu, positions inconnues conservees', async () => {
  const cores = [{
    ids: ['101', '102', '103'],
    names: ['Cotte épineuse', null, 'Unmapped item'],
    unresolvedIds: ['102'], pick: 12, win: 51
  }];
  const before = structuredClone(cores);
  const lines = await render(cores);
  assert.equal(lines.length, 5);
  for (const line of lines) assert.equal(line,
    'Core 1 : Cotte épineuse + ID 102 + Unmapped item · IDs non résolus : 102 · usage : 12 · victoire : 51');
  assert.deepEqual(cores, before);
});

test('Ancien rapport, noms vides et non traduits conservent les IDs', async () => {
  const lines = await render([
    {ids: ['a', 'b', 'c']},
    {ids: ['d', 'e', 'f'], names: ['', '   ', 42]},
    {ids: ['g', 'h', 'i'], names: ['<b>Original name</b>']}
  ]);
  assert.equal(lines.length, 15);
  assert.ok(lines.includes('Core 1 : ID a + ID b + ID c · usage : inconnu · victoire : inconnue'));
  assert.ok(lines.includes('Core 2 : ID d + ID e + ID f · usage : inconnu · victoire : inconnue'));
  assert.ok(lines.includes('Core 3 : <b>Original name</b> + ID h + ID i · usage : inconnu · victoire : inconnue'));
});

test('Rapport sans unresolvedIds continue a afficher le diagnostic', async () => {
  const lines = await render([
    {ids: ['101', '102'], names: ['Cotte épineuse', null], pick: 12, win: 51},
    {ids: ['a', 'b']}
  ], {legacyReport: true});
  assert.equal(lines.length, 10);
  assert.equal(lines.filter(line => line ===
    'Core 1 : Cotte épineuse + ID 102 · usage : 12 · victoire : 51').length, 5);
  assert.equal(lines.filter(line => line ===
    'Core 2 : ID a + ID b · usage : inconnu · victoire : inconnue').length, 5);
  assert.ok(lines.every(line => !line.includes('IDs non résolus')));
});
