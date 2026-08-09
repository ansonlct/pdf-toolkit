const CACHE='pdf-toolkit-v1-clean-audited-20260810';
const LOCAL=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './favicon.ico'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(LOCAL))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request,fallback){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response && response.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,response.clone()).catch(()=>{});
    }
    return response;
  }catch(err){
    return (await caches.match(request)) || (fallback ? await caches.match(fallback) : Response.error());
  }
}

async function cacheFirst(request){
  const hit=await caches.match(request);
  if(hit)return hit;
  const response=await fetch(request);
  if(response && response.ok){
    const cache=await caches.open(CACHE);
    cache.put(request,response.clone()).catch(()=>{});
  }
  return response;
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;

  const url=new URL(req.url);
  const sameOrigin=url.origin===self.location.origin;

  // Always try network first for the HTML shell + core JS/CSS.
  // This prevents a newly deployed tool list being hidden by an old cache.
  if(
    req.mode==='navigate' ||
    (sameOrigin && (
      url.pathname.endsWith('/index.html') ||
      url.pathname.endsWith('/app.js') ||
      url.pathname.endsWith('/styles.css') ||
      url.pathname.endsWith('/manifest.webmanifest')
    ))
  ){
    event.respondWith(networkFirst(req,'./index.html'));
    return;
  }

  if(sameOrigin){
    event.respondWith(cacheFirst(req));
  }
});
