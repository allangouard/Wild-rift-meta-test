/* WRDI V14.16 — player-confirmed Galio rune observations.
 * User-confirmed Wild Rift client observations are accepted as valid
 * within the precise tested conditions. This does NOT invent measurements,
 * patch scope, other interactions, or evidence for untested runes.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WRDI_GalioPlayerEvidenceV1416=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='14.16.0-alpha.1';
const TEST_MAP=Object.freeze({
 'glacial-w':{rune:'Souverain des glaces',ability:'Z',condition:'Z provoque un champion ennemi'},
 'glacial-e':{rune:'Souverain des glaces',ability:'E',condition:'E touche et projette un champion ennemi'},
 'colossus-w':{rune:'Courage du colosse',ability:'Z',condition:'Z provoque un champion ennemi'},
 'colossus-e':{rune:'Courage du colosse',ability:'E',condition:'E touche et projette un champion ennemi'},
 'electrocute-combo':{rune:'Électrocution',ability:'combo',condition:'E → passif → A sur la même cible'},
 'electrocute-two-hits':{rune:'Électrocution',ability:'combo',condition:'E → passif sans A'},
 'electrocute-multiple-combos':{rune:'Électrocution',ability:'combo',condition:'A → Z → passif ou E → A → Z et autres triples interactions'},
 'electrocute-q-ticks':{rune:'Électrocution',ability:'A',condition:'A seul, tornade et dégâts répétés'},
 'phase-combo':{rune:'Rush phasique',ability:'combo',condition:'E → passif → A et autres triples interactions'},
 'phase-q-ticks':{rune:'Rush phasique',ability:'A',condition:'A seul, tornade et dégâts répétés'},
 'guardian-r':{rune:'Gardien',ability:'R',condition:'R sur un allié sans dégâts subis déclenchant Gardien'},
 'revitalize-r':{rune:'Revitalisation',ability:'R',condition:'Amplification chiffrée du bouclier R avec/sans rune'}
});
const STATES=Object.freeze({
 observed_yes:'validated_in_game_positive',
 observed_no:'validated_in_game_negative',
 inconclusive:'not_yet_validated'
});
function evaluate(record){
 const expected=TEST_MAP[record?.test_id];
 if(!expected)return null;
 if(record.rune!==expected.rune || !Object.prototype.hasOwnProperty.call(STATES,record.result))
   return {testId:record.test_id,valid:false,error:'Identité de rune ou résultat non conforme'};
 const firsthand=record.client_observation_verified_by_player===true
 ||record.client_observation_status==='reported_by_player_in_wild_rift_client'
 ||record.client_observation_status==='confirmed_by_player_in_wild_rift_client'
 ||record.provenance==='user_report_with_video_inspected_not_independently_confirmed';
 const validated=record.result!=='inconclusive' && firsthand;
 return {testId:record.test_id,rune:expected.rune,ability:expected.ability,
  condition:expected.condition,valid:true,status:validated?STATES[record.result]:'not_yet_validated',
  triggered:validated?(record.result==='observed_yes'):null,
  source:'player_observation',patch:record.patch||null,
  replicated:record.replicated_by_player===true || record.replicated===true,
  observations:record.replication_count||null,
  scope:'tested_conditions_only'};
}
function summarize(data){
 if(data?.game!=='Wild Rift mobile'||data?.champion?.id!=='10099'||!Array.isArray(data?.observations))
   return {ok:false,error:'Observations de Galio Wild Rift attendues'};
 const entries=data.observations.map(evaluate).filter(Boolean);
 const errors=entries.filter(x=>x.valid===false);
 const validated=entries.filter(x=>x.status==='validated_in_game_positive'||x.status==='validated_in_game_negative');
 return {ok:errors.length===0,version:VERSION,game:'Wild Rift mobile',
  champion:'Galio',entries,validatedCount:validated.length,
  positiveCount:validated.filter(x=>x.triggered).length,
  negativeCount:validated.filter(x=>!x.triggered).length,
  unvalidatedCount:entries.length-validated.length,
  patchCertified:false,automaticOptimalBuildClaim:false,
  importantLimits:['Validation par le joueur limitée aux conditions explicitement testées.',
   'Les essais ne mesurent ni les valeurs exactes ni le taux de victoire.',
   'Les nouvelles versions du jeu peuvent modifier ces interactions.']};
}
return Object.freeze({VERSION,TEST_MAP,STATES,evaluate,summarize});
});
