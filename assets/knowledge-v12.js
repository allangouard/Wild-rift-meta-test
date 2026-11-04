/* WRDI V12 — isolated, auditable knowledge foundation. Does not replace V11 logic. */
(function(g){'use strict';
 const VERSION='12.0.0-alpha.1';
 const records=new Map();
 const required=['id','kind','patch','source','verifiedAt','data'];
 function validate(record){
  if(!record||typeof record!=='object')return ['Record must be an object'];
  const errors=required.filter(k=>record[k]===undefined||record[k]===null||record[k]==='').map(k=>'Missing '+k);
  if(record.data&&typeof record.data!=='object')errors.push('data must be an object');
  if(record.source&&!/^https:\/\//.test(record.source))errors.push('source must be an HTTPS URL');
  return errors;
 }
 function add(record){const errors=validate(record);if(errors.length)return {ok:false,errors};
  const key=String(record.kind)+':'+String(record.id)+':'+String(record.patch);
  if(records.has(key))return {ok:false,errors:['Duplicate record '+key]};
  records.set(key,Object.freeze({...record,data:Object.freeze({...record.data})}));return {ok:true,key};
 }
 function get(kind,id,patch){return records.get([kind,id,patch].map(String).join(':'))||null}
 function list(kind,patch){return [...records.values()].filter(r=>(!kind||r.kind===kind)&&(!patch||r.patch===patch))}
 function audit(patch){const all=list(null,patch);return {version:VERSION,patch:patch||null,records:all.length,byKind:all.reduce((a,r)=>(a[r.kind]=(a[r.kind]||0)+1,a),{}),ready:false,reason:'No validated champion/item/rune interaction dataset has been imported yet.'}}
 g.WRDIKnowledgeV12=Object.freeze({VERSION,validate,add,get,list,audit});
})(window);
