const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const reference=require('./wrdi-champion-kit-reference-v1.js');
const data=require('./data/champion-kits-official-fr-v1.json');
const coverage=require('./data/champion-kit-coverage-v1.json');
const client=require('./data/champions-picker-v151.json');
test('official Wild Rift kit batch is sourced and names all five skills',()=>{
 const compiled=reference.prepare(data);
 assert.equal(compiled.ok,true,compiled.reason);
 assert.equal(compiled.size,36);
 assert.equal(new Set(data.profiles.map(x=>x.id)).size,36);
 for(const p of data.profiles){
  if(p.source.type==='user_wild_rift_client_screenshots_fr')assert.equal(p.source.type,'user_wild_rift_client_screenshots_fr');
  else assert.equal(p.source.type,'riot_wild_rift_official_fr');
  assert.ok(p.source.url.startsWith('https://wildrift.leagueoflegends.com/fr-fr/champions/'),p.champion);
  assert.deepEqual(['passive','q','w','e','r'].map(k=>typeof p.kit[k].name),Array(5).fill('string'));
  if(p.champion==='Hwei')assert.equal(p.coverage.numeric_values,'client_visible_partial_except_ee_damage_conflict_with_7_3b');
  else if(p.champion==='Aurora')assert.equal(p.coverage.numeric_values,'partially_client_verified_patch_not_visible');
  else if(p.source.type==='user_wild_rift_client_screenshots_fr')assert.equal(p.coverage.numeric_values,'not_yet_certified');
  else assert.equal(p.coverage.numeric_values,'not_yet_verified');
  if(['Hwei','Aurora'].includes(p.champion))assert.equal(p.coverage.active_ability_descriptions,'client_screenshots');
  else if(p.source.type==='user_wild_rift_client_screenshots_fr')assert.match(p.coverage.active_ability_descriptions,/client_/);
  else assert.equal(p.coverage.active_ability_descriptions,'not_yet_verified');
  assert.equal(p.allowedForEngine,false);
  for(const k of ['q','w','e','r']){
   if(p.source.type==='user_wild_rift_client_screenshots_fr')assert.ok(p.kit[k].description_fr.length>25);
   else assert.equal(p.kit[k].description_fr,null);
  }
 }
});
test('all champion IDs match local Wild Rift picker; coverage exposes all pending records',()=>{
 const map=new Map(client.champions.map(x=>[x.id,x.name]));
 for(const p of data.profiles)assert.equal(map.get(p.id),p.champion);
 assert.equal(coverage.totalLocalChampions,client.champions.length);
 assert.equal(coverage.entries.length,client.champions.length);
 assert.equal(coverage.officialPartialProfiles,data.profiles.filter(p=>p.source.type==='riot_wild_rift_official_fr').length);
 assert.equal(coverage.clientScreenshotCompleteProfiles,15);
 assert.equal(coverage.clientScreenshotPartialProfiles,1);
 assert.equal(coverage.unresearched,coverage.entries.length-data.profiles.length);
 for(const row of coverage.entries){
  assert.ok(map.has(row.id));
  assert.equal(row.fullFiveSkillDescriptionsVerified,row.officialKitStatus==='client_screenshot_curated_5_slots'||['Hwei','Aurora'].includes(row.name));
  assert.equal(row.allRatiosAndCooldownsVerified,false);
 }
});
test('conditional Kayn and inherent Jhin mechanics are not confused with predicted items',()=>{
 const r=reference.prepare(data);
 assert.ok(r.find('Kayn').kit.passive.mechanics_from_passive.includes('form_dependent'));
 assert.ok(r.find('Jhin').kit.passive.mechanics_from_passive.includes('guaranteed_fourth_shot_crit'));
 assert.ok(r.find('Ashe').kit.passive.mechanics_from_passive.includes('special_crit_interaction'));
});
test('incomplete official sheets cannot silently affect existing five-item or rune scoring',()=>{
 const r=reference.prepare(data);
 assert.deepEqual(r.eligibleForScoring(),[]);
 const html=fs.readFileSync('index.html','utf8');
 assert.ok(!html.includes('wrdi-champion-kit-reference-v1.js'));
 const engine=fs.readFileSync('wrdi-draft-engine-v15.js','utf8');
 assert.ok(!engine.includes('kitReference.find('));
});
