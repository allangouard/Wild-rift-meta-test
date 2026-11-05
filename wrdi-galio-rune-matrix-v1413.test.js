const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const matrix=require('./wrdi-galio-rune-matrix-v1413.js');
const bridge=require('./wrdi-rune-bridge-v14.js');
const catalog=require('./data/rune-catalog-client-v14.json');
test('Cinq compétences Galio Wild Rift avec sources, rune IDs client et statuts prudents',()=>{
 const m=matrix.inspect(catalog,bridge);
 assert.equal(m.ok,true,JSON.stringify(m.errors));
 assert.equal(m.abilities.length,5);
 assert.ok(m.interactionCount>=15);
 assert.ok(m.runeCoverage>=10);
 assert.equal(m.combatTriggerVerified,false);
 assert.equal(m.patchCurrentVerified,false);
 assert.equal(m.effectDescriptionsVerifiedInClient,true);
 assert.ok(m.abilities.every(a=>a.source.startsWith('https://')&&a.detail));
});
test('Chaque interaction existe dans le catalogue et ne revendique pas de déclenchement validé',()=>{
 const names=new Set([...catalog.minor,...catalog.fundamental].map(x=>x.name_fr));
 for(const r of matrix.rules){
  assert.ok(names.has(r.rune),r.rune);
  assert.ok(['conditional_trigger','indirect_synergy','interaction_unverified'].includes(r.status));
  assert.ok(r.condition&&r.reason);
 }
 assert.equal(matrix.rules.some(r=>r.status==='confirmed_trigger'),false);
});
test('Les conditions distinguent l ultime, l attaque renforcée et le proc multi-coups',()=>{
 const ultimate=matrix.rules.find(x=>x.rune==='Gardien');
 assert.equal(ultimate.ability,'R');
 assert.equal(ultimate.status,'indirect_synergy');
 const electrocute=matrix.rules.find(x=>x.rune==='Électrocution'&&x.ability==='A');
 assert.ok(electrocute.condition.includes('3'));
});
test('Un catalogue falsifié bloque la matrice',()=>{
 const fake={...catalog,minor:catalog.minor.slice(1)};
 assert.equal(matrix.inspect(fake,bridge).ok,false);
});
test('Nouvelle page affiche la matrice, les sources et n utilise pas le moteur d objets',()=>{
 const html=fs.readFileSync('index-v1413.html','utf8');
 const panel=fs.readFileSync('wrdi-galio-rune-matrix-panel-v1413.js','utf8');
 assert.ok(html.includes('./wrdi-galio-rune-matrix-v1413.js?v=14130'));
 assert.ok(html.includes('./wrdi-galio-rune-matrix-panel-v1413.js?v=14130'));
 assert.ok(panel.includes('Kit Galio ↔ runes'));
 assert.ok(panel.includes('Consulter la source'));
 assert.ok(!panel.includes('adapters.create('));
});
