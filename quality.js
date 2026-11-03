/* Data audit only: do not imply complete skill/passive coverage. */
(function(){'use strict';
function refresh(){
 if(typeof db==='undefined'||!window.WRDIKnowledge)return;
 const audit=WRDIKnowledge.inspect(db),box=document.getElementById('simpleDataStatus');if(!box)return;
 const status=audit.consistent?'Patch commun : '+audit.patch:'Patchs absents ou incohérents';
 box.textContent=status+' · '+audit.items+' objets catalogués · '+audit.runes+' runes cataloguées · '+audit.verifiedRules+' règles d’interaction formellement validées dans le moteur. Les passifs, compétences et synergies non validés ne sont pas simulés.';
}
const oldFetch=window.fetch;window.fetch=function(...args){return oldFetch.apply(this,args)};
window.addEventListener('load',()=>{refresh();setTimeout(refresh,2000);setTimeout(refresh,8000)});
})();
