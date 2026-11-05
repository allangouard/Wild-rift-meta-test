const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const engine=require('./wrdi-galio-item-context-v1427.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const item=id=>catalog.items.find(x=>x.id===id).name_fr;
test('client data is available, and contextual reports carry no fake winrate or damage simulations',()=>{
 assert.equal(prepared.ok,true);
 for(const id of ['thornmail','morellonomicon','liandrys_torment','riftmaker','hollow_radiance']){
  const r=engine.inspect({itemName:item(id),prepared,threats:{ad:3,ap:3,tank:3,heal:3}});
  assert.equal(r.ok,true,id);
  assert.equal(r.winRate,null);
  assert.equal(r.damageSimulated,false);
  assert.equal(r.source,'player_verified_client_7.3d');
 }
});
test('antiheal is supported only by the observed grievous wounds passive, not item name heuristics',()=>{
 const threat={heal:2,ad:2,ap:2};
 const thorn=engine.inspect({itemName:item('thornmail'),prepared,threats:threat});
 const morello=engine.inspect({itemName:item('morellonomicon'),prepared,threats:threat});
 const unrelated=engine.inspect({itemName:item('riftmaker'),prepared,threats:threat});
 assert.ok(thorn.signals.some(x=>x.id==='antiheal'));
 assert.ok(morello.signals.some(x=>x.id==='antiheal'));
 assert.ok(!unrelated.signals.some(x=>x.id==='antiheal'));
 assert.match(thorn.indications.join(' '),/50 %/);
});
test('Liandry is identified against high HP teams from target max HP mechanic only',()=>{
 const high=engine.inspect({itemName:item('liandrys_torment'),prepared,threats:{tank:3}});
 const low=engine.inspect({itemName:item('liandrys_torment'),prepared,threats:{tank:0}});
 assert.ok(high.signals.some(x=>x.id==='maxhp'));
 assert.ok(!low.signals.some(x=>x.id==='maxhp'));
 assert.ok(high.suitabilityIndex>low.suitabilityIndex);
});
test('ad and magic threats are evaluated via verified armor and MR stats',()=>{
 const armor=engine.inspect({itemName:item('thornmail'),prepared,threats:{ad:3,ap:0}});
 const mr=engine.inspect({itemName:item('hollow_radiance'),prepared,threats:{ad:0,ap:3}});
 assert.ok(armor.signals.some(x=>x.id==='armor'));
 assert.ok(mr.signals.some(x=>x.id==='mr'));
});
test('rank is stable when no documented contextual signal exists',()=>{
 const r=engine.rank({candidates:[{name:item('riftmaker')},{name:item('thornmail')}],prepared,threats:{}});
 assert.equal(r.ok,true);
 assert.deepEqual(r.entries.map(x=>x.candidate.name),[item('riftmaker'),item('thornmail')]);
 assert.equal(r.certifiedOptimal,false);
});
test('unknown and incomplete item cards are never ranked as validated',()=>{
 const un=engine.inspect({itemName:'Improbable test',prepared,threats:{heal:5}});
 assert.equal(un.ok,false);
 for(const x of catalog.items.filter(v=>!guard.itemEvidence(v).complete)){
  const r=engine.inspect({itemName:x.name_fr,prepared,threats:{ad:5,ap:5}});
  assert.equal(r.ok,false);
 }
});
test('app uses verified passive context, not invented optimization',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 assert.ok(app.includes('WRDI_GalioItemContextV1427'));
 assert.ok(app.includes('clientContext.indications'));
 assert.ok(app.includes('const eligible=canAudit?ranked.filter'));
});
