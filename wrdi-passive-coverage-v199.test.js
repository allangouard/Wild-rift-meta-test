'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const audit=require('./wrdi-passive-coverage-v199.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const bootsCatalog=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const byId=new Map(catalog.items.map(x=>[x.id,x]));
test('complete client inventory includes every item passive, rune and boot',()=>{
 const a=audit.auditCatalog({catalog,runes,bootsCatalog});
 assert.equal(a.ok,true);
 assert.equal(a.itemCount,catalog.items.length);
 assert.equal(a.itemPassiveCount,catalog.items.reduce((s,x)=>s+(x.passives||[]).length,0));
 assert.equal(a.runeCount,runes.fundamental.length+runes.minor.length);
 assert.equal(a.bootCount,bootsCatalog.records.length);
 assert.ok(a.distinctPassiveFields>20);
 assert.equal(a.allEffectsNumericallySimulated,false);
});
test('fifth item passive that is not modeled is explicitly visible',()=>{
 const ids=['ludens_echo','rabadons_deathcap','infinity_orb','void_staff','lich_bane'];
 const items=ids.map(id=>byId.get(id));
 const a=audit.inspectLoadout({items,runePage:{keystone:'Électrocution',
  primary:['Coup de grâce','Transcendance'],secondary:'Plaque d\'os'},
  runes,boots:bootsCatalog.records.find(x=>x.name_fr==='Bottes de mana')});
 assert.equal(a.ok,true);
 assert.equal(a.selectedItems.length,5);
 assert.equal(a.totalPassives,items.reduce((s,x)=>s+(x.passives||[]).length,0));
 assert.ok(a.remainingPassives.includes('lich_bane:0'));
 assert.ok(a.runes.some(x=>x.name==='Électrocution'&&x.found));
 assert.equal(a.unknownEffectsNotSilentlyScored,true);
});
test('each individual passive index is tracked, not only the item name',()=>{
 const ids=['hollow_radiance','riftmaker','ludens_echo','liandrys_torment','unending_despair'];
 const a=audit.inspectLoadout({items:ids.map(id=>byId.get(id))});
 assert.ok(a.passives.some(x=>x.id==='hollow_radiance:1'&&!x.modeled));
 assert.ok(a.passives.some(x=>x.id==='hollow_radiance:0'&&x.modeled));
 assert.ok(a.passives.some(x=>x.id==='riftmaker:1'&&x.modeled));
 assert.ok(a.totalPassives>a.numericallyModeled);
});
