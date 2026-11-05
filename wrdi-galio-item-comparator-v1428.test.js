const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const comparator=require('./wrdi-galio-item-comparator-v1428.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const name=id=>catalog.items.find(x=>x.id===id).name_fr;
const compare=(ids,threats,coreIds=[])=>comparator.compare({
 candidates:ids.map(id=>({name:name(id),refId:id})),prepared,threats,coreNames:coreIds.map(name)
});
test('Galio suitability is based on client-verified passives and character fit, never DPS',()=>{
 const r=comparator.review({name:name('liandrys_torment'),prepared,threats:{tank:3}});
 assert.equal(r.ok,true);assert.equal(r.estimatedDamage,null);assert.equal(r.winRate,null);
 assert.ok(r.points.some(x=>x.category==='draft'&&x.reason.includes('PV max')));
 assert.ok(r.points.some(x=>x.category==='galio_fit'));
});
test('vs several tanks, Liandry beats untyped flat AP item for explicit max-HP mechanic',()=>{
 const r=compare(['rabadons_deathcap','liandrys_torment'],{tank:3});
 assert.equal(r.ok,true);assert.equal(r.choice.refId,'liandrys_torment');
 assert.ok(r.relativeReason.includes('Coiffe'));
 assert.equal(r.certifiedOptimal,false);
});
test('vs multiple AP enemies, MR item is preferred over armor-only defense',()=>{
 const r=compare(['thornmail','hollow_radiance'],{ap:4,ad:0});
 assert.equal(r.choice.refId,'hollow_radiance');
 assert.equal(r.hasDirectDraftReason,true);
});
test('healing reduction is only inferred from documented client grievous wounds',()=>{
 const r=compare(['riftmaker','morellonomicon'],{heal:3});
 assert.equal(r.choice.refId,'morellonomicon');
 assert.ok(r.choiceAudit.points.some(x=>x.reason.includes('Blessures graves')));
});
test('core redundancy prevents presenting a second antiheal as generally better',()=>{
 const r=compare(['morellonomicon','riftmaker'],{heal:3},['thornmail']);
 assert.equal(r.choice.refId,'riftmaker');
 assert.equal(r.certifiedOptimal,false);
});
test('incompatible magic-penetration options are excluded, not scored as safe',()=>{
 const r=compare(['void_staff','hollow_radiance'],{ap:3},['cryptbloom']);
 assert.equal(r.choice.refId,'hollow_radiance');
 assert.ok(r.rejected.some(x=>x.name===name('void_staff')));
});
test('when the scores tie, engine explicitly does not claim relative advantage',()=>{
 const r=compare(['rabadons_deathcap','infinity_orb'],{});
 assert.equal(r.ok,true);
 assert.equal(r.advantageDemonstrated,false);
 assert.ok(r.relativeReason.includes('Avantage non démontré'));
});
test('no unsupported shield counter is fabricated from high AP or penetration',()=>{
 const a=comparator.review({name:name('void_staff'),prepared,threats:{shield:4}});
 assert.equal(a.ok,true);
 assert.ok(!a.points.some(x=>x.reason.includes('bouclier')));
});
test('UI consumes comparison with explanations in simple mode',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 assert.ok(app.includes('WRDI_GalioItemComparatorV1428'));
 assert.ok(app.includes('comparison?.relativeReason')||app.includes('pick.relativeComparison?.relativeReason'));
 assert.ok(app.includes('comparator.compare('));
});
