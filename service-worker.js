const CACHE = 'hero-sheet-v1';
const ASSETS = [
  './', './index.html', './app.js', './styles.css', './manifest.json',
  './modules/core.js', './modules/combat.js', './modules/skills.js',
  './modules/stats.js', './modules/rests.js', './modules/inventory.js',
  './modules/pcchar.js',
  './tabs/basicinfo.html', './tabs/stats.html', './tabs/skills.html',
  './tabs/inventory.html', './tabs/pcchar.html',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
