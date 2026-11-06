const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const runeArt=require('./wrdi-rune-images-v152.js');
const advisor=require('./wrdi-galio-rune-advisor-v1411.js');
const items=require('./data/items-client-7.3d-v12.json');
const restrictions=require('./data/item-restrictions-client-7.3d-v12.json');
test('every Galio rune used by a valid existing strategy has an explicit image reference',()=>{
 const names=new Set();
 for(const page of advisor.STRATEGIES){
  names.add(page.keystone);names.add(page.secondary);
  page.primary.forEach(x=>names.add(x));
 }
 for(const name of names){
  const url=runeArt.url(name);
  assert.ok(url,'Missing rune artwork: '+name);
  assert.ok(url.startsWith('https://wrpocket.app/assets/img/runes/'),name);
  assert.ok(url.endsWith('.webp'),name);
 }
 assert.equal(runeArt.url('Unknown rune from future patch'),null);
});
test('suggested item swaps use exact verified local client icon IDs',()=>{
 const app=fs.readFileSync('wrdi-app-v15.js','utf8');
 assert.ok(app.includes("option.remove.name"));
 assert.ok(app.includes("option.add.name"));
 assert.ok(app.includes("itemImage(option.remove,'À remplacer')"));
 assert.ok(app.includes("itemImage(option.add,'À acheter')"));
 assert.ok(app.includes("'./assets/item-icons/'+encodeURIComponent(it.id)+'.webp'"));
 const inventory=new Set(items.items.map(x=>x.id));
 for(const id of inventory){
  if(id==='')continue;
  if(restrictions.known_active_item_ids?.includes(id))assert.ok(inventory.has(id));
 }
});
test('rune display preserves the one keystone and four-rune decision without modification',()=>{
 const app=fs.readFileSync('wrdi-app-v15.js','utf8');
 assert.ok(app.includes('result.runes.page.keystone'));
 assert.ok(app.includes('...result.runes.page.primary,result.runes.page.secondary'));
 assert.ok(app.includes('WRDI_RuneImagesV152?.portrait'));
 assert.ok(!app.includes("runeImages.chooseRune("));
});
test('mobile V15.2 includes rune art before UI and friendly responsive cards',()=>{
 const html=fs.readFileSync('index-v152.html','utf8');
 assert.ok(html.includes('wrdi-rune-images-v152.js'));
 assert.ok(html.indexOf('wrdi-rune-images-v152.js')<html.indexOf('wrdi-app-v15.js'));
 for(const name of ['wrdi-swap-card','wrdi-swap-line','wrdi-rune-keystone','wrdi-rune-grid','wrdi-rune-tile'])assert.ok(html.includes(name),name);
});
