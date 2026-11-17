// Service worker do app /castanha.
// Guarda só a "casca" (JS, CSS, fontes, ícones) e nunca dados de leads/deals:
// funções de servidor, POSTs e o Apps Script passam direto pela rede.
const CACHE = 'castanha-v1';
const PRECACHE = [
  '/castanha.webmanifest',
  '/castanha-icons/icon-192.png',
  '/castanha-icons/icon-512.png',
  '/castanha-icons/apple-touch-icon.png',
];

const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Castanha — sem conexão</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1A1A1A;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px}
h1{font-size:22px;margin:16px 0 8px}p{opacity:.6;margin:0}img{width:96px}</style></head>
<body><div><img src="/castanha-icons/icon-192.png" alt=""><h1>Sem conexão</h1>
<p>Abra de novo quando tiver internet.</p></div></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function ehCasca(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/castanha-icons/') ||
      url.pathname === '/castanha.webmanifest' ||
      /\.(woff2?|ttf|otf|css)$/i.test(url.pathname))
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })),
    );
    return;
  }

  const url = new URL(req.url);
  if (!ehCasca(url)) return; // dados e terceiros: sempre rede, sem cache

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || Response.error())),
  );
});
