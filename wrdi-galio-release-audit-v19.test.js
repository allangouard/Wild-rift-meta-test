'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const audit=require('./wrdi-galio-release-audit-v19.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const bootsCatalog=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const champs=require('./data/champions-picker-v151.json').champions;
const base={catalog,runes,bootsCatalog,championMeta:champs};
test('V19 exposes latest official 7.3e note without falsely upgrading the client 7.3d catalog',()=>{
 const r=audit.inspect(base);
 assert.equal(r.ok,true);
 assert.equal(r.status,'experimental');
 assert.equal(r.verifiedLatestOfficialNote.patch,'7.3e');
 assert.equal(r.verifiedLatestOfficialNote.date,'2026-11-04');
 assert.equal(r.sourcePatch,'7.3d');
 assert.equal(r.currentLivePatchClaim,false);
 assert.equal(r.fullPatchStatsVerified,false);
 assert.equal(r.empiricalWinrateAvailable,false);
 assert.equal(r.rankedOptimizationCertified,false);
 assert.ok(r.warnings.some(x=>/intégration automatique/.test(x)));
 assert.ok(r.warnings.some(x=>/combat/.test(x)));
});
test('V19 flags actual roster gap Hwei rather than injecting an invented numeric ID',()=>{
 const r=audit.inspect(base);
 assert.ok(r.knownMissingChampionNames.includes('Hwei'));
 assert.ok(r.warnings.some(x=>/Hwei/.test(x)));
 assert.equal(r.rosterCount,125);
});
test('V19 distinguishes hard legality failures from unverified efficacy',()=>{
 const legal=audit.inspect({...base,result:{build:{legal:true,lateSlots:{evaluatedPairs:150}},
  runes:{ok:true},draft:{officialKitCoverage:10}}});
 assert.equal(legal.status,'experimental');
 assert.equal(legal.inspectedPairs,150);
 const bad=audit.inspect({...base,result:{build:{legal:false},runes:{ok:false},draft:{officialKitCoverage:9}}});
 assert.equal(bad.status,'blocked');
 assert.equal(bad.blocked.length,3);
});
test('Provenance never claims patch compatibility just because older catalog metadata exists',()=>{
 const changed=audit.inspect({...base,catalog:{...catalog,patch_claimed_by_client_user:'7.3c'}});
 assert.equal(changed.status,'experimental');
 assert.ok(changed.warnings.some(x=>/7.3d/.test(x)));
});
