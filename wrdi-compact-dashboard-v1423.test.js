const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('compact UI is loaded last after rune engines and app, with cache busting',()=>{
 const html=fs.readFileSync('index-v1423.html','utf8');
 assert.ok(html.includes('wrdi-compact-dashboard-v1423.js?v=14230'));
 assert.ok(html.indexOf('wrdi-compact-dashboard-v1423.js')>html.indexOf('wrdi-ten-kit-panel-v1414.js'));
 assert.ok(html.includes('assets/app.js?v=14230'));
 assert.ok(html.includes('wrdi-ten-kit-panel-v1414.js?v=14230'));
});
test('core exposes structured observed Mid items and situational choices',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 assert.ok(app.includes("new CustomEvent('wrdi:build-result'"));
 assert.ok(app.includes("core:base.items.map(optId)"));
 assert.ok(app.includes('situational:chosen.map'));
 assert.ok(app.includes('if(!window.WRDI_CompactV1423)'));
});
test('rune event only comes from verified legal adapted rune pages',()=>{
 const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
 assert.ok(panel.includes("new CustomEvent('wrdi:rune-result'"));
 assert.ok(panel.includes('bridge.validate(selected.page,catalog).valid'));
 assert.ok(panel.includes('draftFingerprint:fingerprint'));
 assert.ok(panel.includes('fullKitCoverage:inspected.coverage.available===10'));
});
test('compact mode preserves a single visible results section and hides technical panes',()=>{
 const ui=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(ui.includes('wrdiCompactCore1423'));
 assert.ok(ui.includes('wrdiCompactItems1423'));
 assert.ok(ui.includes('wrdiCompactRunes1423'));
 assert.ok(ui.includes('wrdiTechnicalV1423'));
 assert.ok(ui.includes('#simpleResults{display:none!important}'));
 assert.ok(ui.includes('advanced.append(workspace)'));
 assert.ok(ui.includes('button.click()'));
 assert.ok(ui.includes('d.draftFingerprint!==activeSignature'));
});
test('no invented six-item build, fictional item/rune gains, or declared winrate',()=>{
 const ui=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(ui.includes('Core Mid observé'));
 assert.ok(ui.includes('Page Galio tactique expérimentale'));
 assert.ok(!ui.includes('bestWinRate'));
 assert.ok(!ui.includes('100% fiable'));
});
