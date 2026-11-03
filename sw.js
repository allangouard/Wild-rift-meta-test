const CACHE='wrdi-shell-v110';
const SHELL=['./','./index.html','./manifest.webmanifest','./assets/styles.css','./assets/app.js','./assets/knowledge.js','./assets/quality.js','./assets/pwa.js','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('wrdi-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin||!u.pathname.startsWith(new URL(self.registration.scope).pathname))return;
if(req.mode==='navigate'){event.respondWith(fetch(req,{cache:'no-store'}).then(resp=>{if(resp.ok){const clone=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',clone));}return resp}).catch(()=>caches.match('./index.html')));return;}
event.respondWith(fetch(req).then(resp=>{if(resp.ok){const clone=resp.clone();caches.open(CACHE).then(c=>c.put(req,clone));}return resp}).catch(()=>caches.match(req)));
});