/* Parsing utilities for embedded __NEXT_DATA__ on the official Wild Rift site.
 * This is NOT a League of Legends PC Data Dragon reader.
 */
export function extractNextData(html){
 const m=String(html||'').match(/<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
 if(!m)throw Error('Official Riot __NEXT_DATA__ not found');
 return JSON.parse(m[1].replace(/&quot;/g,'"'));
}
function plain(value){
 const raw=typeof value==='string'?value:
  typeof value?.text==='string'?value.text:
  Array.isArray(value)?value.map(plain).join(' '):'';
 return raw.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&')
  .replace(/\s+/g,' ').trim();
}
export function extractKit(next){
 const groups=next?.props?.pageProps?.page?.blades?.[2]?.groups;
 if(!Array.isArray(groups)||groups.length<5)throw Error('Five Wild Rift abilities required');
 const keys=['passive','q','w','e','r'];
 const spells={};
 for(let i=0;i<5;i++){
  const p=groups[i],name=plain(p?.label);
  if(!name||name.length>120)throw Error('Missing ability name '+keys[i]);
  const words=plain(p?.content?.description?.body).split(/\s+/).filter(Boolean);
  spells[keys[i]]={name,excerpt_fr:words.slice(0,24).join(' '),
   descriptionPresent:words.length>0,descriptionTruncated:words.length>24};
 }
 return spells;
}
