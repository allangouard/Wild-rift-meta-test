'use strict';
/**
 * Wild Rift rune page structural validation, source: confirmed client screenshot
 * 1000010857.jpg and stage-a-rune-page-rules-2026-11-05.json.
 *
 * Interface: validateRunePage({ keystone, primary: [three French rune names],
 *   secondary: one French rune name }, catalogue?)
 *
 * Rune effects and champion eligibility are out of scope. Primary row
 * restrictions are only validated if independently supplied as slot metadata.
 */
const RULES = require('./data/stage-a-rune-page-rules-2026-11-05.json');
const INVENTORY = require('./data/stage-a-minor-rune-completeness-2026-11-05.json');
const VERIFIED_SLOTS = require('./data/stage-a-rune-verified-slots-2026-11-05.json');
const ROWS_BY_RUNE = new Map(VERIFIED_SLOTS.verified_examples.map(x => [x.name_fr, x.primary_row]));
const DEFAULT_CATALOGUE = Object.fromEntries(INVENTORY.entries.map(e => [e.name_fr, e.tree]));

function validateRunePage(page, catalogue = DEFAULT_CATALOGUE) {
  const errors = [];
  if (!page || typeof page !== 'object') return { valid: false, errors: ['Page de runes absente.'] };
  if (typeof page.keystone !== 'string' || !page.keystone.trim()) errors.push('Il faut une rune fondamentale.');
  if (!Array.isArray(page.primary) || page.primary.length !== RULES.primary_count) {
    errors.push('Il faut exactement trois runes principales.');
  }
  if (typeof page.secondary !== 'string' || !page.secondary.trim()) errors.push('Il faut exactement une rune secondaire.');
  const primaries = Array.isArray(page.primary) ? page.primary : [];
  const allMinor = [...primaries, ...(typeof page.secondary === 'string' ? [page.secondary] : [])];
  if (new Set(allMinor).size !== allMinor.length) errors.push('Une rune ne peut pas être sélectionnée deux fois.');
  const trees = primaries.map(name => catalogue[name]);
  for (const name of allMinor) {
    if (!catalogue[name]) errors.push('Rune secondaire inconnue du catalogue : ' + name);
  }
  if (primaries.length === RULES.primary_count && trees.every(Boolean) && new Set(trees).size !== 1) {
    errors.push('Les trois runes principales doivent appartenir à la même branche.');
  }
  const mainTree = trees.length === RULES.primary_count && trees.every(Boolean) && new Set(trees).size === 1 ? trees[0] : null;
  if (mainTree && catalogue[page.secondary] === mainTree) errors.push('La rune secondaire doit appartenir à une autre branche.');
  const knownRows = primaries.map(name => ROWS_BY_RUNE.get(name));
  if (mainTree && knownRows.every(row => Number.isInteger(row)) && new Set(knownRows).size !== RULES.primary_count) {
    errors.push('Il faut choisir une rune de chaque ligne principale (1, 2 et 3).');
  }
  return {valid: errors.length === 0, errors, primary_tree: mainTree, secondary_tree: catalogue[page.secondary] || null,
    primary_rows_verified: mainTree !== null && knownRows.every(row => Number.isInteger(row))};
}

if (typeof module !== 'undefined' && module.exports) module.exports = { RULES, validateRunePage };
