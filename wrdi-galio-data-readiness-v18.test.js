const test=require('node:test');
const assert=require('node:assert/strict');
const readiness=require('./wrdi-galio-data-readiness-v18.js');
const champs=require('./data/champions-picker-v151.json').champions;
const official=require('./data/champion-ability-extract-official-v1.json');
const numeric=require('./data/champion-ability-numeric-wiki-wr-v1.json');
const items=require('./data/items-client-7.3d-v12.json');
const runes=require('./data/rune-catalog-client-v14.json');
const boots=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
const picks=['10002','10038','10099','10119','10021','10071','10013','10031','10077','10081'];
const data={picks,championMeta:champs,officialKits:official,numericKits:numeric,items,runes,boots};
test('All selected champions have all five sourced Wild Rift skill descriptions before optimization',()=>{
 const a=readiness.inspect(data);
 assert.equal(a.ok,true,a.reasons.join('; '));
 assert.equal(a.fullyDescribed,10);
 assert.equal(a.itemRecords,59);
 assert.equal(a.runeRecords,52);
 assert.ok(a.bootRecords>=3);
 assert.equal(a.numericSourceUsed,true);
});
test('Fail closed on missing skill description or boots, rather than calculating fictitious scores',()=>{
 const altered={...official,entries:official.entries.map(x=>x.id===picks[0]?{...x,skills:{...x.skills,q:{...x.skills.q,description_fr:''}}}:x)};
 const a=readiness.inspect({...data,officialKits:altered});
 assert.equal(a.ok,false);assert.ok(a.reasons.some(x=>x.includes('Compétences')));
 const missing=readiness.inspect({...data,boots:{records:boots.records.filter(x=>x.name_fr!=='Bottes de mana')}});
 assert.equal(missing.ok,false);
});
test('No claims that numeric stats from the external WR wiki are patch verified',()=>{
 const x=readiness.inspect(data);assert.equal(x.status,'ready_with_source_qualifications');
 assert.ok(x.warnings.some(s=>s.includes('patch')));
});
