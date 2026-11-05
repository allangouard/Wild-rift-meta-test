const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const gate=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepare=patch=>gate.prepare({catalog,rules,core,livePatch:patch});
const p=prepare('7.3d');
const names=ids=>ids.map(id=>catalog.items.find(x=>x.id===id).name_fr);
test('client-based audit is ready, but never a certified optimizer',()=>{
 assert.equal(p.ok,true);
 assert.equal(p.recommendationEligible,false);
 assert.equal(gate.identify('Cotte épineuse',p).id,'thornmail');
 assert.equal(gate.identify('Bâton du vide',p).id,'void_staff');
});
test('real Wild Rift exclusion pairs block an incompatible Galio build',()=>{
 const result=gate.validateSelection(names(['cryptbloom','void_staff']),p);
 assert.equal(result.ok,false);
 assert.equal(result.status,'equipment_conflict');
 assert.match(result.reason,/magic_pen/);
});
test('extra exclusive mythic-like families block direct suggestions',()=>{
 const run=gate.validateSelection(names(['hollow_radiance','sunfire_aegis']),p);
 assert.equal(run.ok,false);
 assert.match(run.reason,/immolate/);
});
test('allowed Galio combinations preserve validated client restrictions without claiming optimality',()=>{
 const run=gate.validateSelection(names(['riftmaker','thornmail','unending_despair']),p,{requireFullCore:true});
 assert.equal(run.ok,true);
 assert.equal(run.recommendationEligible,false);
});
test('unresolved item names cannot be assumed safe or translated',()=>{
 const run=gate.validateSelection(['Objet non identifié'],p);
 assert.equal(run.ok,false);
 assert.equal(run.status,'unresolved_identity');
 assert.equal(gate.identify('Void Staff',p).ok,false);
});
test('transformed item cannot become a standalone purchase recommendation',()=>{
 const transformed=catalog.items.find(x=>x.item_type==='transformed');
 assert.ok(transformed);
 const run=gate.validateSelection([transformed.name_fr],p);
 assert.equal(run.ok,false);
 assert.equal(run.status,'transformed_not_buyable');
});
test('outdated or mismatched live patch fails closed, without inventing item legality',()=>{
 const older=prepare('7.3e');
 assert.equal(older.ok,false);
 const result=gate.validateSelection(['Cotte épineuse'],older);
 assert.equal(result.ok,false);
 assert.equal(result.status,'source_unavailable');
});
test('filter rejects mutually exclusive completion but keeps other validated candidates',()=>{
 const base=names(['riftmaker','void_staff','thornmail']);
 const alternatives=[{name:'Fleur de crypte'},{name:'Désespoir infini'}];
 const result=gate.filterAlternatives({coreNames:base,candidates:alternatives,prepared:p});
 assert.equal(result.ok,true);
 assert.deepEqual(result.selected.map(x=>x.name),['Désespoir infini']);
 assert.equal(result.rejected.length,1);
});
test('integration prevents uncontrolled item candidate selection when audit fails',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const compact=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(app.includes('WRDI_GalioItemGuardV1424.prepare'));
 assert.ok(app.includes('WRDI_GalioItemGuardV1424.validateSelection'));
 assert.ok(app.includes('const pick=canAudit?ranked.find'));
 assert.ok(app.includes('const verifiedCores=itemSafety?.ok?unique.filter'));
 assert.ok(app.includes('verifiedCores.length?verifiedCores:unique'));

 assert.ok(app.includes('itemRestrictionsChecked:canAudit'));
 assert.ok(compact.includes('d.itemRestrictionsChecked'));
});
