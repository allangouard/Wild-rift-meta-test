const {test}=require('node:test');
const assert=require('node:assert/strict');
const kit=require('./wrdi-official-kit-intelligence-v158.js');
const profiles=require('./wrdi-champion-profiles-v15.js');
const team=require('./wrdi-galio-team-context-v1431.js');
const engine=require('./wrdi-draft-engine-v15.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const order=require('./wrdi-galio-purchase-order-v1432.js');
const contingency=require('./wrdi-galio-contingencies-v1433.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const inventory=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const roster=require('./data/champions-picker-v151.json').champions;
const official=require('./data/champion-ability-extract-official-v1.json');
const reviewed=require('./data/champion-kits-official-fr-v1.json');
const api=kit.prepare(official);
const byName=new Map(roster.map(x=>[x.name.toLowerCase(),x]));
const manual=new Map(reviewed.profiles.map(x=>[x.id,x]));
const lookup=name=>{
 const meta=byName.get(name.toLowerCase());
 return kit.enrich(profiles.lookup(name,meta),api.find(meta?.id||name),manual.get(meta?.id)).traits;
};
const prepare=guard.prepare({catalog:inventory,rules:restrictions,core,livePatch:'7.3d'});
test('all 126 sourced Wild Rift entries support textual analysis, never numeric simulation',()=>{
 assert.equal(api.ok,true,api.reason);
 assert.equal(api.count,126);
 for(const entry of official.entries){
  const r=kit.analyze(entry);
  assert.equal(r.ok,true);
  assert.equal(r.damageQuantified,false);
  assert.equal(r.patchVerified,false);
  for(const evidence of r.evidence)assert.equal(evidence.source,
   entry.name==='Hwei'?'user_wild_rift_client_screenshots':entry.source_url);
 }
});
test('Aatrox healing from official skill, Kayn conditional healing from reviewed official passive',()=>{
 const a=kit.enrich(profiles.lookup('Aatrox'),api.find('Aatrox'),manual.get('10002'));
 const k=kit.enrich(profiles.lookup('Kayn'),api.find('Kayn'),manual.get('10005'));
 assert.ok(a.traits.includes('heal'),JSON.stringify(a));
 assert.ok(a.intel.evidence.some(x=>x.flag==='healing'));
 assert.ok(k.traits.includes('heal'),JSON.stringify(k));
 assert.ok(k.traits.includes('conditional_sustain'));
 assert.ok(k.intel.evidence.some(x=>x.flag==='healing_reviewed'));
});
test('passive and spell mechanics are detectable without guessing crit-item builds',()=>{
 const kindred=kit.analyze(api.find('Kindred'));
 const jhin=kit.analyze(api.find('Jhin'));
 const brand=kit.analyze(api.find('Brand'));
 assert.ok(brand.flags.burn,JSON.stringify(brand.flags));
 assert.ok(kindred.flags.untargetable,JSON.stringify(kindred.flags));
 assert.ok(!jhin.traits.includes('crit'));
 assert.ok(!jhin.traits.includes('ad'));
});
test('official spells materially enrich healing threats and affect legal Galio builds',()=>{
 const allies=['Ornn','Rammus','Galio','Ashe','Alistar'];
 const enemies=['Aatrox','Kayn','Orianna','Miss Fortune','Leona'];
 const baseline=team.make({allies,enemies,lookup:name=>profiles.lookup(name,byName.get(name.toLowerCase()))});
 const enriched=team.make({allies,enemies,lookup});
 assert.equal(enriched.ok,true);
 assert.ok(enriched.threats.heal>=2,JSON.stringify(enriched.threats));
 assert.ok(enriched.threats.heal>baseline.threats.heal);
 assert.equal(enriched.threats.damageDuty,2);
 const newBuild=optimizer.optimize({prepared:prepare,threats:enriched.threats});
 assert.equal(newBuild.ok,true);
 assert.equal(newBuild.main.items.length,5);
 assert.equal(core.validateEquipment(newBuild.main.items.map(x=>x.id),inventory,restrictions).valid,true);
});
test('normal draft pipeline uses the same official text for both build and rune planning',()=>{
 const names=['Ornn','Rammus','Galio','Ashe','Alistar','Aatrox','Kayn','Orianna','Miss Fortune','Leona'];
 const picks=names.map(name=>roster.find(x=>x.name===name)?.id);
 assert.ok(picks.every(Boolean));
 const result=engine.analyze({picks,champions:Object.fromEntries(roster.map(x=>[x.id,x.name])),
 championMeta:roster,officialKits:official,reviewedKits:reviewed,
 catalog:inventory,rules:restrictions,runes,modules:{
 profiles,team,kitIntelligence:kit,guard,core,optimizer,order,contingency,runeBridge:bridge,runeAdvisor:advisor
 }});
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.draft.officialKitCoverage,10);
 assert.equal(result.draft.threats.heal>=2,true);
 assert.equal(result.methods.championThreatSource,'official_wild_rift_abilities');
 assert.equal(result.build.items.length,5);
 assert.equal(bridge.validate(result.runes.page,runes).valid,true);
 assert.equal(result.build.noPopularBuilds,true);
 assert.ok(result.draft.notes.some(x=>x.includes('Compétences Riot Wild Rift')));
});
test('full official text is prioritized over short display excerpts',()=>{
 const sample={id:'10099',name:'Galio',source_url:'https://wildrift.leagueoflegends.com/fr-fr/champions/galio/',skills:{}};
 for(const k of ['passive','q','w','e','r'])sample.skills[k]={name:k,excerpt_fr:'Inflige des dégâts.',description_fr:'Inflige des dégâts et soigne un allié.',detected_mechanics:[]};
 const r=kit.analyze(sample);
 assert.equal(r.flags.healing,true);
 assert.equal(r.confidence,'explicit_full_official_text');
 assert.ok(r.evidence.every(e=>e.truncated===false));
});
test('no official kit available means no fake mechanical inference',()=>{
 assert.equal(kit.enrich(['ad'],null).traits.join(','),'ad');
 assert.equal(kit.prepare({entries:[]}).ok,false);
});

test('French phrasing cannot turn an explosion into a taunt, or a slow into a hard stun',()=>{
 const rec={id:'test',name:'Champion test',
  source_url:'https://wildrift.leagueoflegends.com/fr-fr/champions/galio/',
  skills:{passive:{name:'Passif',excerpt_fr:'Provoque une explosion qui inflige des dégâts magiques.'},
   q:{name:'A',excerpt_fr:'La cible est ralentie.'},
   w:{name:'Z',excerpt_fr:'Galio provoque et blesse les champions ennemis proches.'},
   e:{name:'E',excerpt_fr:'Galio projette les ennemis en l’air.'},
   r:{name:'R',excerpt_fr:'La compétence accorde un bouclier.'}}};
 const r=kit.analyze(rec);
 assert.equal(r.ok,true);
 assert.ok(r.flags.cc);
 assert.ok(r.flags.shield);
 assert.ok(!r.evidence.some(x=>x.flag==='cc'&&x.spell==='passive'),
  'Provoquer une explosion ne doit pas devenir une provocation');
 assert.ok(r.evidence.some(x=>x.flag==='slow'&&x.spell==='q'));
 assert.ok(!r.evidence.some(x=>x.flag==='cc'&&x.spell==='q'),
  'Un ralentissement n’est pas automatiquement un contrôle dur');
});

test('full 125 champion import is rejected if one complete description is lost',()=>{
 const raw=require('./data/champion-ability-extract-official-v1.json');
 const sample={...raw,entries:raw.entries.map((c,i)=>i?c:{...c,skills:{...c.skills,q:{...c.skills.q,description_fr:''}}})};
 assert.equal(kit.prepare(sample).ok,false);
 assert.match(kit.prepare(sample).reason,/Description intégrale/);
 assert.equal(kit.prepare(raw).ok,true);
});
