const CACHE='kokotts-shell-v2';
const SHELL=['./','./index.html','./manifest.webmanifest','./favicon.svg','./THIRD_PARTY_NOTICES.txt'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy));
      return response;
    }).catch(()=>caches.match(request).then(hit=>hit||caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(async hit=>{
    if(hit)return hit;
    const response=await fetch(request);
    if(response.ok){
      // Clone before yielding the response; otherwise its body may already be
      // consumed by the browser when the asynchronous cache open completes.
      const copy=response.clone();
      void caches.open(CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
  }));
});
