const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const raw=require('./data/champion-ability-extract-official-v1.json');
const coverage=require('./data/champion-kit-coverage-v2.json');
const roster=require('./data/champions-picker-v151.json').champions;
test('126 sourced Wild Rift champion kits including one player-client Hwei sheet',()=>{
 assert.equal(raw.schema,'wrdi-official-wild-rift-extracted-v1');
 assert.equal(raw.coverage.attempted,roster.length);
 assert.equal(raw.coverage.extracted,126);
 assert.equal(raw.coverage.failed,0);
 assert.equal(raw.entries.length,126);
 assert.equal(raw.entries.flatMap(c=>Object.values(c.skills)).filter(s=>s.description_fr?.length>0).length,630);
 const ids=new Set();
 for(const champ of raw.entries){
  assert.ok(!ids.has(champ.id));ids.add(champ.id);
  assert.equal(champ.allowedForScoring,false);
  assert.equal(champ.numericRatiosVerified,false);
  assert.equal(champ.currentPatchVerified,false);
  assert.ok(/^https:\/\/wildrift\.leagueoflegends\.com\/fr-fr\/champions\/[a-z0-9-]+\/$/.test(champ.source_url),champ.name);
  assert.deepEqual(Object.keys(champ.skills),['passive','q','w','e','r']);
  for(const spell of Object.values(champ.skills)){
   assert.ok(spell.name.length>0,champ.name);
   assert.equal(spell.descriptionPresent,true,champ.name+' '+spell.name);
   assert.ok(spell.excerpt_fr.length>0);
   assert.ok(typeof spell.description_fr==='string'&&spell.description_fr.length>=spell.excerpt_fr.length);
   assert.ok(spell.description_fr.startsWith(spell.excerpt_fr));
   assert.ok(spell.excerpt_fr.split(/\s+/).length<=24);
  }
 }
 for(const p of roster)assert.ok(ids.has(p.id),p.name);
});
test('published coverage makes unverified numbers and descriptions explicit',()=>{
 assert.equal(coverage.catalogueCount,126);
 assert.equal(coverage.officialAutoExtracted,125);
 assert.equal(coverage.missingOfficialAutoExtract,1);
 assert.equal(coverage.clientScreenshotDescriptions,1);
 assert.equal(coverage.manuallyReviewedPassiveAndNames,20);
 assert.equal(coverage.numericStatsVerified,0);
 assert.equal(coverage.fullActiveDescriptionsValidated,1);
 assert.ok(coverage.entries.every(x=>!x.eligibleForScoring));
});
test('officially sourced conditional mechanics exist without hallucinating enemy builds',()=>{
 const byName=new Map(raw.entries.map(x=>[x.name,x]));
 assert.match(byName.get('Kayn').skills.passive.excerpt_fr,/Darkin|Rhaast/i);
 // Short excerpts intentionally omit later parts of long abilities.
 // The independently checked first batch preserves intrinsic fourth-shot crit.
 const reviewed=require('./data/champion-kits-official-fr-v1.json').profiles;
 const jhin=reviewed.find(x=>x.champion==='Jhin');
 assert.ok(jhin.kit.passive.mechanics_from_passive.includes('guaranteed_fourth_shot_crit'));
 assert.match(byName.get('Galio').skills.passive.excerpt_fr,/magique/i);
 const engine=fs.readFileSync('wrdi-draft-engine-v15.js','utf8');
 assert.ok(!engine.includes('champion-ability-extract-official-v1.json'));
});
