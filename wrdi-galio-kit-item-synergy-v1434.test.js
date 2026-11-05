const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const synergy=require('./wrdi-galio-kit-item-synergy-v1434.js');
const optimizer=require('./wrdi-galio-five-item-optimizer-v1429.js');
const guard=require('./wrdi-galio-item-guard-v1424.js');
const core=require('./wrdi-core-v14.js');
const catalog=require('./data/items-client-7.3d-v12.json');
const rules=require('./data/item-restrictions-client-7.3d-v12.json');
const item=id=>catalog.items.find(x=>x.id===id);
const prepared=guard.prepare({catalog,rules,core,livePatch:'7.3d'});
const has=(id,key,needs={})=>synergy.evaluate(item(id),needs).entries.some(x=>x.key===key);
test('Galio kit profile is explicit and separate from untested proc claims',()=>{
 assert.equal(synergy.KIT.role,'mid');
 assert.equal(synergy.KIT.taunt,true);
 assert.equal(synergy.KIT.knockup,true);
 assert.equal(synergy.KIT.empoweredAttack,true);
 assert.equal(synergy.KIT.ultimateAllyEngage,true);
 assert.equal(synergy.evaluate(item('riftmaker')).procsConfirmedInGame,false);
});
test('item passive compatibility is derived from client mechanics, never hardcoded item IDs',()=>{
 assert.ok(has('sunfire_aegis','nearby_waveclear'));
 assert.ok(has('hollow_radiance','nearby_waveclear'));
 assert.ok(has('unending_despair','sustained_proximity'));
 assert.ok(has('iceborn_gauntlet','spell_then_attack'));
 assert.ok(has('lich_bane','spell_then_attack'));
 assert.ok(has('liandrys_torment','damaging_spell_burn'));
 assert.ok(has('rylais_crystal_scepter','damaging_ability_trigger'));
 assert.ok(has('radiant_virtue','ult_trigger'));
 assert.ok(has('zekes_convergence','ult_trigger'));
 assert.ok(has('zhonyas_hourglass','active_stasis'));
 assert.ok(has('riftmaker','bonus_hp_to_ap'));
 assert.ok(has('rabadons_deathcap','ap_multiplier'));
 assert.ok(has('abyssal_mask','nearby_magic_amp'));
 assert.equal(optimizer.features(item('oceanids_trident')).shieldCut,true);
 assert.equal(optimizer.features(item('riftmaker')).shieldCut,false);
 assert.ok(has('imperial_mandate','team_protection')===false);
});
test('long-range and repeated on-hit passives are not rewarded as natural Galio melee engage procs',()=>{
 assert.ok(has('horizon_focus','long_range_condition'));
 assert.ok(has('nashors_tooth','repeated_on_hit'));
 const horizon=synergy.evaluate(item('horizon_focus')).score;
 const close=synergy.evaluate(item('sunfire_aegis')).score;
 assert.ok(horizon<close);
});
test('anti-crit passive only valued when actual crit threat is confirmed',()=>{
 const no=synergy.evaluate(item('randuins_omen'),{crit:0}).score;
 const yes=synergy.evaluate(item('randuins_omen'),{crit:3}).score;
 assert.ok(yes>no);
 assert.ok(has('randuins_omen','critical_only'));
});
test('item HP-to-AP and AP multiplier combinations add explainable set-level value',()=>{
 const a=synergy.build([item('riftmaker'),item('thornmail'),item('sunfire_aegis')],{frontlineNeed:2});
 const b=synergy.build([item('riftmaker'),item('void_staff')],{frontlineNeed:2});
 assert.equal(a.ok,true);assert.equal(b.ok,true);
 assert.ok(a.combinations.some(x=>x.includes('conversion PV')));
 assert.ok(!b.combinations.some(x=>x.includes('conversion PV')));
 const c=synergy.build([item('rabadons_deathcap'),item('riftmaker'),item('liandrys_torment')],{tank:2});
 assert.ok(c.combinations.some(x=>x.includes('multiplicateur')));
 assert.equal(c.damageSimulated,false);
});
test('all complete client entries are handled without inventing procs',()=>{
 const all=catalog.items.filter(x=>x.completeness?.description==='documented');
 for(const x of all){
  const r=synergy.evaluate(x);
  assert.equal(r.ok,true,x.id);
  assert.equal(r.damageSimulated,false,x.id);
  assert.equal(r.procsConfirmedInGame,false,x.id);
  assert.ok(Number.isFinite(r.score),x.id);
 }
});
test('five-item optimization calls kit-passive synergy and remains legal and client-only',()=>{
 const r=optimizer.optimize({prepared,threats:{ad:3,ap:2,tank:2,frontlineNeed:1,heal:1}});
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.main.items.length,5);
 assert.equal(core.validateEquipment(r.main.items.map(x=>x.id),catalog,rules).valid,true);
 assert.equal(r.noPopularityData,true);assert.equal(r.noDamageForecast,true);
 const synergyStats=optimizer.calculate(r.main.items.map(x=>({...item(x.id),feature:optimizer.features(item(x.id))})),{ad:3,ap:2,tank:2});
 assert.equal(synergyStats.synergy.ok,true);
 assert.ok(synergyStats.synergy.items.length===5);
});
test('browser page loads synergy before optimizer; compact UI unchanged',()=>{
 const html=fs.readFileSync('index-v1434.html','utf8');
 assert.ok(html.includes('wrdi-galio-kit-item-synergy-v1434.js?v=14341'));
 assert.ok(html.indexOf('wrdi-galio-kit-item-synergy-v1434.js')<html.indexOf('wrdi-galio-five-item-optimizer-v1429.js'));
 const ui=fs.readFileSync('wrdi-compact-dashboard-v1423.js','utf8');
 assert.ok(ui.includes('Objets situationnels'));
});
