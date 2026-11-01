// IntPrep's service worker (offline support). This is a template: at build time
// sw/precache-plugin.ts replaces __BUILD__ with this deploy's version and file list and writes
// the result to dist/sw.js. Plain JS with no imports, so the browser runs it as-is.
//
// How it works
// - One cache per deploy, named 'intprep-<version>'. The version is a hash of the build output, so
//   every deploy changes this file's bytes and the browser installs the new worker (its update
//   check skips the HTTP cache, so GitHub Pages' max-age=600 doesn't delay it).
// - install downloads the whole app for this deploy (page, JS/CSS bundle, manifest, icons, Latin
//   fonts), then takes over at once (skipWaiting + clients.claim).
// - activate deletes the previous deploys' caches. Tabs that are already open keep working: the
//   app is a single JS bundle, so an open tab has all of its code in memory and never asks for an
//   old file again (the plugin warns if code splitting ever adds lazy chunks).
// - Opening the app is network-first, so a new deploy shows up at once. The precached page is used
//   offline, on a server error, or if the network hasn't answered within 3 s.
//   Navigations never write to the cache: the page only comes from this deploy's precache, so it
//   always matches the bundle cached next to it, and an error page can't become the offline app.
// - Other files are cache-first. Hashed files under assets/ that aren't precached (rarer font
//   subsets) are added to this deploy's cache when first used; nothing else is cached at runtime.
//
// Cache Storage is shared by every GitHub Pages project of the same user (one origin), so this
// worker only ever reads, writes or deletes caches named 'intprep-*', and only handles requests
// inside its own scope.

const BUILD = __BUILD__;
const PREFIX = 'intprep-';
const CACHE = PREFIX + BUILD.version;
const NAV_TIMEOUT_MS = 3000;

// Build paths are relative to this script, which sits at the site root.
const abs = (path) => new URL(path, self.location.href).href;
const PRECACHE = BUILD.precache.map(abs);
const SHELL = abs('./');
const ASSETS = abs(BUILD.assetsDir);

self.addEventListener('install', (event) => {
  event.waitUntil(precache(PRECACHE).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith(PREFIX) && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only this app's own GET requests. The scope check also leaves other projects on this origin
  // (and other sites) alone.
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  event.respondWith(req.mode === 'navigate' ? navigate(event) : cacheFirst(event));
});

// Downloads `urls` and stores them only once all of them arrived, so a cache never holds half a
// deploy. Throws (failing the install, which the browser retries later) on any error.
async function precache(urls) {
  const responses = await Promise.all(
    urls.map(async (url) => {
      // Files under assets/ have a content hash in their name, so the HTTP cache can't hold a stale
      // copy and the one the page just downloaded is reused. The page, manifest and icons keep their
      // names across deploys, so they skip the HTTP cache (GitHub Pages lets it keep them 10 min).
      const res = await fetch(url, { cache: url.startsWith(ASSETS) ? 'default' : 'reload' });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      // A CDN edge can briefly serve the previous deploy's page; never cache a page whose bundle
      // isn't the one cached with it.
      if (url === SHELL && !(await res.clone().text()).includes(BUILD.entry)) {
        throw new Error(`${url} is not this deploy's page`);
      }
      return res;
    }),
  );
  const cache = await caches.open(CACHE);
  await Promise.all(urls.map((url, i) => cache.put(url, responses[i])));
}

// Looks only in this deploy's cache (never another project's), without creating it.
function cached(url) {
  return caches.match(url, { cacheName: CACHE });
}

async function navigate(event) {
  // 'no-cache' revalidates with the server instead of trusting the HTTP cache's copy (up to 10 min
  // old on GitHub Pages), which may be a previous deploy's page whose bundle is already gone.
  const network = fetch(event.request.url, { cache: 'no-cache', redirect: 'manual' });
  const path = new URL(event.request.url).pathname;
  const scope = self.registration.scope;
  const root = new URL(scope).pathname;
  if (path !== root && path !== root + 'index.html') {
    // Not the app (e.g. a mistyped URL): show what the server says (its 404 page). Offline, open
    // the app at its real URL so its relative asset paths still resolve.
    return network.catch(() => Response.redirect(scope, 302));
  }
  event.waitUntil(repair());
  const shell = await cached(SHELL);
  if (!shell) return network; // our cache is gone; repair() is refilling it
  return new Promise((resolve) => {
    // On a connection that hangs (common on mobile), opening the app shouldn't wait for the
    // browser's own timeout. Falling back is always safe: the cached page and the bundle it loads
    // come from the same deploy, so the worst case is one more launch on the current version.
    const timer = setTimeout(() => resolve(shell), NAV_TIMEOUT_MS);
    network.then(
      (res) => {
        clearTimeout(timer);
        resolve(res.ok || res.type === 'opaqueredirect' ? res : shell);
      },
      () => {
        clearTimeout(timer);
        resolve(shell);
      },
    );
  });
}

async function cacheFirst(event) {
  const req = event.request;
  const hit = await cached(req.url);
  if (hit) return hit;
  const res = await fetch(req);
  // Hashed files never change, so one that wasn't precached is kept for the rest of this deploy.
  if (res.ok && res.type === 'basic' && req.url.startsWith(ASSETS)) {
    const copy = res.clone();
    event.waitUntil(
      // A newer deploy may have taken over (deleting this cache) while the request was in flight.
      caches.has(CACHE).then((live) => live && caches.open(CACHE).then((c) => c.put(req.url, copy))),
    );
  }
  return res;
}

// Another project on this origin (a worker that deletes every cache but its own) or the user can
// wipe this cache while this worker stays installed. Each time the app opens, quietly download
// whatever is missing again.
async function repair() {
  const names = await caches.keys();
  // A newer deploy is installing or has taken over: its own cache is what matters now.
  if (names.some((n) => n.startsWith(PREFIX) && n !== CACHE)) return;
  const have = names.includes(CACHE) ? (await (await caches.open(CACHE)).keys()).map((r) => r.url) : [];
  const missing = PRECACHE.filter((url) => !have.includes(url));
  if (missing.length) await precache(missing).catch(() => {}); // offline: try again next time
}
