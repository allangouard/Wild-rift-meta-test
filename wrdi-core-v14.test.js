const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('./wrdi-core-v14.js');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/items-client-7.3d-v12.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/item-restrictions-client-7.3d-v12.json'), 'utf8'));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('OK - ' + name);
  } catch (e) {
    console.error('ECHEC - ' + name);
    throw e;
  }
}
const valid = ids => core.validateEquipment(ids, catalog, rules);
const draft = ['1', '2', '10099', '', '', '6', '7', '8', '9', '10'];
const input = { picks: draft, patch: '7.3d', rank: '1', sourceRevision: 'test' };

test('01 - Module charge', () => assert.ok(core.VERSION));
test('02 - Jeu Wild Rift', () => assert.equal(core.GAME, 'Wild Rift mobile'));
test('03 - Six emplacements maximum', () => assert.equal(core.MAX_SLOTS, 6));
test('04 - Catalogues compatibles', () => assert.equal(core.validateSources(catalog, rules).ok, true));
test('05 - Catalogue exploratoire bloque les recommandations', () => assert.equal(core.validateSources(catalog, rules).recommendationEligible, false));
test('06 - Objet unique autorise', () => assert.equal(valid(['riftmaker']).valid, true));
test('07 - Doublon interdit', () => assert.equal(valid(['riftmaker', 'riftmaker']).valid, false));
test('08 - Plus de six objets interdit', () => assert.equal(valid(Array(7).fill('riftmaker')).valid, false));
test('09 - Objet inconnu interdit', () => assert.equal(valid(['objet_inconnu']).valid, false));
test('10 - Pénétration magique exclusive', () => assert.equal(valid(['void_staff', 'cryptbloom']).valid, false));
test('11 - Sanguinaire et Baton du vide incompatibles', () => assert.equal(valid(['bloodletters_curse', 'void_staff']).valid, false));
test('12 - Deux immolations interdites', () => assert.equal(valid(['hollow_radiance', 'sunfire_aegis']).valid, false));
test('13 - Deux lames enchantees interdites', () => assert.equal(valid(['lich_bane', 'iceborn_gauntlet']).valid, false));
test('14 - Deux objets actifs interdits', () => assert.equal(valid(['zhonyas_hourglass', 'redemption']).valid, false));
test('15 - Deux familles compatibles', () => assert.equal(valid(['riftmaker', 'thornmail']).valid, true));
test('16 - Snapshot de dix cases', () => assert.equal(core.createSnapshot(input).picks.length, 10));
test('17 - Snapshot gele', () => assert.equal(Object.isFrozen(core.createSnapshot(input)), true));
test('18 - Draft inchangee reconnue', () => assert.equal(core.isCurrent(core.createSnapshot(input), input), true));
test('19 - Changement de draft detecte', () => assert.equal(core.isCurrent(core.createSnapshot(input), {...input, picks: [...draft.slice(0, 5), '11', ...draft.slice(6)]}), false));

console.log('\nRESULTAT : ' + passed + '/19 tests reussis');
