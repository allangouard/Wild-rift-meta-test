const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const canonical=fs.readFileSync('index.html','utf8');
const snapshot=fs.readFileSync('index-v1434.html','utf8');
const scripts=html=>[...html.matchAll(/<script[^>]+src=["']([^"'?]+)/g)].map(x=>x[1]);
test('canonical landing page loads current Galio five item build and rune interface',()=>{
 assert.match(canonical,/V14\.34/);
 for(const name of [
  'wrdi-galio-team-context-v1431.js',
  'wrdi-galio-kit-item-synergy-v1434.js',
  'wrdi-galio-five-item-optimizer-v1429.js',
  'wrdi-galio-purchase-order-v1432.js',
  'wrdi-galio-contingencies-v1433.js',
  'wrdi-compact-dashboard-v1423.js',
  'wrdi-ten-kit-panel-v1414.js'
 ])assert.ok(canonical.includes(name),name);
 assert.deepEqual(scripts(canonical),scripts(snapshot));
});
test('all browser local JS imports exist and are not duplicated',()=>{
 const included=scripts(canonical);
 assert.equal(included.length,new Set(included).size);
 for(const ref of included){
  assert.ok(ref.startsWith('./'),ref);
  assert.ok(fs.existsSync(ref.slice(2)),ref);
 }
 assert.ok(included.length<70,'audit bloated runtime if script count grows');
});
test('historical HTML fixtures used by tests remain present',()=>{
 const tests=fs.readdirSync('.').filter(x=>x.endsWith('.test.js'));
 const refs=new Set();
 for(const p of tests){
  const content=fs.readFileSync(p,'utf8');
  for(const match of content.matchAll(/index-v\d+\.html/g))refs.add(match[0]);
 }
 for(const ref of refs)assert.ok(fs.existsSync(ref),'missing historical fixture '+ref);
});
test('canonical PWA worker cannot overwrite main offline cache with a versioned snapshot',()=>{
 const sw=fs.readFileSync('sw.js','utf8');
 assert.ok(sw.includes("wrdi-shell-current-v1434"));
 assert.ok(sw.includes("url.pathname===scope.pathname+'index.html'"));
 assert.ok(sw.includes('if(exact)'));
});
test('GitHub main and dev remain controlled deployment targets; no popular builds for Galio',()=>{
 const app=fs.readFileSync('assets/app.js','utf8');
 const start=app.indexOf('async function simpleAnalyze(){');
 const piece=app.slice(start,start+1650);
 assert.ok(piece.indexOf("if(String(own)==='10099')")<piece.indexOf('const patches='));
 assert.ok(app.includes("source:'player_client_only'"));
});
