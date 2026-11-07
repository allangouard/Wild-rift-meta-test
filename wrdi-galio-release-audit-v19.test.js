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
test('V19 no longer reports Hwei as absent after client-backed catalogue integration',()=>{
 const r=audit.inspect(base);
 assert.ok(!r.knownMissingChampionNames.includes('Hwei'));
 assert.ok(!r.warnings.some(x=>/Hwei figure/.test(x)));
 assert.equal(r.rosterCount,127);
 assert.equal(r.knownMissingChampionNames.length,15);
 assert.ok(r.knownMissingChampionNames.includes('Skarner'));
 assert.ok(r.warnings.some(x=>/15 champions/.test(x)));
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

test('V19 exposes rather than hides conditional items selected by the build',()=>{
 const x=audit.inspect({...base,result:{build:{legal:true,
  conditionAudit:{entries:[{id:'morellonomicon',status:'weak',reason:'No key sustain',trigger:'Spell damage'},
   {id:'void_staff',status:'unknown_enemy_items',reason:'MR purchases unknown',trigger:'Magic penetration'}]}},
  runes:{ok:true},draft:{officialKitCoverage:10}}});
 assert.equal(x.itemRisks.length,2);
 assert.equal(x.itemRisks[0].id,'morellonomicon');
 assert.ok(x.warnings.some(w=>/faibles ou hypothétiques/.test(w)));
 assert.equal(x.status,'experimental');
});
