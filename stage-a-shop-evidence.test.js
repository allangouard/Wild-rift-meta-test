const assert=require('node:assert/strict');
const {test}=require('node:test');
const catalog=require('./data/items-client-7.3d-v12.json');
const magic=require('./data/stage-a-magic-shop-evidence-2026-11-05.json');
const defense=require('./data/stage-a-defense-shop-evidence-2026-11-05.json');
const byId=new Map(catalog.items.map(x=>[x.id,x]));
test('catalogue conserve 59 fiches et aucune duplication',()=>{
 assert.equal(catalog.items.length,59);
 assert.equal(byId.size,catalog.items.length);
});
test('prix catalogues 56 presents, trois transformations manquantes',()=>{
 const missing=catalog.items.filter(x=>!Number.isFinite(x.price_gold)).map(x=>x.id).sort();
 assert.deepEqual(missing,['fimbulwinter','harmonic_circlet','seraphs_embrace']);
});
for(const e of [magic,defense]){
 test(e.category+' : prix et identites correspondants aux captures',()=>{
  assert.equal(e.entries.length,e.entry_count);
  for(const entry of e.entries){
   if(!entry.existing_catalog_id)continue;
   const item=byId.get(entry.existing_catalog_id);
   assert.ok(item,entry.existing_catalog_id);
   assert.equal(item.name_fr,entry.name_fr,entry.id);
   assert.equal(item.price_gold,entry.price_gold,entry.id);
   assert.ok(e.images.includes(entry.screenshot),entry.id);
  }
 });
}
test('30 lignes defense dont deux non associees, aucune fiche inventee',()=>{
 assert.equal(defense.entries.length,30);
 const unresolved=defense.entries.filter(x=>!x.existing_catalog_id);
 assert.equal(unresolved.length,2);
 assert.deepEqual(unresolved.map(x=>x.name_fr).sort(),
  ['Lithoplastron de gargouille','Médaillon de l’Iron Solari'].sort());
 for(const x of unresolved){
  assert.equal(x.needs_client_details,false);
  assert.equal(x.details_verified,true);
  assert.equal(x.needs_canonical_id_reconciliation,true);
  assert.equal(x.existing_catalog_id,null);
 }
});
test('pas de preuve de passif issue des captures de prix',()=>{
 assert.equal(catalog.no_patch_deltas_applied,true);
 assert.equal(catalog.do_not_automatically_load_into_build_recommendations,true);
 assert.ok(catalog.items.every(x=>x.completeness?.interactions!=='verified'));
});

const detail=require('./data/stage-a-defense-active-details-2026-11-05.json');
test('deux objets actifs de defense documentes sans inventer identifiants',()=>{
 assert.equal(detail.records.length,2);
 assert.equal(detail.policy.do_not_automatically_load_into_build_recommendations,true);
 const byRef=new Map(detail.records.map(x=>[x.provisional_ref,x]));
 assert.equal(byRef.get('medallion_of_the_iron_solari_UNRESOLVED').price_gold,2500);
 assert.deepEqual(byRef.get('medallion_of_the_iron_solari_UNRESOLVED').stats,{hp:300,armor:30,mr:30,ah:10});
 const med=byRef.get('medallion_of_the_iron_solari_UNRESOLVED').active;
 assert.equal(med.shield_min,250);
 assert.equal(med.shield_max,370);
 assert.equal(med.duration_seconds,2.5);
 assert.equal(med.cooldown_seconds,60);
 assert.equal(med.repeat_application.window_seconds,20);
 assert.equal(med.repeat_application.subsequent_shield_multiplier,0.5);
 const garg=byRef.get('gargoyle_stoneplate_UNRESOLVED');
 assert.equal(garg.price_gold,2900);
 assert.deepEqual(garg.stats,{hp:200,armor:45,mr:45,ah:10});
 assert.equal(garg.active.shield_formula,'100 + 0.90 * bonus_hp');
 assert.equal(garg.active.shield_duration_seconds,2.5);
 assert.equal(garg.active.cooldown_seconds,60);
 assert.ok(detail.records.every(x=>x.evidence_status.external_item_id==='unknown'));
});

