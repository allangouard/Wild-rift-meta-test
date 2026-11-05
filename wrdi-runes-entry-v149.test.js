const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const page=fs.readFileSync('index-v149.html','utf8');
const tabs=fs.readFileSync('assets/unified-interface-v149.js','utf8');
const panel=fs.readFileSync('wrdi-rune-panel-v14.js','utf8');
test('Page V14.9 distincte et lien visible sans dépendre de la navigation cachée',()=>{
 assert.match(page,/<title>Wild Rift Draft Intelligence · V14\.9 Runes<\/title>/);
 assert.ok(page.includes('id="wrdiOpenRunes149"'));
 assert.ok(page.includes("document.getElementById('wrdiTab_runes')"));
 assert.ok(page.includes('./assets/unified-interface-v149.js?v=1490'));
 assert.ok(!page.includes('<script defer src="./assets/pwa.js'));
});
test('Quatrième onglet Runes créé, visible et monté au bon endroit',()=>{
 assert.ok(tabs.includes("['runes', '✨ Runes']"));
 assert.ok(tabs.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
 assert.ok(tabs.includes("panes.runes.appendChild"));
 assert.ok(panel.includes("$('wrdiPane_runes') || $('runes')"));
 assert.ok(panel.includes('host.appendChild(card)'));
});
test('Moteur rune V14.8 et catalogue chargés sur la nouvelle URL',()=>{
 assert.ok(page.includes('wrdi-rune-bridge-v14.js?v=1490'));
 assert.ok(page.includes('wrdi-galio-rune-scenarios-v14.js?v=1490'));
 assert.ok(page.includes('wrdi-rune-panel-v14.js?v=1490'));
 assert.ok(panel.includes('Examiner les runes avec la draft'));
});
