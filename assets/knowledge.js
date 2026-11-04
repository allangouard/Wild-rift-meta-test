/* V11: verified-rule registry. No unverified mechanics are executed. */
(function(global){'use strict';
const VERSION='11.0';
const STAT_KEYS=['Hp','Armor','Mr','Ad','Ap','Haste','As','Crit','ArmorPen','ArmorPenPct','MagicPen','MagicPenPct','Lifesteal','Omnivamp','Mana'];
const registry={version:VERSION,verifiedRules:[],sourcePolicies:{officialPatch:'https://wildrift.leagueoflegends.com/fr-fr/news/game-updates/',catalogue:'https://wrchina.gg/'},status:'incomplete'};
function inspect(data){
 const items=Array.isArray(data?.items?.items)?data.items.items:[];
 const runes=Array.isArray(data?.runes?.paths)?data.runes.paths.flatMap(p=>p.runes||[]):[];
 const champions=Array.isArray(data?.meta?.champions)?data.meta.champions:[];
 const patches=[data?.meta?.patch,data?.items?.patch,data?.runes?.patch];
 const consistent=patches.every(Boolean)&&new Set(patches.map(String)).size===1;
 const missingIds=items.filter(x=>x.id===undefined||x.id===null).length;
 const itemPassivesUnverified=items.length;
 return {patch:consistent?String(patches[0]):null,consistent,items:items.length,runes:runes.length,champions:champions.length,missingIds,itemPassivesUnverified,verifiedRules:registry.verifiedRules.length};
}
function resistance(damage,resistance){if(!Number.isFinite(damage)||!Number.isFinite(resistance)||damage<0)throw Error('Invalid inputs');return resistance>=0?damage*100/(100+resistance):damage*(2-100/(100-resistance));}
function hasteReduction(haste){if(!Number.isFinite(haste)||haste<0)throw Error('Invalid haste');return 100*haste/(100+haste)}
function verifyRule(rule){return !!rule&&rule.patch&&rule.source&&rule.formula&&rule.tested===true}
function register(rule){if(!verifyRule(rule))throw Error('Unverified interaction: cannot register');registry.verifiedRules.push(Object.freeze({...rule}))}
global.WRDIKnowledge=Object.freeze({VERSION,STAT_KEYS,registry,inspect,resistance,hasteReduction,verifyRule,register});
})(window);
