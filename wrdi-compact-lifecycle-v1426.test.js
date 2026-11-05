const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const app=fs.readFileSync('assets/app.js','utf8');
const panel=fs.readFileSync('wrdi-ten-kit-panel-v1414.js','utf8');
const compact=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
const html=fs.readFileSync('index-v1426.html','utf8');
test('mobile V14.26 loads refreshed scripts',()=>{
 assert.ok(html.includes('assets/app.js?v=14260'));
 assert.ok(html.includes('wrdi-ten-kit-panel-v1414.js?v=14260'));
 assert.ok(html.includes('wrdi-compact-dashboard-v1423.js?v=14261'));
});
test('build analysis reports all early exits and exceptions',()=>{
 const fn=app.slice(app.indexOf('async function simpleAnalyze(){'),app.indexOf("\n$('simpleRun').onclick=simpleAnalyze;"));
 assert.ok(fn.includes("new CustomEvent('wrdi:build-error'"));
 assert.ok(fn.includes("reportFailure('Sources d’objets indisponibles"));
 assert.ok(fn.includes("reportFailure('Aucun core Mid identifié"));
 assert.ok(fn.includes("reportFailure('Aucun core Mid complet"));
 assert.ok(fn.includes("reportFailure('Analyse des objets interrompue"));
 assert.ok(fn.includes("new CustomEvent('wrdi:build-result'"));
});
test('rune panel surfaces errors from missing modules, draft failures and thrown exceptions',()=>{
 assert.ok(panel.includes("new CustomEvent('wrdi:rune-error'"));
 assert.ok(panel.includes("reportFailure('Module d’analyse des kits manquant.')"));
 assert.ok(panel.includes("reportFailure('Analyse des runes interrompue"));
 assert.ok(panel.includes("reportFailure(evaluation.errors.join(' ; '))"));
 assert.ok(panel.includes("signal:controller.signal"));
 assert.ok(panel.includes("new CustomEvent('wrdi:rune-result'"));
});
test('single screen responds to both error events and ends loading on timeout',()=>{
 assert.ok(compact.includes("addEventListener('wrdi:build-error'"));
 assert.ok(compact.includes("addEventListener('wrdi:rune-error'"));
 assert.ok(compact.includes("d.draftFingerprint!==activeSignature"));
 assert.ok(compact.includes("setTimeout(()=>"));
 assert.ok(compact.includes('},25000)'));
 assert.ok(compact.includes('if(buildDone&&runeDone)'));
 assert.ok(compact.includes('Analyse terminée'));
 assert.ok(compact.includes('clearTimeout(pendingTimer)'));
 assert.ok(compact.includes('},true);'));
});
test('successful rune and item recommendations remain available',()=>{
 assert.ok(compact.includes("addEventListener('wrdi:build-result'"));
 assert.ok(compact.includes("addEventListener('wrdi:rune-result'"));
 assert.ok(compact.includes('fillRow(core,d.core.map'));
 assert.ok(compact.includes('fillRow(runes,names(d.page))'));
});
