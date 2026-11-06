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

test('French accent normalization preserves spell mechanics from complete Riot text',()=>{
 const groups=[
  {label:'Passif',content:{description:{body:'Les flammes enflamment les cibles et infligent des dégâts magiques.'}}},
  {label:'A',content:{description:{body:'Galio inflige des dégâts magiques aux ennemis proches.'}}},
  {label:'Z',content:{description:{body:'Une compétence octroie un bouclier protecteur.'}}},
  {label:'E',content:{description:{body:'Le champion bondit vers son adversaire.'}}},
  {label:'R',content:{description:{body:'La compétence inflige des dégâts physiques.'}}}
 ];
 const kit=extractKit({props:{pageProps:{page:{blades:[{}, {}, {groups}]}}}});
 assert.ok(kit.passive.detected_mechanics.includes('burn'));
 assert.ok(kit.passive.detected_mechanics.includes('magic_damage'));
 assert.ok(kit.q.detected_mechanics.includes('magic_damage'));
 assert.ok(kit.w.detected_mechanics.includes('shield'));
 assert.ok(kit.e.detected_mechanics.includes('mobility'));
 assert.ok(kit.r.detected_mechanics.includes('physical_damage'));
});
