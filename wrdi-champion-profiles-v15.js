/* V15: extracted draft archetype descriptions; NOT measured matchups or player builds. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WRDI_ChampionProfilesV15=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const threatProfiles={
 'syndra':['ap','burst','cc'],'orianna':['ap','poke','cc'],'ahri':['ap','burst','cc'],'veigar':['ap','burst','cc'],'brand':['ap','burn','aoe'],'zyra':['ap','burn','cc'],'vladimir':['ap','sustain','aoe'],'akali':['ap','assassin'],'katarina':['ap','assassin'],'fizz':['ap','assassin'],'ekko':['ap','assassin'],'kennen':['ap','aoe','cc'],'annie':['ap','burst','cc'],'lux':['ap','poke','cc'],'morgana':['ap','cc'],'galio':['ap','cc','tank'],'swain':['ap','sustain','cc'],'aurelion sol':['ap','aoe'],'teemo':['ap','poke'],'lillia':['ap','burn'],'gwen':['ap','sustain'],'evelynn':['ap','assassin'],'diana':['ap','assassin'],'gragas':['ap','cc'],'rumble':['ap','aoe'],'ziggs':['ap','poke'],'hwei':['ap','poke','cc'],
 'zed':['ad','assassin'],'yasuo':['ad','crit'],'yone':['ad','crit','cc'],'talon':['ad','assassin'],'qiyana':['ad','assassin'],'pantheon':['ad','burst','cc'],'jayce':['ad','poke'],'lucian':['ad','crit'],'tristana':['ad','crit'],'jinx':['ad','crit'],'caitlyn':['ad','crit','poke'],'draven':['ad','crit'],'samira':['ad','crit'],'miss fortune':['ad','aoe'],'ashe':['ad','cc'],'vayne':['ad','onhit'],'kai’sa':['hybrid','onhit'],'kai\'sa':['hybrid','onhit'],'ezreal':['hybrid','poke'],'varus':['hybrid','poke'],'kalista':['ad','onhit'],'xayah':['ad','crit'],'sivir':['ad','crit'],'twitch':['ad','onhit'],'zeri':['ad','crit'],'aphelios':['ad','crit'],'graves':['ad','crit'],'master yi':['ad','onhit'],'tryndamere':['ad','crit'],'viego':['ad','onhit'],'lee sin':['ad','burst'],'vi':['ad','cc'],'jarvan iv':['ad','cc'],'hecarim':['ad','engage'],'khazix':['ad','assassin'],"kha'zix":['ad','assassin'],'rengar':['ad','assassin'],'wukong':['ad','cc'],'xin zhao':['ad','engage'],'olaf':['ad','sustain'],'darius':['ad','sustain'],'garen':['ad','tank'],'sett':['ad','tank','cc'],'aatrox':['ad','sustain'],'riven':['ad','cc'],'fiora':['ad','sustain'],'camille':['ad','cc'],'irelia':['ad','onhit'],'nasus':['ad','tank'],'renekton':['ad','sustain'],'ambessa':['ad','assassin'],
 'ornn':['tank','cc'],'malphite':['tank','cc'],'nautilus':['tank','cc'],'leona':['tank','cc'],'alistar':['tank','cc'],'rell':['tank','cc'],'braum':['tank','cc'],'thresh':['tank','cc'],'blitzcrank':['tank','cc'],'sion':['tank','cc'],'maokai':['tank','cc'],'rammus':['tank','cc'],'amumu':['tank','cc'],'sejuani':['tank','cc'],'zac':['tank','cc'],'cho’gath':['tank','cc'],'chogath':['tank','cc'],'dr. mundo':['tank','sustain'],'mundo':['tank','sustain'],'volibear':['tank','sustain'],'shen':['tank','cc'],'poppy':['tank','cc'],'tahm kench':['tank','cc'],
 'soraka':['heal'],'sona':['heal','shield'],'yuumi':['heal','shield'],'nami':['heal','cc'],'milio':['heal','shield'],'janna':['shield','cc'],'lulu':['shield','cc'],'karma':['shield','poke'],'seraphine':['shield','heal','cc'],'rakan':['shield','cc'],'senna':['heal','ad'],'taric':['heal','tank'],'renata glasc':['shield','cc'],'bard':['ap','cc'],'pyke':['ad','assassin','cc'],'nilah':['ad','crit'],'smolder':['ad','poke'],'mel':['ap','poke'],'aurora':['ap','burst']
};

function normalize(value){return String(value||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").trim();}
function lookup(name,metadata){
 const k=normalize(name);
 if(Array.isArray(threatProfiles[k]))return [...threatProfiles[k]];
 // Conservative role inference from our local Wild Rift client identity catalogue.
 // A marksman threatens physical damage by default; it does NOT imply a
 // confirmed critical-hit item build. A mage can have mixed scaling, so when
 // both Mage + Tireur are present the marksman role is the safe baseline.
 const classes=Array.isArray(metadata?.classes)?metadata.classes:[];
 const traits=[];
 if(classes.includes('Tireur'))traits.push('ad');
 else if(classes.includes('Mage'))traits.push('ap');
 else if(classes.includes('Combattant'))traits.push('ad');
 if(classes.includes('Tank'))traits.push('tank');
 if(classes.includes('Assassin'))traits.push('assassin');
 if(classes.includes('Support')&&classes.includes('Tank'))traits.push('cc');
 return traits.length?traits:null;
}
return Object.freeze({VERSION:'15.3.0',lookup,keys:Object.keys(threatProfiles),source:'legacy_explicit_draft_archetypes_not_player_builds',confidence:'categorical_heuristics_only'});
});
