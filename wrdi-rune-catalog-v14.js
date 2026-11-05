'use strict';
/**
 * Wild Rift rune registry V14.
 * Reads client screenshot transcriptions only. Does not infer official rune IDs,
 * slot position, champion eligibility, combat scaling or patch deltas.
 */
const minorAudit = require('./data/stage-a-minor-rune-completeness-2026-11-05.json');
const keystoneBatch = require('./data/stage-a-keystones-batch2-2026-11-05.json');
const electrocution = require('./data/stage-a-rune-electrocution-2026-11-05.json');
const rules = require('./data/stage-a-rune-page-rules-2026-11-05.json');

const SOURCE_MINOR = [...new Set(minorAudit.entries.map(e => e.source))];
const TREE_KEYS = Object.freeze({
  'Domination':'domination',
  'Précision':'precision',
  'Volonté':'volonte',
  'Sorcellerie':'sorcellerie'
});

function buildRuneCatalog() {
  const minor = [];
  for (const path of SOURCE_MINOR) {
    const source = require('./' + path);
    for (const entry of source.entries) {
      const tree = entry.tree || source.tree;
      if (!TREE_KEYS[tree]) throw Error('Unknown client rune tree: ' + tree);
      if (!entry.id || !entry.name_fr) throw Error('Missing source rune name/id in ' + path);
      minor.push({
        id: 'wr:minor:' + TREE_KEYS[tree] + ':' + entry.id,
        local_source_id: entry.id,
        external_game_id: null,
        name_fr: entry.name_fr,
        category: 'minor',
        tree,
        primary_row: null,
        primary_row_status: 'not_verified',
        screenshot: entry.screenshot || null,
        source_path: path,
        client_effect_data: entry.mechanics || entry.stats || entry.effect || null,
        champion_restrictions_verified: false,
        patch_delta_reconciled: false
      });
    }
  }
  const fundamental = keystoneBatch.items.map(entry => ({
    id: 'wr:keystone:' + entry.id,
    local_source_id: entry.id,
    external_game_id: null,
    name_fr: entry.name_fr,
    category: 'keystone',
    tree: null,
    primary_row: null,
    screenshot: entry.source_image || null,
    source_path: 'data/stage-a-keystones-batch2-2026-11-05.json',
    client_effect_data: entry.effect || null,
    champion_restrictions_verified: false,
    patch_delta_reconciled: false
  }));
  fundamental.push({
    id: 'wr:keystone:electrocution',
    local_source_id: 'electrocution',
    external_game_id: null,
    name_fr: electrocution.name_fr,
    category: 'keystone',
    tree: null,
    primary_row: null,
    screenshot: electrocution.source_image,
    source_path: 'data/stage-a-rune-electrocution-2026-11-05.json',
    client_effect_data: electrocution.effect,
    champion_restrictions_verified: false,
    patch_delta_reconciled: false
  });
  const all = [...fundamental,...minor];
  if (new Set(all.map(x=>x.id)).size !== all.length) throw Error('Duplicate local rune ids');
  if (new Set(all.map(x=>x.name_fr)).size !== all.length) throw Error('Duplicate French rune names');
  return { schema: 'wrdi.v14.rune_catalog.v1', game:'Wild Rift mobile',
    rune_page_rules:rules, total:all.length, keystones:fundamental, minor,
    all, inventory_complete:all.length===52 && fundamental.length===13 && minor.length===39,
    optimizer_ready:all.every(x=>x.external_game_id!==null && x.patch_delta_reconciled) &&
      minor.every(x=>Number.isInteger(x.primary_row)) };
}
module.exports = {buildRuneCatalog,TREE_KEYS};
