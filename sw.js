/* WRDI V14 consolidation: navigation cache never aliases versioned debug pages to canonical app. */
const CACHE='wrdi-shell-current-v18.6';
const SHELL=['./index.html','./manifest.webmanifest','./assets/styles.css','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(
 caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>
  (k.startsWith('wrdi-shell-')||k.startsWith('wrdi-shell-current-'))&&k!==CACHE)
  .map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url),scope=new URL(self.registration.scope);
 if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
   if(response.ok){
    const exact=url.pathname===scope.pathname||url.pathname===scope.pathname+'index.html';
    if(exact){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));}
   }
   return response;
  }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./index.html'))));
  return;
 }
 event.respondWith(fetch(req).then(response=>{
  if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(req,clone));}
  return response;
 }).catch(()=>caches.match(req)));
});