const boots=require('./data/stage-a-boots-shop-evidence-2026-11-05.json');
test('inventaire bottes : 15 entrées, 7 supérieures, 7 intermédiaires et 1 basique',()=>{
 assert.equal(boots.entries.length,15);
 assert.equal(boots.entries.filter(x=>x.tier==='upper').length,7);
 assert.equal(boots.entries.filter(x=>x.tier==='intermediate').length,7);
 assert.equal(new Set(boots.entries.map(x=>x.name_fr)).size,15);
 assert.equal(boots.coverage.basic_tier_visible,1);
 assert.equal(boots.coverage.complete_current_shop_inventory,true);
 assert.equal(boots.policy.do_not_load_into_build_recommendations,true);
});
test('Bottes : les prix et captures correspondent au palier',()=>{
 assert.ok(boots.entries.every(x=>x.price_gold>=400&&x.price_gold<=2200));
 assert.ok(boots.entries.every(x=>boots.screenshots.includes(x.screenshot)));
 assert.ok(boots.entries.every(x=>x.canonical_external_id===null));
});
test('Chaussures de lanceur de sorts : description client séparée du modèle vérifié',()=>{
 const d=boots.detailed_item;
 assert.equal(d.name_fr,'Chaussures de lanceur de sorts');
 assert.deepEqual(d.stats,{ap:35,magic_pen_flat:18,magic_pen_pct:8,mana_regen_pct:100,movement_speed_flat:45});
 assert.equal(d.passives[0].value,50);
 assert.equal(d.passives[1].bonus_true_damage,18);
 assert.equal(d.mechanics_interactions_tested,false);
});

const bootDetails=require('./data/stage-a-boots-details-batch1-2026-11-05.json');
test('dix fiches supplémentaires et onze détails bottes attestés',()=>{
 assert.equal(bootDetails.records.length,10);
 assert.equal(boots.coverage.description_details_fully_documented,14);
 assert.equal(new Set(bootDetails.records.map(x=>x.name_fr)).size,10);
 assert.equal(boots.entries.filter(x=>x.stats_verified).length,14);
 for(const d of bootDetails.records){
  const index=boots.entries.find(x=>x.name_fr===d.name_fr);
  assert.ok(index,d.name_fr);
  assert.equal(index.price_gold,d.price_gold);
  assert.equal(index.stats_verified,true);
  assert.equal(index.canonical_external_id,null);
  assert.equal(d.interactions_tested,false);
  assert.equal(d.external_id_verified,false);
 }
});
test('bottes défensives : valeurs et conditions en client, pas interaction validée',()=>{
 const x=bootDetails.records.find(x=>x.name_fr==='Avancée blindée');
 assert.equal(x.stats.armor,30);
 assert.equal(x.passives.find(p=>p.name_fr==='Endurance noxienne').shield_max_health_pct,5);
 assert.equal(x.passives.find(p=>p.name_fr==='Endurance noxienne').cooldown_seconds,12);
 const y=bootDetails.records.find(x=>x.name_fr==='Broyeuses à chaînes');
 assert.equal(y.stats.mr,30);
 assert.equal(y.passives[0].shield_damage_type,'magic');
});
test('bottes magie et pénétration transcrites sans fusionner fixe et pourcentage',()=>{
 const x=bootDetails.records.find(x=>x.name_fr==='Bottes de mana');
 assert.equal(x.stats.magic_pen_flat,8);
 assert.equal(x.stats.magic_pen_pct,undefined);
 const y=bootDetails.records.find(x=>x.name_fr==='Bottes Brise-armure');
 assert.equal(y.stats.armor_pen_flat,10);
 assert.equal(y.stats.armor_pen_pct,6);
});

const bootDetails2=require('./data/stage-a-boots-details-batch2-2026-11-05.json');
test('les 3 dernieres bottes superieures deja fournies ont des fiches',()=>{
 assert.equal(bootDetails2.records.length,3);
 assert.deepEqual(bootDetails2.records.map(x=>x.name_fr).sort(),['Jambières de métal','Lucidité pourpre','Sandales immortelles'].sort());
 for(const record of bootDetails2.records){
  const index=boots.entries.find(x=>x.name_fr===record.name_fr);
  assert.ok(index);
  assert.equal(index.price_gold,record.price_gold);
  assert.equal(index.stats_verified,true);
  assert.equal(record.external_id_verified,false);
  assert.equal(record.interactions_tested,false);
 }
});
test('Bottes de vitesse à 400 PO : pas de vitesse chiffrée inventée',()=>{
 assert.equal(bootDetails2.basic_boots.name_fr,'Bottes de vitesse');
 assert.equal(bootDetails2.basic_boots.price_gold,400);
 assert.equal(bootDetails2.basic_boots.movement_speed_exact_value,null);
 assert.equal(boots.entries.find(x=>x.name_fr==='Bottes de vitesse').stats_verified,false);
});
test('restrictions de Hâte noxienne et soins des bottes documentés',()=>{
 const lucid=bootDetails2.records.find(x=>x.name_fr==='Lucidité pourpre');
 assert.equal(lucid.stats.ability_haste,25);
 assert.ok(lucid.passives.some(x=>x.trigger_limit==='une fois toutes les 4 secondes par compétence'));
 const steel=bootDetails2.records.find(x=>x.name_fr==='Jambières de métal');
 assert.equal(steel.stats.attack_speed_pct,50);
 assert.ok(steel.passives.some(x=>x.on_attack_heal===12));
});
