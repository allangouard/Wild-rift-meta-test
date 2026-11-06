import test from 'node:test';
import assert from 'node:assert/strict';
import {extractNextData,extractKit} from './wr-official-page-parser.mjs';
const groups=['Passif','Compétence 1','Compétence 2','Compétence 3','Ultime']
 .map((name,i)=>({label:name,content:{description:{body:'Dégâts et contrôle '+i}}}));
const next={props:{pageProps:{page:{blades:[{}, {}, {groups}]}}}};
test('Riot Wild Rift Next.js page produces five well-ordered official ability names',()=>{
 const html='<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(next)+'</script>';
 const d=extractNextData(html),kit=extractKit(d);
 assert.deepEqual(Object.keys(kit),['passive','q','w','e','r']);
 assert.equal(kit.q.name,'Compétence 1');
 assert.equal(kit.r.name,'Ultime');
 assert.equal(kit.r.descriptionPresent,true);
});
test('no fallback to PC Data Dragon or made-up skills when source page is incomplete',()=>{
 assert.throws(()=>extractNextData('<html>No official data</html>'),/not found/);
 assert.throws(()=>extractKit({props:{}}),/Five Wild Rift abilities/);
});
