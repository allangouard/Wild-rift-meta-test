/* WRDI V13.5 B - reference explicite, Wild Rift uniquement. Aucun calcul de meilleur build. */
(function(root){'use strict';
 const OFFICIAL_HP={base:630,perLevel:148,source:'Riot Wild Rift, notes 7.3',status:'patch_official'};
 const SECONDARY={ad:{base:58,perLevel:3.6},armor:{base:40,perLevel:4.5},mr:{base:44,perLevel:2}};
 function levelStats(level){const n=Math.max(1,Math.min(15,Math.trunc(Number(level)||13)));return {level:n,hp:630+(n-1)*148,ad:58+(n-1)*3.6,armor:40+(n-1)*4.5,mr:44+(n-1)*2,confidence:{hp:'confirmé par notes Riot 7.3 (projection linéaire)',ad:'source secondaire à vérifier en client',armor:'source secondaire à vérifier en client',mr:'source secondaire à vérifier en client'}};}
 function price(item){const raw=item?.price_gold;return Number.isFinite(raw)&&raw>0?raw:null;}
 function catalogReport(data){const items=Array.isArray(data?.items)?data.items:[];return {items:items.length,priced:items.filter(x=>price(x)!==null).length,missingPrices:items.filter(x=>price(x)===null).map(x=>x.id),patch:data?.patch||data?.source_patch||'non attesté',game:data?.target_game||'non attesté'};}
 const api={version:'13.5B',level:13,officialHp:OFFICIAL_HP,secondary:SECONDARY,levelStats,price,catalogReport};root.WRDI_GalioV135=api;
})(typeof window!=='undefined'?window:globalThis);
