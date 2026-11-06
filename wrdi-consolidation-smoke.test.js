const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const current=fs.readFileSync('index.html','utf8');
const snapshot=fs.readFileSync('index-v154.html','utf8');
const scripts=html=>[...html.matchAll(/<script[^>]+src=["']([^"'?]+)/g)].map(x=>x[1]);
test('production homepage is the standalone Galio draft V15 application',()=>{
 assert.ok(current.includes('Wild Rift Draft Intelligence — V15.4'));
 assert.deepEqual(scripts(current),scripts(snapshot));
 assert.equal(scripts(current).length,15);
 for(const forbidden of ['assets/app.js','wrdi-diagnostic-v14.js','wrdi-galio-item-comparator-v1428.js','wrdi-compact-dashboard-v1423.js','/api/build/'])assert.ok(!current.includes(forbidden),forbidden);
});
test('all clean runtime scripts exist and no script is loaded twice',()=>{
 const refs=scripts(current);
 assert.equal(new Set(refs).size,refs.length);
 for(const ref of refs)assert.ok(fs.existsSync(ref.slice(2)),ref);
});
test('historical HTML pages referenced by tests are retained as fixtures, not startup pages',()=>{
 const tests=fs.readdirSync('.').filter(x=>x.endsWith('.test.js'));
 const refs=new Set();
 for(const p of tests)for(const match of fs.readFileSync(p,'utf8').matchAll(/index-v\d+\.html/g))refs.add(match[0]);
 for(const path of refs)assert.ok(fs.existsSync(path),'missing historical fixture '+path);
});
test('PWA cache preserves versioned pages without overwriting the canonical index',()=>{
 const sw=fs.readFileSync('sw.js','utf8');
 assert.ok(sw.includes('wrdi-shell-current-v15'));
 assert.ok(sw.includes('if(exact)'));
});
