/* Official Wild Rift site-only kit importer (Node >= 20).
 * Never touches build/rune scoring or manual, client-verified data.
 * A failed/partial import is excluded; no PC Data Dragon fallback.
 * Descriptions trimmed to <=24 words per skill for a compact excerpt;
 * full detail and numerical mechanics remain pending client validation.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {extractNextData,extractKit} from './wr-official-page-parser.mjs';
const catalogue=JSON.parse(await readFile('data/champions-picker-v151.json','utf8'));
const LIMIT=process.env.WRDI_IMPORT_LIMIT==='ALL'?catalogue.champions.length:
 Math.min(30,Math.max(1,Number(process.env.WRDI_IMPORT_LIMIT||20)));
const DEST='data/champion-ability-extract-official-v1.json';
const slugOverrides=new Map([
 ['AurelionSol','aurelion-sol'],['DrMundo','dr-mundo'],
 ['MonkeyKing','wukong'],['Nunu','nunu-and-willump'],
 ['MissFortune','miss-fortune'],['LeeSin','lee-sin'],
 ['Kaisa','kaisa'],['Khazix','khazix'],
 ['KogMaw','kog-maw'],['Chogath','cho-gath'],
 ['KSante','k-sante'],['Velkoz','vel-koz'],
 ['JarvanIV','jarvan-iv'],['TwistedFate','twisted-fate']
]);
function slug(champion){
 if(slugOverrides.has(champion.riotId))return slugOverrides.get(champion.riotId);
 return String(champion.name).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[’']/g,'-').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
}
async function fetchOne(champion){
 const url='https://wildrift.leagueoflegends.com/fr-fr/champions/'+slug(champion)+'/';
 const res=await fetch(url,{signal:AbortSignal.timeout(14000),headers:{'User-Agent':'WRDI-Source-Verification/1.0'}});
 if(!res.ok)throw Error('HTTP '+res.status);
 const spells=extractKit(extractNextData(await res.text()));
 return {id:champion.id,name:champion.name,source_url:url,
  skills:spells,confidence:'official_page_extracted_not_client_verified',
  currentPatchVerified:false,numericRatiosVerified:false,allowedForScoring:false};
}
const targets=catalogue.champions.slice(0,LIMIT);
const output=[],errors=[];
for(let i=0;i<targets.length;i+=3){
 const batch=await Promise.all(targets.slice(i,i+3).map(async c=>{
  try{return {ok:true,value:await fetchOne(c)}}catch(e){return {ok:false,name:c.name,reason:String(e?.message||e).slice(0,180)}}
 }));
 for(const row of batch)if(row.ok)output.push(row.value);else errors.push({name:row.name,error:row.reason});
}
const payload={schema:'wrdi-official-wild-rift-extracted-v1',date:'2026-11-06',
 source:'https://wildrift.leagueoflegends.com/fr-fr/champions/',
 coverage:{attempted:targets.length,extracted:output.length,failed:errors.length},
 restrictions:'Excerpts <=24 words per skill; no numeric or patch confidence; do not use for scoring',
 entries:output,failures:errors};
await writeFile(DEST,JSON.stringify(payload,null,2)+'\n','utf8');
process.stdout.write('Wild Rift official extraction: '+output.length+'/'+targets.length+'; failed='+errors.length+'\n');
if(output.length===0)process.exitCode=1;
